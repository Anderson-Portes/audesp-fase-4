#!/usr/bin/env python3
"""
Script para geração do PDF da Especificação Técnica de Infraestrutura
Sistema AUDESP Fase IV (TCESP)
"""

import os
import sys
import weasyprint

DOCS_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PDF = os.path.join(DOCS_DIR, "especificacao_servidor_implantacao.pdf")

HTML_CONTENT = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Especificação Técnica de Infraestrutura e Servidor - AUDESP Fase IV</title>
<style>
  @page {
    size: A4 portrait;
    margin: 14mm 15mm 14mm 15mm;
    @top-left {
      content: "AUDESP FASE IV — TCESP";
      font-size: 8pt;
      color: #64748b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-weight: 600;
    }
    @top-right {
      content: "Especificação Técnica de Infraestrutura";
      font-size: 8pt;
      color: #64748b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    @bottom-left {
      content: "Documento Técnico de Provisionamento de Servidor";
      font-size: 8pt;
      color: #94a3b8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    @bottom-right {
      content: "Página " counter(page) " de " counter(pages);
      font-size: 8.5pt;
      font-weight: 700;
      color: #334155;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    line-height: 1.42;
    font-size: 9pt;
  }

  .header-card {
    border-bottom: 2px solid #0284c7;
    padding-bottom: 6px;
    margin-bottom: 10px;
  }

  .badge {
    display: inline-block;
    background-color: #0284c7;
    color: #ffffff;
    font-size: 6.8pt;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 4px;
  }

  h1 {
    color: #0f172a;
    font-size: 16pt;
    font-weight: 800;
    margin: 0 0 2px 0;
    letter-spacing: -0.3px;
  }

  .subtitle {
    color: #0284c7;
    font-size: 10.5pt;
    font-weight: 600;
    margin: 0 0 5px 0;
  }

  .intro-text {
    font-size: 8.8pt;
    color: #475569;
    margin: 0;
  }

  h2 {
    color: #0f172a;
    font-size: 11pt;
    font-weight: 700;
    margin-top: 10px;
    margin-bottom: 5px;
    padding-bottom: 2px;
    border-bottom: 1px solid #e2e8f0;
    break-after: avoid;
  }

  p {
    margin: 3px 0 6px 0;
  }

  ul, ol {
    margin: 3px 0 6px 16px;
    padding: 0;
  }

  li {
    margin-bottom: 2px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 10px 0;
    break-inside: avoid;
  }

  th {
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 600;
    font-size: 8.5pt;
    text-align: left;
    padding: 5px 8px;
    border: 1px solid #0f172a;
  }

  td {
    border: 1px solid #cbd5e1;
    padding: 5px 8px;
    font-size: 8.3pt;
    vertical-align: top;
  }

  tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  .callout-box {
    background-color: #f0f9ff;
    border-left: 3px solid #0284c7;
    padding: 6px 10px;
    margin: 6px 0 8px 0;
    border-radius: 0 4px 4px 0;
    font-size: 8.5pt;
    color: #0369a1;
    break-inside: avoid;
  }

  .callout-box strong {
    color: #0c4a6e;
  }

  pre {
    background-color: #0f172a;
    color: #f1f5f9;
    border-radius: 4px;
    padding: 8px 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 8pt;
    line-height: 1.35;
    margin: 5px 0 8px 0;
    break-inside: avoid;
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 8.2pt;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 1px 3px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
  }

  pre code {
    background: transparent;
    color: inherit;
    padding: 0;
    border: none;
  }

  a {
    color: #0284c7;
    text-decoration: underline;
    font-weight: 600;
  }

  .page-break {
    page-break-before: always;
    break-before: page;
  }
</style>
</head>
<body>

<div class="header-card">
  <div class="badge">Documento Técnico Oficial</div>
  <h1>Especificação Técnica de Infraestrutura e Servidor</h1>
  <div class="subtitle">Sistema AUDESP Fase IV — Tribunal de Contas do Estado de São Paulo (TCESP)</div>
  <p class="intro-text">
    Este documento estabelece os requisitos técnicos e o procedimento de preparação do servidor (físico ou máquina virtual)
    para a implantação e operação contínua do <strong>Sistema AUDESP Fase IV</strong>.
  </p>
</div>

<h2>1. Visão Geral da Arquitetura</h2>
<p>
  A aplicação é executada inteiramente em contêineres gerenciados pelo <strong>Docker Compose</strong>, composta pelos seguintes serviços:
</p>
<ul>
  <li><strong>Frontend SPA:</strong> Aplicação web moderna em React servida via Nginx de alta performance (servidor web estático e proxy reverso).</li>
  <li><strong>Backend API:</strong> Web service REST em Python (FastAPI / Uvicorn), responsável pela lógica de negócios, validação estrita dos esquemas e regras da Fase IV e transmissão de dados ao webservice do TCESP.</li>
  <li><strong>Banco de Dados (MySQL 8.0):</strong> Conexão a servidor corporativo dedicado já existente ou, opcionalmente, executado como contêiner gerenciado via Docker.</li>
</ul>

<h2>2. Requisitos de Hardware</h2>
<table>
  <thead>
    <tr>
      <th style="width: 20%;">Componente</th>
      <th style="width: 25%;">Especificação Recomendada</th>
      <th style="width: 55%;">Observações e Justificativas</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Memória RAM</strong></td>
      <td><strong>16 GB</strong></td>
      <td>Essencial para garantir estabilidade operacional, buffer pool do MySQL, múltiplos workers da API e compilação/execução simultânea dos contêineres sem risco de esgotamento de memória (OOM).</td>
    </tr>
    <tr>
      <td><strong>Processador (CPU)</strong></td>
      <td><strong>4 a 8 núcleos (vCPUs)</strong><br><span style="font-size: 7.8pt; color: #475569;">Frequência &ge; 2.4 GHz</span></td>
      <td>
        Arquitetura <strong>x86_64 (amd64)</strong>.<br>
        <strong>Exemplos homologados:</strong><br>
        • <strong>Intel:</strong> Xeon (família E5 v4 ou Scalable Silver/Gold) ou Core i5/i7 (8ª geração ou superior).<br>
        • <strong>AMD:</strong> EPYC ou Ryzen 5/7.<br>
        • <strong>Nuvem / Virtualizadores:</strong> Instâncias <em>general purpose</em> ou <em>compute optimized</em> (ex: AWS <code>t3.xlarge</code>, Azure <code>Standard_D4s_v5</code>).
      </td>
    </tr>
    <tr>
      <td><strong>Armazenamento</strong></td>
      <td><strong>100 GB SSD ou NVMe</strong></td>
      <td>Espaço livre em disco de alta performance (IOPS) para instalação do sistema operacional, cache de camadas de imagens Docker, dados persistentes de banco de dados e logs rotativos.</td>
    </tr>
    <tr>
      <td><strong>Arquitetura</strong></td>
      <td><strong>64-bit (x86_64)</strong></td>
      <td>Obrigatório para compatibilidade com os binários das imagens do Python, Node.js e MySQL.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h2>3. Sistema Operacional Homologado</h2>
<p>
  O servidor deve utilizar distribuição <strong>Linux</strong> de 64 bits, preferencialmente baseada na família <strong>Debian</strong>:
</p>
<ul>
  <li><strong>Ubuntu Server 24.04 LTS (Noble Numbat)</strong> ou <strong>22.04 LTS (Jammy Jellyfish)</strong></li>
  <li><strong>Debian GNU/Linux 13 (Trixie)</strong>, <strong>12 (Bookworm)</strong> ou <strong>11 (Bullseye)</strong></li>
</ul>

<div class="callout-box">
  <strong>Nota de Estabilidade:</strong> Distribuições baseadas na família Debian oferecem suporte nativo de longo prazo (LTS), alta estabilidade para servidores corporativos de produção e integração direta com os repositórios oficiais da Docker Engine.
</div>

<h2>4. Instalação do Docker e Docker Compose</h2>
<p>
  O ambiente exige a instalação do <strong>Docker Engine oficial (versão 24.0 ou superior)</strong> e do plugin <strong>Docker Compose v2 (versão 2.20 ou superior)</strong>. Não utilize versões desatualizadas dos repositórios genéricos da distribuição.
</p>
<p>
  A equipe de infraestrutura deve seguir o roteiro oficial detalhado disponibilizado pelo próprio Docker:
</p>
<ul>
  <li><strong>Para Ubuntu Server:</strong> <a href="https://docs.docker.com/engine/install/ubuntu/">Guia Oficial no Ubuntu</a> (<code>https://docs.docker.com/engine/install/ubuntu/</code>)</li>
  <li><strong>Para Debian:</strong> <a href="https://docs.docker.com/engine/install/debian/">Guia Oficial no Debian</a> (<code>https://docs.docker.com/engine/install/debian/</code>)</li>
  <li><strong>Pós-Instalação no Linux:</strong> <a href="https://docs.docker.com/engine/install/linux-postinstall/">Configurações Pós-Instalação (Acesso sem sudo e boot)</a> (<code>https://docs.docker.com/engine/install/linux-postinstall/</code>)</li>
</ul>

<h2>5. Requisitos de Rede e Firewall</h2>
<p>
  O servidor deve ser configurado de forma que <strong>todas as portas estejam liberadas e acessíveis sem qualquer tipo de bloqueio</strong>
  (tanto para tráfego de entrada/inbound quanto de saída/outbound), garantindo conectividade irrestrita entre todos os serviços da aplicação,
  banco de dados e redes de acesso.
</p>
<p>
  Adicionalmente, o servidor deve possuir conectividade externa de saída liberada na internet para os seguintes destinos fundamentais:
</p>
<ol>
  <li>
    <strong>Tribunal de Contas do Estado de São Paulo (TCESP):</strong>
    <ul>
      <li><code>https://audesp-piloto.tce.sp.gov.br</code> (Ambiente Piloto / Homologação de testes)</li>
      <li><code>https://audesp.tce.sp.gov.br</code> (Ambiente de Produção oficial)</li>
    </ul>
  </li>
  <li>
    <strong>Repositórios de pacotes e imagens Docker:</strong>
    <ul>
      <li><code>registry-1.docker.io</code> e <code>production.cloudflare.docker.com</code> (Download e atualização de imagens Docker)</li>
      <li><code>archive.ubuntu.com</code> / <code>deb.debian.org</code> (Atualizações de segurança do sistema operacional)</li>
    </ul>
  </li>
</ol>

<h2>6. Checklist de Validação e Teste de Prontidão</h2>
<p>
  Após a preparação da máquina, execute a lista de verificação abaixo para confirmar que o servidor está pronto para receber a aplicação:
</p>

<pre><code># 1. Verificar versão do Docker Engine (deve ser >= 24.0)
docker --version

# 2. Verificar versão do Docker Compose (deve ser >= v2.20)
docker compose version

# 3. Testar execução de contêineres e conectividade com o registry Docker
sudo docker run --rm hello-world

# 4. Validar conectividade de saída com a API do TCESP
curl -Is https://audesp-piloto.tce.sp.gov.br | head -n 5
curl -Is https://audesp.tce.sp.gov.br | head -n 5

# 5. Conferir memória RAM disponível (deve indicar aproximadamente 16 GB)
free -h

# 6. Conferir espaço livre em disco
df -h /</code></pre>

<p style="font-size: 8.5pt; color: #475569; margin-top: 4px;">
  Se todos os comandos acima retornarem com sucesso, o servidor estará totalmente apto para receber e executar o <strong>Sistema AUDESP Fase IV</strong>.
</p>

</body>
</html>
"""

def main():
    print(f"Gerando PDF em: {OUTPUT_PDF}...")
    weasyprint.HTML(string=HTML_CONTENT).write_pdf(OUTPUT_PDF)
    print("PDF gerado com sucesso!")

if __name__ == "__main__":
    main()
