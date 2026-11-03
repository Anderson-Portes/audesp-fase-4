import io
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, Header, UploadFile
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from core.database import get_session
from modules.importacao_exportacao.ImportacaoExportacaoService import ImportacaoExportacaoService

router = APIRouter(prefix="/api/importacao-exportacao", tags=["Importação e Exportação em Lote"])


@router.get("/{modulo}/modelo")
def baixar_modelo_planilha(modulo: str):
    """Baixa a planilha de modelo (.xlsx) comentada, com selects e múltiplas linhas para o módulo informado."""
    conteudo, filename = ImportacaoExportacaoService.obter_modelo_planilha(modulo)
    return StreamingResponse(
        io.BytesIO(conteudo),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{modulo}/exportar")
def exportar_dados_planilha(modulo: str, session: Session = Depends(get_session)):
    """Exporta todos os registros do módulo em formato Excel (.xlsx) compatível com reimportação."""
    conteudo, filename = ImportacaoExportacaoService.exportar_dados_planilha(modulo, session)
    return StreamingResponse(
        io.BytesIO(conteudo),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/editais/pre-visualizar")
async def pre_visualizar_planilha_editais(file: UploadFile = File(...)):
    """
    Lê a planilha de Editais (.xlsx) e retorna a lista de editais encontrados (ignorando linhas sem ID)
    para que o usuário possa anexar o arquivo PDF de cada edital na tabela da interface.
    """
    return await ImportacaoExportacaoService.pre_visualizar_planilha_editais(file)


@router.post("/editais/importar-lote")
async def importar_lote_editais(
    dados_json: str = Form(..., description="Lista JSON dos editais pré-visualizados"),
    transmitir: bool = Form(False, description="Se verdadeiro, transmite à AUDESP após salvar"),
    arquivos_pdf: List[UploadFile] = File(default=[]),
    pdfs_codigos: List[str] = Form(default=[], description="Código do edital correspondente a cada PDF enviado"),
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
):
    """
    Importa em lote os editais da planilha, vinculando os PDFs enviados individualmente
    pelo usuário e opcionalmente transmitindo para a AUDESP, retornando o log completo.
    """
    return await ImportacaoExportacaoService.importar_lote_editais(
        dados_json=dados_json,
        transmitir=transmitir,
        arquivos_pdf=arquivos_pdf,
        pdfs_codigos=pdfs_codigos,
        authorization=authorization,
        session=session,
    )


@router.post("/{modulo}/importar-lote")
async def importar_lote_planilha(
    modulo: str,
    file: UploadFile = File(...),
    transmitir: bool = Form(False),
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
):
    """
    Importa em lote planilhas (.xlsx) de Licitações, Atas ou Ajustes (ignorando linhas sem ID),
    inserindo/atualizando no banco e opcionalmente transmitindo à AUDESP.
    """
    return await ImportacaoExportacaoService.importar_lote_planilha(
        modulo=modulo,
        file=file,
        transmitir=transmitir,
        authorization=authorization,
        session=session,
    )

