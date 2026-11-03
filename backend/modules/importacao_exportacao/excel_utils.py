"""
Utilitários de formatação, estilização de abas, selects (DataValidation) e conversores de tipos
para geração e leitura de planilhas Excel (.xlsx) do módulo de Importação e Exportação.
"""
import io
import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

import openpyxl
from fastapi import HTTPException
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

HEADER_FILL = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
HEADER_FONT = Font(color="FFFFFF", bold=True, size=10)
SUBHEADER_FILL = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
SUBHEADER_FONT = Font(color="1F4E78", bold=True, size=9)
THIN_BORDER = Border(
    left=Side(style="thin", color="D9D9D9"),
    right=Side(style="thin", color="D9D9D9"),
    top=Side(style="thin", color="D9D9D9"),
    bottom=Side(style="thin", color="D9D9D9"),
)


def fmt_dominio_dict(d: Dict[Any, str]) -> List[str]:
    """Formata um dicionário de domínio como ['1 - Descrição', ...] sem duplicar prefixo numérico."""
    opcoes: List[str] = []
    for k, v in d.items():
        v_str = str(v).strip()
        if re.match(rf"^{re.escape(str(k))}\s*[-–]", v_str):
            opcoes.append(v_str.replace("–", "-"))
        else:
            opcoes.append(f"{k} - {v_str}")
    return opcoes


def label_id(d: Dict[Any, str], key: Any, default_prefix: Any = "") -> str:
    """Retorna a string 'ID - Descrição' correspondente a um ID de domínio."""
    if key is None or key == "":
        return str(default_prefix)
    desc = d.get(key)
    if not desc:
        return str(key)
    s = str(desc).strip()
    if re.match(rf"^{re.escape(str(key))}\s*[-–]", s):
        return s.replace("–", "-")
    return f"{key} - {s}"


def criar_aba_dominios(wb: openpyxl.Workbook, listas: Dict[str, List[str]]) -> Dict[str, str]:
    """
    Cria uma aba oculta '_Dominios' com as listas de opções para os selects (DataValidation)
    e retorna um mapa {nome_lista: "'_Dominios'!$A$2:$A$10"}.
    """
    ws_dom = wb.create_sheet("_Dominios")
    ws_dom.sheet_state = "hidden"
    formulas: Dict[str, str] = {}

    for col_idx, (nome_lista, valores) in enumerate(listas.items(), start=1):
        col_letter = get_column_letter(col_idx)
        ws_dom.cell(row=1, column=col_idx, value=nome_lista)
        valores_limpos = valores if valores else [""]
        for row_idx, val in enumerate(valores_limpos, start=2):
            ws_dom.cell(row=row_idx, column=col_idx, value=str(val))
        end_row = len(valores_limpos) + 1
        formulas[nome_lista] = f"'_Dominios'!${col_letter}$2:${col_letter}${end_row}"

    return formulas


def estilizar_aba(
    ws,
    colunas: List[Tuple[str, str, int, Optional[str]]],
    formulas_dominios: Dict[str, str],
    linha_exemplo: Optional[List[Any]] = None,
    qtd_linhas_vazias: int = 50,
) -> None:
    """
    Configura cabeçalhos (linha 1 = chave técnica, linha 2 = instrução amigável),
    adiciona a linha de exemplo (se fornecida), pré-formata `qtd_linhas_vazias` linhas em branco
    para preenchimento em lote e aplica DataValidation (dropdown select) nas colunas com domínio.
    """
    ws.append([c[0] for c in colunas])
    ws.append([c[1] for c in colunas])

    max_row = 2 + (1 if linha_exemplo else 0) + qtd_linhas_vazias

    for col_idx, (_, _, largura, nome_dominio) in enumerate(colunas, start=1):
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = max(largura, 16)

        cell_key = ws.cell(row=1, column=col_idx)
        cell_key.fill = HEADER_FILL
        cell_key.font = HEADER_FONT
        cell_key.alignment = Alignment(horizontal="center", vertical="center")

        cell_desc = ws.cell(row=2, column=col_idx)
        cell_desc.fill = SUBHEADER_FILL
        cell_desc.font = SUBHEADER_FONT
        cell_desc.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

        if nome_dominio and nome_dominio in formulas_dominios:
            dv = DataValidation(
                type="list",
                formula1=formulas_dominios[nome_dominio],
                allow_blank=True,
                showDropDown=False,  # No openpyxl, False significa MOSTRAR a seta do select no Excel
            )
            dv.promptTitle = "Selecione uma opção"
            dv.prompt = "Escolha um item da lista ou deixe em branco (linhas sem ID não serão enviadas)."
            ws.add_data_validation(dv)
            dv.add(f"{col_letter}3:{col_letter}{max_row}")

    ws.row_dimensions[1].height = 22
    ws.row_dimensions[2].height = 32
    ws.freeze_panes = "A3"

    start_empty_row = 3
    if linha_exemplo:
        ws.append(linha_exemplo)
        for col_idx in range(1, len(colunas) + 1):
            ws.cell(row=3, column=col_idx).border = THIN_BORDER
        start_empty_row = 4

    for r_idx in range(start_empty_row, max_row + 1):
        for col_idx in range(1, len(colunas) + 1):
            ws.cell(row=r_idx, column=col_idx).border = THIN_BORDER


