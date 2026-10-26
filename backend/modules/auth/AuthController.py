from fastapi import APIRouter
from pydantic import BaseModel
from modules.auth.AuthService import AuthService

router = APIRouter(prefix="/api/auth", tags=["Autenticação AUDESP"])

class LoginRequest(BaseModel):
    email: str
    senha: str

@router.post("/login")
async def login_audesp(dados: LoginRequest):
    """
    Autentica o usuário com suas credenciais do Portal de Sistemas TCESP
    diretamente na API do AUDESP delegando para AuthService.
    """
    return await AuthService.autenticar(email=dados.email, senha=dados.senha)
