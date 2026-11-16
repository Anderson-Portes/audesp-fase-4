import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Award, Layers, FileCheck, Search, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { CardBox } from '../../components/CardBox';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader 
        title="Painel Geral AUDESP — Fase IV" 
        description="Módulo de Licitações e Contratos (TCESP) — Transmissão Direta em JSON via API"
      />

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <CardBox 
            className="h-100 shadow-sm border-0 cursor-pointer"
            actions={
              <button 
                onClick={() => navigate('/editais')}
                className="btn btn-outline-success btn-sm"
              >
                Acessar Editais &rarr;
              </button>
            }
          >
            <div 
              className="d-flex align-items-center gap-3"
              onClick={() => navigate('/editais')}
            >
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                <FileText size={28} />
              </div>
              <div>
                <span className="text-muted small">Módulo 1</span>
                <h5 className="mb-0 fw-bold">Editais</h5>
                <span className="badge bg-success mt-1">Prazo: 5 dias úteis</span>
              </div>
            </div>
            <p className="text-muted small mt-3 mb-0" onClick={() => navigate('/editais')}>
              Envio de editais, termos de referência e atos convocatórios em formato JSON com upload do PDF (até 30 MB).
            </p>
          </CardBox>
        </div>


        <div className="col-md-4">
          <CardBox 
            className="h-100 shadow-sm border-0 cursor-pointer"
            actions={
              <button 
                onClick={() => navigate('/licitacoes')}
                className="btn btn-outline-success btn-sm"
              >
                Acessar Licitações &rarr;
              </button>
            }
          >
            <div 
              className="d-flex align-items-center gap-3"
              onClick={() => navigate('/licitacoes')}
            >
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-3">
                <Award size={28} />
              </div>
              <div>
                <span className="text-muted small">Módulo 2</span>
                <h5 className="mb-0 fw-bold">Licitações</h5>
                <span className="badge bg-primary mt-1">Prazo: 10 dias úteis</span>
              </div>
            </div>
            <p className="text-muted small mt-3 mb-0" onClick={() => navigate('/licitacoes')}>
              Homologações, adjudicações, propostas vencedoras e itens do certame em formato JSON.
            </p>
          </CardBox>
        </div>

        <div className="col-md-4">
          <CardBox 
            className="h-100 shadow-sm border-0 cursor-pointer"
            actions={
              <button 
                onClick={() => navigate('/atas')}
                className="btn btn-outline-warning btn-sm"
              >
                Acessar Atas &rarr;
              </button>
            }
          >
            <div 
              className="d-flex align-items-center gap-3"
              onClick={() => navigate('/atas')}
            >
              <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-3">
                <Layers size={28} />
              </div>
              <div>
                <span className="text-muted small">Módulo 3</span>
                <h5 className="mb-0 fw-bold">Atas de Registro (ARP)</h5>
                <span className="badge bg-warning text-dark mt-1">Prazo: 15 dias úteis</span>
              </div>
            </div>
            <p className="text-muted small mt-3 mb-0" onClick={() => navigate('/atas')}>
              Atas de registro de preços vinculadas às licitações de origem homologadas no TCESP.
            </p>
          </CardBox>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <CardBox 
            className="h-100 shadow-sm border-0 cursor-pointer"
            actions={
              <button 
                onClick={() => navigate('/ajustes')}
                className="btn btn-outline-danger btn-sm"
              >
                Acessar Ajustes &rarr;
              </button>
            }
          >
            <div 
              className="d-flex align-items-center gap-3"
              onClick={() => navigate('/ajustes')}
            >
              <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-3">
                <FileCheck size={28} />
              </div>
              <div>
                <span className="text-muted small">Módulo 4</span>
                <h5 className="mb-0 fw-bold">Ajustes e Contratos</h5>
                <span className="badge bg-danger mt-1">Prazo: 22 dias úteis</span>
              </div>
            </div>
            <p className="text-muted small mt-3 mb-0" onClick={() => navigate('/ajustes')}>
              Contratos, termos de aditamento e notas de empenho substitutivas.
            </p>
          </CardBox>
        </div>

        <div className="col-md-4">
          <CardBox 
            className="h-100 shadow-sm border-0 cursor-pointer"
            actions={
              <button 
                onClick={() => navigate('/protocolos')}
                className="btn btn-outline-info btn-sm"
              >
                Consultar Protocolos &rarr;
              </button>
            }
          >
            <div 
              className="d-flex align-items-center gap-3"
              onClick={() => navigate('/protocolos')}
            >
              <div className="p-3 bg-info bg-opacity-10 text-info rounded-3">
                <Search size={28} />
              </div>
              <div>
                <span className="text-muted small">Consultas</span>
                <h5 className="mb-0 fw-bold">Protocolos e Recibos</h5>
                <span className="badge bg-info mt-1">Tempo Real</span>
              </div>
            </div>
            <p className="text-muted small mt-3 mb-0" onClick={() => navigate('/protocolos')}>
              Acompanhamento de status de validação no TCESP (Recebido, Armazenado ou Rejeitado) de todos os módulos.
            </p>
          </CardBox>
        </div>

        <div className="col-md-4">
          <CardBox className="h-100 shadow-sm border-0">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-secondary bg-opacity-10 text-secondary rounded-3">
                <ShieldCheck size={28} />
              </div>
              <div>
                <span className="text-muted small">Ambiente</span>
                <h5 className="mb-0 fw-bold">Regras & Alçada</h5>
                <span className="badge bg-dark mt-1">&ge; 2.500 UFESPs</span>
              </div>
            </div>
            <p className="text-muted small mt-3 mb-0">
              Obrigatoriedade geral a partir de 03/11/2026 com prazo de regularização de estoque de 90 dias.
            </p>
          </CardBox>
        </div>
      </div>
    </div>
  );
};

