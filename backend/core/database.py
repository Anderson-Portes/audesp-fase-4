import os
from typing import Generator
from dotenv import load_dotenv
from sqlmodel import create_engine, SQLModel, Session

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Lê as credenciais do .env
DB_USER = os.getenv("DB_USERNAME") or os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
if DB_PASSWORD:
    DB_PASSWORD = DB_PASSWORD.strip('"\'')
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_DATABASE") or os.getenv("DB_NAME", "AUDESP_FASE_4")

# Monta a URL do banco dinamicamente
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    """Cria todas as tabelas registradas no SQLModel"""
    SQLModel.metadata.create_all(engine)

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

