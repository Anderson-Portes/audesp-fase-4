"""
Geração de planilhas Excel (.xlsx) de modelo e exportação de dados para:
- Editais
- Licitações
- Atas de Registro de Preços
- Ajustes e Contratos
"""
import json
from typing import Any, List, Optional

import openpyxl
from sqlmodel import Session, select

from modules.ajustes.Ajuste import AjusteContrato
from modules.ajustes.AjusteDomains import (
    DOMINIO_CATEGORIA_PROCESSO,
    DOMINIO_TIPO_CONTRATO,
    DOMINIO_TIPO_OBJETO_CONTRATO,
)
from modules.atas.Ata import AtaRegistroPreco
from modules.editais.Edital import Edital
from modules.editais.EditalDomains import (
    DOMINIO_CRITERIO_JULGAMENTO,
    DOMINIO_INSTRUMENTOS,
    DOMINIO_ITEM_CATEGORIA,
    DOMINIO_MODALIDADES,
    DOMINIO_MODO_DISPUTA,
    DOMINIO_TIPO_BENEFICIO,
    DOMINIO_VEICULOS_PUBLICACAO,
)
from modules.importacao_exportacao.excel_utils import (
    criar_aba_dominios,
    estilizar_aba,
    label_id,
    preencher_linhas_aba,
    salvar_workbook_bytes,
)
from modules.importacao_exportacao.ImportacaoExportacaoSchemas import (
    COLUNAS_AJUSTES,
    COLUNAS_ATAS,
    COLUNAS_EDITAIS,
    COLUNAS_EDITAIS_ITENS,
    COLUNAS_EDITAIS_PUBLICACOES,
    COLUNAS_LICITACOES,
    COLUNAS_LICITACOES_ITENS,
    COLUNAS_LICITACOES_LICITANTES,
    EXEMPLO_AJUSTE,
    EXEMPLO_ATA,
    EXEMPLO_EDITAL,
    EXEMPLO_EDITAL_ITEM,
    EXEMPLO_EDITAL_PUB,
    EXEMPLO_LICITACAO,
    EXEMPLO_LICITACAO_ITEM,
    EXEMPLO_LICITACAO_LICITANTE,
    construir_listas_dominios,
)
from modules.licitacoes.Licitacao import Licitacao
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


def _carregar_json_seguro(raw: Optional[str]) -> dict:
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except Exception:
        return {}


