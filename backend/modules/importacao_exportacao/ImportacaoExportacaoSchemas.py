"""
Definição de colunas, listas de domínios para os selects (DataValidation) e linhas de exemplo
das planilhas (.xlsx) de Editais, Licitações, Atas e Ajustes.
"""
from typing import Dict, List, Optional, Tuple

from core.audesp_domains import ENTIDADES_AUDESP, MUNICIPIOS_AUDESP
from modules.ajustes.AjusteDomains import (
    DOMINIO_CATEGORIA_PROCESSO,
    DOMINIO_TIPO_CONTRATO,
    DOMINIO_TIPO_OBJETO_CONTRATO,
)
from modules.editais.EditalDomains import (
    DOMINIO_CRITERIO_JULGAMENTO,
    DOMINIO_INSTRUMENTOS,
    DOMINIO_ITEM_CATEGORIA,
    DOMINIO_MODALIDADES,
    DOMINIO_MODO_DISPUTA,
    DOMINIO_TIPO_BENEFICIO,
    DOMINIO_VEICULOS_PUBLICACAO,
)
from modules.editais.EditalService import AMPAROS_LEGAIS
from modules.importacao_exportacao.excel_utils import fmt_dominio_dict, label_id
from modules.licitacoes.LicitacaoDomains import (
    DOMINIO_DECLARACAO_ME_EPP,
    DOMINIO_EXIGENCIA_AMOSTRA,
    DOMINIO_EXIGENCIA_VISITA,
    DOMINIO_RESULTADO_HABILITACAO,
    DOMINIO_SITUACAO_COMPRA_ITEM,
    DOMINIO_TIPO_NATUREZA,
    DOMINIO_TIPO_ORCAMENTO,
    DOMINIO_TIPO_PROPOSTA,
    DOMINIO_TRI_STATE,
)

OPCOES_SIM_NAO = ["NAO", "SIM"]
OPCOES_MATERIAL_SERVICO = ["M - Material", "S - Serviço"]
OPCOES_TIPO_VALOR = ["M - Monetário", "P - Percentual"]
OPCOES_TIPO_PESSOA = ["PJ - Pessoa Jurídica (CNPJ)", "PF - Pessoa Física (CPF)", "PE - Pessoa Estrangeira"]


def _fmt_municipios() -> List[str]:
    return [f"{m['codigo']} - {m['nome']} ({m['uf']})" for m in MUNICIPIOS_AUDESP]


def _fmt_entidades() -> List[str]:
    return [f"{e['codigo']} - {e['nome']}" for e in ENTIDADES_AUDESP]


def _fmt_amparos() -> List[str]:
    opcoes: List[str] = []
    for a in AMPAROS_LEGAIS:
        aid = a.get("id")
        art = a.get("artigo") or a.get("label") or ""
        det = a.get("detalhe") or ""
        resumo = f"{aid} - {art}" + (f" ({det[:45]})" if det else "")
        opcoes.append(resumo[:110])
    return opcoes if opcoes else ["1 - Lei 14.133/2021, Art. 28, I"]


