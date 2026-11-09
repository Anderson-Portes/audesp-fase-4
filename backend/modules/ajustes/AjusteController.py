from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlmodel import Session

from core.database import get_session
from modules.ajustes.Ajuste import AjusteContrato
from modules.ajustes.AjusteService import AjusteService

router = APIRouter(prefix="/api/ajustes", tags=["Ajustes e Contratos"])


@router.get("/dominios")
def get_dominios():
    """Retorna os domínios do módulo de Ajustes para o frontend."""
    return AjusteService.get_dominios()


@router.get("", response_model=List[AjusteContrato])
def listar_ajustes(
    status: Optional[str] = Query(None, description="Filtro por status: draft, sent, error"),
    search: Optional[str] = Query(None, description="Busca por número, código, fornecedor ou protocolo"),
    session: Session = Depends(get_session)
):
    """Lista Ajustes/Contratos cadastrados no sistema."""
    return AjusteService.listar_ajustes(session, status, search)


@router.get("/{ajuste_id}")
def obter_ajuste(
    ajuste_id: int,
    session: Session = Depends(get_session)
):
    """Obtém detalhes e o documento JSON completo do ajuste."""
    return AjusteService.obter_ajuste(session, ajuste_id)


@router.post("", response_model=AjusteContrato)
def salvar_ajuste(
    payload: Dict[str, Any],
    session: Session = Depends(get_session)
):
    """Salva ou atualiza um rascunho de ajuste/contrato."""
    return AjusteService.salvar_ajuste(session, payload)


@router.post("/{ajuste_id}/enviar")
def enviar_ajuste(
    ajuste_id: int,
    forcar: bool = Query(False, description="Forçar envio ignorando validações prévias locais"),
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session)
):
    """Transmite o Ajuste/Contrato para a API Fase IV do AUDESP."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token do AUDESP obrigatório no header Authorization.")
    token_audesp = authorization.replace("Bearer ", "").strip()

    return AjusteService.enviar_ajuste(session, ajuste_id, token_audesp, forcar)


@router.get("/{ajuste_id}/consultar-protocolo")
@router.post("/{ajuste_id}/consultar-protocolo")
def consultar_protocolo(
    ajuste_id: int,
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session)
):
    """Consulta o status de processamento do protocolo no TCESP."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token do AUDESP obrigatório no header Authorization.")
    token_audesp = authorization.replace("Bearer ", "").strip()

    return AjusteService.consultar_protocolo(session, ajuste_id, token_audesp)


@router.get("/{ajuste_id}/historico-protocolo")
def obter_historico_protocolo(
    ajuste_id: int,
    session: Session = Depends(get_session)
):
    """Retorna o histórico de consultas de protocolo do ajuste."""
    return AjusteService.obter_historico_protocolo(session, ajuste_id)


@router.delete("/{ajuste_id}")
def excluir_ajuste(
    ajuste_id: int,
    session: Session = Depends(get_session)
):
    """Exclui um ajuste (apenas rascunhos)."""
    return AjusteService.excluir_ajuste(session, ajuste_id)


@router.post("/{ajuste_id}/retornar-rascunho", response_model=AjusteContrato)
def retornar_rascunho(
    ajuste_id: int,
    session: Session = Depends(get_session)
):
    """Reabre um ajuste enviado/com erro para modo rascunho."""
    return AjusteService.retornar_rascunho(session, ajuste_id)
