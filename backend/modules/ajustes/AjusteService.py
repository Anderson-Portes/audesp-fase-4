import json
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timezone

from fastapi import HTTPException
from sqlmodel import Session, select, or_

from core.audesp_client import (
    enviar_ajuste_audesp,
    consultar_protocolo_audesp,
    extrair_erros_estruturados_audesp,
    extrair_mensagens_protocolo_audesp,
)
from modules.protocolos.ProtocoloService import (
    consultar_e_registrar_protocolo,
    listar_historico_protocolo,
)
from core.audesp_domains import MUNICIPIOS_AUDESP, ENTIDADES_AUDESP
from modules.ajustes.Ajuste import AjusteContrato
from modules.ajustes.AjusteDomains import (
    DOMINIO_TIPO_CONTRATO,
    DOMINIO_CATEGORIA_PROCESSO,
    DOMINIO_TIPO_OBJETO_CONTRATO,
    OBJETOS_POR_CATEGORIA,
    validar_regras_negocio_ajuste
)
from modules.licitacoes.Licitacao import Licitacao
from modules.editais.Edital import Edital
from modules.atas.Ata import AtaRegistroPreco
from modules.licitacoes.LicitacaoDomains import (
    DOMINIO_FONTES_RECURSO,
    selecionar_licitacao_enviada,
    extrair_numeros_itens_licitacao,
)


