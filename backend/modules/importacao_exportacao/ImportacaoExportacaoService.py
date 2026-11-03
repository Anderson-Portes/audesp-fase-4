"""
Camada de serviço para importação e exportação em lote (.xlsx) dos 4 módulos da AUDESP Fase IV:
- Editais
- Licitações
- Atas de Registro de Preços
- Ajustes e Contratos
"""
import json
from datetime import date
from typing import Any, Callable, Dict, List, Optional, Tuple

from fastapi import HTTPException, UploadFile
from sqlmodel import Session, select

from modules.ajustes.Ajuste import AjusteContrato
from modules.ajustes.AjusteService import AjusteService
from modules.atas.Ata import AtaRegistroPreco
from modules.atas.AtaService import AtaService
from modules.editais.Edital import Edital
from modules.editais.EditalService import EditalService
from modules.importacao_exportacao.excel_generators import (
    gerar_planilha_ajuste,
    gerar_planilha_ata,
    gerar_planilha_edital,
    gerar_planilha_licitacao,
)
from modules.importacao_exportacao.excel_parsers import (
    parsear_planilha_ajustes,
    parsear_planilha_atas,
    parsear_planilha_editais,
    parsear_planilha_licitacoes,
)
from modules.importacao_exportacao.excel_utils import formatar_erro_excecao
from modules.licitacoes.Licitacao import Licitacao
from modules.licitacoes.LicitacaoService import LicitacaoService


def _criar_log_item(linha: Any, codigo: str, descricao: str) -> Dict[str, Any]:
    return {
        "linha": linha or "-",
        "codigo_documento": codigo,
        "descricao": descricao,
        "salvo_bd": False,
        "transmitido": False,
        "sucesso": False,
        "protocolo": None,
        "status_protocolo": None,
        "erros": [],
    }


def _registrar_resultado_envio(log_item: Dict[str, Any], res_envio: Dict[str, Any], exigir_flag_sucesso: bool = False) -> None:
    """Popula no `log_item` os dados de protocolo e eventuais erros retornados pelo envio à AUDESP."""
    if exigir_flag_sucesso and not res_envio.get("sucesso"):
        log_item["erros"].extend(res_envio.get("erros") or [res_envio.get("mensagem", "Erro no envio")])
        log_item["sucesso"] = False
        return

    log_item["transmitido"] = True
    log_item["protocolo"] = res_envio.get("protocolo")
    log_item["status_protocolo"] = res_envio.get("status_protocolo")

    if res_envio.get("is_rejeitado") or res_envio.get("erros_formatados"):
        log_item["erros"].extend(
            res_envio.get("erros_formatados")
            or [f"Protocolo {log_item['protocolo']} retornou status {log_item['status_protocolo']}"]
        )
        log_item["sucesso"] = not bool(res_envio.get("is_rejeitado"))
    else:
        log_item["sucesso"] = True


def _buscar_edital_vinculado(session: Session, codigo_edital: str, municipio: int, entidade: int) -> Optional[Edital]:
    return session.exec(
        select(Edital).where(
            Edital.codigo_edital == codigo_edital,
            Edital.municipio == municipio,
            Edital.entidade == entidade,
        )
    ).first()


def _montar_resumo_lote(resultados: List[Dict[str, Any]]) -> Dict[str, Any]:
    sucessos = sum(1 for r in resultados if r["sucesso"] and not r["erros"])
    falhas = len(resultados) - sucessos
    return {
        "sucesso": falhas == 0,
        "total": len(resultados),
        "sucessos": sucessos,
        "falhas": falhas,
        "resultados": resultados,
    }


