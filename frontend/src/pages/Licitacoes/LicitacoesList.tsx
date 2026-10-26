import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Button, 
  ButtonGroup, 
  InputGroup, 
  Form, 
  Card, 
  Badge, 
  Spinner 
} from 'react-bootstrap';
import { 
  Award, 
  Plus, 
  Search, 
  RefreshCw, 
  Send, 
  Edit, 
  Trash2, 
  FileCheck, 
  AlertTriangle, 
  RotateCcw,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '../../components/PageHeader/PageHeader';
import { licitacaoService } from '../../services/licitacaoService';
import type { Licitacao } from '../../types/licitacao';
import { formatDateBR, formatPncpMask } from '../../utils/formatters';

export const LicitacoesList: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'draft' | 'sent'>('draft');
  const [search, setSearch] = useState('');
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const carregarLicitacoes = async () => {
    try {
      setLoading(true);
      const data = await licitacaoService.getLicitacoes(tab, search);
      setLicitacoes(data);
    } catch {
      toast.error('Erro ao carregar lista de licitações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLicitacoes();
  }, [tab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    carregarLicitacoes();
  };

  const handleExcluir = async (id: number, codigoEdital: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o rascunho da licitação vinculada ao edital ${codigoEdital}?`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      await licitacaoService.deleteLicitacao(id);
      toast.success('Rascunho excluído com sucesso');
      carregarLicitacoes();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Erro ao excluir rascunho';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEnviar = async (id: number, codigoEdital: string) => {
    if (!window.confirm(`Confirma o envio da licitação do edital ${codigoEdital} para o AUDESP Fase IV?`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      const res = await licitacaoService.enviarLicitacao(id);
      toast.success(`Licitação transmitida com sucesso! Protocolo: ${res.protocolo}`);
      carregarLicitacoes();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail && detail.erros && detail.erros.length > 0) {
        toast.error(
          <div>
            <strong>Erros de Validação da Licitação:</strong>
            <ul className="mb-0 ps-3 mt-1 small">
              {detail.erros.map((e: string, i: number) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>,
          { duration: 7000 }
        );
      } else {
        toast.error(detail?.mensagem || detail || 'Erro ao transmitir licitação ao AUDESP');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConsultarProtocolo = async (id: number) => {
    try {
      setActionLoadingId(id);
      const res = await licitacaoService.consultarProtocolo(id);
      toast.success(`Situação atualizada no AUDESP: ${res.status}`);
      carregarLicitacoes();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Erro ao consultar protocolo';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRetornarRascunho = async (id: number) => {
    if (!window.confirm('Deseja retornar esta licitação para rascunho para poder editá-la e reenviá-la?')) {
      return;
    }
    try {
      setActionLoadingId(id);
      await licitacaoService.retornarRascunho(id);
      toast.success('Licitação retornada para rascunho.');
      setTab('draft');
    } catch {
      toast.error('Erro ao retornar licitação para rascunho');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (lic: Licitacao) => {
    if (lic.status === 'draft') {
      return <Badge bg="secondary">Rascunho Local</Badge>;
    }
    const st = (lic.status_protocolo || 'Recebido').toLowerCase();
    if (st.includes('armazenado')) {
      return (
        <Badge bg="success" className="d-inline-flex align-items-center gap-1">
          <CheckCircle2 size={12} /> Armazenado
        </Badge>
      );
    }
    if (st.includes('rejeitado')) {
      return (
        <Badge bg="danger" className="d-inline-flex align-items-center gap-1">
          <AlertTriangle size={12} /> Rejeitado
        </Badge>
      );
    }
    return (
      <Badge bg="primary" className="d-inline-flex align-items-center gap-1">
        <FileCheck size={12} /> {lic.status_protocolo || 'Recebido'}
      </Badge>
    );
  };

  return (
    <Container fluid className="p-0">
      <PageHeader 
        title="Licitações e Julgamentos de Propostas (Fase IV)"
        actions={
          <Button 
            variant="light"
            onClick={() => navigate('/licitacoes/novo')}
            className="text-success fw-bold d-flex align-items-center gap-2 shadow-sm"
          >
            <Plus size={18} /> Nova Licitação
          </Button>
        }
      />

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        {/* Tabs com ButtonGroup do React-Bootstrap */}
        <ButtonGroup className="shadow-sm bg-white p-1 rounded">
          <Button
            size="sm"
            variant={tab === 'draft' ? 'success' : 'light'}
            className={`px-4 py-2 fw-medium ${tab === 'draft' ? 'text-white shadow-sm' : 'text-dark'}`}
            onClick={() => setTab('draft')}
          >
            <Edit size={16} className="me-1 d-inline" /> Rascunhos
          </Button>
          <Button
            size="sm"
            variant={tab === 'sent' ? 'success' : 'light'}
            className={`px-4 py-2 fw-medium ${tab === 'sent' ? 'text-white shadow-sm' : 'text-dark'}`}
            onClick={() => setTab('sent')}
          >
            <CheckCircle2 size={16} className="me-1 d-inline" /> Enviadas ao AUDESP
          </Button>
        </ButtonGroup>

        {/* Busca com Form e InputGroup */}
        <Form onSubmit={handleSearchSubmit} className="d-flex align-items-center gap-2">
          <InputGroup size="sm" style={{ width: '320px' }}>
            <InputGroup.Text className="bg-white border-end-0">
              <Search size={16} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              className="border-start-0 ps-0"
              placeholder="Filtrar por código edital, processo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button 
                variant="outline-secondary" 
                onClick={() => { setSearch(''); carregarLicitacoes(); }}
              >
                ×
              </Button>
            )}
            <Button type="submit" variant="outline-success">
              Filtrar
            </Button>
          </InputGroup>

          <Button
            size="sm"
            variant="outline-secondary"
            onClick={carregarLicitacoes}
            className="d-flex align-items-center gap-1"
            title="Atualizar lista"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </Button>
        </Form>
      </div>

      {loading ? (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <Spinner animation="border" variant="success" />
            <p className="text-muted mt-2 mb-0">Carregando licitações...</p>
          </Card.Body>
        </Card>
      ) : licitacoes.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <Award size={48} className="text-muted opacity-50 mb-3" />
            <h5 className="text-secondary fw-semibold">
              {search ? 'Nenhuma licitação encontrada para o filtro' : tab === 'draft' ? 'Nenhum rascunho de licitação' : 'Nenhuma licitação transmitida ao AUDESP'}
            </h5>
            <p className="text-muted small">
              {tab === 'draft' 
                ? 'Clique no botão "+ Nova Licitação" acima para cadastrar os resultados e propostas de um certame.' 
                : 'As licitações homologadas transmitidas ao AUDESP aparecerão nesta aba.'}
            </p>
            {tab === 'draft' && (
              <Button 
                variant="success" 
                size="sm" 
                onClick={() => navigate('/licitacoes/novo')}
                className="mt-2"
              >
                Cadastrar Primeira Licitação
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <div className="d-flex flex-column gap-3">
          {licitacoes.map((lic) => {
            const isLoading = actionLoadingId === lic.id;
            const isRejected = (lic.status_protocolo || '').toLowerCase().includes('rejeitado');
            const displayCodigo = lic.codigo_edital.length === 25 ? formatPncpMask(lic.codigo_edital) : lic.codigo_edital;

            return (
              <Card key={lic.id} className="shadow-sm border-0">
                <Card.Body className="p-3">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold font-monospace text-dark fs-6">
                        {displayCodigo}
                      </span>
                      {lic.retificacao && (
                        <Badge bg="warning" text="dark" className="small">Retificação</Badge>
                      )}
                      {getStatusBadge(lic)}
                    </div>

                    <ButtonGroup size="sm">
                      {tab === 'draft' ? (
                        <>
                          <Button
                            variant="outline-primary"
                            onClick={() => navigate(`/licitacoes/${lic.id}`)}
                            disabled={isLoading}
                            title="Editar rascunho"
                          >
                            <Edit size={14} /> Editar
                          </Button>
                          <Button
                            variant="success"
                            onClick={() => handleEnviar(lic.id, lic.codigo_edital)}
                            disabled={isLoading}
                            title="Transmitir licitação para a API do AUDESP"
                          >
                            <Send size={14} className="me-1" /> Transmitir
                          </Button>
                          <Button
                            variant="outline-danger"
                            onClick={() => handleExcluir(lic.id, lic.codigo_edital)}
                            disabled={isLoading}
                            title="Excluir rascunho"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline-info"
                            onClick={() => handleConsultarProtocolo(lic.id)}
                            disabled={isLoading}
                            title="Consultar situação do protocolo no AUDESP"
                          >
                            <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Consultar Protocolo
                          </Button>
                          {isRejected && (
                            <Button
                              variant="outline-warning"
                              onClick={() => handleRetornarRascunho(lic.id)}
                              disabled={isLoading}
                              title="Retornar para rascunho e corrigir erros apontados pelo AUDESP"
                            >
                              <RotateCcw size={14} className="me-1" /> Destravar p/ Rascunho
                            </Button>
                          )}
                        </>
                      )}
                    </ButtonGroup>
                  </div>

                  <Row className="mt-3 g-2 small text-muted">
                    <Col md={3}>
                      <span>Nº Compra:</span>{' '}
                      <strong className="text-dark">{lic.numero_compra || '-'} / {lic.ano_compra || '-'}</strong>
                    </Col>
                    <Col md={3}>
                      <span>Nº Processo:</span>{' '}
                      <strong className="text-dark">{lic.numero_processo || '-'}</strong>
                    </Col>
                    <Col md={3}>
                      <span>Município / Entidade:</span>{' '}
                      <strong className="text-dark">{lic.municipio} / {lic.entidade}</strong>
                    </Col>
                    <Col md={3} className="text-md-end">
                      <span className="d-inline-flex align-items-center gap-1">
                        <Calendar size={13} />
                        {formatDateBR(lic.updated_at)}
                      </span>
                    </Col>
                  </Row>

                  {lic.objeto_edital && (
                    <div className="mt-2 text-secondary small bg-light p-2 rounded">
                      <strong>Objeto:</strong> {lic.objeto_edital}
                    </div>
                  )}

                  {lic.protocolo && (
                    <div className="mt-2 p-2 bg-light rounded d-flex flex-wrap justify-content-between align-items-center small">
                      <div>
                        <span className="text-muted">Protocolo AUDESP: </span>
                        <code className="fw-bold fs-6 text-primary">{lic.protocolo}</code>
                      </div>
                      {lic.status_protocolo && (
                        <div className="d-flex align-items-center gap-1">
                          <span className="text-muted">Status do Recibo:</span>
                          <span className="fw-bold">{lic.status_protocolo}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {lic.detalhes_protocolo && isRejected && (
                    <div className="mt-2 alert alert-danger py-2 px-3 small mb-0">
                      <strong>Retorno de Rejeição AUDESP:</strong>
                      <pre className="mb-0 mt-1" style={{ whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                        {lic.detalhes_protocolo}
                      </pre>
                    </div>
                  )}
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}
    </Container>
  );
};
