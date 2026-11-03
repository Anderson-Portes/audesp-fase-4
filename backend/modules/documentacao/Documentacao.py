from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Column, Text
from sqlmodel import Field, SQLModel


class AppConfig(SQLModel, table=True):
    """Tabela simples de chave-valor para configurações e snapshots de monitoramento da documentação AUDESP."""
    __tablename__ = "app_configuracoes"

    chave: str = Field(primary_key=True, max_length=120)
    valor: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

