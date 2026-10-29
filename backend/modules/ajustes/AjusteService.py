import json
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timezone

from fastapi import HTTPException
from sqlmodel import Session, select, or_

from core.audesp_client import enviar_ajuste_audesp, consultar_protocolo_audesp
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

        return {
            "ajuste": ajuste,
            "documento": documento
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

        # Verifica se o edital vinculado é SRP
        is_srp = False
        if ajuste.edital_id:
            edital_vinculado = session.get(Edital, ajuste.edital_id)
            if edital_vinculado and edital_vinculado.documento_json:
                try:
                    ed_doc = json.loads(edital_vinculado.documento_json)
                    is_srp = bool(ed_doc.get("srp", False))
                except Exception:
                    pass

        erros_validacao = validar_regras_negocio_ajuste(documento, edital_srp=is_srp)

        # Cross-validation com Licitacao vinculada (dispensada em adesão/participação externa)
        adesao = documento.get("descritor", {}).get("adesaoParticipacao", False)
        if not adesao and ajuste.licitacao_id:
            licitacao = session.get(Licitacao, ajuste.licitacao_id)
            if licitacao and licitacao.documento_json:
                try:
                    lic_doc = json.loads(licitacao.documento_json)
                    lic_itens = {str(item.get("numeroItem")) for item in lic_doc.get("item", []) if item.get("numeroItem") is not None}
                    ajuste_itens = [str(item.get("numeroItem")) for item in documento.get("itens", []) if item.get("numeroItem") is not None]
                    for item_num in ajuste_itens:
                        if item_num not in lic_itens:
                            erros_validacao.append(f"O item '{item_num}' do ajuste não existe na licitação vinculada.")
                except Exception:
                    pass

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
            ajuste.status = "sent"
            ajuste.protocolo = resultado.get("protocolo")
            ajuste.status_protocolo = "Recebido"
            ajuste.detalhes_protocolo = json.dumps(resultado.get("dados", {}), ensure_ascii=False)
            ajuste.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(ajuste)
            return {
                "sucesso": True,
                "mensagem": "Ajuste/Contrato transmitido com sucesso ao TCESP!",
                "protocolo": ajuste.protocolo,
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
        """Consulta o processamento do protocolo no TCESP."""
        ajuste = session.get(AjusteContrato, ajuste_id)
        if not ajuste or not ajuste.protocolo:
            raise HTTPException(status_code=400, detail="Este ajuste não possui protocolo gerado para consulta.")

        resultado = consultar_protocolo_audesp(token=token_audesp, protocolo=ajuste.protocolo)
        if resultado.get("sucesso"):
            novo_status = resultado.get("status")
            ajuste.status_protocolo = novo_status
            ajuste.detalhes_protocolo = json.dumps(resultado.get("dados", {}), ensure_ascii=False)
            ajuste.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(ajuste)
            return {
                "sucesso": True,
                "protocolo": ajuste.protocolo,
                "status": novo_status,
                "detalhes": resultado.get("dados")
            }
        else:
            return {
                "sucesso": False,
                "mensagem": resultado.get("mensagem", "Erro ao consultar protocolo.")
            }

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