def preencher_linhas_aba(ws, linhas_dados: List[List[Any]], start_row: int = 3) -> None:
    """Preenche uma lista de linhas a partir de `start_row` na aba informada."""
    for offset, valores in enumerate(linhas_dados):
        r_idx = start_row + offset
        for c_idx, val in enumerate(valores, start=1):
            ws.cell(row=r_idx, column=c_idx, value=val)


def salvar_workbook_bytes(wb: openpyxl.Workbook) -> bytes:
    """Serializa o Workbook openpyxl em bytes (.xlsx)."""
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def ler_linhas_aba(wb: openpyxl.Workbook, nomes_possiveis: List[str]) -> List[Dict[str, Any]]:
    """
    Lê uma aba do Workbook onde a linha 1 contém as chaves técnicas.
    Ignora a linha 2 (subcabeçalho descritivo) e ignora linhas totalmente vazias.
    """
    ws = None
    for nome in nomes_possiveis:
        if nome in wb.sheetnames:
            ws = wb[nome]
            break
    if ws is None:
        abas_visiveis = [s for s in wb.sheetnames if not s.startswith("_")]
        if len(abas_visiveis) == 1:
            ws = wb[abas_visiveis[0]]
    if ws is None:
        return []

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []

    headers = [str(h or "").strip() for h in rows[0]]
    resultado: List[Dict[str, Any]] = []

    for row_idx, row in enumerate(rows[1:], start=2):
        if not any(cell is not None and str(cell).strip() != "" for cell in row):
            continue
        row_dict = {headers[i]: row[i] for i in range(min(len(headers), len(row))) if headers[i]}
        if row_idx == 2:
            primeiro_val = str(next(iter(row_dict.values()), "") or "")
            if any(tok in primeiro_val for tok in ("(", "Código", "Obrigatório", "ID ", "*")):
                continue
        row_dict["_row_number"] = row_idx
        resultado.append(row_dict)

    return resultado


def to_str(val: Any, default: str = "") -> str:
    if val is None:
        return default
    if isinstance(val, float) and val.is_integer():
        return str(int(val)).strip()
    return str(val).strip()


def to_code_prefix(val: Any, default: str = "") -> str:
    """Extrai o código de uma opção de select do tipo 'PJ - Pessoa Jurídica' -> 'PJ'."""
    s = to_str(val)
    if not s:
        return default
    m = re.match(r"^([A-Za-z0-9_]+)\s*[-–]", s)
    return m.group(1).strip() if m else s


def to_int(val: Any, default: Optional[int] = 0) -> Optional[int]:
    """Extrai o ID inteiro mesmo quando selecionado via dropdown '6 - Pregão - Eletrônico' -> 6."""
    if val is None or str(val).strip() == "":
        return default
    if isinstance(val, (int, float)) and not isinstance(val, bool):
        return int(val)
    s = str(val).strip()
    m = re.match(r"^(-?\d+)\s*[-–]", s)
    if m:
        return int(m.group(1))
    try:
        return int(float(s))
    except Exception:
        return default


def to_float(val: Any, default: float = 0.0) -> float:
    if val is None or str(val).strip() == "":
        return default
    try:
        s = str(val).strip().replace("R$", "").replace(" ", "")
        if "," in s and "." in s:
            s = s.replace(".", "").replace(",", ".")
        elif "," in s:
            s = s.replace(",", ".")
        return round(float(s), 4)
    except Exception:
        return default


def to_bool(val: Any, default: bool = False) -> bool:
    if val is None or str(val).strip() == "":
        return default
    if isinstance(val, bool):
        return val
    s = to_code_prefix(val).lower()
    return s in ("1", "true", "sim", "s", "yes", "y", "verdadeiro")


def to_date_str(val: Any, default: str = "") -> str:
    if val is None or str(val).strip() == "":
        return default
    if isinstance(val, (datetime, date)):
        return val.strftime("%Y-%m-%d")
    s = str(val).strip()
    if re.match(r"^\d{2}/\d{2}/\d{4}$", s):
        d, m, y = s.split("/")
        return f"{y}-{m}-{d}"
    return s[:10]


def to_datetime_str(val: Any, default: str = "") -> str:
    if val is None or str(val).strip() == "":
        return default
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%dT%H:%M:%S")
    if isinstance(val, date):
        return f"{val.strftime('%Y-%m-%d')}T09:00:00"
    s = str(val).strip().replace(" ", "T")
    if len(s) == 10 and re.match(r"^\d{4}-\d{2}-\d{2}$", s):
        return f"{s}T09:00:00"
    if len(s) == 16:
        return f"{s}:00"
    return s


def split_int_list(val: Any) -> List[int]:
    s = to_str(val)
    if not s:
        return []
    nums: List[int] = []
    for part in re.split(r"[,;|]", s):
        parsed_id = to_int(part.strip(), default=None)
        if parsed_id is not None and parsed_id > 0:
            nums.append(parsed_id)
    return sorted(list(set(nums)))


def split_str_list(val: Any) -> List[str]:
    s = to_str(val)
    if not s:
        return []
    return [p.strip() for p in re.split(r"[,;|]", s) if p.strip()]


def formatar_erro_excecao(exc: Exception) -> List[str]:
    if isinstance(exc, HTTPException):
        detail = exc.detail
        if isinstance(detail, dict):
            erros = detail.get("erros") or []
            msg = detail.get("mensagem") or "Erro de validação"
            return [f"{msg}: {e}" for e in erros] if erros else [str(msg)]
        return [str(detail)]
    return [str(exc)]