def construir_listas_dominios() -> Dict[str, List[str]]:
    return {
        "sim_nao": OPCOES_SIM_NAO,
        "material_servico": OPCOES_MATERIAL_SERVICO,
        "tipo_valor": OPCOES_TIPO_VALOR,
        "tipos_pessoa": OPCOES_TIPO_PESSOA,
        "municipios": _fmt_municipios(),
        "entidades": _fmt_entidades(),
        "instrumentos": fmt_dominio_dict(DOMINIO_INSTRUMENTOS),
        "modalidades": fmt_dominio_dict(DOMINIO_MODALIDADES),
        "modos_disputa": fmt_dominio_dict(DOMINIO_MODO_DISPUTA),
        "veiculos_publicacao": fmt_dominio_dict(DOMINIO_VEICULOS_PUBLICACAO),
        "tipos_beneficio": fmt_dominio_dict(DOMINIO_TIPO_BENEFICIO),
        "criterios_julgamento": fmt_dominio_dict(DOMINIO_CRITERIO_JULGAMENTO),
        "categorias_item": fmt_dominio_dict(DOMINIO_ITEM_CATEGORIA),
        "amparos": _fmt_amparos(),
        "tri_state": fmt_dominio_dict(DOMINIO_TRI_STATE),
        "tipos_natureza": fmt_dominio_dict(DOMINIO_TIPO_NATUREZA),
        "exigencias_amostra": fmt_dominio_dict(DOMINIO_EXIGENCIA_AMOSTRA),
        "exigencias_visita": fmt_dominio_dict(DOMINIO_EXIGENCIA_VISITA),
        "tipos_orcamento": fmt_dominio_dict(DOMINIO_TIPO_ORCAMENTO),
        "situacoes_item": fmt_dominio_dict(DOMINIO_SITUACAO_COMPRA_ITEM),
        "tipos_proposta": fmt_dominio_dict(DOMINIO_TIPO_PROPOSTA),
        "declaracoes_me_epp": fmt_dominio_dict(DOMINIO_DECLARACAO_ME_EPP),
        "resultados_habilitacao": fmt_dominio_dict(DOMINIO_RESULTADO_HABILITACAO),
        "tipos_contrato": fmt_dominio_dict(DOMINIO_TIPO_CONTRATO),
        "categorias_processo": fmt_dominio_dict(DOMINIO_CATEGORIA_PROCESSO),
        "tipos_objeto_contrato": fmt_dominio_dict(DOMINIO_TIPO_OBJETO_CONTRATO),
    }


COLUNAS_EDITAIS: List[Tuple[str, str, int, Optional[str]]] = [
    ("codigo_edital", "ID Contratação PNCP (25 dígitos) ou Código Sem PNCP * (Sem ID = linha ignorada)", 32, None),
    ("sem_pncp", "Sem PNCP? (Selecione)", 18, "sim_nao"),
    ("municipio", "Município AUDESP * (Selecione ou digite ID)", 28, "municipios"),
    ("entidade", "Entidade AUDESP * (Selecione ou digite ID)", 36, "entidades"),
    ("data_documento", "Data Documento * (AAAA-MM-DD)", 20, None),
    ("retificacao", "Retificação? (Selecione)", 18, "sim_nao"),
    ("tipo_instrumento_id", "Tipo Instrumento ID * (Selecione)", 28, "instrumentos"),
    ("modalidade_id", "Modalidade ID * (Selecione)", 30, "modalidades"),
    ("modo_disputa_id", "Modo Disputa ID * (Selecione)", 26, "modos_disputa"),
    ("numero_compra", "Número da Compra * (Ex: 034)", 18, None),
    ("ano_compra", "Ano da Compra * (Ex: 2026)", 16, None),
    ("numero_processo", "Número do Processo * (Ex: 650/2026)", 20, None),
    ("objeto_compra", "Objeto da Compra *", 42, None),
    ("srp", "Registro de Preços SRP? (Selecione)", 20, "sim_nao"),
    ("amparo_legal_id", "Amparo Legal ID * (Selecione)", 38, "amparos"),
    ("data_abertura_proposta", "Abertura Proposta (AAAA-MM-DDTHH:MM:SS)", 26, None),
    ("data_encerramento_proposta", "Encerramento Proposta (AAAA-MM-DDTHH:MM:SS)", 26, None),
    ("codigo_unidade_compradora", "Cód. Unidade Compradora (Opcional)", 22, None),
    ("link_sistema_origem", "Link Sistema Origem (Opcional)", 28, None),
    ("justificativa_presencial", "Justificativa Presencial (Opcional)", 26, None),
    ("informacao_complementar", "Informação Complementar (Opcional)", 28, None),
    ("houve_publicacao", "Houve Publicação? (Selecione)", 18, "sim_nao"),
]