class AjusteService:
    """Camada de serviço para regras de negócio e persistência do Módulo de Ajustes e Contratos."""

    @staticmethod
    def get_dominios() -> Dict[str, Any]:
        """Retorna tabelas de domínio do módulo de Ajustes para o frontend."""
        return {
            "tiposContrato": DOMINIO_TIPO_CONTRATO,
            "categoriasProcesso": DOMINIO_CATEGORIA_PROCESSO,
            "tiposObjetoContrato": DOMINIO_TIPO_OBJETO_CONTRATO,
            "objetosPorCategoria": OBJETOS_POR_CATEGORIA,
            "fontesRecurso": DOMINIO_FONTES_RECURSO,
            "municipios": MUNICIPIOS_AUDESP,
            "entidades": ENTIDADES_AUDESP
        }

    @staticmethod
    def listar_ajustes(
        session: Session,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[AjusteContrato]:
        """Lista ajustes/contratos cadastrados com filtros opcionais."""
        query = select(AjusteContrato).order_by(AjusteContrato.updated_at.desc())
        if status:
            query = query.where(AjusteContrato.status == status)
        if search:
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    AjusteContrato.numero_contrato_empenho.like(term),
                    AjusteContrato.codigo_contrato.like(term),
                    AjusteContrato.codigo_edital.like(term),
                    AjusteContrato.nome_razao_social_fornecedor.like(term),
                    AjusteContrato.ni_fornecedor.like(term),
                    AjusteContrato.protocolo.like(term)
                )
            )
        return list(session.exec(query).all())

    @staticmethod
    def obter_ajuste(session: Session, ajuste_id: int) -> Dict[str, Any]:
        """Recupera detalhes e o documento JSON completo de um ajuste."""
        ajuste = session.get(AjusteContrato, ajuste_id)
        if not ajuste:
            raise HTTPException(status_code=404, detail="Ajuste/Contrato não encontrado.")
        
        try:
            documento = json.loads(ajuste.documento_json)
        except Exception:
            documento = {}

        detalhes_prot = None
        if ajuste.detalhes_protocolo:
            try:
                detalhes_prot = json.loads(ajuste.detalhes_protocolo)
            except Exception:
                detalhes_prot = ajuste.detalhes_protocolo

        return {
            "ajuste": ajuste,
            "documento": documento,
            "parsed_detalhes_protocolo": detalhes_prot,
            "erros_formatados": extrair_mensagens_protocolo_audesp(detalhes_prot),
            "erros_detalhados": extrair_erros_estruturados_audesp(detalhes_prot),
            "historico_protocolo": listar_historico_protocolo(session, "ajuste", ajuste.id, ajuste.protocolo),
        }

    @staticmethod
    def salvar_ajuste(session: Session, payload: Dict[str, Any]) -> AjusteContrato:
        """Cria ou atualiza um rascunho de ajuste/contrato."""
        documento = payload.get("documento", {})
        descritor = documento.get("descritor", {})
        
        ajuste_id = payload.get("id")
        ajuste = session.get(AjusteContrato, ajuste_id) if ajuste_id else None

        def parse_date(val):
            if not val:
                return None
            if isinstance(val, (date, datetime)):
                return val if isinstance(val, date) else val.date()
            try:
                return datetime.strptime(str(val).split("T")[0], "%Y-%m-%d").date()
            except Exception:
                return None

        dt_assinatura = parse_date(documento.get("dataAssinatura")) or datetime.now(timezone.utc).date()
        dt_inicio = parse_date(documento.get("dataVigenciaInicio"))
        dt_fim = parse_date(documento.get("dataVigenciaFim"))

        numero_contrato = str(documento.get("numeroContratoEmpenho", ""))
        ano_contrato = int(documento.get("anoContrato", datetime.now().year))
        codigo_contrato = str(descritor.get("codigoContrato", f"CONTR-{numero_contrato}/{ano_contrato}"))

        if not ajuste:
            ajuste = AjusteContrato(
                municipio=int(descritor.get("municipio", 0)),
                entidade=int(descritor.get("entidade", 0)),
                codigo_edital=str(descritor.get("codigoEdital", "")),
                codigo_ata=descritor.get("codigoAta"),
                codigo_contrato=codigo_contrato,
                retificacao=bool(descritor.get("retificacao", False)),
                edital_id=payload.get("edital_id"),
                licitacao_id=payload.get("licitacao_id"),
                ata_id=payload.get("ata_id"),
                numero_contrato_empenho=numero_contrato,
                ano_contrato=ano_contrato,
                tipo_contrato_id=int(documento.get("tipoContratoId", 1)),
                processo=str(documento.get("processo", "")),
                categoria_processo_id=int(documento.get("categoriaProcessoId", 2)),
                tipo_objeto_contrato=int(documento.get("tipoObjetoContrato", 11)),
                receita=bool(documento.get("receita", False)),
                ni_fornecedor=str(documento.get("niFornecedor", "")),
                tipo_pessoa_fornecedor=str(documento.get("tipoPessoaFornecedor", "PJ")),
                nome_razao_social_fornecedor=str(documento.get("nomeRazaoSocialFornecedor", "")),
                valor_inicial=float(documento.get("valorInicial", 0.0)),
                valor_global=float(documento.get("valorGlobal", documento.get("valorInicial", 0.0))),
                data_assinatura=dt_assinatura,
                data_vigencia_inicio=dt_inicio,
                data_vigencia_fim=dt_fim,
                status="draft",
                documento_json=json.dumps(documento, ensure_ascii=False)
            )
            session.add(ajuste)
        else:
            if ajuste.status == "sent":
                raise HTTPException(status_code=400, detail="Este ajuste já foi enviado à AUDESP e não pode ser editado diretamente sem gerar retificação.")
            
            ajuste.municipio = int(descritor.get("municipio", ajuste.municipio))
            ajuste.entidade = int(descritor.get("entidade", ajuste.entidade))
            ajuste.codigo_edital = str(descritor.get("codigoEdital", ajuste.codigo_edital))
            ajuste.codigo_ata = descritor.get("codigoAta", ajuste.codigo_ata)
            ajuste.codigo_contrato = codigo_contrato
            ajuste.retificacao = bool(descritor.get("retificacao", ajuste.retificacao))
            ajuste.edital_id = payload.get("edital_id", ajuste.edital_id)
            ajuste.licitacao_id = payload.get("licitacao_id", ajuste.licitacao_id)
            ajuste.ata_id = payload.get("ata_id", ajuste.ata_id)
            ajuste.numero_contrato_empenho = numero_contrato
            ajuste.ano_contrato = ano_contrato
            ajuste.tipo_contrato_id = int(documento.get("tipoContratoId", ajuste.tipo_contrato_id))
            ajuste.processo = str(documento.get("processo", ajuste.processo))
            ajuste.categoria_processo_id = int(documento.get("categoriaProcessoId", ajuste.categoria_processo_id))
            ajuste.tipo_objeto_contrato = int(documento.get("tipoObjetoContrato", ajuste.tipo_objeto_contrato))
            ajuste.receita = bool(documento.get("receita", ajuste.receita))
            ajuste.ni_fornecedor = str(documento.get("niFornecedor", ajuste.ni_fornecedor))
            ajuste.tipo_pessoa_fornecedor = str(documento.get("tipoPessoaFornecedor", ajuste.tipo_pessoa_fornecedor))
            ajuste.nome_razao_social_fornecedor = str(documento.get("nomeRazaoSocialFornecedor", ajuste.nome_razao_social_fornecedor))
            ajuste.valor_inicial = float(documento.get("valorInicial", ajuste.valor_inicial))
            ajuste.valor_global = float(documento.get("valorGlobal", ajuste.valor_global))
            ajuste.data_assinatura = dt_assinatura
            ajuste.data_vigencia_inicio = dt_inicio
            ajuste.data_vigencia_fim = dt_fim
            ajuste.documento_json = json.dumps(documento, ensure_ascii=False)
            ajuste.updated_at = datetime.now(timezone.utc)

        session.commit()
        session.refresh(ajuste)
        return ajuste

    @staticmethod
    def enviar_ajuste(
        session: Session,
        ajuste_id: int,
        token_audesp: str,
        forcar: bool = False
    ) -> Dict[str, Any]:
        """Valida e transmite o ajuste/contrato para o AUDESP Fase IV."""
        ajuste = session.get(AjusteContrato, ajuste_id)
        if not ajuste:
            raise HTTPException(status_code=404, detail="Ajuste/Contrato não encontrado.")

        try:
            documento = json.loads(ajuste.documento_json)
        except Exception:
            raise HTTPException(status_code=400, detail="JSON do ajuste está corrompido.")

        adesao = bool(documento.get("descritor", {}).get("adesaoParticipacao", False))
        is_srp = False
        erros_fluxo: List[str] = []
        numeros_itens_lic = None
        ata_vinculada_status = None

        if ajuste.ata_id:
            ata_vinc = session.get(AtaRegistroPreco, ajuste.ata_id)
            if ata_vinc:
                ata_vinculada_status = ata_vinc.status

        if not adesao:
            edital_vinculado = session.get(Edital, ajuste.edital_id) if ajuste.edital_id else None
            if not edital_vinculado and ajuste.codigo_edital:
                edital_vinculado = session.exec(
                    select(Edital).where(
                        Edital.codigo_edital == ajuste.codigo_edital,
                        Edital.municipio == ajuste.municipio,
                        Edital.entidade == ajuste.entidade
                    )
                ).first()

            if not edital_vinculado:
                erros_fluxo.append("O edital vinculado não foi encontrado.")
            else:
                if edital_vinculado.status != "sent":
                    erros_fluxo.append("O edital ainda não foi enviado ao AUDESP.")
                if edital_vinculado.documento_json:
                    try:
                        ed_doc = json.loads(edital_vinculado.documento_json)
                        is_srp = bool(ed_doc.get("srp", False))
                    except Exception:
                        pass

                licitacoes_edital = list(
                    session.exec(
                        select(Licitacao).where(
                            or_(
                                Licitacao.edital_id == edital_vinculado.id,
                                (Licitacao.codigo_edital == edital_vinculado.codigo_edital) &
                                (Licitacao.municipio == edital_vinculado.municipio) &
                                (Licitacao.entidade == edital_vinculado.entidade)
                            )
                        )
                    ).all()
                )
                if not licitacoes_edital:
                    erros_fluxo.append("O edital ainda não tem licitação.")
                else:
                    lic_enviada = selecionar_licitacao_enviada(licitacoes_edital)
                    if not lic_enviada:
                        erros_fluxo.append("A licitação do edital ainda não foi enviada ao AUDESP.")
                    else:
                        try:
                            lic_doc = json.loads(lic_enviada.documento_json) if lic_enviada.documento_json else {}
                        except Exception:
                            lic_doc = {}
                        numeros_itens_lic = extrair_numeros_itens_licitacao(lic_doc)

        erros_validacao = erros_fluxo + validar_regras_negocio_ajuste(
            documento,
            edital_srp=is_srp,
            numeros_itens_licitacao=numeros_itens_lic,
            ata_id_vinculada=ajuste.ata_id,
            ata_vinculada_status=ata_vinculada_status
        )

        if erros_validacao and not forcar:
            raise HTTPException(
                status_code=422,
                detail={"mensagem": "O ajuste possui inconsistências com o schema AUDESP.", "erros": erros_validacao}
            )

        # Remove campos de vigência com string vazia antes de serializar/enviar
        payload_ajuste = dict(documento)
        for campo_data in ["dataVigenciaInicio", "dataVigenciaFim"]:
            if campo_data in payload_ajuste and not payload_ajuste[campo_data]:
                del payload_ajuste[campo_data]

        resultado = enviar_ajuste_audesp(
            token=token_audesp,
            documento_json=json.dumps(payload_ajuste, ensure_ascii=False)
        )

        if resultado.get("sucesso"):
            protocolo = resultado.get("protocolo")
            ajuste.status = "sent"
            ajuste.protocolo = protocolo
            ajuste.status_protocolo = "Recebido"
            ajuste.detalhes_protocolo = json.dumps(resultado.get("dados", {}), ensure_ascii=False)
            ajuste.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(ajuste)

            # Consulta automaticamente o protocolo logo após a transmissão
            consulta_auto = None
            if protocolo:
                consulta_auto = consultar_e_registrar_protocolo(
                    session=session,
                    token=token_audesp,
                    modulo="ajuste",
                    registro_id=ajuste.id,
                    codigo_documento=ajuste.codigo_contrato or f"{ajuste.numero_contrato_empenho}/{ajuste.ano_contrato}",
                    protocolo=protocolo,
                    origem="envio_automatico",
                    status_padrao="Recebido",
                )
                if consulta_auto.get("sucesso"):
                    ajuste.status_protocolo = consulta_auto.get("status") or "Recebido"
                    ajuste.detalhes_protocolo = json.dumps(consulta_auto.get("dados", {}), ensure_ascii=False)
                    ajuste.updated_at = datetime.now(timezone.utc)
                    session.add(ajuste)
                    session.commit()
                    session.refresh(ajuste)

            erros_formatados = consulta_auto.get("erros_formatados", []) if consulta_auto else []
            erros_detalhados = consulta_auto.get("erros_detalhados", []) if consulta_auto else []
            is_rejeitado = bool(consulta_auto.get("is_rejeitado")) if consulta_auto else False
            possui_erros = bool(consulta_auto.get("possui_erros")) if consulta_auto else False

            return {
                "sucesso": True,
                "mensagem": "Ajuste/Contrato transmitido com sucesso ao TCESP!",
                "protocolo": ajuste.protocolo,
                "status_protocolo": ajuste.status_protocolo or "Recebido",
                "is_rejeitado": is_rejeitado,
                "possui_erros": possui_erros,
                "erros_formatados": erros_formatados,
                "erros_detalhados": erros_detalhados,
                "dados": consulta_auto.get("dados") if consulta_auto else resultado.get("dados"),
                "detalhes": consulta_auto.get("dados") if consulta_auto else resultado.get("dados"),
                "historico_protocolo": consulta_auto.get("historico", []) if consulta_auto else [],
                "ajuste": ajuste
            }
        else:
            ajuste.status = "error"
            ajuste.detalhes_protocolo = json.dumps(resultado, ensure_ascii=False)
            ajuste.updated_at = datetime.now(timezone.utc)
            session.commit()
            return {
                "sucesso": False,
                "mensagem": resultado.get("mensagem", "Falha no envio do ajuste ao AUDESP."),
                "erros": resultado.get("erros", []),
                "status_code": resultado.get("status_code", 400)
            }

    @staticmethod
    def consultar_protocolo(
        session: Session,
        ajuste_id: int,
        token_audesp: str
    ) -> Dict[str, Any]:
        """Consulta o processamento do protocolo no TCESP e grava no histórico."""
        ajuste = session.get(AjusteContrato, ajuste_id)
        if not ajuste or not ajuste.protocolo:
            raise HTTPException(status_code=400, detail="Este ajuste não possui protocolo gerado para consulta.")

        consulta = consultar_e_registrar_protocolo(
            session=session,
            token=token_audesp,
            modulo="ajuste",
            registro_id=ajuste.id,
            codigo_documento=ajuste.codigo_contrato or f"{ajuste.numero_contrato_empenho}/{ajuste.ano_contrato}",
            protocolo=ajuste.protocolo,
            origem="consulta_manual",
            status_padrao=ajuste.status_protocolo or "Recebido",
        )
        if consulta.get("sucesso"):
            novo_status = consulta.get("status")
            ajuste.status_protocolo = novo_status
            ajuste.detalhes_protocolo = json.dumps(consulta.get("dados", {}), ensure_ascii=False)
            ajuste.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(ajuste)
            return {
                "sucesso": True,
                "protocolo": ajuste.protocolo,
                "status": novo_status,
                "is_rejeitado": consulta.get("is_rejeitado", False),
                "possui_erros": consulta.get("possui_erros", False),
                "erros_formatados": consulta.get("erros_formatados", []),
                "erros_detalhados": consulta.get("erros_detalhados", []),
                "dados": consulta.get("dados"),
                "detalhes": consulta.get("dados"),
                "historico": consulta.get("historico", []),
            }
        else:
            return {
                "sucesso": False,
                "mensagem": consulta.get("mensagem", "Erro ao consultar protocolo.")
            }

    @staticmethod
    def obter_historico_protocolo(session: Session, ajuste_id: int) -> List[Dict[str, Any]]:
        """Retorna o histórico de consultas de protocolo de um ajuste."""
        ajuste = session.get(AjusteContrato, ajuste_id)
        if not ajuste:
            raise HTTPException(status_code=404, detail="Ajuste não encontrado.")
        return listar_historico_protocolo(session, "ajuste", ajuste.id, ajuste.protocolo)

    @staticmethod
    def excluir_ajuste(session: Session, ajuste_id: int) -> Dict[str, Any]:
        """Exclui um ajuste (apenas rascunhos)."""
        ajuste = session.get(AjusteContrato, ajuste_id)
        if not ajuste:
            raise HTTPException(status_code=404, detail="Ajuste não encontrado.")
        if ajuste.status == "sent":
            raise HTTPException(status_code=400, detail="Não é possível excluir um ajuste já transmitido ao AUDESP.")
        session.delete(ajuste)
        session.commit()
        return {"sucesso": True, "mensagem": "Ajuste excluído com sucesso."}

    @staticmethod
    def retornar_rascunho(session: Session, ajuste_id: int) -> AjusteContrato:
        """Destrava ajuste para edição em modo rascunho."""
        ajuste = session.get(AjusteContrato, ajuste_id)
        if not ajuste:
            raise HTTPException(status_code=404, detail="Ajuste não encontrado.")
        ajuste.status = "draft"
        ajuste.updated_at = datetime.now(timezone.utc)
        session.commit()
        session.refresh(ajuste)
        return ajuste
