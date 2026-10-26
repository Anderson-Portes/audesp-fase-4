import os
from typing import Optional, Dict, Any
import requests
from dotenv import load_dotenv

load_dotenv()

def get_audesp_url() -> str:
    """Retorna a URL base configurada para a API do AUDESP"""
    url = os.getenv("AUDESP_API_URL", "https://audesp-piloto.tce.sp.gov.br").strip()
    return url.rstrip("/")

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
    
    erros = dados.get("erros") if isinstance(dados, dict) else []
    msg = dados.get("mensagem") or dados.get("message") or dados.get("error") if isinstance(dados, dict) else f"Erro HTTP {status_code}"
    
    if status_code == 401:
        msg = "E-mail ou senha inválidos no Portal de Sistemas do TCESP."
    elif status_code == 403:
        msg = "Acesso negado: o usuário não possui a permissão necessária no WebService AUDESP."

    return {
        "sucesso": False,
        "status_code": status_code,
        "mensagem": msg,
        "erros": erros,
        "dados": dados
    }

def _executar_requisicao(metodo: str, endpoint: str, **kwargs) -> Dict[str, Any]:
    """Centraliza o try/except para erros de conexão e timeout com requests."""
    kwargs.setdefault("verify", False)
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
