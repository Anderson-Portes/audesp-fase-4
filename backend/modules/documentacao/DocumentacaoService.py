"""
Serviço de Monitoramento da documentação oficial da AUDESP Fase IV (TCESP):
- Página de JSON Schemas e documentação XLSX do TCESP
- Especificação OpenAPI / Swagger (audesp.yaml)

Compara hashes SHA-256 uma vez por período (00h–12h / 12h–00h) e expõe um alerta
caso o TCESP publique novos anexos, altere schemas/planilhas ou atualize o audesp.yaml.
"""
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

import requests
from sqlmodel import Session

from modules.documentacao.Documentacao import AppConfig

PAGINA_TCE_URL = (
    "https://www.tce.sp.gov.br/audesp/documentacao/"
    "reformulacao-fase-iv-jsonschemas-e-documentacao-xlsx"
)
PAGINA_API_URL = "https://audesp.tce.sp.gov.br/api"
ESPECIFICACAO_API_URL = "https://audesp.tce.sp.gov.br/api/audesp.yaml"

KEY_DOC_REFERENCIA = "documentacao_referencia"
KEY_DOC_ATUAL = "documentacao_atual"
KEY_DOC_PERIODO = "documentacao_periodo"
KEY_DOC_ALTERADA_EM = "documentacao_alterada_em"


