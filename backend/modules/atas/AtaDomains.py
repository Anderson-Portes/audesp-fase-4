from typing import Dict, Any, List

def validar_regras_negocio_ata(dados: Dict[str, Any]) -> List[str]:
    """
    Valida as regras de negócio de envio da Ata de Registro de Preços
    em estrita conformidade com ata_schema.json e regras do TCESP.
    """
    erros = []
    
    descritor = dados.get("descritor", {})
    if not descritor.get("codigoEdital"):
        erros.append("Código do Edital é obrigatório no descritor.")
    if not descritor.get("codigoAta"):
        erros.append("Código da Ata é obrigatório no descritor.")
    if not descritor.get("anoCompra"):
        erros.append("Ano da Compra é obrigatório no descritor.")
        
    numero_item = dados.get("numeroItem", [])
    if not numero_item or not isinstance(numero_item, list) or len(numero_item) == 0:
        erros.append("É necessário vincular ao menos 1 item da licitação/edital à ata.")
        
    if not dados.get("numeroAtaRegistroPreco"):
        erros.append("Número da Ata no sistema de origem é obrigatório.")
        
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
