from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import create_db_and_tables

app = FastAPI(
    title="AUDESP Fase IV API",
    description="API de Integração e Transmissão da Nova Fase IV ao TCESP (Licitações e Contratos)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {
        "sistema": "AUDESP Fase IV API",
        "status": "online",
        "versao": "1.0.0"
    }

from modules.auth.AuthController import router as auth_router
app.include_router(auth_router)

# Importa os models para registro das tabelas no startup
from modules.protocolos.Protocolo import ProtocoloConsulta

from modules.documentacao.Documentacao import AppConfig
from modules.documentacao.DocumentacaoController import router as documentacao_router
app.include_router(documentacao_router)

from modules.importacao_exportacao.ImportacaoExportacaoController import router as importacao_exportacao_router
app.include_router(importacao_exportacao_router)

from modules.protocolos.ProtocoloController import router as protocolo_router
app.include_router(protocolo_router)

from modules.editais.Edital import Edital, EditalArquivo
from modules.editais.EditalController import router as edital_router
app.include_router(edital_router)

from modules.licitacoes.Licitacao import Licitacao
from modules.licitacoes.LicitacaoController import router as licitacao_router
app.include_router(licitacao_router)

from modules.atas.Ata import AtaRegistroPreco
from modules.atas.AtaController import router as ata_router
app.include_router(ata_router)

from modules.ajustes.Ajuste import AjusteContrato
from modules.ajustes.AjusteController import router as ajuste_router
app.include_router(ajuste_router)




@app.get("/health")
def health_check():
    return {"status": "healthy"}


