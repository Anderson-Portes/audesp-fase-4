import os
import json
from typing import Optional, Dict, Any, List
import requests
from dotenv import load_dotenv

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ROOT_ENV = os.path.join(ROOT_DIR, ".env")
if os.path.exists(ROOT_ENV):
    load_dotenv(ROOT_ENV)
else:
    load_dotenv()

def get_audesp_url() -> str:
    """Retorna a URL base configurada para a API do AUDESP"""
    url = os.getenv("AUDESP_API_URL", "https://audesp-piloto.tce.sp.gov.br").strip()
    return url.rstrip("/")


def formatar_item_erro_audesp(err: Any) -> Dict[str, Any]:
    """
    Normaliza um item de erro ou inconsistência do AUDESP em um dicionário estruturado
    e uma string amigável (texto_formatado) sem jamais exibir JSON cru.
    """
    if isinstance(err, str):
        texto = err.strip()
        return {
            "mensagem": texto,
            "campo": None,
            "codigoErro": None,
            "classificacao": None,
            "origem": None,
            "texto_formatado": texto,
        }

    if isinstance(err, dict):
        mensagem = str(
            err.get("mensagem")
            or err.get("message")
            or err.get("descricao")
            or err.get("erro")
            or err.get("error")
            or "Inconsistência reportada pelo AUDESP"
        ).strip()
        campo = str(err.get("campo") or err.get("field") or err.get("propriedade") or "").strip() or None
        codigo = str(err.get("codigoErro") or err.get("codigo") or err.get("code") or "").strip() or None
        classificacao = str(err.get("classificacao") or err.get("tipo") or "").strip() or None
        origem = str(err.get("origem") or err.get("valor") or "").strip() or None

        partes_cabecalho: List[str] = []
        if classificacao:
            partes_cabecalho.append(f"[{classificacao}]")
        if codigo:
            partes_cabecalho.append(f"({codigo})")

        prefixo = " ".join(partes_cabecalho)
        detalhes_extras: List[str] = []
        if campo:
            detalhes_extras.append(f"Campo: {campo}")
        if origem:
            detalhes_extras.append(f"Valor informado: {origem}")

        texto_base = f"{prefixo} {mensagem}".strip() if prefixo else mensagem
        if detalhes_extras:
            texto_formatado = f"{texto_base} — {' | '.join(detalhes_extras)}"
        else:
            texto_formatado = texto_base

        return {
            "mensagem": mensagem,
            "campo": campo,
            "codigoErro": codigo,
            "classificacao": classificacao,
            "origem": origem,
            "texto_formatado": texto_formatado,
        }

    texto_fallback = str(err).strip()
    return {
        "mensagem": texto_fallback,
        "campo": None,
        "codigoErro": None,
        "classificacao": None,
        "origem": None,
        "texto_formatado": texto_fallback,
    }


def extrair_erros_estruturados_audesp(dados: Any) -> List[Dict[str, Any]]:
    """
    Extrai e normaliza todos os erros/inconsistências de uma resposta do AUDESP
    (seja de envio 400/422 ou de consulta de protocolo /f4/consulta/{protocolo}).
    Aceita dict, list ou string JSON.
    """
    if not dados:
        return []

    if isinstance(dados, str):
        try:
            dados = json.loads(dados)
        except Exception:
            texto = dados.strip()
            return [formatar_item_erro_audesp(texto)] if texto else []

    itens_brutos: List[Any] = []

    if isinstance(dados, list):
        itens_brutos.extend(dados)
    elif isinstance(dados, dict):
        # 1. Lista direta em 'erros', 'inconsistencias' ou 'mensagens'
        for chave in ("erros", "inconsistencias", "mensagens", "errors"):
            val = dados.get(chave)
            if isinstance(val, list):
                itens_brutos.extend(val)
            elif isinstance(val, str) and val.strip():
                itens_brutos.append(val.strip())

        # 2. Caso 'message' ou 'detail' seja um objeto aninhado (ex: Erro400DocInvalido do AUDESP)
        for chave_obj in ("message", "detail", "dados", "retorno"):
            sub = dados.get(chave_obj)
            if isinstance(sub, dict):
                for chave in ("erros", "inconsistencias", "mensagens", "errors"):
                    val = sub.get(chave)
                    if isinstance(val, list):
                        itens_brutos.extend(val)
                    elif isinstance(val, str) and val.strip():
                        itens_brutos.append(val.strip())
                if not itens_brutos:
                    msg_sub = sub.get("mensagem") or sub.get("message")
                    if isinstance(msg_sub, str) and msg_sub.strip():
                        itens_brutos.append(msg_sub.strip())

        # 3. Se o status for Rejeitado/Erro mas não veio array 'erros', verifica 'mensagem'/'message'/'error'
        status_str = str(dados.get("status") or "").lower()
        if not itens_brutos and ("rejeitado" in status_str or "erro" in status_str or dados.get("sucesso") is False):
            msg_direta = dados.get("mensagem") or dados.get("message") or dados.get("error")
            if isinstance(msg_direta, str) and msg_direta.strip():
                itens_brutos.append(msg_direta.strip())

    resultado: List[Dict[str, Any]] = []
    vistos = set()
    for item in itens_brutos:
        formatado = formatar_item_erro_audesp(item)
        txt = formatado.get("texto_formatado", "")
        if txt and txt not in vistos:
            vistos.add(txt)
            resultado.append(formatado)

    return resultado


