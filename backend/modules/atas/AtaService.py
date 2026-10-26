import json
from typing import Optional, List, Dict, Any
from datetime import datetime, date

from fastapi import HTTPException
from sqlmodel import Session, select, or_

from core.audesp_client import enviar_ata_audesp, consultar_protocolo_audesp
from core.audesp_domains import MUNICIPIOS_AUDESP, ENTIDADES_AUDESP
from modules.atas.Ata import AtaRegistroPreco
from modules.atas.AtaDomains import validar_regras_negocio_ata
from modules.editais.Edital import Edital
from modules.licitacoes.Licitacao import Licitacao


class AtaService:
    """Camada de serviço para regras de negócio e persistência do Módulo de Atas de Registro de Preços."""

    @staticmethod
    def get_dominios() -> Dict[str, Any]:
        """Retorna tabelas de domínio para o módulo de Atas."""
        return {
            "municipios": MUNICIPIOS_AUDESP,
            "entidades": ENTIDADES_AUDESP
        }

    @staticmethod
    def listar_atas(
        session: Session,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[AtaRegistroPreco]:
        """Lista atas cadastradas com filtros opcionais."""
        query = select(AtaRegistroPreco).order_by(AtaRegistroPreco.updated_at.desc())
        if status:
            query = query.where(AtaRegistroPreco.status == status)
        if search:
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    AtaRegistroPreco.numero_ata_registro_preco.like(term),
                    AtaRegistroPreco.codigo_ata.like(term),
                    AtaRegistroPreco.codigo_edital.like(term),
                    AtaRegistroPreco.protocolo.like(term)
                )
            )
        return list(session.exec(query).all())

    @staticmethod
    def obter_ata(session: Session, ata_id: int) -> Dict[str, Any]:
        """Recupera detalhes e o payload JSON completo de uma ata."""
        ata = session.get(AtaRegistroPreco, ata_id)
        if not ata:
            raise HTTPException(status_code=404, detail="Ata de Registro de Preços não encontrada.")
        
        try:
            documento = json.loads(ata.documento_json)
        except Exception:
            documento = {}

        return {
            "ata": ata,
            "documento": documento
        }

    @staticmethod
    def salvar_ata(session: Session, payload: Dict[str, Any]) -> AtaRegistroPreco:
        """Cria ou atualiza um rascunho de ata de registro de preços."""
        documento = payload.get("documento", {})
        descritor = documento.get("descritor", {})
        
        ata_id = payload.get("id")
        ata = session.get(AtaRegistroPreco, ata_id) if ata_id else None

        # Parse de datas
        def parse_date(val):
            if not val:
                return datetime.utcnow().date()
            if isinstance(val, (date, datetime)):
                return val if isinstance(val, date) else val.date()
            try:
                return datetime.strptime(str(val).split("T")[0], "%Y-%m-%d").date()
            except Exception:
                return datetime.utcnow().date()

        dt_assinatura = parse_date(documento.get("dataAssinatura"))
        dt_inicio = parse_date(documento.get("dataVigenciaInicio"))
        dt_fim = parse_date(documento.get("dataVigenciaFim"))

        numero_ata = str(documento.get("numeroAtaRegistroPreco", ""))
        ano_ata = int(documento.get("anoAta", datetime.now().year))
        codigo_ata = str(descritor.get("codigoAta", f"ATA-{numero_ata}/{ano_ata}"))

        if not ata:
            ata = AtaRegistroPreco(
                municipio=int(descritor.get("municipio", 0)),
                entidade=int(descritor.get("entidade", 0)),
                codigo_edital=str(descritor.get("codigoEdital", "")),
                codigo_ata=codigo_ata,
                ano_compra=int(descritor.get("anoCompra", ano_ata)),
                retificacao=bool(descritor.get("retificacao", False)),
                edital_id=payload.get("edital_id"),
                licitacao_id=payload.get("licitacao_id"),
                numero_ata_registro_preco=numero_ata,
                ano_ata=ano_ata,
                data_assinatura=dt_assinatura,
                data_vigencia_inicio=dt_inicio,
                data_vigencia_fim=dt_fim,
                status="draft",
                documento_json=json.dumps(documento, ensure_ascii=False)
            )
            session.add(ata)
        else:
            if ata.status == "sent":
                raise HTTPException(status_code=400, detail="Esta ata já foi enviada à AUDESP e não pode ser editada diretamente sem gerar retificação.")
            
            ata.municipio = int(descritor.get("municipio", ata.municipio))
            ata.entidade = int(descritor.get("entidade", ata.entidade))
            ata.codigo_edital = str(descritor.get("codigoEdital", ata.codigo_edital))
            ata.codigo_ata = codigo_ata
            ata.ano_compra = int(descritor.get("anoCompra", ata.ano_compra))
            ata.retificacao = bool(descritor.get("retificacao", ata.retificacao))
            ata.edital_id = payload.get("edital_id", ata.edital_id)
            ata.licitacao_id = payload.get("licitacao_id", ata.licitacao_id)
            ata.numero_ata_registro_preco = numero_ata
            ata.ano_ata = ano_ata
            ata.data_assinatura = dt_assinatura
            ata.data_vigencia_inicio = dt_inicio
            ata.data_vigencia_fim = dt_fim
            ata.documento_json = json.dumps(documento, ensure_ascii=False)
            ata.updated_at = datetime.utcnow()

        session.commit()
        session.refresh(ata)
        return ata

    @staticmethod
    async def enviar_ata(
        session: Session,
        ata_id: int,
        token_audesp: str,
        forcar: bool = False
    ) -> Dict[str, Any]:
        """Valida e transmite a ata para a API AUDESP Fase IV."""
        ata = session.get(AtaRegistroPreco, ata_id)
        if not ata:
            raise HTTPException(status_code=404, detail="Ata não encontrada.")

        try:
            documento = json.loads(ata.documento_json)
        except Exception:
            raise HTTPException(status_code=400, detail="JSON da ata está corrompido.")

        # Valida regras de negócio do schema
        erros_validacao = validar_regras_negocio_ata(documento)
        if erros_validacao and not forcar:
            raise HTTPException(
                status_code=422,
                detail={"mensagem": "A ata possui inconsistências de negócio com a AUDESP.", "erros": erros_validacao}
            )

        # Transmissão HTTP multipart
        resultado = enviar_ata_audesp(
            token=token_audesp,
            documento_json=ata.documento_json
        )

        if resultado.get("sucesso"):
            ata.status = "sent"
            ata.protocolo = resultado.get("protocolo")
            ata.status_protocolo = "Recebido"
            ata.detalhes_protocolo = json.dumps(resultado.get("dados", {}), ensure_ascii=False)
            ata.updated_at = datetime.utcnow()
            session.commit()
            session.refresh(ata)
            return {
                "sucesso": True,
                "mensagem": "Ata de Registro de Preços transmitida com sucesso ao TCESP!",
                "protocolo": ata.protocolo,
                "ata": ata
            }
        else:
            ata.status = "error"
            ata.detalhes_protocolo = json.dumps(resultado, ensure_ascii=False)
            ata.updated_at = datetime.utcnow()
            session.commit()
            return {
                "sucesso": False,
                "mensagem": resultado.get("mensagem", "Falha no envio da ata ao AUDESP."),
                "erros": resultado.get("erros", []),
                "status_code": resultado.get("status_code", 400)
            }

    @staticmethod
    async def consultar_protocolo(
        session: Session,
        ata_id: int,
        token_audesp: str
    ) -> Dict[str, Any]:
        """Consulta a situação do processamento do protocolo no TCESP."""
        ata = session.get(AtaRegistroPreco, ata_id)
        if not ata or not ata.protocolo:
            raise HTTPException(status_code=400, detail="Esta ata não possui protocolo gerado para consulta.")

        resultado = consultar_protocolo_audesp(token=token_audesp, protocolo=ata.protocolo)
        if resultado.get("sucesso"):
            novo_status = resultado.get("status")
            ata.status_protocolo = novo_status
            ata.detalhes_protocolo = json.dumps(resultado.get("dados", {}), ensure_ascii=False)
            ata.updated_at = datetime.utcnow()
            session.commit()
            session.refresh(ata)
            return {
                "sucesso": True,
                "protocolo": ata.protocolo,
                "status": novo_status,
                "detalhes": resultado.get("dados")
            }
        else:
            return {
                "sucesso": False,
                "mensagem": resultado.get("mensagem", "Erro ao consultar protocolo.")
            }

    @staticmethod
    def retornar_rascunho(session: Session, ata_id: int) -> AtaRegistroPreco:
        """Permite destravar uma ata enviada/com erro para edição."""
        ata = session.get(AtaRegistroPreco, ata_id)
        if not ata:
            raise HTTPException(status_code=404, detail="Ata não encontrada.")
        ata.status = "draft"
        ata.updated_at = datetime.utcnow()
        session.commit()
        session.refresh(ata)
        return ata
