from typing import Dict, Any, List

# Domínio PNCP: Tipo de Contrato
DOMINIO_TIPO_CONTRATO = {
    1: "1 – Contrato (termo inicial)",
    2: "2 – Comodato",
    3: "3 – Arrendamento",
    4: "4 – Concessão",
    5: "5 – Termo de Adesão",
    7: "7 – Empenho",
    8: "8 – Outros",
    12: "12 – Carta Contrato"
}

# Domínio PNCP: Categoria do Processo
DOMINIO_CATEGORIA_PROCESSO = {
    1: "1 – Cessão",
    2: "2 – Compras",
    3: "3 – Informática (TIC)",
    4: "4 – Internacional",
    5: "5 – Locação Imóveis",
    6: "6 – Mão de Obra",
    7: "7 – Obras",
    8: "8 – Serviços",
    9: "9 – Serviços de Engenharia",
    10: "10 – Serviços de Saúde",
    11: "11 – Alienação de bens móveis/imóveis"
}

# Domínio AUDESP: Objeto do Contrato
DOMINIO_TIPO_OBJETO_CONTRATO = {
    1: "1 – Permissão",
    2: "2 – Concessão de serviço público",
    3: "3 – Equipamentos e materiais permanentes",
    4: "4 – Material de expediente",
    5: "5 – Medicamentos",
    6: "6 – Material hospitalar, ambulatorial ou odontológico",
    7: "7 – Material escolar",
    8: "8 – Uniforme escolar",
    9: "9 – Gêneros alimentícios",
    10: "10 – Combustíveis e lubrificantes",
    11: "11 – Outros materiais de consumo",
    12: "12 – Compras de TIC",
    13: "13 – Serviços de TIC",
    14: "14 – SIAFIC",
    15: "15 – Internacional",
    16: "16 – Locação de imóveis",
    17: "17 – Locação de mão de obra",
    18: "18 – Implantação de aterro sanitário",
    19: "19 – Outras obras e serviços de engenharia",
    20: "20 – Coleta de Lixo",
    21: "21 – Limpeza urbana/varrição",
    22: "22 – Transporte escolar",
    23: "23 – Publicidade/Propaganda",
    24: "24 – Passagens aéreas e outras despesas de locomoção",
    25: "25 – Serviços de consultoria",
    26: "26 – Operações de crédito (exceto ARO)",
    27: "27 – Outras prestações de serviço",
    28: "28 – Serviços de saúde",
    29: "29 – Alienação de bens móveis/imóveis"
}

def validar_regras_negocio_ajuste(dados: Dict[str, Any]) -> List[str]:
    """Valida as regras de negócio de envio de Ajuste/Contrato conforme o schema do TCESP."""
    erros = []
    
    descritor = dados.get("descritor", {})
    if not descritor.get("codigoEdital"):
        erros.append("Código do Edital é obrigatório no descritor.")
    if not descritor.get("codigoContrato"):
        erros.append("Código único do Ajuste/Contrato (codigoContrato) é obrigatório.")
        
    if not dados.get("tipoContratoId"):
        erros.append("Tipo de Contrato é obrigatório.")
    if not dados.get("numeroContratoEmpenho"):
        erros.append("Número do contrato ou empenho no sistema de origem é obrigatório.")
    if not dados.get("anoContrato"):
        erros.append("Ano do contrato é obrigatório.")
    if not dados.get("processo"):
        erros.append("Número do processo é obrigatório.")
    if not dados.get("categoriaProcessoId"):
        erros.append("Categoria do processo é obrigatória.")
    if not dados.get("tipoObjetoContrato"):
        erros.append("Tipo de Objeto do Contrato é obrigatório.")
        
    # Fornecedor
    if not dados.get("niFornecedor"):
        erros.append("Número de identificação (CPF/CNPJ) do fornecedor é obrigatório.")
    if not dados.get("tipoPessoaFornecedor"):
        erros.append("Tipo de pessoa do fornecedor (PJ, PF, PE) é obrigatório.")
    if not dados.get("nomeRazaoSocialFornecedor"):
        erros.append("Razão Social/Nome do fornecedor é obrigatório.")
        
    if not dados.get("objetoContrato"):
        erros.append("Descrição do objeto do contrato é obrigatória.")
        
    if dados.get("valorInicial") is None:
        erros.append("Valor inicial do contrato é obrigatório.")
        
    if not dados.get("dataAssinatura"):
        erros.append("Data de assinatura do contrato é obrigatória.")
        
    dt_inicio = dados.get("dataVigenciaInicio")
    dt_fim = dados.get("dataVigenciaFim")
    if dt_inicio and dt_fim and dt_fim < dt_inicio:
        erros.append("A data de término da vigência não pode ser anterior à data inicial.")
        
    itens = dados.get("itens", [])
    if not itens or len(itens) == 0:
        erros.append("É necessário vincular ao menos 1 item contratado.")
        
    return erros
