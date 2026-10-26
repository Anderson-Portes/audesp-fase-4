import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Button, 
  Alert, 
  Spinner 
} from 'react-bootstrap';
import {
  Building2,
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/api/auth/login', { email, senha });
      const token = res.data?.token || res.data?.access_token;

      if (token) {
        signIn(token, res.data.user || { email }, res.data.tempoExpiracao || 3600);
        navigate('/', { replace: true });
      } else {
        setErrorMsg('TCESP respondeu com sucesso, mas o token de acesso não foi retornado.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Erro ao comunicar com a API do AUDESP.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light p-3">
      <Card className="border-0 shadow-sm p-4 p-md-5" style={{ maxWidth: '440px', width: '100%', borderRadius: '1rem' }}>
        {/* Cabeçalho do Card */}
        <div className="text-center mb-4">
          <div className="d-inline-flex p-3 bg-success bg-opacity-10 text-success rounded-circle mb-3">
            <Building2 size={36} />
          </div>
          <h3 className="fw-bold text-dark mb-1">AUDESP — Fase IV</h3>
          <p className="text-muted small mb-0">
            Módulo de Licitações e Contratos (TCESP)
          </p>
        </div>

        {/* Mensagem de Erro com Alert do React-Bootstrap */}
        {errorMsg && (
          <Alert variant="danger" className="border-0 bg-danger bg-opacity-10 py-2 px-3 small d-flex align-items-center gap-2 mb-3">
            <AlertCircle size={18} className="text-danger flex-shrink-0" />
            <span>{errorMsg}</span>
          </Alert>
        )}

        {/* Formulário de Login com Form do React-Bootstrap */}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="loginEmail">
            <Form.Label className="d-flex align-items-center gap-1 small fw-bold">
              <Mail size={15} /> E-mail (Portal TCESP)
            </Form.Label>
            <Form.Control
              type="email"
              placeholder="seu.email@orgao.sp.gov.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="loginSenha">
            <Form.Label className="d-flex align-items-center gap-1 small fw-bold">
              <Lock size={15} /> Senha (Portal TCESP)
            </Form.Label>
            <Form.Control
              type="password"
              placeholder="Sua senha de acesso"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </Form.Group>

          <Button
            type="submit"
            variant="success"
            className="w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-bold"
            disabled={loading || !email || !senha}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" />
                Autenticando no TCESP...
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Entrar com Credenciais TCESP
              </>
            )}
          </Button>
        </Form>

        {/* Informação sobre segurança e credenciais */}
        <div className="mt-4 pt-3 border-top text-center text-muted small" style={{ fontSize: '0.8rem' }}>
          <p className="mb-1">
            Suas credenciais são transmitidas diretamente à API oficial do AUDESP e <strong>não são armazenadas no banco de dados</strong>.
          </p>
          <a
            href="https://sso.tce.sp.gov.br"
            target="_blank"
            rel="noreferrer"
            className="text-decoration-none text-muted d-inline-flex align-items-center gap-1 mt-1"
          >
            Portal de Sistemas TCESP <ExternalLink size={12} />
          </a>
        </div>
      </Card>
    </div>
  );
};
