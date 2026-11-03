from typing import Dict, Any, List, Optional, Set
from modules.licitacoes.LicitacaoDomains import validar_itens_contra_licitacao

def validar_regras_negocio_ata(
    dados: Dict[str, Any],
    numeros_itens_licitacao: Optional[Set[int]] = None,
    edital_sem_pncp: bool = False,
    edital_codigo_base: str = ""
) -> List[str]:
    """
    Valida as regras de negócio de envio da Ata de Registro de Preços
    em estrita conformidade com ata_schema.json e regras do TCESP.
    """
    erros = []
    
    descritor = dados.get("descritor", {})
    cod_edital = str(descritor.get("codigoEdital") or "").strip()
    if not cod_edital:
        erros.append("Código do Edital é obrigatório no descritor.")
    codigo_ata = str(descritor.get("codigoAta") or "").strip()
    if not codigo_ata:
        erros.append("Código da Ata é obrigatório no descritor.")
    if not descritor.get("anoCompra"):
        erros.append("Ano da Compra é obrigatório no descritor.")
        
    numero_item = dados.get("numeroItem", [])
    if not numero_item or not isinstance(numero_item, list) or len(numero_item) == 0:
        erros.append("É necessário vincular ao menos 1 item da licitação/edital à ata.")
    else:
        erros.extend(validar_itens_contra_licitacao(numero_item, numeros_itens_licitacao))
        
    if not dados.get("numeroAtaRegistroPreco"):
        erros.append("Número da Ata no sistema de origem é obrigatório.")
    elif len(str(dados.get("numeroAtaRegistroPreco", ""))) > 30:
        erros.append("O campo 'numeroAtaRegistroPreco' não pode exceder 30 caracteres.")
        
    if codigo_ata:
        if len(codigo_ata) > 31:
            erros.append("O campo 'codigoAta' não pode exceder 31 caracteres.")
        if not edital_sem_pncp:
            digits_ata = "".join(filter(str.isdigit, codigo_ata))
            digits_edital = "".join(filter(str.isdigit, edital_codigo_base or cod_edital))
            if len(digits_ata) == 31 and len(digits_edital) == 25:
                if not digits_ata.startswith(digits_edital):
                    erros.append(
                        f"Os 25 primeiros dígitos do código da ata PNCP devem coincidir com o código do edital ({digits_edital})."
                    )
        
    if not dados.get("anoAta"):
        erros.append("Ano da Ata é obrigatório.")
        
    dt_assinatura = dados.get("dataAssinatura")
    dt_inicio = dados.get("dataVigenciaInicio")
    dt_fim = dados.get("dataVigenciaFim")
    
    if not dt_assinatura:
        erros.append("Data de assinatura da ata é obrigatória.")
    if not dt_inicio:
        erros.append("Data de início de vigência é obrigatória.")
    if not dt_fim:
        erros.append("Data de término de vigência é obrigatória.")
        
    if dt_inicio and dt_fim and dt_fim < dt_inicio:
        erros.append("A data de término de vigência não pode ser anterior à data de início de vigência.")
        
    return erros
