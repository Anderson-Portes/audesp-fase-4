from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text, LargeBinary
from sqlalchemy.dialects.mysql import LONGBLOB

class Edital(SQLModel, table=True):
    __tablename__ = "editais"

    id: Optional[int] = Field(default=None, primary_key=True)
    municipio: int = Field(index=True, description="Código do município AUDESP")
    entidade: int = Field(index=True, description="Código da entidade AUDESP")
    codigo_edital: str = Field(max_length=50, index=True, description="Código único ou ID PNCP (25 chars)")
    sem_pncp: bool = Field(default=False, description="Indica se o código foi gerado sem PNCP")
    retificacao: bool = Field(default=False, description="Identifica se o envio é uma retificação")
    
    # Status de controle: draft (rascunho), sent (enviado), error (erro)
    status: str = Field(default="draft", max_length=20, index=True)
    
    # Informações do protocolo retornado pela API AUDESP
    protocolo: Optional[str] = Field(default=None, max_length=50, index=True)
    status_protocolo: Optional[str] = Field(default=None, max_length=50) # Recebido, Armazenado, Rejeitado
    detalhes_protocolo: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # Campos indexados para consulta e listagem rápida
    numero_compra: Optional[str] = Field(default=None, max_length=50)
    ano_compra: Optional[int] = Field(default=None, index=True)
    numero_processo: Optional[str] = Field(default=None, max_length=50)
    objeto_compra: Optional[str] = Field(default=None, sa_column=Column(Text))
    modalidade_id: Optional[int] = Field(default=None)
    modo_disputa_id: Optional[int] = Field(default=None)
    tipo_instrumento_id: Optional[int] = Field(default=None)
    
    # Arquivo PDF anexado (armazenado diretamente no banco de dados)
    pdf_path: Optional[str] = Field(default=None, max_length=500, description="Referência do arquivo no banco (ex: db://editais/{id}/pdf)")
    pdf_nome_original: Optional[str] = Field(default=None, max_length=255)
    
    # Documento JSON completo validado conforme edital_schema.json
    documento_json: str = Field(sa_column=Column(Text))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class EditalArquivo(SQLModel, table=True):
    """Armazena o binário do arquivo PDF do edital diretamente no Banco de Dados."""
    __tablename__ = "editais_arquivos"

    id: Optional[int] = Field(default=None, primary_key=True)
    edital_id: int = Field(index=True, unique=True, description="ID do edital correspondente")
    nome_arquivo: str = Field(max_length=255, description="Nome original do arquivo PDF")
    tipo_mime: str = Field(default="application/pdf", max_length=100)
    tamanho: int = Field(default=0, description="Tamanho em bytes do arquivo")
    conteudo: bytes = Field(sa_column=Column(LargeBinary().with_variant(LONGBLOB, "mysql")), description="Binário do arquivo PDF")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
