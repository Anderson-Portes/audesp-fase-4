import os
import json
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile
from sqlmodel import Session, select, or_

from core.audesp_client import (
    enviar_edital_audesp,
    consultar_protocolo_audesp,
    extrair_erros_estruturados_audesp,
    extrair_mensagens_protocolo_audesp,
)
from modules.protocolos.ProtocoloService import (
    consultar_e_registrar_protocolo,
    listar_historico_protocolo,
)
from core.audesp_domains import MUNICIPIOS_AUDESP, ENTIDADES_AUDESP
from modules.editais.Edital import Edital, EditalArquivo
from modules.licitacoes.Licitacao import Licitacao
from modules.atas.Ata import AtaRegistroPreco
from modules.ajustes.Ajuste import AjusteContrato
from modules.editais.EditalDomains import (
    DOMINIO_INSTRUMENTOS,
    DOMINIO_MODALIDADES,
    MODALIDADES_PERMITIDAS_POR_INSTRUMENTO,
    DOMINIO_MODO_DISPUTA,
    DOMINIO_VEICULOS_PUBLICACAO,
    DOMINIO_TIPO_BENEFICIO,
    DOMINIO_CRITERIO_JULGAMENTO,
    DOMINIO_ITEM_CATEGORIA,
    DOMINIO_ITEM_CATEGORIA_LEILAO,
    normalizar_categorias_edital,
    validar_regras_negocio_edital
)

# Carrega amparos legais da base interna da API
_CURRENT_DIR = os.path.dirname(__file__)
AMPAROS_FILE = os.path.join(_CURRENT_DIR, "data", "amparos_legais.json")
if not os.path.exists(AMPAROS_FILE):
    # Fallback se executado a partir de outra estrutura
    AMPAROS_FILE = os.path.join(os.path.dirname(os.path.dirname(_CURRENT_DIR)), "docs", "amparos_legais.json")

try:
    with open(AMPAROS_FILE, "r", encoding="utf-8") as f:
        AMPAROS_LEGAIS = json.load(f)
except Exception:
    AMPAROS_LEGAIS = []


