from fastapi import HTTPException, status
from core.audesp_client import autenticar_audesp

class AuthService:
    """Camada de serviço para autenticação no AUDESP Fase IV."""

    @staticmethod
    async def autenticar(email: str, senha: str) -> dict:
        """
        Autentica credenciais corporativas no WebService AUDESP.
        Retorna o token JWT e tempo de expiração caso válido.
        """
        if not email or not senha:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Informe o e-mail e a senha do Portal de Sistemas do TCESP."
            )

        resultado = autenticar_audesp(
            email=email.strip(),
            senha=senha
        )

        if not resultado.get("sucesso"):
            status_code = resultado.get("status_code", 400)
            http_status = status_code if status_code in [400, 401, 403, 503, 504] else 400
            raise HTTPException(status_code=http_status, detail=resultado.get("mensagem"))

        return {
            "sucesso": True,
            "token": resultado["token"],
            "tempoExpiracao": resultado.get("tempoExpiracao", 3600),
            "user": {
                "email": email.strip()
            }
        }