def extrair_mensagens_protocolo_audesp(dados: Any) -> List[str]:
    """Retorna apenas a lista de strings amigáveis formatadas a partir do retorno do AUDESP."""
    estruturados = extrair_erros_estruturados_audesp(dados)
    return [item["texto_formatado"] for item in estruturados if item.get("texto_formatado")]

def _tratar_resposta_requisicao(response: requests.Response, msg_sucesso_padrao: str = "Operação realizada com sucesso!") -> Dict[str, Any]:
    """Helper unificado para tratar o retorno HTTP de chamadas ao AUDESP."""
    status_code = response.status_code
    try:
        dados = response.json()
    except Exception:
        dados = {"raw": response.text}

    if status_code in (200, 201):
        return {
            "sucesso": True,
            "status_code": status_code,
            "protocolo": dados.get("protocolo"),
            "token": dados.get("access_token") or dados.get("token"),
            "status": dados.get("status"),
            "mensagem": dados.get("mensagem") or dados.get("message") or msg_sucesso_padrao,
            "dados": dados
        }
    
    erros_formatados = extrair_mensagens_protocolo_audesp(dados)
    msg_bruta = dados.get("mensagem") or dados.get("message") or dados.get("error") if isinstance(dados, dict) else f"Erro HTTP {status_code}"
    if isinstance(msg_bruta, dict):
        msg = str(msg_bruta.get("mensagem") or msg_bruta.get("message") or f"Erro HTTP {status_code}")
    else:
        msg = str(msg_bruta or f"Erro HTTP {status_code}")
    
    if status_code == 401:
        msg = "E-mail ou senha inválidos no Portal de Sistemas do TCESP."
    elif status_code == 403:
        msg = "Acesso negado: o usuário não possui a permissão necessária no WebService AUDESP."

    return {
        "sucesso": False,
        "status_code": status_code,
        "mensagem": msg,
        "erros": erros_formatados,
        "dados": dados
    }

def _executar_requisicao(metodo: str, endpoint: str, **kwargs) -> Dict[str, Any]:
    """Centraliza o try/except para erros de conexão e timeout com requests."""
    verify_ssl = os.getenv("AUDESP_VERIFY_SSL", "true").lower() in ("true", "1", "yes")
    kwargs.setdefault("verify", verify_ssl)
    kwargs.setdefault("timeout", 45)
    
    try:
        resp = requests.request(metodo, endpoint, **kwargs)
        return _tratar_resposta_requisicao(resp)
    except requests.exceptions.ConnectionError:
        return {
            "sucesso": False,
            "status_code": 503,
            "mensagem": f"Falha de conexão com o servidor do TCESP em {endpoint}."
        }
    except requests.exceptions.Timeout:
        return {
            "sucesso": False,
            "status_code": 504,
            "mensagem": "Tempo limite esgotado ao tentar comunicar com o TCESP."
        }
    except Exception as e:
        return {
            "sucesso": False,
            "status_code": 500,
            "mensagem": f"Erro interno na comunicação com AUDESP: {str(e)}"
        }

