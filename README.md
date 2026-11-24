# AUDESP Fase IV - Integração e Gestão (TCESP)

Sistema completo (Frontend + Backend) para cadastro, validação e transmissão eletrônica dos dados da **Nova Fase IV do AUDESP** (Tribunal de Contas do Estado de São Paulo), em conformidade com o novo modelo de Licitações e Contratos Públicos (Lei Federal nº 14.133/2021).

---

## 📌 Visão Geral

O projeto atua como intermediário entre a gestão pública municipal / entidades jurisdicionadas e o webservice do **TCESP (AUDESP)**. Ele permite a parametrização de editais, certames licitatórios, atas de registro de preços e ajustes/termos aditivos, gerando os esquemas JSON oficiais, validando as regras de negócio e realizando a transmissão autenticada diretamente com o piloto ou ambiente de produção do TCESP.

---

## 🚀 Módulos do Sistema

O sistema é dividido nos seguintes módulos principais da Fase IV:

1. **Autenticação AUDESP (`/api/auth`)**:
   - Integração direta com as credenciais corporativas do Portal de Sistemas do TCESP.
   - Obtenção e renovação do token de acesso do WebService.

2. **Editais (`/api/editais`)**:
   - Gestão de editais de licitação, prazos de impugnação, datas de abertura e anexos.
   - Validação com base nos schemas oficiais do TCESP.
   - Geração e transmissão do payload com protocolo de entrega.

3. **Licitações (`/api/licitacoes`)**:
   - Cadastro e acompanhamento de certames (Modalidades: Pregão Eletrônico, Concorrência, Dispensa, Inexigibilidade, etc.).
   - Controle de amparos legais, critérios de julgamento e regimes de execução.
   - Transmissão e consulta de protocolo no AUDESP.

4. **Atas de Registro de Preço (`/api/atas`)**:
   - Registro de atas decorrentes dos certames, vigências, órgãos participantes e gerenciadores.
   - Validação dos dados contratuais e envio eletrônico.

5. **Ajustes e Contratos (`/api/ajustes`)**:
   - Gestão de contratos, termos aditivos, prorrogações, apostilamentos e rescisões.
   - Envio e validação estruturada segundo os schemas da Fase IV.

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.10+**
- **FastAPI**: Framework web moderno, assíncrono e de alta performance.
- **SQLModel / SQLAlchemy**: ORM declarativo para modelagem e persistência.
- **PyMySQL**: Conector MySQL.
- **Pydantic v2**: Validação estrita de esquemas e tipos de dados.
- **Requests**: Cliente HTTP para comunicação com a API do TCESP.
- **jsonschema**: Validação de conformidade contra os esquemas JSON oficiais da Fase IV.

### Frontend
- **React 19 + TypeScript**
- **Vite**: Build tool ultrarrápida.
- **React Router 7**: Gerenciamento de rotas e navegação.
- **Bootstrap 5 + React-Bootstrap**: Estilização e componentes de interface.
- **TanStack Table (React Table)**: Tabelas dinâmicas com paginação e busca.
- **React Hook Form**: Manipulação e validação performática de formulários.
- **Lucide React**: Biblioteca moderna de ícones vetoriais.

---

## 📂 Estrutura de Pastas

```text
audesp-fase-4/
├── .env                      # Arquivo unificado de variáveis de ambiente (raiz)
├── .env.example              # Modelo unificado de variáveis de ambiente
├── docker-compose.yml        # Orquestração de contêineres Docker
├── backend/                  # API FastAPI (Python)
│   ├── core/                 # Configurações do banco, domínios e cliente HTTP AUDESP
│   │   ├── audesp_client.py  # Comunicação e endpoints do TCESP
│   │   ├── audesp_domains.py # Listagem de municípios e entidades jurisdicionadas
│   │   └── database.py       # Conexão MySQL e inicialização das tabelas
│   ├── modules/              # Módulos funcionais divididos em camadas (Controller, Service, Model)
│   │   ├── ajustes/          # Módulo de Contratos e Termos Aditivos
│   │   ├── atas/             # Módulo de Atas de Registro de Preço
│   │   ├── auth/             # Módulo de Autenticação TCESP
│   │   ├── editais/          # Módulo de Editais e Amparos Legais
│   │   └── licitacoes/       # Módulo de Licitações
│   ├── main.py               # Ponto de entrada do FastAPI e registro de rotas
│   └── requirements.txt      # Dependências Python
├── frontend/                 # Aplicação Web SPA (React + TypeScript)
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis (Input, DataTable, Select, Header)
│   │   ├── context/          # Contexto global (Autenticação Audesp)
│   │   ├── pages/            # Telas da aplicação (Login, Editais, Licitações, Atas, Ajustes)
│   │   ├── services/         # Integração HTTP via Axios com a API Backend
│   │   └── types/            # Tipagens TypeScript para entidades AUDESP
│   └── package.json          # Dependências Node.js
└── docs/                     # Schemas JSON, planilhas e referências técnicas do TCESP
```

---

## ⚙️ Como Executar o Projeto

