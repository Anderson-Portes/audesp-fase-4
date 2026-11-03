from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Header
from fastapi.responses import Response
from sqlmodel import Session

from core.database import get_session
from modules.editais.EditalService import EditalService

router = APIRouter(prefix="/api/editais", tags=["Editais"])

@router.get("/dominios")
def get_dominios():
    """Retorna todas as tabelas de domínio e regras de validação para o frontend."""
    return EditalService.get_dominios()

@router.get("")
def listar_editais(
    status: Optional[str] = Query(None, description="Filtra por 'draft' ou 'sent'"),
    search: Optional[str] = Query(None, description="Filtro textual"),
    session: Session = Depends(get_session)
):
    """Lista editais cadastrados."""
    return EditalService.listar_editais(session=session, status=status, search=search)

@router.get("/{id}")
def obter_edital(id: int, session: Session = Depends(get_session)):
    """Obtém detalhes de um edital pelo ID."""
    return EditalService.obter_edital(session=session, id=id)

@router.post("")
def salvar_edital(payload: dict, session: Session = Depends(get_session)):
    """Cria um novo edital (rascunho)."""
    return EditalService.salvar_edital(session=session, payload=payload)

@router.put("/{id}")
def atualizar_edital(id: int, payload: dict, session: Session = Depends(get_session)):
    """Atualiza um edital existente."""
    return EditalService.atualizar_edital(session=session, id=id, payload=payload)

@router.delete("/{id}")
def excluir_edital(id: int, session: Session = Depends(get_session)):
    """Exclui um edital (apenas rascunhos)."""
    return EditalService.excluir_edital(session=session, id=id)

@router.post("/{id}/upload-pdf")
async def upload_pdf(id: int, file: UploadFile = File(...), session: Session = Depends(get_session)):
    """Faz upload do arquivo PDF do edital e grava o binário diretamente no banco de dados."""
    return await EditalService.salvar_pdf(session=session, id=id, file=file)

@router.get("/{id}/pdf")
def baixar_pdf(id: int, session: Session = Depends(get_session)):
    """Baixa ou visualiza o arquivo PDF do edital a partir do banco de dados."""
    conteudo, filename, mime_type = EditalService.obter_pdf(session=session, id=id)
    return Response(
        content=conteudo,
        media_type=mime_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )

@router.post("/{id}/enviar")
async def enviar_edital(
    id: int,
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session)
):
    """Valida e transmite o edital para o AUDESP Fase IV (/recepcao-fase-4/f4/enviar-edital)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token de autorização Bearer não informado.")
    token = authorization.replace("Bearer ", "").strip()
    return await EditalService.enviar_edital(session=session, id=id, token=token)

@router.post("/{id}/consultar-protocolo")
async def consultar_protocolo(
    id: int,
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session)
):
    """Consulta no AUDESP a situação do protocolo do edital (/f4/consulta/{protocolo})."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token de autorização Bearer não informado.")
    token = authorization.replace("Bearer ", "").strip()
    return await EditalService.consultar_protocolo(session=session, id=id, token=token)

@router.get("/{id}/historico-protocolo")
def obter_historico_protocolo(id: int, session: Session = Depends(get_session)):
    """Retorna o histórico de consultas de protocolo do edital."""
    return EditalService.obter_historico_protocolo(session=session, id=id)

@router.post("/{id}/retornar-rascunho")
def retornar_rascunho(id: int, session: Session = Depends(get_session)):
    """Retorna um edital enviado/rejeitado para o estado de rascunho para reedição."""
    return EditalService.retornar_rascunho(session=session, id=id)
