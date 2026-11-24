from typing import Dict, List, Any

# Domínio AUDESP / PNCP: Tipo de Instrumento Convocatório
# Nota: Instrumento 4 (Edital de Chamamento Público) consta no JSON Schema do AUDESP (edital_schema.json)
DOMINIO_INSTRUMENTOS = {
    1: "Edital",
    2: "Aviso de Contratação Direta",
    3: "Ato que autoriza a Contratação Direta",
    4: "Edital de Chamamento Público"
}

# Domínio PNCP com alterações AUDESP: Modalidade de Contratação
DOMINIO_MODALIDADES = {
    1: "Leilão - Eletrônico",
    2: "Diálogo Competitivo",
    3: "Concurso",
    4: "Concorrência - Eletrônica",
    5: "Concorrência - Presencial",
    6: "Pregão - Eletrônico",
    7: "Pregão - Presencial",
    8: "Dispensa de Licitação",
    9: "Inexigibilidade",
    10: "Manifestação de Interesse",
    11: "Pré-Qualificação",
    12: "Credenciamento",
    13: "Leilão - Presencial",
    14: "Inaplicabilidade da Licitação",
    15: "Chamada pública",
    16: "Concorrência – Eletrônica Internacional",
    17: "Concorrência – Presencial Internacional",
    18: "Pregão – Eletrônico Internacional",
    19: "Pregão – Presencial Internacional",
    997: "Regime Diferenciado de Contratação (RDC)",
    998: "Convite",
    999: "Tomada de Preços"
}

# Regra da tabela de Domínio "Instrumento Convocatório":
# Validação estrita do Instrumento com a Modalidade de Contratação (Fase IV v04)
MODALIDADES_PERMITIDAS_POR_INSTRUMENTO = {
    1: [1, 2, 3, 4, 5, 6, 7, 13, 14, 16, 17, 18, 19, 997, 998, 999], # Edital (inclui internacionais)
    2: [8, 14],                                                       # Aviso de Contratação Direta (Dispensa com Disputa)
    3: [8, 9, 14],                                                    # Ato que autoriza Contratação Direta (Dispensa sem Disputa ou Inexigibilidade)
    4: [12, 15]                                                       # Edital de Chamamento Público (Credenciamento / Chamada Pública)
}

# Domínio PNCP: Modo de Disputa
DOMINIO_MODO_DISPUTA = {
    1: "Aberto",
    2: "Fechado",
    3: "Aberto-Fechado",
    4: "Dispensa com Disputa",
    5: "Não se aplica",
    6: "Fechado-Aberto"
}

# Domínio AUDESP: Veículo de Comunicação
DOMINIO_VEICULOS_PUBLICACAO = {
    1: "Diário Oficial do Município",
    2: "Diário Oficial do Estado",
    3: "Diário Oficial da União",
    4: "Diário da Justiça Eletrônico",
    5: "Portal Nacional de Compras Públicas (PNCP)",
    6: "Jornal de grande circulação nacional",
    7: "Jornal de grande circulação regional/municipal",
    8: "Quadro ou mural de acesso público",
    9: "Site da administração direta na Internet",
    10: "Outros"
}

# Domínio PNCP: Tipo de Benefício
DOMINIO_TIPO_BENEFICIO = {
    1: "Participação exclusiva para ME/EPP",
    2: "Subcontratação para ME/EPP",
    3: "Cota reservada para ME/EPP",
    4: "Sem benefício",
    5: "Não se aplica"
}

# Domínio PNCP com alterações AUDESP: Critério de Julgamento
DOMINIO_CRITERIO_JULGAMENTO = {
    1: "Menor preço",
    2: "Maior desconto",
    4: "Técnica e preço",
    5: "Maior lance",
    6: "Maior retorno econômico",
    7: "Não se aplica",
    8: "Melhor técnica",
    9: "Conteúdo artístico",
    1000: "Melhor destinação de bens alienados",
    1001: "Maior oferta de preço"
}

# Domínio AUDESP: Categoria do Item
DOMINIO_ITEM_CATEGORIA = {
    1: "Bens Imóveis",
    2: "Bens Móveis",
    3: "Não se aplica"
}

DOMINIO_ITEM_CATEGORIA_LEILAO = {
    1: "Bens Imóveis",
    2: "Bens Móveis"
}


def is_leilao(modalidade_id: Any) -> bool:
    return modalidade_id in (1, 13)


def categoria_item_normalizada(modalidade_id: Any, atual: Any) -> Any:
    """
    Fora de leilão a categoria é sempre "Não se aplica" (3).
    Em leilão só valem 1 ou 2; outro valor volta a ficar None para ser escolhido.
    """
    if not is_leilao(modalidade_id):
        return 3
    return int(atual) if atual in (1, 2) else None


