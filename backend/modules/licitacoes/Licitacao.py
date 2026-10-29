from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

class Licitacao(SQLModel, table=True):
    __tablename__ = "licitacoes"

    id: Optional[int] = Field(default=None, primary_key=True)
    edital_id: Optional[int] = Field(default=None, index=True, description="Vínculo opcional com a tabela editais")
    municipio: int = Field(index=True, description="Código do município AUDESP")
    entidade: int = Field(index=True, description="Código da entidade AUDESP")
    codigo_edital: str = Field(max_length=50, index=True, description="Código do Edital de referência")
    retificacao: bool = Field(default=False, description="Indica se é retificação de licitação já enviada")
    
    # Status: draft (rascunho local), sent (enviado ao AUDESP), error (erro)
    status: str = Field(default="draft", max_length=20, index=True)
    
    # Informações de protocolo retornado pelo TCESP
    protocolo: Optional[str] = Field(default=None, max_length=50, index=True)
    status_protocolo: Optional[str] = Field(default=None, max_length=50) # Recebido, Armazenado, Rejeitado
    detalhes_protocolo: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # Campos informativos e de busca rápida
    recurso_bid: int = Field(default=2, description="1-Sim, 2-Não, 3-Não se aplica")
    tipo_natureza: int = Field(default=1, description="Domínio Tipo de Natureza (1 a 8)")
    numero_compra: Optional[str] = Field(default=None, max_length=50)
    ano_compra: Optional[int] = Field(default=None, index=True)
    numero_processo: Optional[str] = Field(default=None, max_length=50)
    objeto_edital: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # JSON completo em estrita conformidade com licitacao_schema.json
    documento_json: str = Field(sa_column=Column(Text))
    
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
