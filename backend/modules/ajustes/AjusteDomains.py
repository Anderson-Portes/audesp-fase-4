from typing import Dict, Any, List, Optional, Set
from modules.licitacoes.LicitacaoDomains import validar_itens_contra_licitacao

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

# Mapeamento oficial Fase IV v04: Objetos do Contrato permitidos por Categoria do Processo
OBJETOS_POR_CATEGORIA: Dict[int, List[int]] = {
    1: [1, 2],
    2: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    3: [12, 13, 14],
    4: [15],
    5: [16],
    6: [17],
    7: [18, 19],
    8: [20, 21, 22, 23, 24, 25, 26, 27],
    9: [18, 19],
    10: [28],
    11: [29],
}

TIPOS_CONTRATO_COM_VIGENCIA = {1, 2, 3, 4, 5, 8, 12}


def validar_regras_negocio_ajuste(
    dados: Dict[str, Any],
    edital_srp: bool = False,
    numeros_itens_licitacao: Optional[Set[int]] = None,
    ata_id_vinculada: Optional[int] = None,
    ata_vinculada_status: Optional[str] = None
) -> List[str]:
    """Valida as regras de negócio de envio de Ajuste/Contrato conforme o schema do TCESP."""
    erros = []
    
    descritor = dados.get("descritor", {})
    cod_edital = str(descritor.get("codigoEdital") or "").strip()
    if not cod_edital:
        erros.append("Código do Edital é obrigatório no descritor.")
    elif len(cod_edital) > 25:
        erros.append("Código do Edital deve ter no máximo 25 caracteres.")

    cod_contrato = str(descritor.get("codigoContrato") or "").strip()
    if not cod_contrato:
        erros.append("Código único do Ajuste/Contrato (codigoContrato) é obrigatório.")
    elif len(cod_contrato) > 25:
        erros.append("Código único do Ajuste/Contrato deve ter no máximo 25 caracteres.")

    # Validação de Ata e Códigos na adesão
    cod_ata = str(descritor.get("codigoAta") or "").strip()
    adesao = bool(descritor.get("adesaoParticipacao", False))

    if adesao:
        # Na adesão, os identificadores são os IDs PNCP da entidade gerenciadora
        digits_edital = "".join(filter(str.isdigit, cod_edital))
        if len(digits_edital) != 25:
            erros.append("Na adesão ou participação, informe o ID de Contratação PNCP do edital com 25 dígitos.")
        if cod_ata:
            digits_ata = "".join(filter(str.isdigit, cod_ata))
            if len(digits_ata) != 31:
                erros.append("Na adesão, informe o ID da Ata PNCP com 31 dígitos ou deixe o campo vazio.")

        ger_jurisd = descritor.get("gerenciadoraJurisdicionada")
        if ger_jurisd is True:
            if not descritor.get("municipioGerenciador") or not descritor.get("entidadeGerenciadora"):
                erros.append("Na adesão a entidade jurisdicionada ao TCE-SP, informe 'municipioGerenciador' e 'entidadeGerenciadora'.")
        elif ger_jurisd is False:
            cnpj_ger = "".join(filter(str.isdigit, str(descritor.get("cnpjGerenciadora") or "")))
            if len(cnpj_ger) != 14:
                erros.append("Na adesão a entidade não jurisdicionada ao TCE-SP, informe 'cnpjGerenciadora' com 14 dígitos.")
    else:
        if cod_ata and len(cod_ata) > 31:
            erros.append("Código da Ata deve ter no máximo 31 caracteres.")

        # Regra AUDESP (TCE-SP): Se o edital de origem for SRP e não for adesão/participação externa,
        # o Ajuste decorre de uma Ata de Registro de Preços e exige codigoAta
        if edital_srp and not cod_ata:
            erros.append(
                "O Edital vinculado é do tipo SRP (Sistema de Registro de Preços): informe ou vincule o Código da Ata de Registro de Preços (codigoAta) no Ajuste."
            )
        if ata_id_vinculada is not None and ata_vinculada_status and ata_vinculada_status != "sent":
            erros.append("A Ata de Registro de Preços vinculada ainda não foi enviada ao AUDESP.")
        
    tipo_contrato = dados.get("tipoContratoId")
    if not tipo_contrato:
        erros.append("Tipo de Contrato é obrigatório.")

    num_contrato = str(dados.get("numeroContratoEmpenho") or "").strip()
    if not num_contrato:
        erros.append("Número do contrato ou empenho no sistema de origem é obrigatório.")
    elif len(num_contrato) > 50:
        erros.append("Número do contrato ou empenho deve ter no máximo 50 caracteres.")

    if not dados.get("anoContrato"):
        erros.append("Ano do contrato é obrigatório.")

    processo = str(dados.get("processo") or "").strip()
    if not processo:
        erros.append("Número do processo é obrigatório.")
    elif len(processo) > 50:
        erros.append("Número do processo deve ter no máximo 50 caracteres.")

    cat_proc = dados.get("categoriaProcessoId")
    tipo_obj = dados.get("tipoObjetoContrato")
    if not cat_proc:
        erros.append("Categoria do processo é obrigatória.")
    if not tipo_obj:
        erros.append("Tipo de Objeto do Contrato é obrigatório.")
    elif cat_proc and cat_proc in OBJETOS_POR_CATEGORIA:
        permitidos = OBJETOS_POR_CATEGORIA[cat_proc]
        if tipo_obj not in permitidos:
            erros.append(
                f"Objeto do Contrato {tipo_obj} não é permitido para a Categoria de Processo {cat_proc}."
            )
        
    # Fornecedor
    ni_forn = str(dados.get("niFornecedor") or "").strip()
    t_pes_forn = dados.get("tipoPessoaFornecedor")
    nome_forn = str(dados.get("nomeRazaoSocialFornecedor") or "").strip()

    if not ni_forn:
        erros.append("Número de identificação (CPF/CNPJ) do fornecedor é obrigatório.")
    if not t_pes_forn:
        erros.append("Tipo de pessoa do fornecedor (PJ, PF, PE) é obrigatório.")
    if not nome_forn:
        erros.append("Razão Social/Nome do fornecedor é obrigatório.")
    elif len(nome_forn) > 100:
        erros.append("Nome/Razão Social do fornecedor deve ter no máximo 100 caracteres.")
        
    obj_contrato = str(dados.get("objetoContrato") or "").strip()
    if not obj_contrato:
        erros.append("Descrição do objeto do contrato é obrigatória.")
    elif len(obj_contrato) > 5120:
        erros.append("Descrição do objeto do contrato deve ter no máximo 5120 caracteres.")
        
    if dados.get("valorInicial") is None:
        erros.append("Valor inicial do contrato é obrigatório.")
        
    if not dados.get("dataAssinatura"):
        erros.append("Data de assinatura do contrato é obrigatória.")
        
    # Vigência condicional (Fase IV v04)
    dt_inicio = dados.get("dataVigenciaInicio")
    dt_fim = dados.get("dataVigenciaFim")
    vig_meses = dados.get("vigenciaMeses")

    if tipo_contrato in TIPOS_CONTRATO_COM_VIGENCIA:
        if not dt_inicio and (vig_meses is None or vig_meses <= 0):
            erros.append("Para o tipo de contrato informado, forneça a 'dataVigenciaInicio' ou a 'vigenciaMeses'.")
        if dt_inicio and not dt_fim:
            erros.append("Quando 'dataVigenciaInicio' for informada, 'dataVigenciaFim' também é obrigatória.")

    if dt_inicio and dt_fim and dt_fim < dt_inicio:
        erros.append("A data de término da vigência não pode ser anterior à data inicial.")

    despesas = dados.get("despesas")
    if isinstance(despesas, list) and despesas:
        for idx, desp in enumerate(despesas, start=1):
            d_str = str(desp or "").strip()
            if len(d_str) != 8:
                erros.append(f"Classificação de despesa {idx} ('{d_str}') deve conter exatamente 8 caracteres.")
        if tipo_contrato == 7 and len(despesas) > 1:
            erros.append("Para Empenho (tipoContratoId = 7), informe no máximo 1 classificação de despesa.")

    cod_unidade = str(dados.get("codigoUnidade") or "").strip()
    if cod_unidade and len(cod_unidade) > 30:
        erros.append("O campo 'codigoUnidade' deve ter no máximo 30 caracteres.")
        
    itens = dados.get("itens", [])
    if not itens or len(itens) == 0:
        erros.append("É necessário vincular ao menos 1 item contratado.")
    else:
        erros.extend(
            validar_itens_contra_licitacao(
                itens,
                None if adesao else numeros_itens_licitacao
            )
        )
        
    return erros
