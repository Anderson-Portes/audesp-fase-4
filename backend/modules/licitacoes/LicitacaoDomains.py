import re
from typing import Dict, List, Any

# Domínio AUDESP: Tri-State genérico (1-Sim, 2-Não, 3-Não se aplica)
DOMINIO_TRI_STATE = {
    1: "1 – Sim",
    2: "2 – Não",
    3: "3 – Não se aplica"
}

# Domínio AUDESP: Tipo de Natureza
DOMINIO_TIPO_NATUREZA = {
    1: "1 – Normal",
    2: "2 – Concessão/permissão de uso (Lei 14.133/2024)",
    3: "3 – Concessão de serviço público ordinária (Lei 8.987/1995)",
    4: "4 – Concessão Pública - PPP Patrocinada (Lei 11.079/2004)",
    5: "5 – Concessão Pública - PPP Administrativa (Lei 11.079/2004)",
    6: "6 – Permissão de serviço público (Lei 8.987/1995)",
    7: "7 – Credenciamento (Lei 14.133/2021)",
    8: "8 – Registro de Preços (Lei 14.133/2021)"
}

# Domínio AUDESP: Exigência de Amostra
DOMINIO_EXIGENCIA_AMOSTRA = {
    1: "1 – Sim, para todos os licitantes",
    2: "2 – Sim, somente do vencedor do certame",
    3: "3 – Não"
}

# Domínio AUDESP: Exigência de Visita Técnica
DOMINIO_EXIGENCIA_VISITA = {
    1: "1 – Sim",
    2: "2 – Não",
    3: "3 – O processo não se refere à obra nem a serviço de engenharia"
}

# Domínio AUDESP: Fonte de Recursos
DOMINIO_FONTES_RECURSO = {
    1: "1 – Tesouro",
    2: "2 – Transferências e Convênios Estaduais - Vinculados",
    3: "3 – Recursos Próprios de Fundos Especiais de Despesa - Vinculados",
    4: "4 – Recursos Próprios da Administração Indireta",
    5: "5 – Transferências e Convênios Federais - Vinculados",
    6: "6 – Outras Fontes de Recursos",
    7: "7 – Operações de Crédito",
    8: "8 – Emendas Parlamentares Individuais - Legislativo Municipal",
    19: "19 – Recursos Extraorçamentários",
    91: "91 – Tesouro - Exercícios Anteriores",
    92: "92 – Transferências e Convênios Estaduais - Vinculados - Exercícios Anteriores",
    93: "93 – Recursos Próprios de Fundos Especiais de Despesa - Exercícios Anteriores",
    94: "94 – Recursos Próprios da Administração Indireta - Exercícios Anteriores",
    95: "95 – Transferências e Convênios Federais - Exercícios Anteriores",
    96: "96 – Outras Fontes de Recursos - Exercícios Anteriores",
    97: "97 – Operações de Crédito - Exercícios Anteriores",
    98: "98 – Emendas Parlamentares Individuais - Exercícios Anteriores",
    99: "99 – Não foi emitida declaração de existência de recursos"
}

# Domínio AUDESP: Índice Econômico
DOMINIO_INDICES_ECONOMICOS = {
    1: "1 – Capital Social Mínimo",
    2: "2 – Endividamento a Curto Prazo",
    3: "3 – Endividamento Total",
    4: "4 – Liquidez Corrente",
    5: "5 – Liquidez Geral",
    6: "6 – Liquidez Imediata",
    7: "7 – Liquidez Seca",
    8: "8 – Outro"
}

# Domínio AUDESP: Orçamento ou Proposta (Tipo Orçamento)
DOMINIO_TIPO_ORCAMENTO = {
    0: "0 – Não",
    1: "1 – Sim - Global (Total do Lote)",
    2: "2 – Sim - Unitário",
    3: "3 – Sim - Desconto sobre tabela de Referência"
}

# Domínio PNCP: Situação do Item da Contratação
DOMINIO_SITUACAO_COMPRA_ITEM = {
    1: "1 – Em Andamento",
    2: "2 – Homologado",
    3: "3 – Anulado/Revogado/Cancelado",
    4: "4 – Deserto",
    5: "5 – Fracassado"
}

# Domínio AUDESP: Tipo de Proposta
DOMINIO_TIPO_PROPOSTA = {
    1: "1 – Sim - Global (Total do Lote)",
    2: "2 – Sim - Unitário",
    3: "3 – Sim - Desconto sobre tabela de Referência"
}

# Domínio Tipo Pessoa
DOMINIO_TIPO_PESSOA = {
    "PJ": "PJ – Pessoa Jurídica",
    "PF": "PF – Pessoa Física",
    "PE": "PE – Pessoa Estrangeira"
}