COLUNAS_EDITAIS_ITENS: List[Tuple[str, str, int, Optional[str]]] = [
    ("codigo_edital", "Código do Edital vinculado * (Sem ID = linha ignorada)", 30, None),
    ("numero_item", "Nº do Item * (Sequencial: 1, 2...)", 18, None),
    ("material_ou_servico", "Material ou Serviço * (Selecione)", 22, "material_servico"),
    ("tipo_beneficio_id", "Tipo Benefício ID * (Selecione)", 30, "tipos_beneficio"),
    ("incentivo_produtivo_basico", "Incentivo Produtivo Básico? (Selecione)", 20, "sim_nao"),
    ("descricao", "Descrição do Item *", 40, None),
    ("quantidade", "Quantidade * (Ex: 100)", 16, None),
    ("unidade_medida", "Unidade de Medida * (Ex: UN, KG, MES)", 20, None),
    ("orcamento_sigiloso", "Orçamento Sigiloso? (Selecione)", 18, "sim_nao"),
    ("valor_unitario_estimado", "Valor Unitário Estimado * (Ex: 15.50)", 22, None),
    ("valor_total", "Valor Total * (Ex: 1550.00)", 20, None),
    ("criterio_julgamento_id", "Critério Julgamento ID * (Selecione)", 28, "criterios_julgamento"),
    ("item_categoria_id", "Categoria Item ID * (Selecione)", 26, "categorias_item"),
    ("patrimonio", "Patrimônio (Opcional - Leilão Móveis)", 20, None),
    ("codigo_registro_imobiliario", "Reg. Imobiliário (Opcional - Leilão Imóveis)", 22, None),
]

COLUNAS_EDITAIS_PUBLICACOES: List[Tuple[str, str, int, Optional[str]]] = [
    ("codigo_edital", "Código do Edital vinculado * (Sem ID = linha ignorada)", 30, None),
    ("veiculo_publicacao", "Veículo Publicação ID * (Selecione)", 34, "veiculos_publicacao"),
    ("data_publicacao", "Data Publicação * (AAAA-MM-DD)", 20, None),
    ("id_contratacao_pncp", "ID Contratação PNCP 25 dígitos (Obrigatório se Veículo=5)", 30, None),
    ("veiculo_publicacao_nome", "Nome do Veículo (Obrigatório se Veículo=10)", 26, None),
]

COLUNAS_LICITACOES: List[Tuple[str, str, int, Optional[str]]] = [
    ("codigo_edital", "Código do Edital vinculado * (Sem ID = linha ignorada)", 30, None),
    ("municipio", "Município AUDESP * (Selecione)", 28, "municipios"),
    ("entidade", "Entidade AUDESP * (Selecione)", 36, "entidades"),
    ("retificacao", "Retificação? (Selecione)", 16, "sim_nao"),
    ("numero_compra", "Número da Compra (Informativo)", 18, None),
    ("ano_compra", "Ano da Compra (Informativo)", 16, None),
    ("numero_processo", "Número do Processo (Informativo)", 20, None),
    ("objeto_edital", "Objeto (Informativo)", 36, None),
    ("recurso_bid", "Recurso BID ID * (Selecione)", 22, "tri_state"),
    ("tipo_natureza", "Tipo Natureza ID * (Selecione)", 32, "tipos_natureza"),
    ("viabilidade_contratacao", "Viabilidade Contratação ID (Selecione)", 24, "tri_state"),
    ("interposicao_recurso", "Interposição Recurso ID * (Selecione)", 24, "tri_state"),
    ("audiencia_publica", "Audiência Pública ID (Selecione)", 22, "tri_state"),
    ("exigencia_garantia_licitantes", "Exigência Garantia ID * (Selecione)", 24, "tri_state"),
    ("percentual_valor", "Percentual Valor Garantia (Se Garantia=1)", 20, None),
    ("exigencia_amostra", "Exigência Amostra ID (Selecione)", 30, "exigencias_amostra"),
    ("quitacao_tributos_federais", "Quitação Trib. Federais? (Selecione)", 20, "sim_nao"),
    ("quitacao_tributos_estaduais", "Quitação Trib. Estaduais? (Selecione)", 20, "sim_nao"),
    ("quitacao_tributos_municipais", "Quitação Trib. Municipais? (Selecione)", 20, "sim_nao"),
    ("exigencia_visita_tecnica", "Visita Técnica ID (Selecione)", 32, "exigencias_visita"),
    ("exigencia_curriculo", "Exige Currículo? (Selecione)", 20, "sim_nao"),
    ("exigencia_visto_crea", "Exige Visto CREA? (Selecione)", 20, "sim_nao"),
    ("declaracao_recursos_contratacao", "Declaração Recursos? (Selecione)", 20, "sim_nao"),
    ("fontes_recurso", "Fontes Recurso IDs sep. por vírgula (Ex: 1, 2)", 26, None),
    ("contratacao_conduzida", "Contratação Conduzida? (Selecione)", 20, "sim_nao"),
    ("cpfs_condutores", "CPFs Condutores separados por vírgula (11 dígitos)", 28, None),
    ("exigencia_indices_economicos", "Exige Índices Econômicos ID? (Selecione)", 24, "tri_state"),
]