def gerar_planilha_edital(session: Optional[Session] = None, exportar_dados: bool = False) -> bytes:
    wb = openpyxl.Workbook()
    ws_ed = wb.active
    ws_ed.title = "Editais"
    ws_it = wb.create_sheet("Itens")
    ws_pub = wb.create_sheet("Publicacoes")
    formulas = criar_aba_dominios(wb, construir_listas_dominios())

    if not exportar_dados:
        estilizar_aba(ws_ed, COLUNAS_EDITAIS, formulas, linha_exemplo=EXEMPLO_EDITAL, qtd_linhas_vazias=50)
        estilizar_aba(ws_it, COLUNAS_EDITAIS_ITENS, formulas, linha_exemplo=EXEMPLO_EDITAL_ITEM, qtd_linhas_vazias=150)
        estilizar_aba(ws_pub, COLUNAS_EDITAIS_PUBLICACOES, formulas, linha_exemplo=EXEMPLO_EDITAL_PUB, qtd_linhas_vazias=100)
        return salvar_workbook_bytes(wb)

    estilizar_aba(ws_ed, COLUNAS_EDITAIS, formulas, qtd_linhas_vazias=30)
    estilizar_aba(ws_it, COLUNAS_EDITAIS_ITENS, formulas, qtd_linhas_vazias=100)
    estilizar_aba(ws_pub, COLUNAS_EDITAIS_PUBLICACOES, formulas, qtd_linhas_vazias=50)

    editais = session.exec(select(Edital).order_by(Edital.id)).all() if session else []
    linhas_ed: List[List[Any]] = []
    linhas_it: List[List[Any]] = []
    linhas_pub: List[List[Any]] = []

    for ed in editais:
        doc = _carregar_json_seguro(ed.documento_json)
        desc = doc.get("descritor") or {}
        pub = doc.get("publicidade") or {}

        linhas_ed.append([
            ed.codigo_edital,
            "SIM" if ed.sem_pncp else "NAO",
            ed.municipio,
            ed.entidade,
            desc.get("dataDocumento") or "",
            "SIM" if ed.retificacao else "NAO",
            label_id(DOMINIO_INSTRUMENTOS, doc.get("tipoInstrumentoConvocatorioId") or ed.tipo_instrumento_id or 1),
            label_id(DOMINIO_MODALIDADES, doc.get("modalidadeId") or ed.modalidade_id or 6),
            label_id(DOMINIO_MODO_DISPUTA, doc.get("modoDisputaId") or ed.modo_disputa_id or 1),
            doc.get("numeroCompra") or ed.numero_compra or "",
            doc.get("anoCompra") or ed.ano_compra or 2026,
            doc.get("numeroProcesso") or ed.numero_processo or "",
            doc.get("objetoCompra") or ed.objeto_compra or "",
            "SIM" if doc.get("srp") else "NAO",
            doc.get("amparoLegalId") or 1,
            doc.get("dataAberturaProposta") or "",
            doc.get("dataEncerramentoProposta") or "",
            doc.get("codigoUnidadeCompradora") or "",
            doc.get("linkSistemaOrigem") or "",
            doc.get("justificativaPresencial") or "",
            doc.get("informacaoComplementar") or "",
            "SIM" if pub.get("houvePublicacao", True) else "NAO",
        ])

        for it in doc.get("itensCompra") or []:
            linhas_it.append([
                ed.codigo_edital,
                it.get("numeroItem"),
                "M - Material" if it.get("materialOuServico", "M") == "M" else "S - Serviço",
                label_id(DOMINIO_TIPO_BENEFICIO, it.get("tipoBeneficioId", 4)),
                "SIM" if it.get("incentivoProdutivoBasico") else "NAO",
                it.get("descricao", ""),
                it.get("quantidade", 1),
                it.get("unidadeMedida", "UN"),
                "SIM" if it.get("orcamentoSigiloso") else "NAO",
                it.get("valorUnitarioEstimado", 0),
                it.get("valorTotal", 0),
                label_id(DOMINIO_CRITERIO_JULGAMENTO, it.get("criterioJulgamentoId", 1)),
                label_id(DOMINIO_ITEM_CATEGORIA, it.get("itemCategoriaId", 3)),
                it.get("patrimonio", ""),
                it.get("codigoRegistroImobiliario", ""),
            ])

        for p in pub.get("publicacoes") or []:
            linhas_pub.append([
                ed.codigo_edital,
                label_id(DOMINIO_VEICULOS_PUBLICACAO, p.get("veiculoPublicacao", 1)),
                p.get("dataPublicacao", ""),
                p.get("idContratacaoPNCP", ""),
                p.get("veiculoPublicacaoNome", ""),
            ])

    preencher_linhas_aba(ws_ed, linhas_ed)
    preencher_linhas_aba(ws_it, linhas_it)
    preencher_linhas_aba(ws_pub, linhas_pub)
    return salvar_workbook_bytes(wb)


