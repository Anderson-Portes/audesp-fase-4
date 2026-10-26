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
- **MySQL 8.0+**

---

### 1. Configurando o Backend

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

4. Configure as variáveis de ambiente:
   - Copie o arquivo de exemplo:
     ```bash
     cp .env.example .env
     ```
   - Edite o `.env` com suas credenciais do MySQL:
     ```env
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_DATABASE=AUDESP_FASE_4
     DB_USERNAME=seu_usuario
     DB_PASSWORD=sua_senha

     # AUDESP API (Piloto para homologação | Produção para envios reais)
     AUDESP_API_URL=https://audesp-piloto.tce.sp.gov.br
     ```

5. Inicie o servidor da API:
   ```bash
   fastapi dev main.py --port 8000
   ```
   A documentação interativa (Swagger UI) estará disponível em: `http://localhost:8000/docs`.

---

### 2. Configurando o Frontend

1. Em um novo terminal, acesse o diretório do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o arquivo de ambiente:
   - Copie o arquivo de exemplo:
     ```bash
     cp .env.example .env
     ```
   - Defina o endereço da API FastAPI:
     ```env
     VITE_API_URL=http://localhost:8000
     ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse no navegador: `http://localhost:5173`.

---

## 📄 Licença e Uso

Este repositório destina-se à integração e transmissão de dados da administração pública junto ao Tribunal de Contas do Estado de São Paulo (TCESP) no âmbito da Nova Fase IV do AUDESP.