class DocumentacaoService:
    """Camada de serviço para monitoramento da documentação oficial do TCESP AUDESP Fase IV."""

    @staticmethod
    def _obter_config(session: Session, chave: str) -> Optional[str]:
        item = session.get(AppConfig, chave)
        return item.valor if item else None

    @staticmethod
    def _salvar_config(session: Session, chave: str, valor: str) -> None:
        item = session.get(AppConfig, chave)
        if item:
            item.valor = valor
            item.updated_at = datetime.now(timezone.utc)
        else:
            item = AppConfig(chave=chave, valor=valor, updated_at=datetime.now(timezone.utc))
        session.add(item)
        session.commit()

    @staticmethod
    def _apagar_config(session: Session, chave: str) -> None:
        item = session.get(AppConfig, chave)
        if item:
            session.delete(item)
            session.commit()

    @staticmethod
    def periodo_verificacao(agora: Optional[datetime] = None) -> str:
        """Período do dia: 'YYYY-MM-DD-manha' (0h–12h) ou 'YYYY-MM-DD-tarde' (12h–24h)."""
        dt = agora or datetime.now()
        turno = "manha" if dt.hour < 12 else "tarde"
        return f"{dt.strftime('%Y-%m-%d')}-{turno}"

    @staticmethod
    def extrair_pagina_tce(html: str, base_url: str = PAGINA_TCE_URL) -> Dict[str, Any]:
        """
        Extrai do HTML apenas a seção <article> da documentação e os links de anexos
        (/sites/default/files/), ignorando cabeçalho/menu/rodapé do portal.
        """
        inicio = html.find("<article")
        fim = html.find("</article>", inicio) if inicio >= 0 else -1
        if fim < 0:
            raise ValueError("Seção <article> da documentação não encontrada na página do TCESP.")

        artigo = html[inicio:fim]

        anexos: List[str] = []
        for match in re.finditer(r"""<a\s[^>]*href\s*=\s*["']([^"']+)["']""", artigo, re.IGNORECASE):
            href = match.group(1).replace("&amp;", "&")
            if "/sites/default/files/" not in href:
                continue
            full_url = urljoin(base_url, href)
            if full_url not in anexos:
                anexos.append(full_url)

        texto_limpo = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", " ", artigo, flags=re.DOTALL | re.IGNORECASE)
        texto_limpo = re.sub(r"<[^>]+>", " ", texto_limpo)
        texto_limpo = texto_limpo.replace("&nbsp;", " ")
        texto_limpo = re.sub(r"\s+", " ", texto_limpo).strip()

        return {
            "texto": texto_limpo,
            "anexos": anexos,
        }

    @staticmethod
    def _nome_anexo(url: str) -> str:
        parsed = urlparse(url)
        partes = [p for p in parsed.path.split("/") if p]
        return partes[-1] if partes else url

    @staticmethod
    def _sha256_bytes(data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()

    @classmethod
    def capturar_snapshot_remoto(cls) -> Dict[str, Any]:
        """Baixa a página oficial do TCESP, seus anexos e o audesp.yaml, retornando seus hashes SHA-256."""
        verify_ssl = os.getenv("AUDESP_VERIFY_SSL", "true").lower() in ("true", "1", "yes")
        headers = {"User-Agent": "audesp-fase-4-monitor/1.0"}

        resp_html = requests.get(PAGINA_TCE_URL, headers=headers, timeout=30, verify=verify_ssl)
        resp_html.raise_for_status()
        extraido = cls.extrair_pagina_tce(resp_html.text, PAGINA_TCE_URL)

        anexos_hashes: Dict[str, str] = {}
        for anexo_url in extraido["anexos"]:
            resp_anexo = requests.get(anexo_url, headers=headers, timeout=45, verify=verify_ssl)
            resp_anexo.raise_for_status()
            anexos_hashes[cls._nome_anexo(anexo_url)] = cls._sha256_bytes(resp_anexo.content)

        resp_yaml = requests.get(ESPECIFICACAO_API_URL, headers=headers, timeout=45, verify=verify_ssl)
        resp_yaml.raise_for_status()
        hash_yaml = cls._sha256_bytes(resp_yaml.content)

        return {
            "textoPagina": cls._sha256_bytes(extraido["texto"].encode("utf-8")),
            "anexos": anexos_hashes,
            "especificacaoApi": hash_yaml,
        }

    @staticmethod
    def _ler_snapshot_json(raw: Optional[str]) -> Optional[Dict[str, Any]]:
        if not raw:
            return None
        try:
            parsed = json.loads(raw)
            if (
                isinstance(parsed, dict)
                and isinstance(parsed.get("textoPagina"), str)
                and isinstance(parsed.get("anexos"), dict)
                and isinstance(parsed.get("especificacaoApi"), str)
            ):
                return parsed
        except Exception:
            pass
        return None

    @staticmethod
    def comparar_documentacao(referencia: Dict[str, Any], atual: Dict[str, Any]) -> List[str]:
        """Retorna a lista de diferenças entre o snapshot de referência e o snapshot atual."""
        alteracoes: List[str] = []
        if referencia.get("textoPagina") != atual.get("textoPagina"):
            alteracoes.append("Texto da página de documentação do TCESP alterado")

        anexos_ref: Dict[str, str] = referencia.get("anexos") or {}
        anexos_atu: Dict[str, str] = atual.get("anexos") or {}

        for nome, hash_atu in anexos_atu.items():
            hash_ant = anexos_ref.get(nome)
            if hash_ant is None:
                alteracoes.append(f"Novo anexo publicado: {nome}")
            elif hash_ant != hash_atu:
                alteracoes.append(f"Anexo atualizado pelo TCESP: {nome}")

        for nome in anexos_ref.keys():
            if nome not in anexos_atu:
                alteracoes.append(f"Anexo removido da página: {nome}")

        if referencia.get("especificacaoApi") != atual.get("especificacaoApi"):
            alteracoes.append("Especificação da API (audesp.yaml) alterada")

        return alteracoes

    @classmethod
    def obter_alerta_atual(cls, session: Session) -> Dict[str, Any]:
        """Lê do banco se há diferença pendente entre a referência e a última leitura."""
        ref = cls._ler_snapshot_json(cls._obter_config(session, KEY_DOC_REFERENCIA))
        atu = cls._ler_snapshot_json(cls._obter_config(session, KEY_DOC_ATUAL))
        alterada_em = cls._obter_config(session, KEY_DOC_ALTERADA_EM)
        periodo = cls._obter_config(session, KEY_DOC_PERIODO)

        if not ref or not atu:
            return {
                "possui_alerta": False,
                "alteracoes": [],
                "detectada_em": None,
                "ultimo_periodo_verificado": periodo,
                "pagina_tce": PAGINA_TCE_URL,
                "pagina_api": PAGINA_API_URL,
            }

        alteracoes = cls.comparar_documentacao(ref, atu)
        return {
            "possui_alerta": len(alteracoes) > 0,
            "alteracoes": alteracoes,
            "detectada_em": alterada_em,
            "ultimo_periodo_verificado": periodo,
            "pagina_tce": PAGINA_TCE_URL,
            "pagina_api": PAGINA_API_URL,
        }

    @classmethod
    def verificar_documentacao_periodica(cls, session: Session, forcar: bool = False) -> Dict[str, Any]:
        """
        Verifica a documentação do AUDESP se o período atual (manhã/tarde) ainda
        não tiver sido verificado (ou se `forcar=True`).
        Falhas de rede são tratadas silenciosamente mantendo o último estado válido.
        """
        agora = datetime.now()
        periodo = cls.periodo_verificacao(agora)
        periodo_anterior = cls._obter_config(session, KEY_DOC_PERIODO)

        if not forcar and periodo_anterior == periodo:
            return cls.obter_alerta_atual(session)

        cls._salvar_config(session, KEY_DOC_PERIODO, periodo)

        try:
            snapshot_atual = cls.capturar_snapshot_remoto()
        except Exception as exc:
            if periodo_anterior is None:
                cls._apagar_config(session, KEY_DOC_PERIODO)
            else:
                cls._salvar_config(session, KEY_DOC_PERIODO, periodo_anterior)
            alerta = cls.obter_alerta_atual(session)
            alerta["erro_verificacao"] = str(exc)
            return alerta

        json_atual = json.dumps(snapshot_atual, ensure_ascii=False)
        cls._salvar_config(session, KEY_DOC_ATUAL, json_atual)

        ref = cls._ler_snapshot_json(cls._obter_config(session, KEY_DOC_REFERENCIA))
        if ref is None:
            cls._salvar_config(session, KEY_DOC_REFERENCIA, json_atual)
            cls._apagar_config(session, KEY_DOC_ALTERADA_EM)
            return cls.obter_alerta_atual(session)

        alteracoes = cls.comparar_documentacao(ref, snapshot_atual)
        if not alteracoes:
            cls._apagar_config(session, KEY_DOC_ALTERADA_EM)
        else:
            if not cls._obter_config(session, KEY_DOC_ALTERADA_EM):
                cls._salvar_config(session, KEY_DOC_ALTERADA_EM, datetime.now(timezone.utc).isoformat())

        return cls.obter_alerta_atual(session)

    @classmethod
    def marcar_documentacao_verificada(cls, session: Session) -> Dict[str, Any]:
        """Define o snapshot atual como nova referência conferida e limpa o alerta."""
        atual = cls._obter_config(session, KEY_DOC_ATUAL)
        if atual:
            cls._salvar_config(session, KEY_DOC_REFERENCIA, atual)
        cls._apagar_config(session, KEY_DOC_ALTERADA_EM)
        return cls.obter_alerta_atual(session)

