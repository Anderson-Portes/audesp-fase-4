from typing import Optional
from datetime import datetime, date, timezone
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

class AjusteContrato(SQLModel, table=True):
    __tablename__ = "ajustes_contratos"

    id: Optional[int] = Field(default=None, primary_key=True)
    edital_id: Optional[int] = Field(default=None, index=True, description="Vínculo opcional com a tabela editais")
    licitacao_id: Optional[int] = Field(default=None, index=True, description="Vínculo opcional com a tabela licitacoes")
    ata_id: Optional[int] = Field(default=None, index=True, description="Vínculo opcional com a tabela atas_registro_preco")

    municipio: int = Field(index=True, description="Código do município AUDESP")
    entidade: int = Field(index=True, description="Código da entidade AUDESP")
    codigo_edital: str = Field(max_length=50, index=True, description="Código do Edital de referência")
    codigo_ata: Optional[str] = Field(default=None, max_length=50, index=True, description="Código da ata de RP")
    codigo_contrato: str = Field(max_length=50, index=True, description="Código único do ajuste/contrato")
    retificacao: bool = Field(default=False, description="Indica se é retificação de ajuste já enviado")
    
    # Identificação do Contrato
    numero_contrato_empenho: str = Field(max_length=50, index=True)
    ano_contrato: int = Field(index=True)
    tipo_contrato_id: int = Field(default=1, index=True, description="Domínio PNCP Tipo de Contrato")
    processo: str = Field(max_length=50, index=True)
    categoria_processo_id: int = Field(default=2, index=True, description="Domínio Categoria do Processo")
    tipo_objeto_contrato: int = Field(default=11, index=True, description="Domínio Tipo Objeto do Contrato")
    receita: bool = Field(default=False, description="True se gera receita, False se despesa")

    # Contratado Principal
    ni_fornecedor: str = Field(max_length=50, index=True)
    tipo_pessoa_fornecedor: str = Field(max_length=2, description="PJ, PF ou PE")
    nome_razao_social_fornecedor: str = Field(max_length=150)

    # Valores e Vigência
    valor_inicial: float = Field(default=0.0)
    valor_global: float = Field(default=0.0)
    data_assinatura: date = Field(description="Data de assinatura do contrato")
    data_vigencia_inicio: Optional[date] = Field(default=None)
    data_vigencia_fim: Optional[date] = Field(default=None)

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