COLUNAS_LICITACOES_ITENS: List[Tuple[str, str, int, Optional[str]]] = [
    ("codigo_edital", "Código do Edital vinculado * (Sem ID = linha ignorada)", 30, None),
    ("numero_item", "Nº do Item *", 16, None),
    ("tipo_orcamento", "Tipo Orçamento ID * (Selecione)", 30, "tipos_orcamento"),
    ("valor_orcamento", "Valor Orçamento (Obrigatório se Tipo != 0)", 20, None),
    ("data_orcamento", "Data Orçamento (AAAA-MM-DD)", 20, None),
    ("situacao_compra_item_id", "Situação Item ID * (Selecione)", 28, "situacoes_item"),
    ("data_situacao_item", "Data Situação Item * (AAAA-MM-DD)", 20, None),
    ("tipo_valor", "Tipo Valor * (Selecione)", 22, "tipo_valor"),
    ("tipo_proposta", "Tipo Proposta ID * (Selecione)", 30, "tipos_proposta"),
]

COLUNAS_LICITACOES_LICITANTES: List[Tuple[str, str, int, Optional[str]]] = [
    ("codigo_edital", "Código do Edital vinculado * (Sem ID = linha ignorada)", 30, None),
    ("numero_item", "Nº do Item *", 16, None),
    ("tipo_pessoa_id", "Tipo Pessoa * (Selecione)", 26, "tipos_pessoa"),
    ("ni_pessoa", "CNPJ / CPF / ID Estrangeiro *", 22, None),
    ("nome_razao_social", "Nome/Razão Social (Obrigatório para PE)", 28, None),
    ("declaracao_me_epp", "Declaração ME/EPP ID * (Selecione)", 24, "declaracoes_me_epp"),
    ("resultado_habilitacao", "Resultado Habilitação ID * (Selecione)", 28, "resultados_habilitacao"),
    ("valor_proposta", "Valor Proposta (Obrigatório se Resultado 1 ou 2)", 22, None),
]

COLUNAS_ATAS: List[Tuple[str, str, int, Optional[str]]] = [
    ("codigo_ata", "Código Único da Ata * (Sem ID = linha ignorada)", 30, None),
    ("codigo_edital", "Código do Edital SRP de origem *", 28, None),
    ("municipio", "Município AUDESP * (Selecione)", 28, "municipios"),
    ("entidade", "Entidade AUDESP * (Selecione)", 36, "entidades"),
    ("ano_compra", "Ano da Compra * (Ex: 2026)", 16, None),
    ("retificacao", "Retificação? (Selecione)", 16, "sim_nao"),
    ("numero_ata_registro_preco", "Número da Ata no Sistema * (Ex: 010/2026)", 22, None),
    ("ano_ata", "Ano da Ata * (Ex: 2026)", 16, None),
    ("data_assinatura", "Data Assinatura * (AAAA-MM-DD)", 20, None),
    ("data_vigencia_inicio", "Início Vigência * (AAAA-MM-DD)", 20, None),
    ("data_vigencia_fim", "Fim Vigência * (AAAA-MM-DD)", 20, None),
    ("itens", "Números dos Itens separados por vírgula * (Ex: 1, 2, 3)", 28, None),
]

