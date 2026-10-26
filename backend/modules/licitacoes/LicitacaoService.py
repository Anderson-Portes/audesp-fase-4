import json
from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import HTTPException
from sqlmodel import Session, select, or_

from core.audesp_client import enviar_licitacao_audesp, consultar_protocolo_audesp
from core.audesp_domains import MUNICIPIOS_AUDESP, ENTIDADES_AUDESP
from modules.licitacoes.Licitacao import Licitacao
from modules.editais.Edital import Edital
from modules.licitacoes.LicitacaoDomains import (
    DOMINIO_TRI_STATE,
    DOMINIO_TIPO_NATUREZA,
    DOMINIO_EXIGENCIA_AMOSTRA,
    DOMINIO_EXIGENCIA_VISITA,
    DOMINIO_FONTES_RECURSO,
    DOMINIO_INDICES_ECONOMICOS,
    DOMINIO_TIPO_ORCAMENTO,
    DOMINIO_SITUACAO_COMPRA_ITEM,
    DOMINIO_TIPO_PROPOSTA,
    DOMINIO_TIPO_PESSOA,
    DOMINIO_DECLARACAO_ME_EPP,
    DOMINIO_RESULTADO_HABILITACAO,
    validar_regras_negocio_licitacao
)


class LicitacaoService:
    """Camada de serviço para regras de negócio e persistência do Módulo de Licitações."""

    @staticmethod
    def get_dominios() -> Dict[str, Any]:
        """Retorna todas as tabelas de domínio do módulo de Licitações para o frontend."""
        return {
            "triState": DOMINIO_TRI_STATE,
            "tiposNatureza": DOMINIO_TIPO_NATUREZA,
            "exigenciasAmostra": DOMINIO_EXIGENCIA_AMOSTRA,
            "exigenciasVisita": DOMINIO_EXIGENCIA_VISITA,
            "fontesRecurso": DOMINIO_FONTES_RECURSO,
            "indicesEconomicos": DOMINIO_INDICES_ECONOMICOS,
            "tiposOrcamento": DOMINIO_TIPO_ORCAMENTO,
            "situacoesCompraItem": DOMINIO_SITUACAO_COMPRA_ITEM,
            "tiposProposta": DOMINIO_TIPO_PROPOSTA,
            "tiposPessoa": DOMINIO_TIPO_PESSOA,
            "declaracoesMeEpp": DOMINIO_DECLARACAO_ME_EPP,
            "resultadosHabilitacao": DOMINIO_RESULTADO_HABILITACAO,
            "municipios": MUNICIPIOS_AUDESP,
            "entidades": ENTIDADES_AUDESP
        }

    @staticmethod
    def listar_licitacoes(
        session: Session,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Licitacao]:
        """Lista licitações cadastradas com filtros opcionais."""
        query = select(Licitacao).order_by(Licitacao.updated_at.desc())
        if status:
            query = query.where(Licitacao.status == status)
        if search:
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Licitacao.codigo_edital.like(term),
                    Licitacao.numero_processo.like(term),
                    Licitacao.numero_compra.like(term),
                    Licitacao.objeto_edital.like(term),
                    Licitacao.protocolo.like(term)
                )
            )
        return list(session.exec(query).all())

    @staticmethod
    def obter_licitacao(session: Session, id: int) -> Dict[str, Any]:
        """Obtém detalhes de uma licitação pelo ID e faz o parse de campos JSON."""
        licitacao = session.get(Licitacao, id)
        if not licitacao:
            raise HTTPException(status_code=404, detail="Licitação não encontrada")

        doc_json = {}
        try:
            doc_json = json.loads(licitacao.documento_json)
        except Exception:
            pass

        detalhes_prot = None
        if licitacao.detalhes_protocolo:
            try:
                detalhes_prot = json.loads(licitacao.detalhes_protocolo)
            except Exception:
                detalhes_prot = licitacao.detalhes_protocolo

        return {
            **licitacao.model_dump(),
            "parsed_documento": doc_json,
            "parsed_detalhes_protocolo": detalhes_prot
        }

    @staticmethod
    def salvar_licitacao(session: Session, payload: dict) -> Licitacao:
        """Cria um novo rascunho de licitação com vinculação ao edital de origem."""
        raw_doc = payload.get("documento") if "documento" in payload else payload.get("documento_json")
        if raw_doc is None:
            raw_doc = payload

        if isinstance(raw_doc, str):
            try:
                doc_dict = json.loads(raw_doc)
            except Exception:
                raise HTTPException(status_code=400, detail="documento_json inválido")
        else:
            doc_dict = raw_doc

        descritor = doc_dict.get("descritor", {})
        codigo_edital = str(descritor.get("codigoEdital") or payload.get("codigo_edital") or "").strip()
        municipio = int(descritor.get("municipio") or payload.get("municipio") or 0)
        entidade = int(descritor.get("entidade") or payload.get("entidade") or 0)

        if not codigo_edital:
            raise HTTPException(status_code=400, detail="Código do Edital é obrigatório na Licitação")

        # Localiza edital vinculado se existir
        edital_id = payload.get("edital_id")
        numero_compra = payload.get("numero_compra")
        ano_compra = payload.get("ano_compra")
        numero_processo = payload.get("numero_processo") or doc_dict.get("numeroProcesso")
        objeto_edital = payload.get("objeto_edital") or payload.get("objeto_licitacao")

        if edital_id:
            edital_match = session.get(Edital, edital_id)
            if edital_match:
                numero_compra = numero_compra or edital_match.numero_compra
                ano_compra = ano_compra or edital_match.ano_compra
                numero_processo = numero_processo or edital_match.numero_processo
                objeto_edital = objeto_edital or edital_match.objeto_compra
        else:
            edital_match = session.exec(
                select(Edital).where(
                    Edital.codigo_edital == codigo_edital,
                    Edital.municipio == municipio,
                    Edital.entidade == entidade
                )
            ).first()
            if edital_match:
                edital_id = edital_match.id
                numero_compra = numero_compra or edital_match.numero_compra
                ano_compra = ano_compra or edital_match.ano_compra
                numero_processo = numero_processo or edital_match.numero_processo
                objeto_edital = objeto_edital or edital_match.objeto_compra

        licitacao = Licitacao(
            edital_id=edital_id,
            municipio=municipio,
            entidade=entidade,
            codigo_edital=codigo_edital,
            retificacao=bool(descritor.get("retificacao", False)),
            status=payload.get("status", "draft"),
            recurso_bid=int(doc_dict.get("recursoBID", 2)),
            tipo_natureza=int(doc_dict.get("tipoNatureza", 1)),
            numero_compra=numero_compra,
            ano_compra=ano_compra,
            numero_processo=numero_processo,
            objeto_edital=objeto_edital,
            documento_json=json.dumps(doc_dict, ensure_ascii=False),
            updated_at=datetime.utcnow()
        )
        session.add(licitacao)
        session.commit()
        session.refresh(licitacao)
        return licitacao

    @staticmethod
    def atualizar_licitacao(session: Session, id: int, payload: dict) -> Licitacao:
        """Atualiza uma licitação existente."""
        licitacao = session.get(Licitacao, id)
        if not licitacao:
            raise HTTPException(status_code=404, detail="Licitação não encontrada")

        raw_doc = payload.get("documento") if "documento" in payload else payload.get("documento_json")
        if raw_doc is None:
            raw_doc = payload

        if isinstance(raw_doc, str):
            try:
                doc_dict = json.loads(raw_doc)
            except Exception:
                raise HTTPException(status_code=400, detail="documento_json inválido")
        else:
            doc_dict = raw_doc

        descritor = doc_dict.get("descritor", {})
        if descritor.get("codigoEdital"):
            licitacao.codigo_edital = str(descritor.get("codigoEdital")).strip()
        if descritor.get("municipio"):
            licitacao.municipio = int(descritor.get("municipio"))
        if descritor.get("entidade"):
            licitacao.entidade = int(descritor.get("entidade"))
        if "retificacao" in descritor:
            licitacao.retificacao = bool(descritor["retificacao"])

        if "edital_id" in payload:
            licitacao.edital_id = payload["edital_id"]
        if "numero_compra" in payload:
            licitacao.numero_compra = payload["numero_compra"]
        if "ano_compra" in payload:
            licitacao.ano_compra = payload["ano_compra"]
        if "numero_processo" in payload:
            licitacao.numero_processo = payload["numero_processo"]
        if "objeto_edital" in payload:
            licitacao.objeto_edital = payload["objeto_edital"]

        licitacao.recurso_bid = int(doc_dict.get("recursoBID", licitacao.recurso_bid))
        licitacao.tipo_natureza = int(doc_dict.get("tipoNatureza", licitacao.tipo_natureza))
        licitacao.documento_json = json.dumps(doc_dict, ensure_ascii=False)
        licitacao.updated_at = datetime.utcnow()

        session.add(licitacao)
        session.commit()
        session.refresh(licitacao)
        return licitacao

    @staticmethod
    def excluir_licitacao(session: Session, id: int) -> Dict[str, Any]:
        """Exclui uma licitação (apenas rascunhos)."""
        licitacao = session.get(Licitacao, id)
        if not licitacao:
            raise HTTPException(status_code=404, detail="Licitação não encontrada")
        if licitacao.status == "sent":
            raise HTTPException(status_code=400, detail="Não é possível excluir uma licitação já transmitida ao AUDESP")

        session.delete(licitacao)
        session.commit()
        return {"sucesso": True, "mensagem": "Licitação excluída com sucesso"}

    @staticmethod
    async def enviar_licitacao(session: Session, id: int, token: str) -> Dict[str, Any]:
        """Valida as regras de negócio e transmite a licitação para o AUDESP Fase IV."""
        licitacao = session.get(Licitacao, id)
        if not licitacao:
            raise HTTPException(status_code=404, detail="Licitação não encontrada")

        try:
            doc = json.loads(licitacao.documento_json)
        except Exception:
            raise HTTPException(status_code=400, detail="JSON da licitação corrompido.")

        # Executa validações oficiais AUDESP
        erros = validar_regras_negocio_licitacao(doc)
        if erros:
            raise HTTPException(
                status_code=422,
                detail={
                    "mensagem": "A licitação não atende às regras de negócio da Fase IV do AUDESP.",
                    "erros": erros
                }
            )

        json_to_send = json.dumps(doc, ensure_ascii=False)

        resultado = enviar_licitacao_audesp(
            token=token,
            documento_json=json_to_send
        )

        if resultado["sucesso"]:
            protocolo = resultado.get("protocolo")
            licitacao.status = "sent"
            licitacao.protocolo = protocolo
            licitacao.status_protocolo = "Recebido"
            licitacao.detalhes_protocolo = json.dumps(resultado.get("dados", {}), ensure_ascii=False)
            licitacao.updated_at = datetime.utcnow()
            session.add(licitacao)
            session.commit()
            session.refresh(licitacao)
            return {
                "sucesso": True,
                "mensagem": resultado["mensagem"],
                "protocolo": protocolo,
                "status_protocolo": "Recebido"
            }
        else:
            licitacao.detalhes_protocolo = json.dumps(resultado.get("dados", {}), ensure_ascii=False)
            licitacao.updated_at = datetime.utcnow()
            session.add(licitacao)
            session.commit()
            raise HTTPException(
                status_code=resultado.get("status_code", 400),
                detail={
                    "mensagem": resultado.get("mensagem", "Erro ao enviar licitação ao AUDESP"),
                    "erros": resultado.get("erros", []),
                    "dados": resultado.get("dados")
                }
            )

    @staticmethod
    async def consultar_protocolo(session: Session, id: int, token: str) -> Dict[str, Any]:
        """Consulta no AUDESP a situação do protocolo da licitação."""
        licitacao = session.get(Licitacao, id)
        if not licitacao or not licitacao.protocolo:
            raise HTTPException(status_code=404, detail="Licitação não possui protocolo para consulta.")

        resultado = consultar_protocolo_audesp(token=token, protocolo=licitacao.protocolo)
        if resultado["sucesso"]:
            novo_status = resultado.get("status") or licitacao.status_protocolo
            licitacao.status_protocolo = novo_status
            licitacao.detalhes_protocolo = json.dumps(resultado.get("dados", {}), ensure_ascii=False)
            licitacao.updated_at = datetime.utcnow()
            session.add(licitacao)
            session.commit()
            session.refresh(licitacao)
            return {
                "sucesso": True,
                "protocolo": licitacao.protocolo,
                "status": novo_status,
                "dados": resultado.get("dados")
            }
        else:
            raise HTTPException(
                status_code=resultado.get("status_code", 400),
                detail=resultado.get("mensagem", "Erro ao consultar protocolo")
            )

    @staticmethod
    def retornar_rascunho(session: Session, id: int) -> Dict[str, Any]:
        """Retorna uma licitação para o estado de rascunho para reedição."""
        licitacao = session.get(Licitacao, id)
        if not licitacao:
            raise HTTPException(status_code=404, detail="Licitação não encontrada")
        licitacao.status = "draft"
        licitacao.updated_at = datetime.utcnow()
        session.add(licitacao)
        session.commit()
        session.refresh(licitacao)
        return {"sucesso": True, "mensagem": "Licitação retornada para rascunho com sucesso."}
