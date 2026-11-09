import json
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timezone

from fastapi import HTTPException
from sqlmodel import Session, select, or_

from core.audesp_client import (
    enviar_ata_audesp,
    consultar_protocolo_audesp,
    extrair_erros_estruturados_audesp,
    extrair_mensagens_protocolo_audesp,
)
from modules.protocolos.ProtocoloService import (
    consultar_e_registrar_protocolo,
    listar_historico_protocolo,
)
from core.audesp_domains import MUNICIPIOS_AUDESP, ENTIDADES_AUDESP
from modules.atas.Ata import AtaRegistroPreco
from modules.atas.AtaDomains import validar_regras_negocio_ata
from modules.editais.Edital import Edital
from modules.licitacoes.Licitacao import Licitacao
from modules.licitacoes.LicitacaoDomains import (
    selecionar_licitacao_enviada,
    extrair_numeros_itens_licitacao,
)


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

        detalhes_prot = None
        if ata.detalhes_protocolo:
            try:
                detalhes_prot = json.loads(ata.detalhes_protocolo)
            except Exception:
                detalhes_prot = ata.detalhes_protocolo

        return {
            "ata": ata,
            "documento": documento,
            "parsed_detalhes_protocolo": detalhes_prot,
            "erros_formatados": extrair_mensagens_protocolo_audesp(detalhes_prot),
            "erros_detalhados": extrair_erros_estruturados_audesp(detalhes_prot),
            "historico_protocolo": listar_historico_protocolo(session, "ata", ata.id, ata.protocolo),
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
                return datetime.now(timezone.utc).date()
            if isinstance(val, (date, datetime)):
                return val if isinstance(val, date) else val.date()
            try:
                return datetime.strptime(str(val).split("T")[0], "%Y-%m-%d").date()
            except Exception:
                return datetime.now(timezone.utc).date()

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
            ata.updated_at = datetime.now(timezone.utc)

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

        # Localiza edital vinculado e licitação enviada para validação cruzada
        edital_vinculado = session.get(Edital, ata.edital_id) if ata.edital_id else None
        if not edital_vinculado and ata.codigo_edital:
            edital_vinculado = session.exec(
                select(Edital).where(
                    Edital.codigo_edital == ata.codigo_edital,
                    Edital.municipio == ata.municipio,
                    Edital.entidade == ata.entidade
                )
            ).first()

        erros_fluxo: List[str] = []
        numeros_itens_lic = None
        edital_sem_pncp = False
        edital_codigo_base = ata.codigo_edital

        if not edital_vinculado:
            erros_fluxo.append("O edital vinculado não foi encontrado.")
        else:
            edital_sem_pncp = bool(edital_vinculado.sem_pncp)
            edital_codigo_base = edital_vinculado.codigo_edital
            if edital_vinculado.status != "sent":
                erros_fluxo.append("O edital ainda não foi enviado ao AUDESP.")
            try:
                ed_doc = json.loads(edital_vinculado.documento_json) if edital_vinculado.documento_json else {}
            except Exception:
                ed_doc = {}
            if not ed_doc.get("srp", False):
                erros_fluxo.append("Ata de registro de preços exige edital SRP.")

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

        # Valida regras de negócio do schema + itens da licitação enviada
        erros_validacao = erros_fluxo + validar_regras_negocio_ata(
            documento,
            numeros_itens_licitacao=numeros_itens_lic,
            edital_sem_pncp=edital_sem_pncp,
            edital_codigo_base=edital_codigo_base
        )

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
            protocolo = resultado.get("protocolo")
            ata.status = "sent"
            ata.protocolo = protocolo
            ata.status_protocolo = "Recebido"
            ata.detalhes_protocolo = json.dumps(resultado.get("dados", {}), ensure_ascii=False)
            ata.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(ata)

            # Consulta automaticamente o protocolo logo após a transmissão
            consulta_auto = None
            if protocolo:
                consulta_auto = consultar_e_registrar_protocolo(
                    session=session,
                    token=token_audesp,
                    modulo="ata",
                    registro_id=ata.id,
                    codigo_documento=ata.codigo_ata or f"{ata.numero_ata_registro_preco}/{ata.ano_ata}",
                    protocolo=protocolo,
                    origem="envio_automatico",
                    status_padrao="Recebido",
                )
                if consulta_auto.get("sucesso"):
                    ata.status_protocolo = consulta_auto.get("status") or "Recebido"
                    ata.detalhes_protocolo = json.dumps(consulta_auto.get("dados", {}), ensure_ascii=False)
                    ata.updated_at = datetime.now(timezone.utc)
                    session.add(ata)
                    session.commit()
                    session.refresh(ata)

            erros_formatados = consulta_auto.get("erros_formatados", []) if consulta_auto else []
            erros_detalhados = consulta_auto.get("erros_detalhados", []) if consulta_auto else []
            is_rejeitado = bool(consulta_auto.get("is_rejeitado")) if consulta_auto else False
            possui_erros = bool(consulta_auto.get("possui_erros")) if consulta_auto else False

            return {
                "sucesso": True,
                "mensagem": "Ata de Registro de Preços transmitida com sucesso ao TCESP!",
                "protocolo": ata.protocolo,
                "status_protocolo": ata.status_protocolo or "Recebido",
                "is_rejeitado": is_rejeitado,
                "possui_erros": possui_erros,
                "erros_formatados": erros_formatados,
                "erros_detalhados": erros_detalhados,
                "dados": consulta_auto.get("dados") if consulta_auto else resultado.get("dados"),
                "detalhes": consulta_auto.get("dados") if consulta_auto else resultado.get("dados"),
                "historico_protocolo": consulta_auto.get("historico", []) if consulta_auto else [],
                "ata": ata
            }
        else:
            ata.status = "error"
            ata.detalhes_protocolo = json.dumps(resultado, ensure_ascii=False)
            ata.updated_at = datetime.now(timezone.utc)
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
        """Consulta a situação do processamento do protocolo no TCESP e grava no histórico."""
        ata = session.get(AtaRegistroPreco, ata_id)
        if not ata or not ata.protocolo:
            raise HTTPException(status_code=400, detail="Esta ata não possui protocolo gerado para consulta.")

        consulta = consultar_e_registrar_protocolo(
            session=session,
            token=token_audesp,
            modulo="ata",
            registro_id=ata.id,
            codigo_documento=ata.codigo_ata or f"{ata.numero_ata_registro_preco}/{ata.ano_ata}",
            protocolo=ata.protocolo,
            origem="consulta_manual",
            status_padrao=ata.status_protocolo or "Recebido",
        )
        if consulta.get("sucesso"):
            novo_status = consulta.get("status")
            ata.status_protocolo = novo_status
            ata.detalhes_protocolo = json.dumps(consulta.get("dados", {}), ensure_ascii=False)
            ata.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(ata)
            return {
                "sucesso": True,
                "protocolo": ata.protocolo,
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
    def obter_historico_protocolo(session: Session, ata_id: int) -> List[Dict[str, Any]]:
        """Retorna o histórico de consultas de protocolo de uma ata."""
        ata = session.get(AtaRegistroPreco, ata_id)
        if not ata:
            raise HTTPException(status_code=404, detail="Ata não encontrada.")
        return listar_historico_protocolo(session, "ata", ata.id, ata.protocolo)

    @staticmethod
    def excluir_ata(session: Session, ata_id: int) -> Dict[str, Any]:
        """Exclui uma ata (apenas rascunhos)."""
        ata = session.get(AtaRegistroPreco, ata_id)
        if not ata:
            raise HTTPException(status_code=404, detail="Ata não encontrada.")
        if ata.status == "sent":
            raise HTTPException(status_code=400, detail="Não é possível excluir uma ata já transmitida ao AUDESP.")
        session.delete(ata)
        session.commit()
        return {"sucesso": True, "mensagem": "Ata excluída com sucesso."}

    @staticmethod
    def retornar_rascunho(session: Session, ata_id: int) -> AtaRegistroPreco:
        """Permite destravar uma ata enviada/com erro para edição."""
        ata = session.get(AtaRegistroPreco, ata_id)
        if not ata:
            raise HTTPException(status_code=404, detail="Ata não encontrada.")
        ata.status = "draft"
        ata.updated_at = datetime.now(timezone.utc)
        session.commit()
        session.refresh(ata)
        return ata
