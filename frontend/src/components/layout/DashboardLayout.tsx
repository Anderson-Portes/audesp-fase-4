import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { 
  Home, 
  FileText, 
  Award, 
  Layers, 
  FileCheck, 
  Search, 
  Building2,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

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
            Acompanhamento
          </div>

          <NavLink to="/consultas" className="nav-link fw-bold">
            <Search size={18} /> Consultar Protocolos
          </NavLink>
        </nav>
      </aside>

      <header className="top-header d-flex justify-content-between align-items-center px-4">
        <div>
          <span className="text-muted small fw-medium">
            Prodesan — Tecnologia da Informação
          </span>
        </div>

        <div className="d-flex align-items-center gap-3">
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
    </>
  );
};