COLUNAS_AJUSTES: List[Tuple[str, str, int, Optional[str]]] = [
    ("codigo_contrato", "Código Único do Contrato * (Sem ID = linha ignorada)", 30, None),
    ("codigo_edital", "Código do Edital de referência *", 28, None),
    ("codigo_ata", "Código da Ata (Obrigatório se Edital for SRP)", 26, None),
    ("municipio", "Município AUDESP * (Selecione)", 28, "municipios"),
    ("entidade", "Entidade AUDESP * (Selecione)", 36, "entidades"),
    ("adesao_participacao", "Adesão / Carona? (Selecione)", 18, "sim_nao"),
    ("gerenciadora_jurisdicionada", "Gerenciadora Jurisdicionada TCESP? (Selecione)", 22, "sim_nao"),
    ("cnpj_gerenciadora", "CNPJ Gerenciadora (Se Adesão e Não Jurisd.)", 24, None),
    ("municipio_gerenciador", "Município Gerenciador (Selecione se Adesão)", 26, "municipios"),
    ("entidade_gerenciadora", "Entidade Gerenciadora (Selecione se Adesão)", 32, "entidades"),
    ("retificacao", "Retificação? (Selecione)", 16, "sim_nao"),
    ("tipo_contrato_id", "Tipo Contrato ID * (Selecione)", 28, "tipos_contrato"),
    ("numero_contrato_empenho", "Nº Contrato/Empenho * (Ex: 005/2026)", 22, None),
    ("ano_contrato", "Ano Contrato * (Ex: 2026)", 16, None),
    ("processo", "Nº Processo * (Ex: 650/2026)", 20, None),
    ("categoria_processo_id", "Categoria Processo ID * (Selecione)", 28, "categorias_processo"),
    ("tipo_objeto_contrato", "Tipo Objeto Contrato ID * (Selecione)", 32, "tipos_objeto_contrato"),
    ("receita", "É Receita para a Entidade? (Selecione)", 20, "sim_nao"),
    ("fontes_recurso", "Fontes Recurso IDs sep. por vírgula (Ex: 1)", 22, None),
    ("despesas", "Classificações Despesa 8 chars sep. por vírgula (Ex: 33903000)", 28, None),
    ("codigo_unidade", "Código Unidade Compradora (Opcional)", 22, None),
    ("tipo_pessoa_fornecedor", "Tipo Pessoa Fornecedor * (Selecione)", 26, "tipos_pessoa"),
    ("ni_fornecedor", "CNPJ / CPF Fornecedor *", 22, None),
    ("nome_razao_social_fornecedor", "Razão Social / Nome Fornecedor *", 32, None),
    ("objeto_contrato", "Descrição do Objeto do Contrato *", 40, None),
    ("informacao_complementar", "Informação Complementar (Opcional)", 28, None),
    ("valor_inicial", "Valor Inicial (R$) *", 18, None),
    ("valor_global", "Valor Global (R$) *", 18, None),
    ("valor_acumulado", "Valor Acumulado (Opcional)", 18, None),
    ("numero_parcelas", "Nº Parcelas (Ex: 1)", 16, None),
    ("valor_parcela", "Valor Parcela (R$)", 18, None),
    ("data_assinatura", "Data Assinatura * (AAAA-MM-DD)", 20, None),
    ("data_vigencia_inicio", "Início Vigência (AAAA-MM-DD)", 20, None),
    ("data_vigencia_fim", "Fim Vigência (AAAA-MM-DD)", 20, None),
    ("vigencia_meses", "Vigência em Meses (Opcional)", 18, None),
    ("itens", "Números dos Itens separados por vírgula * (Ex: 1, 2)", 26, None),
]


# ==============================================================================
# Linhas de Exemplo Ilustrativas para a Planilha Modelo (.xlsx)
# ==============================================================================

EXEMPLO_EDITAL = [
    "5820001500018310000012026",
    "NAO",
    "7071 - Santos (SP)",
    "11310 - PRODESAN - Progresso e Desenvolvimento de Santos S/A",
    "2026-03-10",
    "NAO",
    label_id(DOMINIO_INSTRUMENTOS, 1),
    label_id(DOMINIO_MODALIDADES, 6),
    label_id(DOMINIO_MODO_DISPUTA, 1),
    "001",
    2026,
    "100/2026",
    "Aquisição de materiais de escritório pelo período de 12 meses",
    "NAO",
    "1 - Lei 14.133/2021, Art. 28, I (pregão: modalidade de licitação obrigatória p)",
    "2026-03-12T09:00:00",
    "2026-03-25T09:00:00",
    "",
    "",
    "",
    "",
    "SIM",
]

