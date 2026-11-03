import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Button, Modal, Badge, Spinner } from 'react-bootstrap';
import {
  Home,
  FileText,
  Award,
  Layers,
  FileCheck,
  Building2,
  LogOut,
  User as UserIcon,
  AlertOctagon,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { documentacaoService } from '../../services/documentacaoService';
import type { DocumentacaoStatusResponse } from '../../services/documentacaoService';
import { formatDateTimeBR } from '../../utils/formatters';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [docStatus, setDocStatus] = useState<DocumentacaoStatusResponse | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  const verificarDocumentacao = async (forcar: boolean = false) => {
    try {
      if (forcar) setDocLoading(true);
      const data = await documentacaoService.getStatus(forcar);
      setDocStatus(data);
      if (forcar) {
        if (data.possui_alerta) {
          toast.error('Foram detectadas alterações na documentação oficial do AUDESP.');
        } else {
          toast.success('Documentação oficial do AUDESP verificada e sem alterações pendentes.');
        }
      }
    } catch {
      // Falha silenciosa na verificação automática
    } finally {
      if (forcar) setDocLoading(false);
    }
  };

  useEffect(() => {
    verificarDocumentacao(false);
    const interval = window.setInterval(() => {
      verificarDocumentacao(false);
    }, 15 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  const handleMarcarVerificada = async () => {
    try {
      setDocLoading(true);
      const atualizado = await documentacaoService.marcarVerificada();
      setDocStatus(atualizado);
      setShowDocModal(false);
      toast.success('Documentação marcada como conferida!');
    } catch {
      toast.error('Erro ao marcar documentação como verificada.');
    } finally {
      setDocLoading(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <>
      <aside className="sidebar">
        <div className="brand d-flex align-items-center gap-2">
          <Building2 className="text-success" size={24} />
          <div>
            <span className="fw-bold d-block text-dark lh-1">AUDESP</span>
            <span className="text-muted small">Fase IV — TCESP</span>
          </div>
        </div>

        <nav className="d-flex flex-column gap-1 mt-3">
          <NavLink to="/" className="nav-link fw-bold" end>
            <Home size={18} /> Início (Dashboard)
          </NavLink>

          <div className="text-muted text-uppercase px-3 mt-3 mb-1 fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
            Módulos de Envio
          </div>

          <NavLink to="/editais" className="nav-link fw-bold">
            <FileText size={18} /> Editais
          </NavLink>

          <NavLink to="/licitacoes" className="nav-link fw-bold">
            <Award size={18} /> Licitações
          </NavLink>

          <NavLink to="/atas" className="nav-link fw-bold">
            <Layers size={18} /> Atas de Registro (ARP)
          </NavLink>

          <NavLink to="/ajustes" className="nav-link fw-bold">
            <FileCheck size={18} /> Ajustes e Contratos
          </NavLink>

          <div className="text-muted text-uppercase px-3 mt-3 mb-1 fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
            Consultas TCESP
          </div>

          <NavLink to="/protocolos" className="nav-link fw-bold">
            <Search size={18} /> Consultar Protocolos
          </NavLink>
        </nav>
      </aside>

      <header className="top-header d-flex justify-content-end align-items-center px-4">
        <div className="d-flex align-items-center gap-3">
          {docStatus?.possui_alerta && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDocModal(true)}
              className="d-flex align-items-center gap-1 py-1 px-2 fw-semibold shadow-sm"
              title="A documentação oficial do AUDESP foi alterada. Clique para ver detalhes."
            >
              <AlertOctagon size={15} />
              <span>Documentação AUDESP Alterada</span>
              <Badge bg="light" text="danger" pill className="ms-1">
                {docStatus.alteracoes.length}
              </Badge>
            </Button>
          )}

          {user && (
            <div className="d-flex align-items-center gap-2 text-muted small">
              <UserIcon size={16} className="text-secondary" />
              <span className="fw-medium text-dark">{user.email}</span>
            </div>
          )}

          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleLogout}
            className="d-flex align-items-center gap-1 py-1 px-2"
            title="Sair do sistema e encerrar sessão AUDESP"
          >
            <LogOut size={14} />
            <span>Sair</span>
          </Button>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <Modal show={showDocModal} onHide={() => setShowDocModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2 text-danger">
            <AlertOctagon size={18} />
            <span>Documentação Oficial do AUDESP Alterada</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">
          <p className="mb-2">
            A documentação oficial da Fase IV no portal do TCESP mudou desde a última conferência.
            Recomenda-se revisar os novos JSON Schemas, planilhas de domínios ou especificação da API.
          </p>
          {docStatus?.detectada_em && (
            <p className="text-muted mb-3">
              Detectada em: <strong>{formatDateTimeBR(docStatus.detectada_em)}</strong>
            </p>
          )}

          <div className="fw-bold mb-1">Alterações identificadas:</div>
          <ul className="mb-3 ps-3 text-danger fw-medium">
            {(docStatus?.alteracoes || []).map((alt, idx) => (
              <li key={idx}>{alt}</li>
            ))}
          </ul>

          <div className="fw-bold mb-1">Páginas monitoradas do TCESP:</div>
          <div className="d-flex flex-column gap-1 bg-light p-2 rounded border">
            <a
              href={docStatus?.pagina_tce || 'https://www.tce.sp.gov.br/audesp/documentacao/reformulacao-fase-iv-jsonschemas-e-documentacao-xlsx'}
              target="_blank"
              rel="noreferrer"
              className="text-decoration-none d-inline-flex align-items-center gap-1"
            >
              <ExternalLink size={13} /> JSON Schemas e Documentação XLSX (Fase IV)
            </a>
            <a
              href={docStatus?.pagina_api || 'https://audesp.tce.sp.gov.br/api'}
              target="_blank"
              rel="noreferrer"
              className="text-decoration-none d-inline-flex align-items-center gap-1"
            >
              <ExternalLink size={13} /> Swagger / Especificação OpenAPI (audesp.yaml)
            </a>
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => verificarDocumentacao(true)}
            disabled={docLoading}
            className="d-flex align-items-center gap-1"
          >
            {docLoading ? <Spinner animation="border" size="sm" /> : <RefreshCw size={14} />}
            <span>Reverificar Agora</span>
          </Button>
          <div className="d-flex gap-2">
            <Button
              variant="outline-success"
              size="sm"
              onClick={handleMarcarVerificada}
              disabled={docLoading}
              className="d-flex align-items-center gap-1"
            >
              <CheckCircle2 size={14} /> Marcar como Verificada
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowDocModal(false)}>
              Fechar
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
};
