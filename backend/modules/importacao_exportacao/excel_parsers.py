"""
Parsers de planilhas Excel (.xlsx) para os 4 módulos da AUDESP Fase IV:
- Editais (`parsear_planilha_editais`)
- Licitações (`parsear_planilha_licitacoes`)
- Atas de Registro de Preços (`parsear_planilha_atas`)
- Ajustes e Contratos (`parsear_planilha_ajustes`)

Regra geral: qualquer linha sem o ID principal ou sem os IDs de domínio obrigatórios
selecionados é ignorada automaticamente e não é enviada.
"""
import io
import re
from datetime import date
from typing import Any, Dict, List, Tuple

import openpyxl

from modules.editais.EditalDomains import (
    normalizar_categorias_edital,
    valor_total_item_edital,
)
from modules.licitacoes.LicitacaoDomains import normalizar_ni_pessoa
from modules.importacao_exportacao.ImportacaoExportacaoSchemas import (
    EXEMPLO_AJUSTE,
    EXEMPLO_ATA,
    EXEMPLO_EDITAL,
    EXEMPLO_EDITAL_ITEM,
    EXEMPLO_LICITACAO,
)
from modules.importacao_exportacao.excel_utils import (
    ler_linhas_aba,
    split_int_list,
    split_str_list,
    to_bool,
    to_code_prefix,
    to_date_str,
    to_datetime_str,
    to_float,
    to_int,
    to_str,
)


def _eh_linha_exemplo(codigo: str, descricao: str = "") -> bool:
    """Verifica se o registro corresponde ao exemplo padrão da planilha modelo."""
    cod = str(codigo or "").strip().upper()
    desc = str(descricao or "").strip().upper()
    if "EXEMPLO" in cod or "EXEMPLO" in desc:
        return True
    if "PAPEL SULFITE" in desc:
        return True
    if cod in (
        str(EXEMPLO_EDITAL[0]).upper(),
        str(EXEMPLO_ATA[0]).upper(),
        str(EXEMPLO_AJUSTE[0]).upper(),
    ):
        return True
    return False


