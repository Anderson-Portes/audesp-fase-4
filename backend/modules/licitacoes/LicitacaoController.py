from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlmodel import Session

from core.database import get_session
from modules.licitacoes.LicitacaoService import LicitacaoService

router = APIRouter(prefix="/api/licitacoes", tags=["Licitações"])

@router.get("/dominios")
def get_dominios():
    """Retorna todas as tabelas de domínio do módulo de Licitações para o frontend."""
    return LicitacaoService.get_dominios()

@router.get("")
def listar_licitacoes(
    status: Optional[str] = Query(None, description="Filtra por 'draft' ou 'sent'"),
    search: Optional[str] = Query(None, description="Filtro textual"),
    session: Session = Depends(get_session)
):
    """Lista licitações cadastradas."""
    return LicitacaoService.listar_licitacoes(session=session, status=status, search=search)

@router.get("/{id}")
def obter_licitacao(id: int, session: Session = Depends(get_session)):
    """Obtém detalhes de uma licitação pelo ID."""
    return LicitacaoService.obter_licitacao(session=session, id=id)

@router.post("")
def salvar_licitacao(payload: dict, session: Session = Depends(get_session)):
    """Cria um novo rascunho de licitação."""
    return LicitacaoService.salvar_licitacao(session=session, payload=payload)

@router.put("/{id}")
def atualizar_licitacao(id: int, payload: dict, session: Session = Depends(get_session)):
    """Atualiza uma licitação existente."""
    return LicitacaoService.atualizar_licitacao(session=session, id=id, payload=payload)

@router.delete("/{id}")
def excluir_licitacao(id: int, session: Session = Depends(get_session)):
    """Exclui uma licitação (apenas rascunhos)."""
    return LicitacaoService.excluir_licitacao(session=session, id=id)

@router.post("/{id}/enviar")
async def enviar_licitacao(
    id: int,
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session)
):
    """Valida as regras de negócio e transmite a licitação para o AUDESP Fase IV."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token de autorização Bearer não informado.")
    token = authorization.replace("Bearer ", "").strip()
    return await LicitacaoService.enviar_licitacao(session=session, id=id, token=token)

@router.post("/{id}/consultar-protocolo")
async def consultar_protocolo_licitacao(
    id: int,
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session)
):
    """Consulta no AUDESP a situação do protocolo da licitação (/f4/consulta/{protocolo})."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token de autorização Bearer não informado.")
    token = authorization.replace("Bearer ", "").strip()
    return await LicitacaoService.consultar_protocolo(session=session, id=id, token=token)

@router.post("/{id}/retornar-rascunho")
def retornar_rascunho_licitacao(id: int, session: Session = Depends(get_session)):
    """Retorna uma licitação para o estado de rascunho para reedição."""
    return LicitacaoService.retornar_rascunho(session=session, id=id)