### Pré-requisitos
- **Python 3.10 ou superior**
- **Node.js 18 ou superior**
- **MySQL 8.0+** (ou Docker para subir o banco)

---

### 0. Configuração de Variáveis de Ambiente (Arquivo Único na Raiz)

O projeto foi unificado para utilizar **apenas um arquivo `.env` na raiz**:
```bash
cp .env.example .env
```

Edite o `.env` na raiz para configurar:
```env
# 1. Portas dos Serviços (Host e Contêiner rodam na mesma porta)
DB_PORT=3306
BACKEND_PORT=8000
FRONTEND_PORT=80

# 2. Banco de Dados MySQL
DB_CONNECTION=mysql
DB_HOST=10.0.20.70          # Ou 'db' se for rodar o MySQL via Docker
DB_DATABASE=AUDESP_FASE_4
DB_USERNAME=root
DB_PASSWORD="sua_senha"

# 3. AUDESP API (Piloto para homologação | Produção para envios reais)
AUDESP_API_URL=https://audesp-piloto.tce.sp.gov.br

# 4. Frontend (URL de acesso à API no navegador)
VITE_API_URL=http://localhost:8000
```
> **Nota:** Não é necessário criar arquivos `.env` em `backend/` ou `frontend/`. O FastAPI, o Vite e o Docker Compose leem diretamente este arquivo centralizado na raiz.

---

### 1. Configurando o Backend (Execução Local)

1. Acesse o diretório do backend:
   ```bash
   cd backend
   ```

2. Crie e ative um ambiente virtual:
   ```bash
   python -m venv .venv
   source .venv/bin/activate    # Linux / macOS
   # No Windows: .venv\Scripts\activate
   ```

3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

4. Inicie o servidor da API (ele lerá as configurações do `.env` da raiz automaticamente):
   ```bash
   fastapi dev main.py --port 8000
   ```
   A documentação interativa (Swagger UI) estará disponível em: `http://localhost:8000/docs`.

---

### 2. Configurando o Frontend (Execução Local)

1. Em um novo terminal, acesse o diretório do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento (o Vite detecta automaticamente o `.env` da raiz):
   ```bash
   npm run dev
   ```
   Acesse no navegador: `http://localhost:5173`.

---

### 3. Executando com Docker e Docker Compose

O `docker-compose.yml` lê diretamente o `.env` da raiz e foi projetado para suportar tanto o uso de **banco de dados próprio/servidor interno** quanto **subir o MySQL via Docker**:

#### Cenário A: Usando Banco de Dados Próprio / Servidor Interno (Padrão)
Se sua equipe já utiliza um banco MySQL centralizado (ex: `10.0.20.70` ou servidor de rede):
1. No `.env` da raiz, configure o `DB_HOST` com o IP ou hostname do servidor.
2. Inicie os contêineres:
   ```bash
   docker compose up --build -d
   ```
   *Neste modo, apenas o `backend` e o `frontend` são iniciados; nenhum contêiner de banco é criado.*

#### Cenário B: Subindo o MySQL também no Docker (Ambiente Completo Isolado)
Se alguém desejar que o Docker suba automaticamente um contêiner MySQL 8.0:
1. No `.env` da raiz, configure:
   - Se rodar o backend no Docker: `DB_HOST=db`
   - Se rodar o backend localmente no host: `DB_HOST=127.0.0.1`
2. Inicie com o perfil `--profile db`:
   ```bash
   docker compose --profile db up --build -d
   ```
   *O serviço `db` (MySQL 8) subirá com healthcheck e persistência no volume `audesp_mysql_data`.*

#### Configuração de Portas (Host e Contêiner sempre na mesma porta)
Todas as portas são parametrizadas no `.env`. O host e o interior do contêiner rodam **sempre na mesma porta**:
- `DB_PORT`: Porta do MySQL (Padrão: `3306`). Se alterar para `3304`, o MySQL escutará na `3304` dentro do contêiner e será exposto na `3304` no host.
- `BACKEND_PORT`: Porta da API FastAPI (Padrão: `8000`). O Uvicorn escuta internamente na mesma porta exposta no host.
- `FRONTEND_PORT`: Porta da Aplicação Web Nginx (Padrão: `80`). O Nginx escuta internamente na mesma porta exposta no host.

---

#### 4. Build individual das imagens (Opcional):
- **Backend (`python:3.11-slim`)**:
  ```bash
  docker build -t audesp-backend ./backend
  docker run -d -p 8000:8000 --env-file ./.env --name audesp_backend audesp-backend
  ```
- **Frontend (`nginx:alpine` multi-stage)**:
  ```bash
  docker build --build-arg VITE_API_URL=http://localhost:8000 -t audesp-frontend ./frontend
  docker run -d -p 80:80 --name audesp_frontend audesp-frontend
  ```

---

## 📄 Licença e Uso

Este repositório destina-se à integração e transmissão de dados da administração pública junto ao Tribunal de Contas do Estado de São Paulo (TCESP) no âmbito da Nova Fase IV do AUDESP.