def parsear_planilha_editais(file_bytes: bytes) -> List[Dict[str, Any]]:
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
    linhas_ed = ler_linhas_aba(wb, ["Editais", "Edital"])
    linhas_it = ler_linhas_aba(wb, ["Itens", "ItensCompra"])
    linhas_pub = ler_linhas_aba(wb, ["Publicacoes", "Publicidade"])

    itens_por_edital: Dict[str, List[Dict[str, Any]]] = {}
    for row in linhas_it:
        cod = to_str(row.get("codigo_edital"))
        num_item = to_int(row.get("numero_item"), default=None)
        desc = to_str(row.get("descricao"))
        if not cod or num_item is None or _eh_linha_exemplo(cod, desc):
            continue
        mat_serv = to_code_prefix(row.get("material_ou_servico"), "M").upper()[:1]
        item_obj: Dict[str, Any] = {
            "numeroItem": num_item,
            "materialOuServico": mat_serv if mat_serv in ("M", "S") else "M",
            "tipoBeneficioId": to_int(row.get("tipo_beneficio_id"), 4),
            "incentivoProdutivoBasico": to_bool(row.get("incentivo_produtivo_basico"), False),
            "descricao": to_str(row.get("descricao")),
            "quantidade": to_float(row.get("quantidade"), 1.0),
            "unidadeMedida": to_str(row.get("unidade_medida"), "UN"),
            "orcamentoSigiloso": to_bool(row.get("orcamento_sigiloso"), False),
            "valorUnitarioEstimado": to_float(row.get("valor_unitario_estimado"), 0.0),
            "criterioJulgamentoId": to_int(row.get("criterio_julgamento_id"), 1),
            "itemCategoriaId": to_int(row.get("item_categoria_id"), 3),
        }
        item_obj["valorTotal"] = valor_total_item_edital(item_obj)
        if to_str(row.get("patrimonio")):
            item_obj["patrimonio"] = to_str(row.get("patrimonio"))
        if to_str(row.get("codigo_registro_imobiliario")):
            item_obj["codigoRegistroImobiliario"] = to_str(row.get("codigo_registro_imobiliario"))
        itens_por_edital.setdefault(cod, []).append(item_obj)

    pubs_por_edital: Dict[str, List[Dict[str, Any]]] = {}
    for row in linhas_pub:
        cod = to_str(row.get("codigo_edital"))
        veic = to_int(row.get("veiculo_publicacao"), default=None)
        if not cod or veic is None or _eh_linha_exemplo(cod):
            continue
        pub_obj: Dict[str, Any] = {
            "veiculoPublicacao": veic,
            "dataPublicacao": to_date_str(row.get("data_publicacao")),
        }
        if veic == 5 and to_str(row.get("id_contratacao_pncp")):
            pub_obj["idContratacaoPNCP"] = re.sub(r"\D", "", to_str(row.get("id_contratacao_pncp")))
        if veic == 10 and to_str(row.get("veiculo_publicacao_nome")):
            pub_obj["veiculoPublicacaoNome"] = to_str(row.get("veiculo_publicacao_nome"))
        pubs_por_edital.setdefault(cod, []).append(pub_obj)

    editais_parsed: List[Dict[str, Any]] = []
    for row in linhas_ed:
        cod = to_str(row.get("codigo_edital"))
        modalidade_id = to_int(row.get("modalidade_id"), default=6)  # Padrão: 6 (Pregão Eletrônico) se não informado
        tipo_inst_id = to_int(row.get("tipo_instrumento_id"), default=1)  # Padrão: 1 (Edital) se não informado
        if not cod or _eh_linha_exemplo(cod, to_str(row.get("objeto_compra"))):
            continue

        sem_pncp = to_bool(row.get("sem_pncp"), len(re.sub(r"\D", "", cod)) != 25)
        cod_limpo = cod if sem_pncp else re.sub(r"\D", "", cod)
        houve_pub = to_bool(row.get("houve_publicacao"), True)
        pubs = pubs_por_edital.get(cod) or pubs_por_edital.get(cod_limpo) or []

        doc: Dict[str, Any] = {
            "descritor": {
                "municipio": to_int(row.get("municipio"), 7071),
                "entidade": to_int(row.get("entidade"), 11310),
                "codigoEdital": cod_limpo,
                "dataDocumento": to_date_str(row.get("data_documento"), date.today().isoformat()),
                "retificacao": to_bool(row.get("retificacao"), False),
            },
            "publicidade": {
                "houvePublicacao": houve_pub,
                **({"publicacoes": pubs} if houve_pub and pubs else {}),
            },
            "tipoInstrumentoConvocatorioId": tipo_inst_id,
            "modalidadeId": modalidade_id,
            "modoDisputaId": to_int(row.get("modo_disputa_id"), 1),
            "numeroCompra": to_str(row.get("numero_compra")),
            "anoCompra": to_int(row.get("ano_compra"), date.today().year),
            "numeroProcesso": to_str(row.get("numero_processo")),
            "objetoCompra": to_str(row.get("objeto_compra")),
            "srp": to_bool(row.get("srp"), False),
            "amparoLegalId": to_int(row.get("amparo_legal_id"), 1),
            "itensCompra": itens_por_edital.get(cod) or itens_por_edital.get(cod_limpo) or [],
        }

        for col_key, doc_key, fn in [
            ("data_abertura_proposta", "dataAberturaProposta", to_datetime_str),
            ("data_encerramento_proposta", "dataEncerramentoProposta", to_datetime_str),
            ("codigo_unidade_compradora", "codigoUnidadeCompradora", to_str),
            ("link_sistema_origem", "linkSistemaOrigem", to_str),
            ("justificativa_presencial", "justificativaPresencial", to_str),
            ("informacao_complementar", "informacaoComplementar", to_str),
        ]:
            val = fn(row.get(col_key))
            if val:
                doc[doc_key] = val

        doc = normalizar_categorias_edital(doc)

        editais_parsed.append({
            "linha": row.get("_row_number", 0),
            "codigo_edital": cod_limpo,
            "sem_pncp": sem_pncp,
            "numero_compra": doc["numeroCompra"],
            "ano_compra": doc["anoCompra"],
            "numero_processo": doc["numeroProcesso"],
            "objeto_compra": doc["objetoCompra"],
            "modalidade_id": doc["modalidadeId"],
            "qtd_itens": len(doc["itensCompra"]),
            "qtd_publicacoes": len(pubs),
            "exige_pdf": doc["modalidadeId"] != 9,
            "documento": doc,
        })

    return editais_parsed


