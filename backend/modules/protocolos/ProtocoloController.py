from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlmodel import Session

from core.database import get_session
from modules.protocolos.ProtocoloService import ProtocoloService

router = APIRouter(prefix="/api/protocolos", tags=["Consulta Unificada de Protocolos"])


@router.get("")
def listar_protocolos(
    modulo: Optional[str] = Query(None, description="Filtro por módulo: edital, licitacao, ata, ajuste"),
    status_protocolo: Optional[str] = Query(None, description="Filtro por situação: Armazenado, Rejeitado, Recebido"),
    search: Optional[str] = Query(None, description="Busca por protocolo, código, processo ou objeto"),
    session: Session = Depends(get_session),
):
    """Lista todos os protocolos gerados nos módulos de Editais, Licitações, Atas e Ajustes."""
    return ProtocoloService.listar_todos_protocolos(
        session=session,
        modulo=modulo,
        status_protocolo=status_protocolo,
        search=search,
    )


@router.post("/consultar-avulso")
def consultar_protocolo_avulso(
    protocolo: str = Query(..., description="Número do protocolo AUDESP para consulta direta"),
    authorization: Optional[str] = Header(None),
):
    """Consulta qualquer número de protocolo diretamente no webservice da AUDESP/TCESP."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token do AUDESP obrigatório no header Authorization.")
    token = authorization.replace("Bearer ", "").strip()
    return ProtocoloService.consultar_protocolo_avulso(token=token, numero_protocolo=protocolo)


@router.post("/{modulo}/{registro_id}/consultar")
async def consultar_protocolo_registro(
    modulo: str,
    registro_id: int,
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
):
    """Atualiza o status do protocolo de um registro específico junto ao TCESP e salva no histórico."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token do AUDESP obrigatório no header Authorization.")
    token = authorization.replace("Bearer ", "").strip()
    return await ProtocoloService.consultar_protocolo_modulo(
        session=session,
        modulo=modulo,
        registro_id=registro_id,
        token=token,
    )


@router.get("/{modulo}/{registro_id}/historico")
def obter_historico_registro(
    modulo: str,
    registro_id: int,
    protocolo: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    """Retorna o histórico de consultas de protocolo de um documento."""
    return ProtocoloService.obter_historico_modulo(
        session=session,
        modulo=modulo,
        registro_id=registro_id,
        protocolo=protocolo,
    )

