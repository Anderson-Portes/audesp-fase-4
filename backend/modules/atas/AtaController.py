from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlmodel import Session

from core.database import get_session
from modules.atas.Ata import AtaRegistroPreco
from modules.atas.AtaService import AtaService

router = APIRouter(prefix="/api/atas", tags=["Atas de Registro de Preço"])


@router.get("/dominios")
def get_dominios():
    """Retorna domínios compartilhados para o módulo de Atas."""
    return AtaService.get_dominios()


@router.get("", response_model=List[AtaRegistroPreco])
def listar_atas(
    status: Optional[str] = Query(None, description="Filtro por status: draft, sent, error"),
    search: Optional[str] = Query(None, description="Busca por número, código, edital ou protocolo"),
    session: Session = Depends(get_session)
):
    """Lista as Atas de Registro de Preços cadastradas no sistema."""
    return AtaService.listar_atas(session, status, search)


@router.get("/{ata_id}")
def obter_ata(
    ata_id: int,
    session: Session = Depends(get_session)
):
    """Obtém detalhes e o documento JSON completo da ata."""
    return AtaService.obter_ata(session, ata_id)


@router.post("", response_model=AtaRegistroPreco)
def salvar_ata(
    payload: Dict[str, Any],
    session: Session = Depends(get_session)
):
    """Salva ou atualiza um rascunho de ata de registro de preços."""
    return AtaService.salvar_ata(session, payload)


@router.post("/{ata_id}/enviar")
async def enviar_ata(
    ata_id: int,
    forcar: bool = Query(False, description="Forçar envio ignorando validações prévias locais"),
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session)
):
    """Transmite a Ata de Registro de Preços para a API Fase IV do AUDESP/TCESP."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token do AUDESP obrigatório no header Authorization.")
    token_audesp = authorization.replace("Bearer ", "").strip()

    return await AtaService.enviar_ata(session, ata_id, token_audesp, forcar)


@router.get("/{ata_id}/consultar-protocolo")
@router.post("/{ata_id}/consultar-protocolo")
async def consultar_protocolo(
    ata_id: int,
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session)
):
    """Consulta o status de processamento do protocolo no TCESP."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token do AUDESP obrigatório no header Authorization.")
    token_audesp = authorization.replace("Bearer ", "").strip()

    return await AtaService.consultar_protocolo(session, ata_id, token_audesp)


@router.get("/{ata_id}/historico-protocolo")
def obter_historico_protocolo(
    ata_id: int,
    session: Session = Depends(get_session)
):
    """Retorna o histórico de consultas de protocolo da ata."""
    return AtaService.obter_historico_protocolo(session, ata_id)


@router.delete("/{ata_id}")
def excluir_ata(
    ata_id: int,
    session: Session = Depends(get_session)
):
    """Exclui uma ata de registro de preços (apenas se for rascunho)."""
    return AtaService.excluir_ata(session, ata_id)


@router.post("/{ata_id}/retornar-rascunho", response_model=AtaRegistroPreco)
def retornar_rascunho(
    ata_id: int,
    session: Session = Depends(get_session)
):
    """Reabre uma ata enviada/com erro para modo rascunho."""
    return AtaService.retornar_rascunho(session, ata_id)