def valor_total_item_edital(item: Dict[str, Any]) -> float:
    """
    Calcula o valor total do item como quantidade × valorUnitarioEstimado
    com precisão de 4 casas decimais do schema AUDESP.
    """
    try:
        quantidade = float(item.get("quantidade") or 0)
    except (TypeError, ValueError):
        quantidade = 0.0
    try:
        unitario = float(item.get("valorUnitarioEstimado") or 0)
    except (TypeError, ValueError):
        unitario = 0.0
    return round(quantidade * unitario, 4)


def recalcular_totais_edital(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Recalcula `valorTotal` de todos os itens em `itensCompra` pela quantidade × unitário."""
    itens = doc.get("itensCompra")
    if not isinstance(itens, list):
        return doc
    novos_itens = []
    for item in itens:
        if not isinstance(item, dict):
            continue
        novo_item = dict(item)
        novo_item["valorTotal"] = valor_total_item_edital(novo_item)
        novos_itens.append(novo_item)
    doc["itensCompra"] = novos_itens
    return doc


def normalizar_categorias_edital(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Normaliza o campo itemCategoriaId de cada item de compra segundo a modalidade."""
    modalidade_id = doc.get("modalidadeId")
    itens = doc.get("itensCompra")
    if not isinstance(itens, list):
        return doc
    novos_itens = []
    for item in itens:
        if not isinstance(item, dict):
            continue
        novo_item = dict(item)
        cat = categoria_item_normalizada(modalidade_id, novo_item.get("itemCategoriaId"))
        if cat is not None:
            novo_item["itemCategoriaId"] = cat
        else:
            novo_item.pop("itemCategoriaId", None)
        if is_leilao(modalidade_id):
            novo_item["materialOuServico"] = "M"
        novos_itens.append(novo_item)
    doc["itensCompra"] = novos_itens
    return doc

def validar_regras_negocio_edital(doc: Dict[str, Any], has_pdf: bool) -> List[str]:
    """
    Executa a validação de negócio AUDESP Fase IV baseada nas colunas de
    Observação / Validação da documentação oficial do TCESP.
    Retorna uma lista de mensagens de erro encontradas (vazia se válido).
    """
    erros: List[str] = []
    
    # 1. Validação do Descritor
    descritor = doc.get("descritor") or {}
    if not descritor.get("municipio"):
        erros.append("Campo 'municipio' no descritor é obrigatório.")
    if not descritor.get("entidade"):
        erros.append("Campo 'entidade' no descritor é obrigatório.")
    codigo_edital = str(descritor.get("codigoEdital") or "").strip()
    if not codigo_edital:
        erros.append("Campo 'codigoEdital' é obrigatório.")
    elif len(codigo_edital) > 25:
        erros.append("Campo 'codigoEdital' deve ter no máximo 25 caracteres.")
    if not descritor.get("dataDocumento"):
        erros.append("Campo 'dataDocumento' no descritor é obrigatório.")
        
    # 2. Validação da Publicidade
    publicidade = doc.get("publicidade") or {}
    houve_publicacao = publicidade.get("houvePublicacao", False)
    publicacoes = publicidade.get("publicacoes") or []
    
    tem_veiculo_pncp = False
    if houve_publicacao:
        if not publicacoes:
            erros.append("Se 'houvePublicacao' é Sim, é obrigatório cadastrar ao menos uma publicação.")
        for idx, pub in enumerate(publicacoes, start=1):
            v_id = pub.get("veiculoPublicacao")
            if not v_id:
                erros.append(f"Publicação {idx}: 'veiculoPublicacao' é obrigatório.")
            if not pub.get("dataPublicacao"):
                erros.append(f"Publicação {idx}: 'dataPublicacao' é obrigatória.")
            if v_id == 5:
                tem_veiculo_pncp = True
                id_pncp = str(pub.get("idContratacaoPNCP") or "").strip()
                if not id_pncp or len(id_pncp) != 25 or not id_pncp.isdigit():
                    erros.append(f"Publicação {idx}: No veículo PNCP, 'idContratacaoPNCP' deve ter exatamente 25 dígitos numéricos.")
            if v_id == 10:
                nome_outro = str(pub.get("veiculoPublicacaoNome") or "").strip()
                if not nome_outro:
                    erros.append(f"Publicação {idx}: Para o veículo 'Outros' (10), 'veiculoPublicacaoNome' é obrigatório.")
            elif pub.get("veiculoPublicacaoNome"):
                erros.append(f"Publicação {idx}: Para o veículo {v_id}, não deve ser informado 'veiculoPublicacaoNome' (apenas permitido para o veículo 10 - Outros).")
            if v_id != 5 and pub.get("idContratacaoPNCP"):
                erros.append(f"Publicação {idx}: Para o veículo {v_id}, não deve ser informado 'idContratacaoPNCP' (apenas permitido para o veículo 5 - PNCP).")
                    
    # Observação da documentação: Se algum veiculoPublicacao = 5 (PNCP), o codigoEdital deve ser o número de controle PNCP
    if tem_veiculo_pncp and (len(codigo_edital) != 25 or not codigo_edital.isdigit()):
        erros.append("Quando houver publicação no PNCP (veículo 5), o 'codigoEdital' deve ser composto pelos 25 dígitos do controle PNCP.")
        
    # 3. Validação do Instrumento Convocatório e Modalidade
    tipo_inst = doc.get("tipoInstrumentoConvocatorioId")
    modalidade = doc.get("modalidadeId")
    if not tipo_inst:
        erros.append("Campo 'tipoInstrumentoConvocatorioId' é obrigatório.")
    if not modalidade:
        erros.append("Campo 'modalidadeId' é obrigatório.")
    elif tipo_inst in MODALIDADES_PERMITIDAS_POR_INSTRUMENTO:
        # Credenciamento (12) e Chamada pública (15) não têm restrição rígida de instrumento
        if modalidade not in (12, 15):
            permitidas = MODALIDADES_PERMITIDAS_POR_INSTRUMENTO[tipo_inst]
            if modalidade not in permitidas:
                nomes_permitidas = [f"{m} ({DOMINIO_MODALIDADES.get(m, '')})" for m in permitidas]
                erros.append(
                    f"Modalidade {modalidade} não é permitida para o Instrumento Convocatório {tipo_inst} "
                    f"({DOMINIO_INSTRUMENTOS.get(tipo_inst, '')}). Permitidas: {', '.join(nomes_permitidas)}."
                )
            
    # 4. Validação de Datas de Abertura / Encerramento de Propostas
    # Observação: Obrigatório para Instrumento 1 (Edital) ou 2 (Aviso de Contratação Direta: dispensa com disputa)
    dt_abertura = doc.get("dataAberturaProposta")
    dt_encerramento = doc.get("dataEncerramentoProposta")
    if tipo_inst in (1, 2):
        if not dt_abertura:
            erros.append("Campo 'dataAberturaProposta' é obrigatório para Tipo de Instrumento 1 ou 2.")
        if not dt_encerramento:
            erros.append("Campo 'dataEncerramentoProposta' é obrigatório para Tipo de Instrumento 1 ou 2.")
        if dt_abertura and dt_encerramento and dt_encerramento < dt_abertura:
            erros.append("Data de encerramento de proposta não pode ser anterior à data de abertura.")
            
    # 5. Validação de Envio do PDF do Edital
    # Regra da documentação: "Aceitar JSONs de Edital sem PDF apenas nos casos de Inexigibilidade de Licitação (Modalidade = 9)"
    if not has_pdf and modalidade != 9:
        erros.append(
            "O arquivo PDF do Edital é obrigatório para todas as modalidades (exceto Inexigibilidade de Licitação)."
        )
        
    # 6. Validação dos Itens de Compra
    itens = doc.get("itensCompra") or []
    if not itens:
        erros.append("A lista 'itensCompra' é obrigatória e deve conter ao menos 1 item.")
    else:
        is_leilao = modalidade in (1, 13)
        for idx, item in enumerate(itens, start=1):
            # Validação do tipo Material ou Serviço no Leilão
            mat_serv = item.get("materialOuServico")
            if not mat_serv:
                erros.append(f"Item {idx}: 'materialOuServico' é obrigatório ('M' ou 'S').")
            elif is_leilao and mat_serv != "M":
                erros.append(f"Item {idx}: Em contratações na modalidade Leilão, 'materialOuServico' deve ser 'M' (Material).")
                
            # Categoria do item
            cat_id = item.get("itemCategoriaId")
            if not cat_id:
                erros.append(f"Item {idx}: 'itemCategoriaId' é obrigatório.")
            elif is_leilao and cat_id not in (1, 2):
                erros.append(f"Item {idx}: Para Leilão, 'itemCategoriaId' deve ser 1 (Bens Imóveis) ou 2 (Bens Móveis).")
            elif not is_leilao and cat_id != 3:
                erros.append(f"Item {idx}: Para modalidades diferentes de Leilão, 'itemCategoriaId' deve ser 3 (Não se aplica).")
                
            # Critério de julgamento
            if not item.get("criterioJulgamentoId"):
                erros.append(f"Item {idx}: 'criterioJulgamentoId' é obrigatório.")
                
            # Quantidade e valores
            qtd = item.get("quantidade")
            v_unit = item.get("valorUnitarioEstimado")
            v_tot = item.get("valorTotal")
            if qtd is None or float(qtd) <= 0:
                erros.append(f"Item {idx}: 'quantidade' deve ser maior que zero.")
            if v_unit is None or float(v_unit) < 0:
                erros.append(f"Item {idx}: 'valorUnitarioEstimado' é obrigatório e não pode ser negativo.")
            if v_tot is None or float(v_tot) < 0:
                erros.append(f"Item {idx}: 'valorTotal' é obrigatório e não pode ser negativo.")
                
    return erros