def parsear_planilha_licitacoes(file_bytes: bytes) -> List[Dict[str, Any]]:
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
    linhas_lic = ler_linhas_aba(wb, ["Licitacoes", "Licitacao"])
    linhas_it = ler_linhas_aba(wb, ["Itens", "ItensLicitacao"])
    linhas_prop = ler_linhas_aba(wb, ["Licitantes", "Propostas"])

    licitantes_map: Dict[Tuple[str, int], List[Dict[str, Any]]] = {}
    for row in linhas_prop:
        cod = to_str(row.get("codigo_edital"))
        num_item = to_int(row.get("numero_item"), default=None)
        ni_raw = to_str(row.get("ni_pessoa"))
        if not cod or num_item is None or not ni_raw or _eh_linha_exemplo(cod, to_str(row.get("nome_razao_social"))):
            continue
        tp = to_code_prefix(row.get("tipo_pessoa_id"), "PJ").upper()
        ni = normalizar_ni_pessoa(tp, ni_raw)
        res_hab = to_int(row.get("resultado_habilitacao"), 1)
        prop_obj: Dict[str, Any] = {
            "tipoPessoaId": tp,
            "niPessoa": ni,
            "declaracaoMEouEPP": to_int(row.get("declaracao_me_epp"), 2),
            "resultadoHabilitacao": res_hab,
        }
        if tp == "PE" and to_str(row.get("nome_razao_social")):
            prop_obj["nomeRazaoSocial"] = to_str(row.get("nome_razao_social"))
        if res_hab in (1, 2):
            prop_obj["valor"] = to_float(row.get("valor_proposta"), 0.0)
        licitantes_map.setdefault((cod, num_item), []).append(prop_obj)

    itens_por_lic: Dict[str, List[Dict[str, Any]]] = {}
    for row in linhas_it:
        cod = to_str(row.get("codigo_edital"))
        num_item = to_int(row.get("numero_item"), default=None)
        sit_id = to_int(row.get("situacao_compra_item_id"), default=None)
        if not cod or num_item is None or sit_id is None or _eh_linha_exemplo(cod):
            continue
        tp_orc = to_int(row.get("tipo_orcamento"), 2)
        tp_val = to_code_prefix(row.get("tipo_valor"), "M").upper()[:1]
        it_obj: Dict[str, Any] = {
            "numeroItem": num_item,
            "tipoOrcamento": tp_orc,
            "situacaoCompraItemId": sit_id,
            "dataSituacaoItem": to_date_str(row.get("data_situacao_item"), date.today().isoformat()),
            "tipoValor": tp_val if tp_val in ("M", "P") else "M",
            "tipoProposta": to_int(row.get("tipo_proposta"), 2),
            "licitantes": licitantes_map.get((cod, num_item), []),
        }
        if tp_orc != 0:
            it_obj["valor"] = to_float(row.get("valor_orcamento"), 0.0)
            it_obj["dataOrcamento"] = to_date_str(row.get("data_orcamento"), it_obj["dataSituacaoItem"])
        itens_por_lic.setdefault(cod, []).append(it_obj)

    parsed: List[Dict[str, Any]] = []
    for row in linhas_lic:
        cod = to_str(row.get("codigo_edital"))
        tipo_nat = to_int(row.get("tipo_natureza"), default=None)
        if not cod or tipo_nat is None or _eh_linha_exemplo(cod, to_str(row.get("objeto_edital"))):
            continue

        exig_garantia = to_int(row.get("exigencia_garantia_licitantes"), 2)
        exig_visita = to_int(row.get("exigencia_visita_tecnica"), default=None)
        exig_amostra = to_int(row.get("exigencia_amostra"), default=None)
        viabilidade = to_int(row.get("viabilidade_contratacao"), default=None)
        audiencia = to_int(row.get("audiencia_publica"), default=None)
        exig_indices = to_int(row.get("exigencia_indices_economicos"), default=None)
        conduzida = to_bool(row.get("contratacao_conduzida"), True)
        fontes = split_int_list(row.get("fontes_recurso"))
        cpfs = [re.sub(r"\D", "", c) for c in split_str_list(row.get("cpfs_condutores")) if len(re.sub(r"\D", "", c)) == 11]

        doc: Dict[str, Any] = {
            "descritor": {
                "municipio": to_int(row.get("municipio"), 7071),
                "entidade": to_int(row.get("entidade"), 11310),
                "codigoEdital": cod,
                "retificacao": to_bool(row.get("retificacao"), False),
            },
            "recursoBID": to_int(row.get("recurso_bid"), 2),
            "tipoNatureza": tipo_nat,
            **({"viabilidadeContratacao": viabilidade} if viabilidade is not None else {}),
            "interposicaoRecurso": to_int(row.get("interposicao_recurso"), 2),
            **({"audienciaPublica": audiencia} if audiencia is not None else {}),
            "exigenciaGarantiaLicitantes": exig_garantia,
            **({"percentualValor": to_int(row.get("percentual_valor"), 1)} if exig_garantia == 1 else {}),
            **({"exigenciaAmostra": exig_amostra} if exig_amostra is not None else {}),
            "quitacaoTributosFederais": to_bool(row.get("quitacao_tributos_federais"), True),
            "quitacaoTributosEstaduais": to_bool(row.get("quitacao_tributos_estaduais"), True),
            "quitacaoTributosMunicipais": to_bool(row.get("quitacao_tributos_municipais"), True),
            **({"exigenciaVisitaTecnica": exig_visita} if exig_visita is not None else {}),
            **({
                "exigenciaCurriculo": to_bool(row.get("exigencia_curriculo"), False),
                "exigenciaVistoCREA": to_bool(row.get("exigencia_visto_crea"), False),
            } if exig_visita == 1 else {}),
            "declaracaoRecursosContratacao": to_bool(row.get("declaracao_recursos_contratacao"), True),
            **({"fonteRecursosContratacao": fontes} if fontes else {}),
            "contratacaoConduzida": conduzida,
            **({"cpfsCondutores": [{"cpfCondutor": c} for c in cpfs]} if conduzida and cpfs else {}),
            **({"exigenciaIndicesEconomicos": exig_indices} if exig_indices is not None else {}),
            "itens": itens_por_lic.get(cod, []),
        }

        parsed.append({
            "linha": row.get("_row_number", 0),
            "codigo_edital": cod,
            "numero_compra": to_str(row.get("numero_compra")),
            "ano_compra": to_int(row.get("ano_compra"), date.today().year),
            "numero_processo": to_str(row.get("numero_processo")),
            "objeto_edital": to_str(row.get("objeto_edital")),
            "documento": doc,
        })

    return parsed