EXEMPLO_EDITAL_ITEM = [
    "5820001500018310000012026",
    1,
    "M - Material",
    label_id(DOMINIO_TIPO_BENEFICIO, 4),
    "NAO",
    "Papel Sulfite A4 75g pacote com 500 folhas",
    100,
    "PCT",
    "NAO",
    25.50,
    2550.00,
    label_id(DOMINIO_CRITERIO_JULGAMENTO, 1),
    label_id(DOMINIO_ITEM_CATEGORIA, 3),
    "",
    "",
]

EXEMPLO_EDITAL_PUB = [
    "5820001500018310000012026",
    label_id(DOMINIO_VEICULOS_PUBLICACAO, 5),
    "2026-03-11",
    "5820001500018310000012026",
    "",
]

EXEMPLO_LICITACAO = [
    "5820001500018310000012026",
    "7071 - Santos (SP)",
    "11310 - PRODESAN - Progresso e Desenvolvimento de Santos S/A",
    "NAO",
    "001",
    2026,
    "100/2026",
    "Aquisição de materiais de escritório",
    label_id(DOMINIO_TRI_STATE, 2),
    label_id(DOMINIO_TIPO_NATUREZA, 1),
    label_id(DOMINIO_TRI_STATE, 1),
    label_id(DOMINIO_TRI_STATE, 2),
    label_id(DOMINIO_TRI_STATE, 2),
    label_id(DOMINIO_TRI_STATE, 2),
    1,
    label_id(DOMINIO_EXIGENCIA_AMOSTRA, 3),
    "SIM",
    "SIM",
    "SIM",
    label_id(DOMINIO_EXIGENCIA_VISITA, 2),
    "NAO",
    "NAO",
    "SIM",
    "1",
    "SIM",
    "12345678909",
    label_id(DOMINIO_TRI_STATE, 2),
]

EXEMPLO_LICITACAO_ITEM = [
    "5820001500018310000012026",
    1,
    label_id(DOMINIO_TIPO_ORCAMENTO, 2),
    25.50,
    "2026-03-10",
    label_id(DOMINIO_SITUACAO_COMPRA_ITEM, 2),
    "2026-03-26",
    "M - Monetário",
    label_id(DOMINIO_TIPO_PROPOSTA, 2),
]

EXEMPLO_LICITACAO_LICITANTE = [
    "5820001500018310000012026",
    1,
    "PJ - Pessoa Jurídica (CNPJ)",
    "11222333000181",
    "Papelaria Exemplo LTDA",
    label_id(DOMINIO_DECLARACAO_ME_EPP, 1),
    label_id(DOMINIO_RESULTADO_HABILITACAO, 1),
    24.90,
]

EXEMPLO_ATA = [
    "ATA-010/2026",
    "5820001500018310000012026",
    "7071 - Santos (SP)",
    "11310 - PRODESAN - Progresso e Desenvolvimento de Santos S/A",
    2026,
    "NAO",
    "010/2026",
    2026,
    "2026-04-01",
    "2026-04-01",
    "2027-04-01",
    "1, 2",
]

EXEMPLO_AJUSTE = [
    "CONTR-005/2026",
    "5820001500018310000012026",
    "",
    "7071 - Santos (SP)",
    "11310 - PRODESAN - Progresso e Desenvolvimento de Santos S/A",
    "NAO",
    "NAO",
    "",
    "",
    "",
    "NAO",
    label_id(DOMINIO_TIPO_CONTRATO, 1),
    "005/2026",
    2026,
    "100/2026",
    label_id(DOMINIO_CATEGORIA_PROCESSO, 2),
    label_id(DOMINIO_TIPO_OBJETO_CONTRATO, 4),
    "NAO",
    "1",
    "33903000",
    "",
    "PJ - Pessoa Jurídica (CNPJ)",
    "11222333000181",
    "Papelaria Exemplo LTDA",
    "Fornecimento de papel sulfite A4 conforme edital",
    "",
    2490.00,
    2490.00,
    "",
    1,
    2490.00,
    "2026-04-05",
    "2026-04-05",
    "2027-04-05",
    "",
    "1",
]