def gerar_planilha_licitacao(session: Optional[Session] = None, exportar_dados: bool = False) -> bytes:
    wb = openpyxl.Workbook()
    ws_lic = wb.active
    ws_lic.title = "Licitacoes"
    ws_it = wb.create_sheet("Itens")
    ws_prop = wb.create_sheet("Licitantes")
    formulas = criar_aba_dominios(wb, construir_listas_dominios())

    if not exportar_dados:
        estilizar_aba(ws_lic, COLUNAS_LICITACOES, formulas, linha_exemplo=EXEMPLO_LICITACAO, qtd_linhas_vazias=50)
        estilizar_aba(ws_it, COLUNAS_LICITACOES_ITENS, formulas, linha_exemplo=EXEMPLO_LICITACAO_ITEM, qtd_linhas_vazias=150)
        estilizar_aba(ws_prop, COLUNAS_LICITACOES_LICITANTES, formulas, linha_exemplo=EXEMPLO_LICITACAO_LICITANTE, qtd_linhas_vazias=150)
        return salvar_workbook_bytes(wb)

    estilizar_aba(ws_lic, COLUNAS_LICITACOES, formulas, qtd_linhas_vazias=30)
    estilizar_aba(ws_it, COLUNAS_LICITACOES_ITENS, formulas, qtd_linhas_vazias=100)
    estilizar_aba(ws_prop, COLUNAS_LICITACOES_LICITANTES, formulas, qtd_linhas_vazias=100)

    licitacoes = session.exec(select(Licitacao).order_by(Licitacao.id)).all() if session else []
    linhas_lic: List[List[Any]] = []
    linhas_it: List[List[Any]] = []
    linhas_prop: List[List[Any]] = []

    for lic in licitacoes:
        doc = _carregar_json_seguro(lic.documento_json)
        fontes = ",".join(str(x) for x in (doc.get("fonteRecursosContratacao") or []))
        cpfs = ",".join(str(c.get("cpfCondutor", "")) for c in (doc.get("cpfsCondutores") or []) if isinstance(c, dict))

        linhas_lic.append([
            lic.codigo_edital,
            lic.municipio,
            lic.entidade,
            "SIM" if lic.retificacao else "NAO",
            lic.numero_compra or "",
            lic.ano_compra or 2026,
            lic.numero_processo or "",
            lic.objeto_edital or "",
            label_id(DOMINIO_TRI_STATE, doc.get("recursoBID", 2)),
            label_id(DOMINIO_TIPO_NATUREZA, doc.get("tipoNatureza", 1)),
            label_id(DOMINIO_TRI_STATE, doc.get("viabilidadeContratacao", 1)),
            label_id(DOMINIO_TRI_STATE, doc.get("interposicaoRecurso", 2)),
            label_id(DOMINIO_TRI_STATE, doc.get("audienciaPublica", 2)),
            label_id(DOMINIO_TRI_STATE, doc.get("exigenciaGarantiaLicitantes", 2)),
            doc.get("percentualValor", 1),
            label_id(DOMINIO_EXIGENCIA_AMOSTRA, doc.get("exigenciaAmostra", 3)),
            "SIM" if doc.get("quitacaoTributosFederais", True) else "NAO",
            "SIM" if doc.get("quitacaoTributosEstaduais", True) else "NAO",
            "SIM" if doc.get("quitacaoTributosMunicipais", True) else "NAO",
            label_id(DOMINIO_EXIGENCIA_VISITA, doc.get("exigenciaVisitaTecnica", 2)),
            "SIM" if doc.get("exigenciaCurriculo") else "NAO",
            "SIM" if doc.get("exigenciaVistoCREA") else "NAO",
            "SIM" if doc.get("declaracaoRecursosContratacao", True) else "NAO",
            fontes,
            "SIM" if doc.get("contratacaoConduzida", True) else "NAO",
            cpfs,
            label_id(DOMINIO_TRI_STATE, doc.get("exigenciaIndicesEconomicos", 2)),
        ])

        for it in doc.get("itens") or []:
            num_item = it.get("numeroItem")
            linhas_it.append([
                lic.codigo_edital,
                num_item,
                label_id(DOMINIO_TIPO_ORCAMENTO, it.get("tipoOrcamento", 2)),
                it.get("valor", ""),
                it.get("dataOrcamento", ""),
                label_id(DOMINIO_SITUACAO_COMPRA_ITEM, it.get("situacaoCompraItemId", 2)),
                it.get("dataSituacaoItem", ""),
                "M - Monetário" if it.get("tipoValor", "M") == "M" else "P - Percentual",
                label_id(DOMINIO_TIPO_PROPOSTA, it.get("tipoProposta", 2)),
            ])

            for prop in it.get("licitantes") or []:
                linhas_prop.append([
                    lic.codigo_edital,
                    num_item,
                    prop.get("tipoPessoaId", "PJ"),
                    prop.get("niPessoa", ""),
                    prop.get("nomeRazaoSocial", ""),
                    label_id(DOMINIO_DECLARACAO_ME_EPP, prop.get("declaracaoMEouEPP", 2)),
                    label_id(DOMINIO_RESULTADO_HABILITACAO, prop.get("resultadoHabilitacao", 1)),
                    prop.get("valor", ""),
                ])

    preencher_linhas_aba(ws_lic, linhas_lic)
    preencher_linhas_aba(ws_it, linhas_it)
    preencher_linhas_aba(ws_prop, linhas_prop)
    return salvar_workbook_bytes(wb)