def parsear_planilha_atas(file_bytes: bytes) -> List[Dict[str, Any]]:
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
    linhas = ler_linhas_aba(wb, ["Atas", "Ata"])
    parsed: List[Dict[str, Any]] = []
    for row in linhas:
        cod_ata = to_str(row.get("codigo_ata"))
        cod_ed = to_str(row.get("codigo_edital"))
        if not cod_ata or not cod_ed or _eh_linha_exemplo(cod_ata) or _eh_linha_exemplo(cod_ed):
            continue
        num_ata = to_str(row.get("numero_ata_registro_preco")) or cod_ata
        ano_ata = to_int(row.get("ano_ata"), date.today().year)
        doc = {
            "descritor": {
                "municipio": to_int(row.get("municipio"), 7071),
                "entidade": to_int(row.get("entidade"), 11310),
                "codigoEdital": cod_ed,
                "codigoAta": cod_ata,
                "anoCompra": to_int(row.get("ano_compra"), ano_ata),
                "retificacao": to_bool(row.get("retificacao"), False),
            },
            "numeroItem": split_int_list(row.get("itens")),
            "numeroAtaRegistroPreco": num_ata,
            "anoAta": ano_ata,
            "dataAssinatura": to_date_str(row.get("data_assinatura")),
            "dataVigenciaInicio": to_date_str(row.get("data_vigencia_inicio")),
            "dataVigenciaFim": to_date_str(row.get("data_vigencia_fim")),
        }
        parsed.append({
            "linha": row.get("_row_number", 0),
            "codigo_documento": cod_ata,
            "codigo_edital": cod_ed,
            "documento": doc,
        })
    return parsed


