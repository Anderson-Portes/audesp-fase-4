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
  FileDown,
  Calendar,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '../../components/PageHeader/PageHeader';
import {
  ProtocoloErrosAlert,
  HistoricoProtocoloModal,
  notificarResultadoProtocolo,
} from '../../components/ProtocoloInfo/ProtocoloComponents';
import { ImportacaoExportacaoToolbar } from '../../components/ImportacaoExportacao/ImportacaoExportacaoModal';
import { editalService } from '../../services/editalService';
import type { Edital } from '../../types/edital';
import type { HistoricoProtocoloItem } from '../../utils/protocoloFormatter';
import { formatDateBR, formatPncpMask } from '../../utils/formatters';

export const EditaisList: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'draft' | 'sent'>('draft');
  const [search, setSearch] = useState('');
  const [editais, setEditais] = useState<Edital[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoItems, setHistoricoItems] = useState<HistoricoProtocoloItem[]>([]);
  const [historicoDocInfo, setHistoricoDocInfo] = useState<{ codigo: string; protocolo?: string | null }>({
    codigo: '',
    protocolo: null,
  });

  const carregarEditais = async () => {
    try {
      setLoading(true);
      const data = await editalService.getEditais(tab, search);
      setEditais(data);
    } catch {
      toast.error('Erro ao carregar lista de editais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEditais();
  }, [tab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    carregarEditais();
  };

  const handleExcluir = async (id: number, codigo: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o rascunho do edital ${codigo}?`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      await editalService.deleteEdital(id);
      toast.success('Rascunho de edital excluído com sucesso');
      carregarEditais();
    } catch {
      toast.error('Erro ao excluir rascunho de edital');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownloadPdf = async (id: number, codigo: string) => {
    try {
      setActionLoadingId(id);
      const blob = await editalService.downloadPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Edital_${codigo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error('Erro ao baixar PDF do edital');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEnviar = async (id: number, codigo: string) => {
    if (!window.confirm(`Confirma o envio do edital ${codigo} para o AUDESP Fase IV?`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      const res = await editalService.enviarEdital(id);
      notificarResultadoProtocolo(res, {
        prefixoSucesso: 'Edital enviado com sucesso!',
        isTransmissao: true,
      });
      carregarEditais();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail && detail.erros && detail.erros.length > 0) {
        toast.error(
          <div>
            <strong>Erros de Validação AUDESP:</strong>
            <ul className="mb-0 ps-3 mt-1 small">
              {detail.erros.map((e: string, i: number) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>,
          { duration: 7000 }
        );
      } else {
        toast.error(detail?.mensagem || detail || 'Erro ao transmitir edital ao AUDESP');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConsultarProtocolo = async (id: number) => {
    try {
      setActionLoadingId(id);
      const res = await editalService.consultarProtocolo(id);
      notificarResultadoProtocolo(res, { isTransmissao: false });
      carregarEditais();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Erro ao consultar protocolo';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleVerHistoricoProtocolo = async (edital: Edital) => {
    setHistoricoDocInfo({
      codigo: edital.codigo_edital,
      protocolo: edital.protocolo,
    });
    setShowHistoricoModal(true);
    try {
      setHistoricoLoading(true);
      const data = await editalService.getHistoricoProtocolo(edital.id);
      setHistoricoItems(data);
    } catch {
      toast.error('Erro ao carregar histórico de consultas do protocolo');
    } finally {
      setHistoricoLoading(false);
    }
  };

  const handleRetornarRascunho = async (id: number) => {
    if (!window.confirm('Deseja retornar este edital para rascunho para poder editá-lo e reenviá-lo?')) {
      return;
    }
    try {
      setActionLoadingId(id);
      await editalService.retornarRascunho(id);
      toast.success('Edital retornado para rascunho.');
      setTab('draft');
    } catch {
      toast.error('Erro ao retornar edital para rascunho');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (edital: Edital) => {
    if (edital.status === 'draft') {
      return <Badge bg="secondary">Rascunho Local</Badge>;
    }
    const st = (edital.status_protocolo || 'Recebido').toLowerCase();
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
        <FileCheck size={12} /> {edital.status_protocolo || 'Recebido'}
      </Badge>
    );
  };

  return (
    <Container fluid className="p-0">
      <PageHeader 
        title="Editais de Licitação e Contratação Direta (Fase IV)"
      />

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        {/* Tabs com ButtonGroup do React-Bootstrap e Botão Novo */}
        <div className="d-flex align-items-center gap-3">
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
              <CheckCircle2 size={16} className="me-1 d-inline" /> Enviados ao AUDESP
            </Button>
          </ButtonGroup>

          <Button 
            variant="success"
            size="sm"
            onClick={() => navigate('/editais/novo')}
            className="fw-bold d-flex align-items-center gap-2 shadow-sm py-2 px-3"
          >
            <Plus size={18} /> Novo Edital
          </Button>

          <ImportacaoExportacaoToolbar
            modulo="editais"
            tituloModulo="Editais"
            onImportSuccess={carregarEditais}
          />
        </div>

        {/* Busca com Form e InputGroup */}
        <Form onSubmit={handleSearchSubmit} className="d-flex align-items-center gap-2">
          <InputGroup size="sm" style={{ width: '320px' }}>
            <InputGroup.Text className="bg-white border-end-0">
              <Search size={16} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              className="border-start-0 ps-0"
              placeholder="Filtrar por código, processo, objeto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button 
                variant="outline-secondary" 
                onClick={() => { setSearch(''); carregarEditais(); }}
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
            onClick={carregarEditais}
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
            <p className="text-muted mt-2 mb-0">Carregando editais...</p>
          </Card.Body>
        </Card>
      ) : editais.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <h5 className="text-secondary fw-semibold">
              {search ? 'Nenhum edital encontrado para o filtro' : tab === 'draft' ? 'Nenhum rascunho de edital' : 'Nenhum edital transmitido ao AUDESP'}
            </h5>
            <p className="text-muted small">
              {tab === 'draft' 
                ? 'Clique no botão "+ Novo Edital" acima para começar a cadastrar um instrumento convocatório.' 
                : 'Os editais transmitidos com sucesso para a API do AUDESP aparecerão nesta aba.'}
            </p>
            {tab === 'draft' && (
              <Button 
                variant="success" 
                size="sm" 
                onClick={() => navigate('/editais/novo')}
                className="mt-2"
              >
                Cadastrar Primeiro Edital
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <div className="d-flex flex-column gap-3">
          {editais.map((edital) => {
            const isLoading = actionLoadingId === edital.id;
            const isRejected = (edital.status_protocolo || '').toLowerCase().includes('rejeitado');
            const displayCodigo = edital.codigo_edital.length === 25 ? formatPncpMask(edital.codigo_edital) : edital.codigo_edital;

            return (
              <Card key={edital.id} className="shadow-sm border-0">
                <Card.Body className="p-3">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold font-monospace text-dark fs-6">
                        {displayCodigo}
                      </span>
                      {edital.retificacao && (
                        <Badge bg="warning" text="dark" className="small">Retificação</Badge>
                      )}
                      {getStatusBadge(edital)}
                    </div>

                    {/* Ações com ButtonGroup do React-Bootstrap */}
                    <ButtonGroup size="sm">
                      {edital.pdf_nome_original && (
                        <Button
                          variant="outline-secondary"
                          onClick={() => handleDownloadPdf(edital.id, edital.codigo_edital)}
                          disabled={isLoading}
                          title={`Baixar PDF: ${edital.pdf_nome_original}`}
                        >
                          <FileDown size={14} className="me-1" /> PDF
                        </Button>
                      )}

                      {tab === 'draft' ? (
                        <>
                          <Button
                            variant="outline-primary"
                            onClick={() => navigate(`/editais/${edital.id}`)}
                            disabled={isLoading}
                            title="Editar rascunho"
                          >
                            <Edit size={14} /> Editar
                          </Button>
                          <Button
                            variant="success"
                            onClick={() => handleEnviar(edital.id, edital.codigo_edital)}
                            disabled={isLoading}
                            title="Transmitir edital para a API do AUDESP"
                          >
                            <Send size={14} className="me-1" /> Transmitir
                          </Button>
                          <Button
                            variant="outline-danger"
                            onClick={() => handleExcluir(edital.id, edital.codigo_edital)}
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
                            onClick={() => handleConsultarProtocolo(edital.id)}
                            disabled={isLoading}
                            title="Consultar situação do protocolo no AUDESP"
                          >
                            <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Consultar Protocolo
                          </Button>
                          <Button
                            variant="outline-secondary"
                            onClick={() => handleVerHistoricoProtocolo(edital)}
                            disabled={isLoading}
                            title="Ver histórico de consultas de protocolo"
                          >
                            <History size={14} className="me-1" /> Histórico
                          </Button>
                          {isRejected && (
                            <Button
                              variant="outline-warning"
                              onClick={() => handleRetornarRascunho(edital.id)}
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
                      <strong className="text-dark">{edital.numero_compra || '-'} / {edital.ano_compra || '-'}</strong>
                    </Col>
                    <Col md={3}>
                      <span>Nº Processo:</span>{' '}
                      <strong className="text-dark">{edital.numero_processo || '-'}</strong>
                    </Col>
                    <Col md={3}>
                      <span>Município / Entidade:</span>{' '}
                      <strong className="text-dark">{edital.municipio} / {edital.entidade}</strong>
                    </Col>
                    <Col md={3} className="text-md-end">
                      <span className="d-inline-flex align-items-center gap-1">
                        <Calendar size={13} />
                        {formatDateBR(edital.updated_at)}
                      </span>
                    </Col>
                  </Row>

                  {edital.objeto_compra && (
                    <div className="mt-2 text-secondary small bg-light p-2 rounded">
                      <strong>Objeto:</strong> {edital.objeto_compra}
                    </div>
                  )}

                  {edital.protocolo && (
                    <div className="mt-2 p-2 bg-light rounded d-flex flex-wrap justify-content-between align-items-center small">
                      <div>
                        <span className="text-muted">Protocolo AUDESP: </span>
                        <code className="fw-bold fs-6 text-primary">{edital.protocolo}</code>
                      </div>
                      {edital.status_protocolo && (
                        <div className="d-flex align-items-center gap-1">
                          <span className="text-muted">Status do Recibo:</span>
                          <span className="fw-bold">{edital.status_protocolo}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {edital.detalhes_protocolo && (
                    <ProtocoloErrosAlert
                      detalhesProtocolo={edital.detalhes_protocolo}
                      statusProtocolo={edital.status_protocolo}
                    />
                  )}
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      <HistoricoProtocoloModal
        show={showHistoricoModal}
        onHide={() => setShowHistoricoModal(false)}
        protocolo={historicoDocInfo.protocolo}
        codigoDocumento={historicoDocInfo.codigo}
        historico={historicoItems}
        loading={historicoLoading}
      />
    </Container>
  );
};