def gerar_planilha_ata(session: Optional[Session] = None, exportar_dados: bool = False) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Atas"
    formulas = criar_aba_dominios(wb, construir_listas_dominios())

    if not exportar_dados:
        estilizar_aba(ws, COLUNAS_ATAS, formulas, linha_exemplo=EXEMPLO_ATA, qtd_linhas_vazias=50)
        return salvar_workbook_bytes(wb)

    estilizar_aba(ws, COLUNAS_ATAS, formulas, qtd_linhas_vazias=30)
    atas = session.exec(select(AtaRegistroPreco).order_by(AtaRegistroPreco.id)).all() if session else []
    linhas_ata: List[List[Any]] = []

    for ata in atas:
        doc = _carregar_json_seguro(ata.documento_json)
        itens_str = ", ".join(str(i) for i in (doc.get("numeroItem") or []))
        linhas_ata.append([
            ata.codigo_ata,
            ata.codigo_edital,
            ata.municipio,
            ata.entidade,
            ata.ano_compra,
            "SIM" if ata.retificacao else "NAO",
            ata.numero_ata_registro_preco,
            ata.ano_ata,
            str(ata.data_assinatura or ""),
            str(ata.data_vigencia_inicio or ""),
            str(ata.data_vigencia_fim or ""),
            itens_str,
        ])

    preencher_linhas_aba(ws, linhas_ata)
    return salvar_workbook_bytes(wb)


def gerar_planilha_ajuste(session: Optional[Session] = None, exportar_dados: bool = False) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Ajustes"
    formulas = criar_aba_dominios(wb, construir_listas_dominios())

    if not exportar_dados:
        estilizar_aba(ws, COLUNAS_AJUSTES, formulas, linha_exemplo=EXEMPLO_AJUSTE, qtd_linhas_vazias=50)
        return salvar_workbook_bytes(wb)

    estilizar_aba(ws, COLUNAS_AJUSTES, formulas, qtd_linhas_vazias=30)
    ajustes = session.exec(select(AjusteContrato).order_by(AjusteContrato.id)).all() if session else []
    linhas_aj: List[List[Any]] = []

    for aj in ajustes:
        doc = _carregar_json_seguro(aj.documento_json)
        desc = doc.get("descritor") or {}
        fontes = ", ".join(str(x) for x in (doc.get("fonteRecursosContratacao") or []))
        despesas = ", ".join(str(x) for x in (doc.get("despesas") or []))
        itens_str = ", ".join(str(x) for x in (doc.get("itens") or []))

        linhas_aj.append([
            aj.codigo_contrato,
            aj.codigo_edital,
            aj.codigo_ata or "",
            aj.municipio,
            aj.entidade,
            "SIM" if desc.get("adesaoParticipacao") else "NAO",
            "SIM" if desc.get("gerenciadoraJurisdicionada") else "NAO",
            desc.get("cnpjGerenciadora") or "",
            desc.get("municipioGerenciador") or "",
            desc.get("entidadeGerenciadora") or "",
            "SIM" if aj.retificacao else "NAO",
            label_id(DOMINIO_TIPO_CONTRATO, aj.tipo_contrato_id),
            aj.numero_contrato_empenho,
            aj.ano_contrato,
            aj.processo,
            label_id(DOMINIO_CATEGORIA_PROCESSO, aj.categoria_processo_id),
            label_id(DOMINIO_TIPO_OBJETO_CONTRATO, aj.tipo_objeto_contrato),
            "SIM" if aj.receita else "NAO",
            fontes,
            despesas,
            doc.get("codigoUnidade") or "",
            aj.tipo_pessoa_fornecedor,
            aj.ni_fornecedor,
            aj.nome_razao_social_fornecedor,
            doc.get("objetoContrato") or "",
            doc.get("informacaoComplementar") or "",
            aj.valor_inicial,
            aj.valor_global,
            doc.get("valorAcumulado") if doc.get("valorAcumulado") is not None else "",
            doc.get("numeroParcelas") or 1,
            doc.get("valorParcela") or aj.valor_inicial,
            str(aj.data_assinatura or ""),
            str(aj.data_vigencia_inicio or ""),
            str(aj.data_vigencia_fim or ""),
            doc.get("vigenciaMeses") or "",
            itens_str,
        ])

    preencher_linhas_aba(ws, linhas_aj)
    return salvar_workbook_bytes(wb)