def parsear_planilha_ajustes(file_bytes: bytes) -> List[Dict[str, Any]]:
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
    linhas = ler_linhas_aba(wb, ["Ajustes", "Contratos", "Ajuste"])
    parsed: List[Dict[str, Any]] = []
    for row in linhas:
        cod_cont = to_str(row.get("codigo_contrato"))
        cod_ed = to_str(row.get("codigo_edital"))
        tipo_contrato_id = to_int(row.get("tipo_contrato_id"), default=None)
        if not cod_cont or not cod_ed or tipo_contrato_id is None or _eh_linha_exemplo(cod_cont, to_str(row.get("objeto_contrato"))):
            continue

        num_cont = to_str(row.get("numero_contrato_empenho")) or cod_cont
        ano_cont = to_int(row.get("ano_contrato"), date.today().year)
        adesao = to_bool(row.get("adesao_participacao"), False)
        ger_jurisd = to_bool(row.get("gerenciadora_jurisdicionada"), False)
        cod_ata = to_str(row.get("codigo_ata"))

        descritor: Dict[str, Any] = {
            "municipio": to_int(row.get("municipio"), 7071),
            "entidade": to_int(row.get("entidade"), 11310),
            "adesaoParticipacao": adesao,
            "codigoEdital": re.sub(r"\D", "", cod_ed) if adesao else cod_ed,
            "codigoContrato": cod_cont,
            "retificacao": to_bool(row.get("retificacao"), False),
        }
        if adesao:
            descritor["gerenciadoraJurisdicionada"] = ger_jurisd
            if ger_jurisd:
                mun_ger = to_int(row.get("municipio_gerenciador"), default=None)
                ent_ger = to_int(row.get("entidade_gerenciadora"), default=None)
                if mun_ger:
                    descritor["municipioGerenciador"] = mun_ger
                if ent_ger:
                    descritor["entidadeGerenciadora"] = ent_ger
            else:
                cnpj_ger = normalizar_ni_pessoa("PJ", to_str(row.get("cnpj_gerenciadora")))
                if cnpj_ger:
                    descritor["cnpjGerenciadora"] = cnpj_ger
        if cod_ata:
            descritor["codigoAta"] = re.sub(r"\D", "", cod_ata) if adesao else cod_ata

        tp_forn = to_code_prefix(row.get("tipo_pessoa_fornecedor"), "PJ").upper()
        ni_raw = to_str(row.get("ni_fornecedor"))
        ni_forn = normalizar_ni_pessoa(tp_forn, ni_raw)

        fontes = split_int_list(row.get("fontes_recurso"))
        despesas = split_str_list(row.get("despesas"))
        val_ini = to_float(row.get("valor_inicial"), 0.0)
        val_glob = to_float(row.get("valor_global"), val_ini)
        num_parc = to_int(row.get("numero_parcelas"), 1) or 1
        val_parc = to_float(row.get("valor_parcela"), round(val_ini / max(num_parc, 1), 4))

        doc: Dict[str, Any] = {
            "descritor": descritor,
            **({"fonteRecursosContratacao": fontes} if fontes else {}),
            "itens": split_int_list(row.get("itens")),
            "tipoContratoId": tipo_contrato_id,
            "numeroContratoEmpenho": num_cont,
            "anoContrato": ano_cont,
            "processo": to_str(row.get("processo")),
            "categoriaProcessoId": to_int(row.get("categoria_processo_id"), 2),
            "receita": to_bool(row.get("receita"), False),
            **({"despesas": despesas} if despesas else {}),
            **({"codigoUnidade": to_str(row.get("codigo_unidade"))} if to_str(row.get("codigo_unidade")) else {}),
            "niFornecedor": ni_forn,
            "tipoPessoaFornecedor": tp_forn,
            "nomeRazaoSocialFornecedor": to_str(row.get("nome_razao_social_fornecedor")),
            "objetoContrato": to_str(row.get("objeto_contrato")),
            "valorInicial": val_ini,
            "valorGlobal": val_glob,
            "numeroParcelas": num_parc,
            "valorParcela": val_parc,
            "dataAssinatura": to_date_str(row.get("data_assinatura")),
            "tipoObjetoContrato": to_int(row.get("tipo_objeto_contrato"), 1),
        }
        if to_str(row.get("valor_acumulado")) != "":
            doc["valorAcumulado"] = to_float(row.get("valor_acumulado"))
        if to_str(row.get("informacao_complementar")):
            doc["informacaoComplementar"] = to_str(row.get("informacao_complementar"))
        if to_date_str(row.get("data_vigencia_inicio")):
            doc["dataVigenciaInicio"] = to_date_str(row.get("data_vigencia_inicio"))
        if to_date_str(row.get("data_vigencia_fim")):
            doc["dataVigenciaFim"] = to_date_str(row.get("data_vigencia_fim"))
        if to_int(row.get("vigencia_meses"), default=None):
            doc["vigenciaMeses"] = to_int(row.get("vigencia_meses"))

        parsed.append({
            "linha": row.get("_row_number", 0),
            "codigo_documento": cod_cont,
            "codigo_edital": cod_ed,
            "codigo_ata": cod_ata,
            "documento": doc,
        })
    return parsed