class EditalService:
    """Camada de serviço para regras de negócio e persistência do Módulo de Editais."""

    @staticmethod
    def get_dominios() -> Dict[str, Any]:
        """Retorna todas as tabelas de domínio e regras de validação para o frontend."""
        return {
            "instrumentos": DOMINIO_INSTRUMENTOS,
            "modalidades": DOMINIO_MODALIDADES,
            "regrasModalidadePorInstrumento": MODALIDADES_PERMITIDAS_POR_INSTRUMENTO,
            "modosDisputa": DOMINIO_MODO_DISPUTA,
            "veiculosPublicacao": DOMINIO_VEICULOS_PUBLICACAO,
            "tiposBeneficio": DOMINIO_TIPO_BENEFICIO,
            "criteriosJulgamento": DOMINIO_CRITERIO_JULGAMENTO,
            "categoriasItem": DOMINIO_ITEM_CATEGORIA,
            "categoriasItemLeilao": DOMINIO_ITEM_CATEGORIA_LEILAO,
            "amparosLegais": AMPAROS_LEGAIS,
            "municipios": MUNICIPIOS_AUDESP,
            "entidades": ENTIDADES_AUDESP
        }

    @staticmethod
    def obter_dependentes(session: Session, edital_id: int) -> Dict[str, Any]:
        """Retorna a contagem de licitações, atas e ajustes dependentes de um edital."""
        edital = session.get(Edital, edital_id)
        if not edital:
            return {"licitacoes": 0, "atas": 0, "ajustes": 0, "tem_licitacao_enviada": False}

        licitacoes = session.exec(
            select(Licitacao).where(
                or_(
                    Licitacao.edital_id == edital.id,
                    (Licitacao.codigo_edital == edital.codigo_edital)
                    & (Licitacao.municipio == edital.municipio)
                    & (Licitacao.entidade == edital.entidade)
                )
            )
        ).all()

        atas = session.exec(
            select(AtaRegistroPreco).where(
                or_(
                    AtaRegistroPreco.edital_id == edital.id,
                    (AtaRegistroPreco.codigo_edital == edital.codigo_edital)
                    & (AtaRegistroPreco.municipio == edital.municipio)
                    & (AtaRegistroPreco.entidade == edital.entidade)
                )
            )
        ).all()

        ajustes = session.exec(
            select(AjusteContrato).where(
                or_(
                    AjusteContrato.edital_id == edital.id,
                    (AjusteContrato.codigo_edital == edital.codigo_edital)
                    & (AjusteContrato.municipio == edital.municipio)
                    & (AjusteContrato.entidade == edital.entidade)
                )
            )
        ).all()

        return {
            "licitacoes": len(licitacoes),
            "atas": len(atas),
            "ajustes": len(ajustes),
            "tem_licitacao_enviada": any(lic.status == "sent" for lic in licitacoes)
        }

    @staticmethod
    def listar_editais(
        session: Session,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Edital]:
        """Lista os editais cadastrados com filtros opcionais."""
        query = select(Edital).order_by(Edital.updated_at.desc())
        if status:
            query = query.where(Edital.status == status)
        if search:
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Edital.codigo_edital.like(term),
                    Edital.numero_processo.like(term),
                    Edital.numero_compra.like(term),
                    Edital.objeto_compra.like(term),
                    Edital.protocolo.like(term)
                )
            )
        return list(session.exec(query).all())

    @staticmethod
    def obter_edital(session: Session, id: int) -> Dict[str, Any]:
        """Obtém detalhes do edital e faz o parsing de campos JSON."""
        edital = session.get(Edital, id)
        if not edital:
            raise HTTPException(status_code=404, detail="Edital não encontrado")

        doc_json = {}
        try:
            doc_json = json.loads(edital.documento_json)
        except Exception:
            pass

        detalhes_prot = None
        if edital.detalhes_protocolo:
            try:
                detalhes_prot = json.loads(edital.detalhes_protocolo)
            except Exception:
                detalhes_prot = edital.detalhes_protocolo

        return {
            **edital.model_dump(),
            "parsed_documento": doc_json,
            "parsed_detalhes_protocolo": detalhes_prot,
            "erros_formatados": extrair_mensagens_protocolo_audesp(detalhes_prot),
            "erros_detalhados": extrair_erros_estruturados_audesp(detalhes_prot),
            "historico_protocolo": listar_historico_protocolo(session, "edital", edital.id, edital.protocolo),
            "dependentes": EditalService.obter_dependentes(session, edital.id)
        }

    @staticmethod
    def salvar_edital(session: Session, payload: dict) -> Edital:
        """Cria um novo rascunho de edital."""
        documento = payload.get("documento") or payload

        if isinstance(documento, str):
            try:
                doc_dict = json.loads(documento)
            except Exception:
                raise HTTPException(status_code=400, detail="documento_json inválido")
        else:
            doc_dict = dict(documento)

        doc_dict = normalizar_categorias_edital(doc_dict)

        descritor = doc_dict.get("descritor", {})
        codigo_edital = str(descritor.get("codigoEdital") or payload.get("codigo_edital") or "").strip()
        municipio = int(descritor.get("municipio") or payload.get("municipio") or 0)
        entidade = int(descritor.get("entidade") or payload.get("entidade") or 0)

        if not codigo_edital:
            raise HTTPException(status_code=400, detail="Código do Edital é obrigatório")

        edital = Edital(
            municipio=municipio,
            entidade=entidade,
            codigo_edital=codigo_edital,
            sem_pncp=bool(payload.get("sem_pncp", False)),
            retificacao=bool(descritor.get("retificacao", False)),
            status=payload.get("status", "draft"),
            numero_compra=doc_dict.get("numeroCompra"),
            ano_compra=doc_dict.get("anoCompra"),
            numero_processo=doc_dict.get("numeroProcesso"),
            objeto_compra=doc_dict.get("objetoCompra"),
            modalidade_id=doc_dict.get("modalidadeId"),
            modo_disputa_id=doc_dict.get("modoDisputaId"),
            tipo_instrumento_id=doc_dict.get("tipoInstrumentoConvocatorioId"),
            documento_json=json.dumps(doc_dict, ensure_ascii=False),
            pdf_path=payload.get("pdf_path"),
            pdf_nome_original=payload.get("pdf_nome_original"),
            updated_at=datetime.now(timezone.utc)
        )
        session.add(edital)
        session.commit()
        session.refresh(edital)
        return edital

    @staticmethod
    def atualizar_edital(session: Session, id: int, payload: dict) -> Edital:
        """Atualiza um edital existente."""
        edital = session.get(Edital, id)
        if not edital:
            raise HTTPException(status_code=404, detail="Edital não encontrado")

        documento = payload.get("documento") or payload
        if isinstance(documento, str):
            try:
                doc_dict = json.loads(documento)
            except Exception:
                raise HTTPException(status_code=400, detail="documento_json inválido")
        else:
            doc_dict = dict(documento)

        doc_dict = normalizar_categorias_edital(doc_dict)

        descritor = doc_dict.get("descritor", {})
        if descritor.get("codigoEdital"):
            edital.codigo_edital = str(descritor.get("codigoEdital")).strip()
        if descritor.get("municipio"):
            edital.municipio = int(descritor.get("municipio"))
        if descritor.get("entidade"):
            edital.entidade = int(descritor.get("entidade"))
        if "retificacao" in descritor:
            edital.retificacao = bool(descritor["retificacao"])
        if "sem_pncp" in payload:
            edital.sem_pncp = bool(payload["sem_pncp"])

        edital.numero_compra = doc_dict.get("numeroCompra", edital.numero_compra)
        edital.ano_compra = doc_dict.get("anoCompra", edital.ano_compra)
        edital.numero_processo = doc_dict.get("numeroProcesso", edital.numero_processo)
        edital.objeto_compra = doc_dict.get("objetoCompra", edital.objeto_compra)
        edital.modalidade_id = doc_dict.get("modalidadeId", edital.modalidade_id)
        edital.modo_disputa_id = doc_dict.get("modoDisputaId", edital.modo_disputa_id)
        edital.tipo_instrumento_id = doc_dict.get("tipoInstrumentoConvocatorioId", edital.tipo_instrumento_id)
        edital.documento_json = json.dumps(doc_dict, ensure_ascii=False)

        if "pdf_path" in payload:
            edital.pdf_path = payload["pdf_path"]
        if "pdf_nome_original" in payload:
            edital.pdf_nome_original = payload["pdf_nome_original"]

        edital.updated_at = datetime.now(timezone.utc)
        session.add(edital)
        session.commit()
        session.refresh(edital)
        return edital

    @staticmethod
    def excluir_edital(session: Session, id: int) -> Dict[str, Any]:
        """Exclui um edital (apenas rascunhos) e seu arquivo PDF vinculado."""
        edital = session.get(Edital, id)
        if not edital:
            raise HTTPException(status_code=404, detail="Edital não encontrado")
        if edital.status == "sent":
            raise HTTPException(status_code=400, detail="Não é possível excluir um edital já enviado ao AUDESP")

        arquivo = session.exec(
            select(EditalArquivo).where(EditalArquivo.edital_id == edital.id)
        ).first()
        if arquivo:
            session.delete(arquivo)

        session.delete(edital)
        session.commit()
        return {"sucesso": True, "mensagem": "Edital excluído com sucesso"}

    @staticmethod
    async def salvar_pdf(session: Session, id: int, file: UploadFile) -> Dict[str, Any]:
        """Faz upload do arquivo PDF do edital e grava o binário no banco de dados."""
        edital = session.get(Edital, id)
        if not edital:
            raise HTTPException(status_code=404, detail="Edital não encontrado")

        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="O arquivo deve ser do tipo PDF")

        conteudo_bytes = await file.read()
        tamanho = len(conteudo_bytes)

        if tamanho == 0:
            raise HTTPException(status_code=400, detail="O arquivo PDF enviado está vazio")

        # Limite máximo de 30 MB estipulado pelo AUDESP (30 * 1024 * 1024 = 31.457.280 bytes)
        if tamanho > 31457280:
            raise HTTPException(status_code=400, detail="O arquivo PDF excede o limite máximo de 30 MB")

        arquivo = session.exec(
            select(EditalArquivo).where(EditalArquivo.edital_id == edital.id)
        ).first()

        if arquivo:
            arquivo.nome_arquivo = file.filename
            arquivo.tamanho = tamanho
            arquivo.tipo_mime = file.content_type or "application/pdf"
            arquivo.conteudo = conteudo_bytes
            arquivo.updated_at = datetime.now(timezone.utc)
            session.add(arquivo)
        else:
            arquivo = EditalArquivo(
                edital_id=edital.id,
                nome_arquivo=file.filename,
                tipo_mime=file.content_type or "application/pdf",
                tamanho=tamanho,
                conteudo=conteudo_bytes
            )
            session.add(arquivo)

        edital.pdf_path = f"db://editais/{edital.id}/pdf"
        edital.pdf_nome_original = file.filename
        edital.updated_at = datetime.now(timezone.utc)
        session.add(edital)
        session.commit()
        session.refresh(edital)

        return {
            "sucesso": True,
            "mensagem": "Arquivo PDF gravado no banco de dados com sucesso",
            "pdf_path": edital.pdf_path,
            "pdf_nome_original": file.filename,
            "tamanho_bytes": tamanho
        }

    @staticmethod
    def obter_pdf(session: Session, id: int) -> Tuple[bytes, str, str]:
        """Recupera o binário do arquivo PDF e metadados para download/streaming."""
        edital = session.get(Edital, id)
        if not edital:
            raise HTTPException(status_code=404, detail="Edital não encontrado")

        arquivo = session.exec(
            select(EditalArquivo).where(EditalArquivo.edital_id == edital.id)
        ).first()

        if not arquivo or not arquivo.conteudo:
            raise HTTPException(status_code=404, detail="PDF não encontrado no banco de dados para este edital")

        filename = arquivo.nome_arquivo or edital.pdf_nome_original or f"edital_{edital.codigo_edital}.pdf"
        mime_type = arquivo.tipo_mime or "application/pdf"
        return arquivo.conteudo, filename, mime_type

    @staticmethod
    async def enviar_edital(session: Session, id: int, token: str) -> Dict[str, Any]:
        """Valida as regras de negócio e transmite o edital para o AUDESP Fase IV."""
        edital = session.get(Edital, id)
        if not edital:
            raise HTTPException(status_code=404, detail="Edital não encontrado")

        try:
            doc = json.loads(edital.documento_json)
        except Exception:
            raise HTTPException(status_code=400, detail="JSON do edital corrompido.")

        if "criterioJulgamentoId" in doc:
            del doc["criterioJulgamentoId"]

        doc = normalizar_categorias_edital(doc)

        # Bloqueia envio se sem_pncp estiver ativo mas houver publicação PNCP (veículo 5)
        if edital.sem_pncp:
            publicacoes = (doc.get("publicidade") or {}).get("publicacoes") or []
            if any(pub.get("veiculoPublicacao") == 5 for pub in publicacoes if isinstance(pub, dict)):
                raise HTTPException(
                    status_code=422,
                    detail={
                        "mensagem": "O edital não atende às regras de negócio da Fase IV do AUDESP.",
                        "erros": [
                            'O edital está configurado como "Sem PNCP", mas há um veículo de publicação PNCP (veículo 5) selecionado nas publicações. Remova-o antes de enviar.'
                        ]
                    }
                )

        arquivo = session.exec(
            select(EditalArquivo).where(EditalArquivo.edital_id == edital.id)
        ).first()

        pdf_bytes = arquivo.conteudo if arquivo else None
        pdf_filename = arquivo.nome_arquivo if arquivo else edital.pdf_nome_original
        has_pdf = bool(pdf_bytes or (edital.pdf_path and os.path.exists(edital.pdf_path)))

        # Executa validações oficiais AUDESP
        erros_validacao = validar_regras_negocio_edital(doc, has_pdf=has_pdf)
        if erros_validacao:
            raise HTTPException(
                status_code=422,
                detail={
                    "mensagem": "O edital não atende às regras de negócio da Fase IV do AUDESP.",
                    "erros": erros_validacao
                }
            )

        json_to_send = json.dumps(doc, ensure_ascii=False)

        resultado = enviar_edital_audesp(
            token=token,
            documento_json=json_to_send,
            pdf_bytes=pdf_bytes,
            pdf_filename=pdf_filename,
            pdf_path=edital.pdf_path if not pdf_bytes and os.path.exists(edital.pdf_path or "") else None
        )

        if resultado["sucesso"]:
            protocolo = resultado.get("protocolo")
            edital.status = "sent"
            edital.protocolo = protocolo
            edital.status_protocolo = "Recebido"
            edital.detalhes_protocolo = json.dumps(resultado.get("dados", {}), ensure_ascii=False)
            edital.updated_at = datetime.now(timezone.utc)
            session.add(edital)
            session.commit()
            session.refresh(edital)

            # Consulta automaticamente o protocolo logo após a transmissão
            consulta_auto = None
            if protocolo:
                consulta_auto = consultar_e_registrar_protocolo(
                    session=session,
                    token=token,
                    modulo="edital",
                    registro_id=edital.id,
                    codigo_documento=edital.codigo_edital,
                    protocolo=protocolo,
                    origem="envio_automatico",
                    status_padrao="Recebido",
                )
                if consulta_auto.get("sucesso"):
                    edital.status_protocolo = consulta_auto.get("status") or "Recebido"
                    edital.detalhes_protocolo = json.dumps(consulta_auto.get("dados", {}), ensure_ascii=False)
                    edital.updated_at = datetime.now(timezone.utc)
                    session.add(edital)
                    session.commit()
                    session.refresh(edital)

            erros_formatados = consulta_auto.get("erros_formatados", []) if consulta_auto else []
            erros_detalhados = consulta_auto.get("erros_detalhados", []) if consulta_auto else []
            is_rejeitado = bool(consulta_auto.get("is_rejeitado")) if consulta_auto else False
            possui_erros = bool(consulta_auto.get("possui_erros")) if consulta_auto else False

            return {
                "sucesso": True,
                "mensagem": resultado["mensagem"],
                "protocolo": protocolo,
                "status_protocolo": edital.status_protocolo or "Recebido",
                "is_rejeitado": is_rejeitado,
                "possui_erros": possui_erros,
                "erros_formatados": erros_formatados,
                "erros_detalhados": erros_detalhados,
                "dados": consulta_auto.get("dados") if consulta_auto else resultado.get("dados"),
                "detalhes": consulta_auto.get("dados") if consulta_auto else resultado.get("dados"),
                "historico_protocolo": consulta_auto.get("historico", []) if consulta_auto else [],
            }
        else:
            edital.detalhes_protocolo = json.dumps(resultado.get("dados", {}), ensure_ascii=False)
            edital.updated_at = datetime.now(timezone.utc)
            session.add(edital)
            session.commit()
            raise HTTPException(
                status_code=resultado.get("status_code", 400),
                detail={
                    "mensagem": resultado.get("mensagem", "Erro ao enviar edital à AUDESP"),
                    "erros": resultado.get("erros", []),
                    "dados": resultado.get("dados")
                }
            )

    @staticmethod
    async def consultar_protocolo(session: Session, id: int, token: str) -> Dict[str, Any]:
        """Consulta no AUDESP a situação de processamento do protocolo e grava no histórico."""
        edital = session.get(Edital, id)
        if not edital or not edital.protocolo:
            raise HTTPException(status_code=404, detail="Edital não possui protocolo para consulta.")

        consulta = consultar_e_registrar_protocolo(
            session=session,
            token=token,
            modulo="edital",
            registro_id=edital.id,
            codigo_documento=edital.codigo_edital,
            protocolo=edital.protocolo,
            origem="consulta_manual",
            status_padrao=edital.status_protocolo or "Recebido",
        )
        if consulta["sucesso"]:
            novo_status = consulta.get("status") or edital.status_protocolo
            edital.status_protocolo = novo_status
            edital.detalhes_protocolo = json.dumps(consulta.get("dados", {}), ensure_ascii=False)
            edital.updated_at = datetime.now(timezone.utc)
            session.add(edital)
            session.commit()
            session.refresh(edital)
            return {
                "sucesso": True,
                "protocolo": edital.protocolo,
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
            raise HTTPException(
                status_code=consulta.get("status_code", 400),
                detail=consulta.get("mensagem", "Erro ao consultar protocolo")
            )

    @staticmethod
    def obter_historico_protocolo(session: Session, id: int) -> List[Dict[str, Any]]:
        """Retorna o histórico de consultas de protocolo de um edital."""
        edital = session.get(Edital, id)
        if not edital:
            raise HTTPException(status_code=404, detail="Edital não encontrado")
        return listar_historico_protocolo(session, "edital", edital.id, edital.protocolo)

    @staticmethod
    def retornar_rascunho(session: Session, id: int) -> Dict[str, Any]:
        """Retorna um edital enviado/rejeitado para o estado de rascunho para reedição."""
        edital = session.get(Edital, id)
        if not edital:
            raise HTTPException(status_code=404, detail="Edital não encontrado")
        edital.status = "draft"
        edital.updated_at = datetime.now(timezone.utc)
        session.add(edital)
        session.commit()
        session.refresh(edital)
        return {"sucesso": True, "mensagem": "Edital retornado para rascunho com sucesso."}
