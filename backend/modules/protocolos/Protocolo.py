from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Column, Text
from sqlmodel import Field, SQLModel


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class ProtocoloConsulta(SQLModel, table=True):
    """Armazena o histórico de todas as consultas de protocolo realizadas no AUDESP."""
    __tablename__ = "protocolos_consultas_historico"

    id: Optional[int] = Field(default=None, primary_key=True)
    modulo: str = Field(max_length=30, index=True, description="Módulo: edital, licitacao, ata, ajuste")
    registro_id: int = Field(index=True, description="ID do documento no respectivo módulo")
    codigo_documento: str = Field(default="", max_length=100, index=True, description="Código identificador do documento")
    protocolo: str = Field(max_length=60, index=True, description="Número do protocolo AUDESP")
    origem: str = Field(
        default="consulta_manual",
        max_length=30,
        description="Origem: envio_automatico ou consulta_manual",
    )
    status_protocolo: Optional[str] = Field(default=None, max_length=50, description="Situação retornada (Recebido, Armazenado, Rejeitado)")
    data_hora_audesp: Optional[str] = Field(default=None, max_length=50, description="Data/hora informada pelo AUDESP no retorno")
    sucesso_consulta: bool = Field(default=True, description="Se a requisição HTTP de consulta obteve sucesso")
    is_rejeitado: bool = Field(default=False, description="Se o protocolo encontra-se Rejeitado")
    possui_erros: bool = Field(default=False, description="Se o retorno possui erros ou inconsistências")
    erros_formatados_json: str = Field(default="[]", sa_column=Column(Text), description="Lista JSON de mensagens formatadas")
    erros_detalhados_json: str = Field(default="[]", sa_column=Column(Text), description="Lista JSON de objetos de erro estruturados")
    resposta_json: str = Field(default="{}", sa_column=Column(Text), description="Payload completo retornado pelo AUDESP")
    created_at: datetime = Field(default_factory=now_utc, index=True)

