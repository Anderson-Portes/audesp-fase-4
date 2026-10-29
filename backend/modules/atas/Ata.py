from typing import Optional
from datetime import datetime, date, timezone
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

class AtaRegistroPreco(SQLModel, table=True):
    __tablename__ = "atas_registro_preco"

    id: Optional[int] = Field(default=None, primary_key=True)
    edital_id: Optional[int] = Field(default=None, index=True, description="Vínculo opcional com a tabela editais")
    licitacao_id: Optional[int] = Field(default=None, index=True, description="Vínculo opcional com a tabela licitacoes")
    
    municipio: int = Field(index=True, description="Código do município AUDESP")
    entidade: int = Field(index=True, description="Código da entidade AUDESP")
    codigo_edital: str = Field(max_length=50, index=True, description="Código do Edital de referência")
    codigo_ata: str = Field(max_length=50, index=True, description="Código único identificador da ata")
    ano_compra: int = Field(index=True, description="Ano da compra/contratação")
    retificacao: bool = Field(default=False, description="Indica se é retificação de ata já enviada")
    
    # Dados da Ata
    numero_ata_registro_preco: str = Field(max_length=50, index=True, description="Número da ata no sistema de origem")
    ano_ata: int = Field(index=True, description="Ano da ata")
    data_assinatura: date = Field(description="Data de assinatura da ata")
    data_vigencia_inicio: date = Field(description="Data de início de vigência")
    data_vigencia_fim: date = Field(description="Data de término de vigência")

    # Status: draft (rascunho local), sent (enviado ao AUDESP), error (erro)
    status: str = Field(default="draft", max_length=20, index=True)
    
    # Informações de protocolo retornado pelo TCESP
    protocolo: Optional[str] = Field(default=None, max_length=50, index=True)
    status_protocolo: Optional[str] = Field(default=None, max_length=50) # Recebido, Armazenado, Rejeitado
    detalhes_protocolo: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # Documento JSON completo transmitido ao AUDESP
    documento_json: str = Field(sa_column=Column(Text))
    
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
