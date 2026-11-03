"""
Serviço centralizado de listagem, histórico e consulta de protocolos da AUDESP Fase IV
unificando Editais, Licitações, Atas de Registro de Preços e Ajustes/Contratos,
além de permitir consulta avulsa de qualquer número de protocolo direto na API do TCESP.
"""
import json
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from sqlmodel import Session, select

from core.audesp_client import (
    consultar_protocolo_audesp,
    extrair_erros_estruturados_audesp,
    extrair_mensagens_protocolo_audesp,
)
from modules.ajustes.Ajuste import AjusteContrato
from modules.atas.Ata import AtaRegistroPreco
from modules.editais.Edital import Edital
from modules.licitacoes.Licitacao import Licitacao
from modules.protocolos.Protocolo import ProtocoloConsulta, now_utc


def _parse_detalhes(raw: Optional[str]) -> Any:
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return raw


def serializar_item_historico(item: ProtocoloConsulta) -> Dict[str, Any]:
    """Converte um registro ProtocoloConsulta em dicionário pronto para o frontend."""
    try:
        erros_formatados = json.loads(item.erros_formatados_json) if item.erros_formatados_json else []
    except Exception:
        erros_formatados = []

    try:
        erros_detalhados = json.loads(item.erros_detalhados_json) if item.erros_detalhados_json else []
    except Exception:
        erros_detalhados = []

    return {
        "id": item.id,
        "modulo": item.modulo,
        "registro_id": item.registro_id,
        "codigo_documento": item.codigo_documento,
        "protocolo": item.protocolo,
        "origem": item.origem,
        "status_protocolo": item.status_protocolo,
        "data_hora_audesp": item.data_hora_audesp,
        "sucesso_consulta": item.sucesso_consulta,
        "is_rejeitado": item.is_rejeitado,
        "possui_erros": item.possui_erros,
        "erros_formatados": erros_formatados,
        "erros_detalhados": erros_detalhados,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


def listar_historico_protocolo(
    session: Session,
    modulo: str,
    registro_id: int,
    protocolo: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Lista o histórico de consultas de protocolo de um documento do mais recente para o mais antigo."""
    stmt = (
        select(ProtocoloConsulta)
        .where(
            ProtocoloConsulta.modulo == modulo,
            ProtocoloConsulta.registro_id == registro_id,
        )
        .order_by(ProtocoloConsulta.created_at.desc(), ProtocoloConsulta.id.desc())
    )
    registros = session.exec(stmt).all()
    if not registros and protocolo:
        stmt_prot = (
            select(ProtocoloConsulta)
            .where(ProtocoloConsulta.protocolo == protocolo)
            .order_by(ProtocoloConsulta.created_at.desc(), ProtocoloConsulta.id.desc())
        )
        registros = session.exec(stmt_prot).all()

    return [serializar_item_historico(r) for r in registros]


def consultar_e_registrar_protocolo(
    session: Session,
    token: str,
    modulo: str,
    registro_id: int,
    codigo_documento: str,
    protocolo: str,
    origem: str = "consulta_manual",
    status_padrao: str = "Recebido",
) -> Dict[str, Any]:
    """
    Realiza a consulta do protocolo no AUDESP (/f4/consulta/{protocolo}),
    extrai e formata eventuais erros/inconsistências, grava no histórico
    e retorna os dados estruturados.
    """
    resultado = consultar_protocolo_audesp(token=token, protocolo=protocolo)
    sucesso = bool(resultado.get("sucesso"))
    dados = resultado.get("dados") if isinstance(resultado.get("dados"), dict) else {}

    if sucesso:
        novo_status = str(resultado.get("status") or dados.get("status") or status_padrao).strip()
        data_hora_audesp = str(dados.get("dataHora") or "").strip() or None
        erros_detalhados = extrair_erros_estruturados_audesp(dados)
        erros_formatados = extrair_mensagens_protocolo_audesp(dados)
    else:
        novo_status = status_padrao
        data_hora_audesp = None
        msg_falha = resultado.get("mensagem") or "Não foi possível consultar o protocolo no momento."
        erros_detalhados = extrair_erros_estruturados_audesp(dados) or [
            {
                "mensagem": msg_falha,
                "campo": None,
                "codigoErro": None,
                "classificacao": None,
                "origem": None,
                "texto_formatado": msg_falha,
            }
        ]
        erros_formatados = [e["texto_formatado"] for e in erros_detalhados if e.get("texto_formatado")]

    is_rejeitado = "rejeitado" in novo_status.lower()
    possui_erros = bool(erros_formatados) or is_rejeitado

    historico_entry = ProtocoloConsulta(
        modulo=modulo,
        registro_id=registro_id,
        codigo_documento=str(codigo_documento or ""),
        protocolo=protocolo,
        origem=origem,
        status_protocolo=novo_status,
        data_hora_audesp=data_hora_audesp,
        sucesso_consulta=sucesso,
        is_rejeitado=is_rejeitado,
        possui_erros=possui_erros,
        erros_formatados_json=json.dumps(erros_formatados, ensure_ascii=False),
        erros_detalhados_json=json.dumps(erros_detalhados, ensure_ascii=False),
        resposta_json=json.dumps(dados if dados else resultado, ensure_ascii=False),
        created_at=now_utc(),
    )
    session.add(historico_entry)
    session.commit()
    session.refresh(historico_entry)

    historico_lista = listar_historico_protocolo(
        session=session,
        modulo=modulo,
        registro_id=registro_id,
        protocolo=protocolo,
    )

    return {
        "sucesso": sucesso,
        "protocolo": protocolo,
        "status": novo_status,
        "data_hora_audesp": data_hora_audesp,
        "is_rejeitado": is_rejeitado,
        "possui_erros": possui_erros,
        "erros_formatados": erros_formatados,
        "erros_detalhados": erros_detalhados,
        "dados": dados,
        "detalhes": dados,
        "mensagem": resultado.get("mensagem"),
        "status_code": resultado.get("status_code", 200 if sucesso else 400),
        "consulta_registrada": serializar_item_historico(historico_entry),
        "historico": historico_lista,
    }


class ProtocoloService:
    """Serviço unificado para listagem e consulta de protocolos de todos os módulos."""

    @staticmethod
    def listar_todos_protocolos(
        session: Session,
        modulo: Optional[str] = None,
        status_protocolo: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        itens: List[Dict[str, Any]] = []
        mod_filtro = (modulo or "").strip().lower()

        if not mod_filtro or mod_filtro in ("edital", "editais"):
            editais = session.exec(
                select(Edital).where(Edital.protocolo.is_not(None), Edital.protocolo != "")
            ).all()
            for ed in editais:
                det = _parse_detalhes(ed.detalhes_protocolo)
                itens.append({
                    "uid": f"edital-{ed.id}",
                    "modulo": "edital",
                    "modulo_label": "Edital",
                    "rota_modulo": f"/editais/{ed.id}",
                    "registro_id": ed.id,
                    "codigo_documento": ed.codigo_edital,
                    "identificacao": f"Compra {ed.numero_compra or '-'}/{ed.ano_compra or '-'} • Proc. {ed.numero_processo or '-'}",
                    "resumo": ed.objeto_compra or "",
                    "protocolo": ed.protocolo,
                    "status_sistema": ed.status,
                    "status_protocolo": ed.status_protocolo or "Recebido",
                    "retificacao": ed.retificacao,
                    "detalhes_protocolo": det,
                    "erros_detalhados": extrair_erros_estruturados_audesp(det) if isinstance(det, dict) else [],
                    "updated_at": ed.updated_at.isoformat() if ed.updated_at else None,
                })

        if not mod_filtro or mod_filtro in ("licitacao", "licitacoes"):
            licitacoes = session.exec(
                select(Licitacao).where(Licitacao.protocolo.is_not(None), Licitacao.protocolo != "")
            ).all()
            for lic in licitacoes:
                det = _parse_detalhes(lic.detalhes_protocolo)
                itens.append({
                    "uid": f"licitacao-{lic.id}",
                    "modulo": "licitacao",
                    "modulo_label": "Licitação",
                    "rota_modulo": f"/licitacoes/{lic.id}",
                    "registro_id": lic.id,
                    "codigo_documento": lic.codigo_edital,
                    "identificacao": f"Compra {lic.numero_compra or '-'}/{lic.ano_compra or '-'} • Proc. {lic.numero_processo or '-'}",
                    "resumo": lic.objeto_edital or "",
                    "protocolo": lic.protocolo,
                    "status_sistema": lic.status,
                    "status_protocolo": lic.status_protocolo or "Recebido",
                    "retificacao": lic.retificacao,
                    "detalhes_protocolo": det,
                    "erros_detalhados": extrair_erros_estruturados_audesp(det) if isinstance(det, dict) else [],
                    "updated_at": lic.updated_at.isoformat() if lic.updated_at else None,
                })

        if not mod_filtro or mod_filtro in ("ata", "atas"):
            atas = session.exec(
                select(AtaRegistroPreco).where(AtaRegistroPreco.protocolo.is_not(None), AtaRegistroPreco.protocolo != "")
            ).all()
            for ata in atas:
                det = _parse_detalhes(ata.detalhes_protocolo)
                itens.append({
                    "uid": f"ata-{ata.id}",
                    "modulo": "ata",
                    "modulo_label": "Ata (ARP)",
                    "rota_modulo": f"/atas/{ata.id}",
                    "registro_id": ata.id,
                    "codigo_documento": ata.codigo_ata,
                    "identificacao": f"Ata {ata.numero_ata_registro_preco}/{ata.ano_ata} • Edital {ata.codigo_edital}",
                    "resumo": f"Vigência: {ata.data_vigencia_inicio} até {ata.data_vigencia_fim}",
                    "protocolo": ata.protocolo,
                    "status_sistema": ata.status,
                    "status_protocolo": ata.status_protocolo or "Recebido",
                    "retificacao": ata.retificacao,
                    "detalhes_protocolo": det,
                    "erros_detalhados": extrair_erros_estruturados_audesp(det) if isinstance(det, dict) else [],
                    "updated_at": ata.updated_at.isoformat() if ata.updated_at else None,
                })

        if not mod_filtro or mod_filtro in ("ajuste", "ajustes"):
            ajustes = session.exec(
                select(AjusteContrato).where(AjusteContrato.protocolo.is_not(None), AjusteContrato.protocolo != "")
            ).all()
            for aj in ajustes:
                det = _parse_detalhes(aj.detalhes_protocolo)
                itens.append({
                    "uid": f"ajuste-{aj.id}",
                    "modulo": "ajuste",
                    "modulo_label": "Ajuste / Contrato",
                    "rota_modulo": f"/ajustes/{aj.id}",
                    "registro_id": aj.id,
                    "codigo_documento": aj.codigo_contrato,
                    "identificacao": f"Contrato {aj.numero_contrato_empenho}/{aj.ano_contrato} • Proc. {aj.processo}",
                    "resumo": f"Fornecedor: {aj.nome_razao_social_fornecedor} ({aj.ni_fornecedor})",
                    "protocolo": aj.protocolo,
                    "status_sistema": aj.status,
                    "status_protocolo": aj.status_protocolo or "Recebido",
                    "retificacao": aj.retificacao,
                    "detalhes_protocolo": det,
                    "erros_detalhados": extrair_erros_estruturados_audesp(det) if isinstance(det, dict) else [],
                    "updated_at": aj.updated_at.isoformat() if aj.updated_at else None,
                })

        if status_protocolo and status_protocolo.strip():
            st_busca = status_protocolo.strip().lower()
            itens = [it for it in itens if st_busca in str(it.get("status_protocolo") or "").lower()]

        if search and search.strip():
            termo = search.strip().lower()
            itens = [
                it for it in itens
                if termo in str(it.get("protocolo") or "").lower()
                or termo in str(it.get("codigo_documento") or "").lower()
                or termo in str(it.get("identificacao") or "").lower()
                or termo in str(it.get("resumo") or "").lower()
            ]

        itens.sort(key=lambda x: x.get("updated_at") or "", reverse=True)

        contadores = {
            "total": len(itens),
            "armazenados": sum(1 for i in itens if "armazenado" in str(i.get("status_protocolo") or "").lower()),
            "rejeitados": sum(1 for i in itens if "rejeitado" in str(i.get("status_protocolo") or "").lower()),
            "recebidos": sum(
                1 for i in itens
                if "armazenado" not in str(i.get("status_protocolo") or "").lower()
                and "rejeitado" not in str(i.get("status_protocolo") or "").lower()
            ),
        }

        return {
            "contadores": contadores,
            "itens": itens,
        }

    @staticmethod
    async def consultar_protocolo_modulo(
        session: Session,
        modulo: str,
        registro_id: int,
        token: str,
    ) -> Dict[str, Any]:
        mod = modulo.strip().lower()
        if mod in ("edital", "editais"):
            from modules.editais.EditalService import EditalService
            return await EditalService.consultar_protocolo(session, registro_id, token)
        if mod in ("licitacao", "licitacoes"):
            from modules.licitacoes.LicitacaoService import LicitacaoService
            return await LicitacaoService.consultar_protocolo(session, registro_id, token)
        if mod in ("ata", "atas"):
            from modules.atas.AtaService import AtaService
            return await AtaService.consultar_protocolo(session, registro_id, token)
        if mod in ("ajuste", "ajustes"):
            from modules.ajustes.AjusteService import AjusteService
            return await AjusteService.consultar_protocolo(session, registro_id, token)
        raise HTTPException(status_code=400, detail=f"Módulo inválido: {modulo}")

    @staticmethod
    def obter_historico_modulo(session: Session, modulo: str, registro_id: int, protocolo: Optional[str] = None) -> List[Dict[str, Any]]:
        mod = modulo.strip().lower()
        mapa = {
            "edital": "edital",
            "editais": "edital",
            "licitacao": "licitacao",
            "licitacoes": "licitacao",
            "ata": "ata",
            "atas": "ata",
            "ajuste": "ajuste",
            "ajustes": "ajuste",
        }
        mod_key = mapa.get(mod)
        if not mod_key:
            raise HTTPException(status_code=400, detail=f"Módulo inválido: {modulo}")
        return listar_historico_protocolo(session, mod_key, registro_id, protocolo)

    @staticmethod
    def consultar_protocolo_avulso(token: str, numero_protocolo: str) -> Dict[str, Any]:
        """Consulta diretamente no TCESP (/f4/consulta/{protocolo}) qualquer número de protocolo informado."""
        prot = (numero_protocolo or "").strip()
        if not prot:
            raise HTTPException(status_code=400, detail="Informe o número do protocolo para consulta.")

        resultado = consultar_protocolo_audesp(token=token, protocolo=prot)
        dados = resultado.get("dados") if isinstance(resultado.get("dados"), dict) else {}
        status = str(resultado.get("status") or dados.get("status") or "Desconhecido").strip()
        erros_detalhados = extrair_erros_estruturados_audesp(dados)
        erros_formatados = extrair_mensagens_protocolo_audesp(dados)

        return {
            "sucesso": bool(resultado.get("sucesso")),
            "protocolo": prot,
            "status_protocolo": status,
            "data_hora_audesp": dados.get("dataHora"),
            "codigo_documento": dados.get("codigoDocumento") or dados.get("codigoEdital") or dados.get("codigoAta") or dados.get("codigoContrato"),
            "is_rejeitado": "rejeitado" in status.lower(),
            "erros_detalhados": erros_detalhados,
            "erros_formatados": erros_formatados,
            "dados": dados,
            "mensagem": resultado.get("mensagem"),
        }