class ImportacaoExportacaoService:
    """Camada de serviço para importação e exportação em lote (.xlsx) de Editais, Licitações, Atas e Ajustes."""

    _GERADORES: Dict[str, Tuple[Callable, str]] = {
        "edital": (gerar_planilha_edital, "editais"),
        "editais": (gerar_planilha_edital, "editais"),
        "licitacao": (gerar_planilha_licitacao, "licitacoes"),
        "licitacoes": (gerar_planilha_licitacao, "licitacoes"),
        "ata": (gerar_planilha_ata, "atas"),
        "atas": (gerar_planilha_ata, "atas"),
        "ajuste": (gerar_planilha_ajuste, "ajustes"),
        "ajustes": (gerar_planilha_ajuste, "ajustes"),
    }

    @classmethod
    def obter_modelo_planilha(cls, modulo: str) -> Tuple[bytes, str]:
        info = cls._GERADORES.get(modulo.lower().strip())
        if not info:
            raise HTTPException(status_code=400, detail=f"Módulo inválido: {modulo}")
        gerador_fn, sufixo = info
        return gerador_fn(exportar_dados=False), f"modelo_importacao_{sufixo}_audesp.xlsx"

    @classmethod
    def exportar_dados_planilha(cls, modulo: str, session: Session) -> Tuple[bytes, str]:
        info = cls._GERADORES.get(modulo.lower().strip())
        if not info:
            raise HTTPException(status_code=400, detail=f"Módulo inválido: {modulo}")
        gerador_fn, sufixo = info
        hoje = date.today().isoformat()
        return gerador_fn(session=session, exportar_dados=True), f"exportacao_{sufixo}_{hoje}.xlsx"

    @staticmethod
    async def pre_visualizar_planilha_editais(file: UploadFile) -> Dict[str, Any]:
        if not file.filename or not file.filename.lower().endswith(".xlsx"):
            raise HTTPException(status_code=400, detail="Envie um arquivo Excel no formato .xlsx")

        file_bytes = await file.read()
        try:
            editais = parsear_planilha_editais(file_bytes)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Falha ao ler a planilha de editais: {str(exc)}")

        if not editais:
            raise HTTPException(
                status_code=400,
                detail="Nenhum edital com ID preenchido foi encontrado na aba 'Editais' da planilha.",
            )

        return {"sucesso": True, "total": len(editais), "editais": editais}

    @staticmethod
    async def importar_lote_editais(
        dados_json: str,
        transmitir: bool,
        arquivos_pdf: List[UploadFile],
        pdfs_codigos: List[str],
        authorization: Optional[str],
        session: Session,
    ) -> Dict[str, Any]:
        try:
            lista_editais = json.loads(dados_json)
        except Exception:
            raise HTTPException(status_code=400, detail="dados_json inválido.")

        token = authorization.replace("Bearer ", "").strip() if authorization else ""
        if transmitir and not token:
            raise HTTPException(status_code=401, detail="Token de autenticação AUDESP ausente para transmissão.")

        mapa_pdfs = {
            pdfs_codigos[idx].strip(): up_file
            for idx, up_file in enumerate(arquivos_pdf)
            if idx < len(pdfs_codigos)
        }

        resultados: List[Dict[str, Any]] = []
        for item in lista_editais:
            cod = str(item.get("codigo_edital") or "").strip()
            if not cod:
                continue
            doc = item.get("documento") or {}
            sem_pncp = bool(item.get("sem_pncp", False))
            descricao = f"Compra {item.get('numero_compra', '')}/{item.get('ano_compra', '')} - Proc. {item.get('numero_processo', '')}"
            log_item = _criar_log_item(item.get("linha"), cod, descricao)

            try:
                desc = doc.get("descritor") or {}
                mun = int(desc.get("municipio") or 7071)
                ent = int(desc.get("entidade") or 11310)
                existente = _buscar_edital_vinculado(session, cod, mun, ent)
                payload = {"documento": doc, "sem_pncp": sem_pncp}

                edital_obj = (
                    EditalService.atualizar_edital(session, existente.id, payload)
                    if existente
                    else EditalService.salvar_edital(session, payload)
                )
                log_item["registro_id"] = edital_obj.id
                log_item["salvo_bd"] = True

                pdf_upload = mapa_pdfs.get(cod)
                if pdf_upload and pdf_upload.filename:
                    await EditalService.salvar_pdf(session, edital_obj.id, pdf_upload)

                if transmitir:
                    res_envio = await EditalService.enviar_edital(session, edital_obj.id, token)
                    _registrar_resultado_envio(log_item, res_envio)
                else:
                    log_item["sucesso"] = True
            except Exception as exc:
                session.rollback()
                log_item["erros"].extend(formatar_erro_excecao(exc))
                log_item["sucesso"] = False

            resultados.append(log_item)

        return _montar_resumo_lote(resultados)

    @classmethod
    async def importar_lote_planilha(
        cls,
        modulo: str,
        file: UploadFile,
        transmitir: bool,
        authorization: Optional[str],
        session: Session,
    ) -> Dict[str, Any]:
        if not file.filename or not file.filename.lower().endswith(".xlsx"):
            raise HTTPException(status_code=400, detail="Envie um arquivo Excel no formato .xlsx")

        token = authorization.replace("Bearer ", "").strip() if authorization else ""
        if transmitir and not token:
            raise HTTPException(status_code=401, detail="Token de autenticação AUDESP ausente para transmissão.")

        mod = modulo.lower().strip()
        file_bytes = await file.read()

        if mod in ("licitacao", "licitacoes"):
            return await cls._importar_licitacoes(file_bytes, transmitir, token, session)
        if mod in ("ata", "atas"):
            return await cls._importar_atas(file_bytes, transmitir, token, session)
        if mod in ("ajuste", "ajustes"):
            return await cls._importar_ajustes(file_bytes, transmitir, token, session)

        raise HTTPException(status_code=400, detail=f"Módulo inválido: {modulo}")

    @staticmethod
    async def _importar_licitacoes(file_bytes: bytes, transmitir: bool, token: str, session: Session) -> Dict[str, Any]:
        registros = parsear_planilha_licitacoes(file_bytes)
        if not registros:
            raise HTTPException(status_code=400, detail="Nenhuma licitação com ID preenchido foi encontrada na aba 'Licitacoes'.")

        resultados: List[Dict[str, Any]] = []
        for reg in registros:
            cod = reg["codigo_edital"]
            doc = reg["documento"]
            desc = doc.get("descritor") or {}
            mun, ent = int(desc.get("municipio") or 7071), int(desc.get("entidade") or 11310)
            log_item = _criar_log_item(reg.get("linha"), cod, f"Licitação do Edital {cod}")

            try:
                edital_vinc = _buscar_edital_vinculado(session, cod, mun, ent)
                existente = session.exec(
                    select(Licitacao).where(Licitacao.codigo_edital == cod, Licitacao.municipio == mun, Licitacao.entidade == ent)
                ).first()

                payload = {
                    "edital_id": edital_vinc.id if edital_vinc else None,
                    "numero_compra": reg.get("numero_compra") or (edital_vinc.numero_compra if edital_vinc else ""),
                    "ano_compra": reg.get("ano_compra") or (edital_vinc.ano_compra if edital_vinc else date.today().year),
                    "numero_processo": reg.get("numero_processo") or (edital_vinc.numero_processo if edital_vinc else ""),
                    "objeto_edital": reg.get("objeto_edital") or (edital_vinc.objeto_compra if edital_vinc else ""),
                    "documento": doc,
                }
                lic_obj = (
                    LicitacaoService.atualizar_licitacao(session, existente.id, payload)
                    if existente
                    else LicitacaoService.salvar_licitacao(session, payload)
                )
                log_item["registro_id"] = lic_obj.id
                log_item["salvo_bd"] = True

                if transmitir:
                    res_envio = await LicitacaoService.enviar_licitacao(session, lic_obj.id, token)
                    _registrar_resultado_envio(log_item, res_envio)
                else:
                    log_item["sucesso"] = True
            except Exception as exc:
                session.rollback()
                log_item["erros"].extend(formatar_erro_excecao(exc))

            resultados.append(log_item)

        return _montar_resumo_lote(resultados)

    @staticmethod
    async def _importar_atas(file_bytes: bytes, transmitir: bool, token: str, session: Session) -> Dict[str, Any]:
        registros = parsear_planilha_atas(file_bytes)
        if not registros:
            raise HTTPException(status_code=400, detail="Nenhuma ata com ID preenchido foi encontrada na aba 'Atas'.")

        resultados: List[Dict[str, Any]] = []
        for reg in registros:
            cod_ata, cod_ed, doc = reg["codigo_documento"], reg["codigo_edital"], reg["documento"]
            desc = doc.get("descritor") or {}
            mun, ent = int(desc.get("municipio") or 7071), int(desc.get("entidade") or 11310)
            log_item = _criar_log_item(
                reg.get("linha"), cod_ata, f"Ata {doc.get('numeroAtaRegistroPreco')}/{doc.get('anoAta')} (Edital {cod_ed})"
            )

            try:
                edital_vinc = _buscar_edital_vinculado(session, cod_ed, mun, ent)
                existente = session.exec(
                    select(AtaRegistroPreco).where(
                        AtaRegistroPreco.codigo_ata == cod_ata, AtaRegistroPreco.municipio == mun, AtaRegistroPreco.entidade == ent
                    )
                ).first()

                ata_obj = AtaService.salvar_ou_atualizar_ata(
                    session=session,
                    ata_id=existente.id if existente else None,
                    edital_id=edital_vinc.id if edital_vinc else None,
                    documento=doc,
                )
                log_item["registro_id"] = ata_obj.id
                log_item["salvo_bd"] = True

                if transmitir:
                    res_envio = await AtaService.enviar_ata(session, ata_obj.id, token)
                    _registrar_resultado_envio(log_item, res_envio, exigir_flag_sucesso=True)
                else:
                    log_item["sucesso"] = True
            except Exception as exc:
                session.rollback()
                log_item["erros"].extend(formatar_erro_excecao(exc))

            resultados.append(log_item)

        return _montar_resumo_lote(resultados)

    @staticmethod
    async def _importar_ajustes(file_bytes: bytes, transmitir: bool, token: str, session: Session) -> Dict[str, Any]:
        registros = parsear_planilha_ajustes(file_bytes)
        if not registros:
            raise HTTPException(status_code=400, detail="Nenhum ajuste com ID preenchido foi encontrado na aba 'Ajustes'.")

        resultados: List[Dict[str, Any]] = []
        for reg in registros:
            cod_cont, cod_ed, cod_ata, doc = reg["codigo_documento"], reg["codigo_edital"], reg.get("codigo_ata") or "", reg["documento"]
            desc = doc.get("descritor") or {}
            mun, ent = int(desc.get("municipio") or 7071), int(desc.get("entidade") or 11310)
            log_item = _criar_log_item(
                reg.get("linha"),
                cod_cont,
                f"Contrato {doc.get('numeroContratoEmpenho')}/{doc.get('anoContrato')} - {doc.get('nomeRazaoSocialFornecedor', '')}",
            )

            try:
                edital_vinc = _buscar_edital_vinculado(session, cod_ed, mun, ent)
                ata_vinc = (
                    session.exec(
                        select(AtaRegistroPreco).where(
                            AtaRegistroPreco.codigo_ata == cod_ata, AtaRegistroPreco.municipio == mun, AtaRegistroPreco.entidade == ent
                        )
                    ).first()
                    if cod_ata
                    else None
                )
                existente = session.exec(
                    select(AjusteContrato).where(
                        AjusteContrato.codigo_contrato == cod_cont, AjusteContrato.municipio == mun, AjusteContrato.entidade == ent
                    )
                ).first()

                ajuste_obj = AjusteService.salvar_ou_atualizar_ajuste(
                    session=session,
                    ajuste_id=existente.id if existente else None,
                    edital_id=edital_vinc.id if edital_vinc else None,
                    ata_id=ata_vinc.id if ata_vinc else None,
                    documento=doc,
                )
                log_item["registro_id"] = ajuste_obj.id
                log_item["salvo_bd"] = True

                if transmitir:
                    res_envio = await AjusteService.enviar_ajuste(session, ajuste_obj.id, token)
                    _registrar_resultado_envio(log_item, res_envio, exigir_flag_sucesso=True)
                else:
                    log_item["sucesso"] = True
            except Exception as exc:
                session.rollback()
                log_item["erros"].extend(formatar_erro_excecao(exc))

            resultados.append(log_item)

        return _montar_resumo_lote(resultados)
