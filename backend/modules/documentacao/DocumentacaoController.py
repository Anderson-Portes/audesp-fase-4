from fastapi import APIRouter, Depends
from sqlmodel import Session

from core.database import get_session
from modules.documentacao.DocumentacaoService import DocumentacaoService

router = APIRouter(prefix="/api/documentacao", tags=["Monitoramento Documentação AUDESP"])


@router.get("/status")
def consultar_status_documentacao(
    forcar: bool = False,
    session: Session = Depends(get_session),
):
    """Retorna o status/alerta de alteração na documentação oficial do TCESP AUDESP Fase IV."""
    return DocumentacaoService.verificar_documentacao_periodica(session, forcar=forcar)


@router.post("/marcar-verificada")
def confirmar_verificacao_documentacao(
    session: Session = Depends(get_session),
):
    """Marca a versão atual da documentação do TCESP como conferida, encerrando o alerta."""
    return DocumentacaoService.marcar_documentacao_verificada(session)

