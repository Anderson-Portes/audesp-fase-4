import os
import time
import logging
from typing import Generator
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlmodel import create_engine, SQLModel, Session

# Carrega as variáveis de ambiente do .env na raiz do projeto (ou no diretório atual)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ROOT_ENV = os.path.join(ROOT_DIR, ".env")
if os.path.exists(ROOT_ENV):
    load_dotenv(ROOT_ENV)
else:
    load_dotenv()

# Lê as credenciais do .env
DB_USER = os.getenv("DB_USERNAME") or os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD") or ""
if DB_PASSWORD:
    DB_PASSWORD = DB_PASSWORD.strip('"\'')
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_DATABASE") or os.getenv("DB_NAME", "AUDESP_FASE_4")

# Monta a URL do banco dinamicamente (quote_plus escapa caracteres especiais como @ e # na senha)
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables(max_retries: int = 15, delay_seconds: int = 2):
    """Cria todas as tabelas registradas no SQLModel, com retentativas caso o banco esteja inicializando."""
    for attempt in range(1, max_retries + 1):
        try:
            SQLModel.metadata.create_all(engine)
            logging.info(f"✅ Conexão com banco '{DB_NAME}' ({DB_HOST}:{DB_PORT}) estabelecida e tabelas sincronizadas.")
            return
        except Exception as e:
            if attempt < max_retries:
                logging.warning(f"⏳ Aguardando banco de dados responder em {DB_HOST}:{DB_PORT} (tentativa {attempt}/{max_retries})...")
                time.sleep(delay_seconds)
            else:
                logging.error(f"❌ Falha definitiva ao conectar no banco de dados após {max_retries} tentativas: {e}")
                raise e

def get_session() -> Generator[Session, None, None]:
    """Dependency do FastAPI para obter sessão do banco"""
    with Session(engine) as session:
        yield session

if __name__ == "__main__":
    if not DB_USER or not DB_PASSWORD:
        print("Erro: Preencha DB_USER e DB_PASSWORD no arquivo .env antes de prosseguir.")
    else:
        create_db_and_tables()
        print(f"Tabelas criadas com sucesso no banco '{DB_NAME}'!")

