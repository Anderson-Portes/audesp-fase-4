"""
Domínios compartilhados para Municípios e Entidades AUDESP (TCESP Fase IV).
"""
from typing import List, Dict, Any

# Lista inicial de municípios do Estado de São Paulo com jurisdição AUDESP
# 545 (Santos) é a sede padrão da Prodesan
MUNICIPIOS_AUDESP: List[Dict[str, Any]] = [
    {"codigo": 7071, "nome": "Santos", "uf": "SP"},
    {"codigo": 7075, "nome": "São Vicente", "uf": "SP"},
    {"codigo": 6475, "nome": "Guarujá", "uf": "SP"},
    {"codigo": 6871, "nome": "Praia Grande", "uf": "SP"},
    {"codigo": 6325, "nome": "Cubatão", "uf": "SP"},
    {"codigo": 6223, "nome": "Bertioga", "uf": "SP"},
    {"codigo": 6735, "nome": "Mongaguá", "uf": "SP"},
    {"codigo": 6537, "nome": "Itanhaém", "uf": "SP"},
    {"codigo": 6867, "nome": "Peruíbe", "uf": "SP"},
    {"codigo": 7100, "nome": "São Paulo", "uf": "SP"},
    {"codigo": 6291, "nome": "Campinas", "uf": "SP"},
    {"codigo": 7099, "nome": "São José dos Campos", "uf": "SP"},
    {"codigo": 7000, "nome": "Ribeirão Preto", "uf": "SP"},
    {"codigo": 7149, "nome": "Sorocaba", "uf": "SP"},
]

# Entidades públicas e de administração indireta com código AUDESP
# 11310 é o código oficial da PRODESAN (Progresso e Desenvolvimento de Santos S/A)
ENTIDADES_AUDESP: List[Dict[str, Any]] = [
    {
        "codigo": 11310,
        "municipio": 7071,
        "nome": "PRODESAN - Progresso e Desenvolvimento de Santos S/A",
        "tipo": "Empresa Pública / Sociedade de Economia Mista",
        "cnpj": "58.200.015/0001-83"
    },
    {
        "codigo": 1,
        "municipio": 7071,
        "nome": "Prefeitura Municipal de Santos",
        "tipo": "Prefeitura / Executivo Municipal",
        "cnpj": "44.722.952/0001-55"
    },
    {
        "codigo": 2,
        "municipio": 7071,
        "nome": "Câmara Municipal de Santos",
        "tipo": "Poder Legislativo",
        "cnpj": "49.638.245/0001-92"
    },
    {
        "codigo": 3,
        "municipio": 7071,
        "nome": "CET - Companhia de Engenharia de Tráfego de Santos",
        "tipo": "Empresa Pública",
        "cnpj": "50.419.866/0001-44"
    },
    {
        "codigo": 4,
        "municipio": 7071,
        "nome": "IPREV - Instituto de Previdência Social dos Servidores de Santos",
        "tipo": "Autarquia Previdenciária",
        "cnpj": "07.824.238/0001-51"
    },
    {
        "codigo": 5,
        "municipio": 7071,
        "nome": "FAPES - Fundação Arquivo e Memória de Santos",
        "tipo": "Fundação Pública",
        "cnpj": "03.012.345/0001-90"
    },
    {
        "codigo": 6,
        "municipio": 7071,
        "nome": "COHAB Santista - Companhia de Habitação da Baixada Santista",
        "tipo": "Sociedade de Economia Mista",
        "cnpj": "58.199.118/0001-09"
    }
]