def autenticar_audesp(email: str, senha: str, url_override: Optional[str] = None) -> Dict[str, Any]:
    """
    Realiza a autenticação no AUDESP (TCESP) via endpoint /login
    usando o header 'x-authorization: email:senha'.
    """
    base_url = (url_override or get_audesp_url()).rstrip("/")
    endpoint = f"{base_url}/login"
    headers = {
        "x-authorization": f"{email}:{senha}",
        "Accept": "application/json"
    }
    return _executar_requisicao("POST", endpoint, headers=headers)

def enviar_edital_audesp(
    token: str,
    documento_json: str,
    pdf_bytes: Optional[bytes] = None,
    pdf_filename: Optional[str] = None,
    pdf_path: Optional[str] = None,
    url_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Envia um edital de licitação/compra para o AUDESP Fase IV via multipart/form-data.
    Endpoint: /recepcao-fase-4/f4/enviar-edital
    """
    base_url = (url_override or get_audesp_url()).rstrip("/")
    endpoint = f"{base_url}/recepcao-fase-4/f4/enviar-edital"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    files: Dict[str, Any] = {
        "documentoJSON": ("edital.json", documento_json.encode("utf-8"), "application/json")
    }
    
    file_handle = None
    if pdf_bytes:
        filename = pdf_filename or "edital.pdf"
        files["arquivoPDF"] = (filename, pdf_bytes, "application/pdf")
    elif pdf_path and os.path.exists(pdf_path):
        filename = pdf_filename or os.path.basename(pdf_path)
        file_handle = open(pdf_path, "rb")
        files["arquivoPDF"] = (filename, file_handle, "application/pdf")

    try:
        return _executar_requisicao("POST", endpoint, headers=headers, files=files, timeout=60)
    finally:
        if file_handle:
            file_handle.close()

def enviar_licitacao_audesp(
    token: str,
    documento_json: str,
    url_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Envia a licitação / resultado do certame para o AUDESP Fase IV via multipart/form-data.
    Endpoint: /recepcao-fase-4/f4/enviar-licitacao
    """
    base_url = (url_override or get_audesp_url()).rstrip("/")
    endpoint = f"{base_url}/recepcao-fase-4/f4/enviar-licitacao"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    files = {
        "documentoJSON": ("licitacao.json", documento_json.encode("utf-8"), "application/json")
    }
    return _executar_requisicao("POST", endpoint, headers=headers, files=files, timeout=60)

def enviar_ata_audesp(
    token: str,
    documento_json: str,
    url_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Envia a Ata de Registro de Preços para o AUDESP Fase IV via multipart/form-data.
    Endpoint: /recepcao-fase-4/f4/enviar-ata
    """
    base_url = (url_override or get_audesp_url()).rstrip("/")
    endpoint = f"{base_url}/recepcao-fase-4/f4/enviar-ata"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    files = {
        "documentoJSON": ("ata.json", documento_json.encode("utf-8"), "application/json")
    }
    return _executar_requisicao("POST", endpoint, headers=headers, files=files, timeout=60)

def enviar_ajuste_audesp(
    token: str,
    documento_json: str,
    url_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Envia o Ajuste/Contrato para o AUDESP Fase IV via multipart/form-data.
    Endpoint: /recepcao-fase-4/f4/enviar-ajuste
    """
    base_url = (url_override or get_audesp_url()).rstrip("/")
    endpoint = f"{base_url}/recepcao-fase-4/f4/enviar-ajuste"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    files = {
        "documentoJSON": ("ajuste.json", documento_json.encode("utf-8"), "application/json")
    }
    return _executar_requisicao("POST", endpoint, headers=headers, files=files, timeout=60)

def consultar_protocolo_audesp(
    token: str,
    protocolo: str,
    url_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Consulta a situação de um documento da Fase IV pelo número do protocolo.
    Endpoint: /f4/consulta/{protocolo}
    """
    base_url = (url_override or get_audesp_url()).rstrip("/")
    endpoint = f"{base_url}/f4/consulta/{protocolo}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    return _executar_requisicao("GET", endpoint, headers=headers, timeout=30)
