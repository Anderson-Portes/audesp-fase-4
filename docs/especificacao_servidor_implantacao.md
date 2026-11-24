# Especificação Técnica de Infraestrutura e Servidor
## Sistema AUDESP Fase IV (TCESP)

Este documento estabelece os requisitos técnicos e o procedimento de preparação do servidor (físico ou máquina virtual) para a implantação e operação contínua do **Sistema AUDESP Fase IV**.

---

## 1. Visão Geral da Arquitetura

A aplicação é executada inteiramente em contêineres gerenciados pelo **Docker Compose**, composta pelos seguintes serviços:
- **Frontend SPA**: Aplicação React servida via Nginx (servidor web estático e proxy reverso).
- **Backend API**: Web service REST em Python (FastAPI / Uvicorn), responsável pela lógica de negócios, validação de regras da Fase IV e transmissão de dados ao webservice do TCESP.
- **Banco de Dados (MySQL 8.0)**: Opcional via Docker ou conexão a servidor de banco de dados interno/dedicado já existente na infraestrutura.

---

## 2. Requisitos de Hardware

| Componente | Especificação Mínima Recomendada | Observações |
| :--- | :--- | :--- |
| **Memória RAM** | **16 GB** | Essencial para garantir estabilidade operacional, buffer pool do MySQL, múltiplos workers da API e compilação/execução simultânea dos contêineres sem esgotamento de memória (OOM). |
| **Processador (CPU)** | **4 a 8 núcleos (vCPUs)** <br>Frequência $\ge$ 2.4 GHz | Arquitetura **x86_64 (amd64)**.<br>Exemplos homologados:<br>• **Intel**: Xeon (família E5 v4 ou Scalable Silver/Gold) ou Core i5/i7 (8ª geração ou superior).<br>• **AMD**: EPYC ou Ryzen 5/7.<br>• Em nuvem/virtualizadores: Equivalente a instâncias do tipo *general purpose* ou *compute optimized* (ex: AWS `t3.xlarge`, Azure `Standard_D4s_v5`). |
| **Armazenamento** | **100 GB SSD ou NVMe** | Espaço livre para instalação do sistema operacional, cache de camadas de imagens Docker, dados persistentes de banco de dados e logs rotativos. Recomenda-se alocação em disco de alta performance (IOPS). |
| **Arquitetura** | **64-bit (x86_64)** | Obrigatório para compatibilidade com os binários das imagens do Python, Node.js e MySQL. |

---

## 3. Sistema Operacional Homologado

O servidor deve utilizar distribuição **Linux**, preferencialmente baseada na família **Debian**:

- **Ubuntu Server 24.04 LTS (Noble Numbat)** ou **22.04 LTS (Jammy Jellyfish)**
- **Debian GNU/Linux 13 (Trixie)**, **12 (Bookworm)** ou **11 (Bullseye)**

> [!NOTE]
> Distribuições baseadas em Debian oferecem suporte nativo de longo prazo (LTS), alta estabilidade para servidores de produção e integração direta com os repositórios oficiais da Docker Engine.

---

## 4. Instalação do Docker e Docker Compose

O ambiente exige a instalação do **Docker Engine** oficial (versão 24.0 ou superior) e do plugin **Docker Compose v2** (versão 2.20 ou superior). Não utilize versões desatualizadas dos repositórios genéricos da distribuição.

A equipe de infraestrutura deve seguir o roteiro oficial detalhado disponibilizado pelo próprio Docker:

- **Para Ubuntu Server**: [Guia Oficial de Instalação no Ubuntu (Docker Docs)](https://docs.docker.com/engine/install/ubuntu/)
- **Para Debian**: [Guia Oficial de Instalação no Debian (Docker Docs)](https://docs.docker.com/engine/install/debian/)
- **Pós-Instalação (Acesso sem `sudo` e Inicialização no Boot)**: [Post-installation steps for Linux](https://docs.docker.com/engine/install/linux-postinstall/)

---

## 5. Requisitos de Rede e Firewall

O servidor deve ser configurado de forma que **todas as portas estejam liberadas e acessíveis sem qualquer tipo de bloqueio** (tanto para tráfego de entrada/inbound quanto de saída/outbound), garantindo conectividade irrestrita entre todos os serviços da aplicação, banco de dados e redes de acesso.

Adicionalmente, o servidor deve possuir conectividade externa de saída liberada (especialmente via HTTPS / porta 443) para os seguintes destinos fundamentais:

1. **Tribunal de Contas do Estado de São Paulo (TCESP)**:
   - `https://audesp-piloto.tce.sp.gov.br` (Ambiente Piloto / Homologação de testes)
   - `https://audesp.tce.sp.gov.br` (Ambiente de Produção oficial)
2. **Repositórios de pacotes e imagens**:
   - `registry-1.docker.io` e `production.cloudflare.docker.com` (Download e atualização de imagens Docker)
   - `archive.ubuntu.com` / `deb.debian.org` (Atualizações de segurança do sistema operacional)

---

## 6. Checklist de Validação e Teste de Prontidão

Após a preparação da máquina, execute a lista de verificação abaixo para confirmar que o servidor está pronto para receber a aplicação:

```bash
# 1. Verificar versão do Docker Engine (deve ser >= 24.0)
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
df -h /
```

Se todos os comandos acima retornarem com sucesso, o servidor estará totalmente apto para receber e executar o sistema AUDESP Fase IV.