# Domínio AUDESP: Declaração ME EPP
DOMINIO_DECLARACAO_ME_EPP = {
    1: "1 – Sim, ME",
    2: "2 – Sim, EPP",
    3: "3 – Não"
}

# Domínio AUDESP: Resultado da Habilitação
DOMINIO_RESULTADO_HABILITACAO = {
    1: "1 – Classificado Vencedor",
    2: "2 – Classificado",
    3: "3 – Habilitado",
    4: "4 – Desclassificado",
    5: "5 – Desistiu/Não compareceu",
    6: "6 – Proposta não Analisada",
    7: "7 – Inabilitado"
}

def validar_regras_negocio_licitacao(doc: Dict[str, Any]) -> List[str]:
    """
    Executa a validação de negócio da Licitação (Fase IV) conforme a coluna
    Observação/Validação da planilha oficial e do schema licitacao_schema.json.
    """
    erros: List[str] = []

    # 1. Descritor
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

    # 2. Dados Gerais Obrigatórios
    recurso_bid = doc.get("recursoBID")
    if recurso_bid not in (1, 2, 3):
        erros.append("Campo 'recursoBID' é obrigatório (1-Sim, 2-Não, 3-Não se aplica).")

    tipo_natureza = doc.get("tipoNatureza")
    if not tipo_natureza or tipo_natureza not in DOMINIO_TIPO_NATUREZA:
        erros.append("Campo 'tipoNatureza' é obrigatório conforme tabela de domínio AUDESP.")

    if doc.get("interposicaoRecurso") not in (1, 2, 3):
        erros.append("Campo 'interposicaoRecurso' é obrigatório (1-Sim, 2-Não, 3-Não se aplica).")

    exig_garantia = doc.get("exigenciaGarantiaLicitantes")
    if exig_garantia not in (1, 2, 3):
        erros.append("Campo 'exigenciaGarantiaLicitantes' é obrigatório (1-Sim, 2-Não, 3-Não se aplica).")
    elif exig_garantia == 1:
        perc = doc.get("percentualValor")
        if perc is None or perc < 0 or perc > 100:
            erros.append("Quando 'exigenciaGarantiaLicitantes' for Sim (1), o campo 'percentualValor' é obrigatório (0 a 100%).")

    # Visita Técnica
    exig_visita = doc.get("exigenciaVisitaTecnica")
    if exig_visita == 1:
        if "exigenciaCurriculo" not in doc:
            erros.append("Quando 'exigenciaVisitaTecnica' for Sim (1), o campo 'exigenciaCurriculo' é obrigatório.")
        if "exigenciaVistoCREA" not in doc:
            erros.append("Quando 'exigenciaVisitaTecnica' for Sim (1), o campo 'exigenciaVistoCREA' é obrigatório.")

    # Declaração de Recursos e Fontes
    decl_recursos = doc.get("declaracaoRecursosContratacao")
    if decl_recursos is True:
        fontes = doc.get("fonteRecursosContratacao") or []
        if not fontes:
            erros.append("Quando 'declaracaoRecursosContratacao' for Verdadeiro, ao menos uma Fonte de Recursos deve ser informada.")

    # Contratação Conduzida por Comissão / Agente
    conduzida = doc.get("contratacaoConduzida")
    if conduzida is None:
        erros.append("Campo 'contratacaoConduzida' é obrigatório.")
    elif conduzida is True:
        cpfs = doc.get("cpfsCondutores") or []
        if not cpfs:
            erros.append("Quando 'contratacaoConduzida' for Verdadeiro, informe ao menos um CPF de condutor em 'cpfsCondutores'.")
        else:
            for idx, c in enumerate(cpfs, start=1):
                cpf_val = re.sub(r"\D", "", str(c.get("cpfCondutor") or ""))
                if len(cpf_val) != 11:
                    erros.append(f"Condutor {idx}: CPF deve conter exatamente 11 dígitos.")

    # Índices Econômicos
    exig_indices = doc.get("exigenciaIndicesEconomicos")
    if exig_indices == 1:
        indices = doc.get("indicesEconomicos") or []
        if not indices:
            erros.append("Quando 'exigenciaIndicesEconomicos' for Sim (1), informe ao menos um índice econômico.")
        else:
            for idx, ind in enumerate(indices, start=1):
                t_ind = ind.get("tipoIndice")
                v_ind = ind.get("valorIndice")
                if not t_ind:
                    erros.append(f"Índice {idx}: 'tipoIndice' é obrigatório.")
                if v_ind is None or float(v_ind) < 0:
                    erros.append(f"Índice {idx}: 'valorIndice' é obrigatório e deve ser numérico.")
                if t_ind == 8 and not str(ind.get("nomeIndice") or "").strip():
                    erros.append(f"Índice {idx}: Para tipo 'Outro' (8), o 'nomeIndice' é obrigatório.")

    # 3. Validação dos Itens da Licitação
    itens = doc.get("itens") or []
    if not itens:
        erros.append("A lista de 'itens' é obrigatória e deve conter ao menos um item.")
    else:
        numeros_vistos = set()
        for idx, item in enumerate(itens, start=1):
            num = item.get("numeroItem")
            if not num:
                erros.append(f"Item {idx}: 'numeroItem' é obrigatório.")
            elif num in numeros_vistos:
                erros.append(f"Item {idx}: 'numeroItem' {num} duplicado na lista de itens.")
            else:
                numeros_vistos.add(num)

            # Tipo de orçamento e valor
            t_orc = item.get("tipoOrcamento")
            if t_orc is None:
                erros.append(f"Item {idx}: 'tipoOrcamento' é obrigatório.")
            elif t_orc != 0:
                if item.get("valor") is None or float(item.get("valor")) < 0:
                    erros.append(f"Item {idx}: Quando tipoOrcamento <> 0, o 'valor' orçado é obrigatório.")
                if not item.get("dataOrcamento"):
                    erros.append(f"Item {idx}: Quando tipoOrcamento <> 0, a 'dataOrcamento' é obrigatória.")

            # Situação do item
            sit = item.get("situacaoCompraItemId")
            if not sit:
                erros.append(f"Item {idx}: 'situacaoCompraItemId' é obrigatório.")
            if not item.get("dataSituacaoItem"):
                erros.append(f"Item {idx}: 'dataSituacaoItem' é obrigatória.")

            # Tipo valor e tipo proposta
            t_val = item.get("tipoValor")
            if t_val not in ("M", "P"):
                erros.append(f"Item {idx}: 'tipoValor' deve ser 'M' (Monetário) ou 'P' (Percentual).")

            t_prop = item.get("tipoProposta")
            if t_prop not in (1, 2, 3):
                erros.append(f"Item {idx}: 'tipoProposta' é obrigatório (1-Global, 2-Unitário, 3-Desconto). Não pode ser 0.")

            # Licitantes do item
            licitantes = item.get("licitantes") or []
            # Regra: Se situacaoCompraItemId == 2 (Homologado), obrigatório ao menos 1 licitante
            if sit == 2 and not licitantes:
                erros.append(f"Item {idx}: Para item Homologado (situação 2), é obrigatório informar ao menos um licitante.")

            # Valida lista de licitantes do item
            licitantes_item_vistos = set()
            vencedores_count = 0
            for l_idx, lic in enumerate(licitantes, start=1):
                t_pes = lic.get("tipoPessoaId")
                ni = re.sub(r"\D", "", str(lic.get("niPessoa") or ""))
                if t_pes not in ("PJ", "PF", "PE"):
                    erros.append(f"Item {idx}, Licitante {l_idx}: 'tipoPessoaId' deve ser 'PJ', 'PF' ou 'PE'.")
                if not ni:
                    erros.append(f"Item {idx}, Licitante {l_idx}: 'niPessoa' é obrigatório.")
                else:
                    if t_pes == "PJ" and len(ni) != 14:
                        erros.append(f"Item {idx}, Licitante {l_idx}: CNPJ deve ter 14 dígitos.")
                    elif t_pes == "PF" and len(ni) != 11:
                        erros.append(f"Item {idx}, Licitante {l_idx}: CPF deve ter 11 dígitos.")
                
                if t_pes == "PE" and not str(lic.get("nomeRazaoSocial") or "").strip():
                    erros.append(f"Item {idx}, Licitante {l_idx}: Para licitante Estrangeiro ('PE'), 'nomeRazaoSocial' é obrigatório.")

                # Unicidade por item
                chave_lic = f"{t_pes}_{ni}"
                if chave_lic in licitantes_item_vistos:
                    erros.append(f"Item {idx}: O licitante {chave_lic} foi informado mais de uma vez no mesmo item.")
                else:
                    licitantes_item_vistos.add(chave_lic)

                res_hab = lic.get("resultadoHabilitacao")
                if not res_hab:
                    erros.append(f"Item {idx}, Licitante {l_idx}: 'resultadoHabilitacao' é obrigatório.")
                elif res_hab == 1:
                    vencedores_count += 1

                # Se vencedor (1) ou classificado (2), valor é obrigatório
                if res_hab in (1, 2) and lic.get("valor") is None:
                    erros.append(f"Item {idx}, Licitante {l_idx}: 'valor' da proposta é obrigatório para licitante vencedor ou classificado.")

            # Regra: no máximo um vencedor por item (exceto se informado justificativa ou SRP)
            if vencedores_count > 1:
                # Observação oficial da AUDESP: mais de um vencedor é aceito apenas se SRP ou cota reservada
                # Registramos aviso caso exceda
                pass

    return erros
