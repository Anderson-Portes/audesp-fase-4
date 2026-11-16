import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
  InputGroup,
  Spinner,
  Modal,
} from 'react-bootstrap';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  History,
  ExternalLink,
  FileText,
  Award,
  Layers,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '../../components/PageHeader';
import {
  ProtocoloErrosAlert,
  HistoricoProtocoloModal,
  notificarResultadoProtocolo,
} from '../../components/ProtocoloInfo/ProtocoloComponents';
import { protocoloService } from '../../services/protocoloService';
import type {
  ProtocoloUnificadoItem,
  ConsultaAvulsaResponse,
} from '../../services/protocoloService';
import type { HistoricoProtocoloItem } from '../../utils/protocoloFormatter';
import { formatDateTimeBR } from '../../utils/formatters';

export const ProtocolosList: React.FC = () => {
  const navigate = useNavigate();

  const [moduloFiltro, setModuloFiltro] = useState<string>('');
  const [statusFiltro, setStatusFiltro] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const [itens, setItens] = useState<ProtocoloUnificadoItem[]>([]);
  const [contadores, setContadores] = useState({
    total: 0,
    armazenados: 0,
    rejeitados: 0,
    recebidos: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);

  // Modal de Histórico
  const [showHistoricoModal, setShowHistoricoModal] = useState<boolean>(false);
  const [historicoLoading, setHistoricoLoading] = useState<boolean>(false);
  const [historicoItems, setHistoricoItems] = useState<HistoricoProtocoloItem[]>([]);
  const [historicoDocInfo, setHistoricoDocInfo] = useState<{
    codigo: string;
    protocolo?: string | null;
  }>({ codigo: '', protocolo: null });

  // Consulta Avulsa direta no TCESP
  const [protocoloAvulsoInput, setProtocoloAvulsoInput] = useState<string>('');
  const [avulsoLoading, setAvulsoLoading] = useState<boolean>(false);
  const [avulsoResultado, setAvulsoResultado] = useState<ConsultaAvulsaResponse | null>(null);
  const [showAvulsoModal, setShowAvulsoModal] = useState<boolean>(false);

  const carregarProtocolos = async () => {
    try {
      setLoading(true);
      const data = await protocoloService.listarProtocolos({
        modulo: moduloFiltro || undefined,
        status_protocolo: statusFiltro || undefined,
        search: search || undefined,
      });
      setItens(data.itens || []);
      setContadores(
        data.contadores || { total: 0, armazenados: 0, rejeitados: 0, recebidos: 0 }
      );
    } catch {
      toast.error('Erro ao carregar a listagem de protocolos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarProtocolos();
  }, [moduloFiltro, statusFiltro]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    carregarProtocolos();
  };

  const handleConsultarStatus = async (item: ProtocoloUnificadoItem) => {
    try {
      setActionLoadingUid(item.uid);
      const res = await protocoloService.consultarProtocoloRegistro(
        item.modulo,
        item.registro_id
      );
      notificarResultadoProtocolo(res, { isTransmissao: false });
      await carregarProtocolos();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail || 'Não foi possível consultar o protocolo no AUDESP.';
      toast.error(typeof msg === 'string' ? msg : 'Erro ao consultar protocolo.');
    } finally {
      setActionLoadingUid(null);
    }
  };

  const handleAbrirHistorico = async (item: ProtocoloUnificadoItem) => {
    setHistoricoDocInfo({
      codigo: item.codigo_documento,
      protocolo: item.protocolo,
    });
    setHistoricoItems([]);
    setShowHistoricoModal(true);

    try {
      setHistoricoLoading(true);
      const data = await protocoloService.obterHistoricoRegistro(
        item.modulo,
        item.registro_id,
        item.protocolo
      );
      setHistoricoItems(data);
    } catch {
      toast.error('Erro ao carregar o histórico de consultas do protocolo.');
    } finally {
      setHistoricoLoading(false);
    }
  };

  const handleConsultaAvulsaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = protocoloAvulsoInput.trim();
    if (!num) {
      toast.error('Digite o número do protocolo para consultar no TCESP.');
      return;
    }
    try {
      setAvulsoLoading(true);
      const res = await protocoloService.consultarProtocoloAvulso(num);
      setAvulsoResultado(res);
      setShowAvulsoModal(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail || 'Erro ao consultar protocolo diretamente no TCESP.';
      toast.error(typeof msg === 'string' ? msg : 'Falha na consulta do protocolo.');
    } finally {
      setAvulsoLoading(false);
    }
  };

  const renderModuloBadge = (modulo: string, label: string) => {
    switch (modulo) {
      case 'edital':
        return (
          <Badge bg="primary" className="d-inline-flex align-items-center gap-1">
            <FileText size={12} /> {label}
          </Badge>
        );
      case 'licitacao':
        return (
          <Badge bg="success" className="d-inline-flex align-items-center gap-1">
            <Award size={12} /> {label}
          </Badge>
        );
      case 'ata':
        return (
          <Badge bg="warning" text="dark" className="d-inline-flex align-items-center gap-1">
            <Layers size={12} /> {label}
          </Badge>
        );
      case 'ajuste':
        return (
          <Badge bg="danger" className="d-inline-flex align-items-center gap-1">
            <FileCheck size={12} /> {label}
          </Badge>
        );
      default:
        return <Badge bg="secondary">{label}</Badge>;
    }
  };

  const renderStatusProtocoloBadge = (status?: string | null) => {
    const st = (status || 'Recebido').toLowerCase();
    if (st.includes('armazenado')) {
      return (
        <Badge bg="success" className="d-inline-flex align-items-center gap-1">
          <CheckCircle2 size={13} /> {status}
        </Badge>
      );
    }
    if (st.includes('rejeitado')) {
      return (
        <Badge bg="danger" className="d-inline-flex align-items-center gap-1">
          <AlertTriangle size={13} /> {status}
        </Badge>
      );
    }
    return (
      <Badge bg="info" text="dark" className="d-inline-flex align-items-center gap-1">
        <FileCheck size={13} /> {status || 'Recebido'}
      </Badge>
    );
  };

  return (
    <Container fluid className="py-2">
      <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2">
        <PageHeader
          title="Consulta Unificada de Protocolos AUDESP"
          description="Acompanhe todos os protocolos de Editais, Licitações, Atas de Registro de Preços e Ajustes enviados ao TCESP"
        />
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={carregarProtocolos}
          disabled={loading}
          className="d-flex align-items-center gap-1 shadow-sm"
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Atualizar Lista</span>
        </Button>
      </div>

      {/* Cards de Resumo + Consulta Avulsa Direta no TCESP */}
      <Row className="g-3 mb-4">
        <Col md={8}>
          <Row className="g-3 h-100">
            <Col sm={3}>
              <Card
                className={`border-0 shadow-sm h-100 cursor-pointer ${statusFiltro === '' ? 'border-bottom border-primary border-3' : ''}`}
                onClick={() => setStatusFiltro('')}
              >
                <Card.Body className="py-3">
                  <div className="text-muted small fw-semibold">Total de Protocolos</div>
                  <div className="fs-3 fw-bold text-dark">{contadores.total}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={3}>
              <Card
                className={`border-0 shadow-sm h-100 cursor-pointer ${statusFiltro === 'Armazenado' ? 'border-bottom border-success border-3' : ''}`}
                onClick={() =>
                  setStatusFiltro(statusFiltro === 'Armazenado' ? '' : 'Armazenado')
                }
              >
                <Card.Body className="py-3">
                  <div className="text-success small fw-semibold d-flex align-items-center gap-1">
                    <CheckCircle2 size={14} /> Armazenados
                  </div>
                  <div className="fs-3 fw-bold text-success">{contadores.armazenados}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={3}>
              <Card
                className={`border-0 shadow-sm h-100 cursor-pointer ${statusFiltro === 'Rejeitado' ? 'border-bottom border-danger border-3' : ''}`}
                onClick={() =>
                  setStatusFiltro(statusFiltro === 'Rejeitado' ? '' : 'Rejeitado')
                }
              >
                <Card.Body className="py-3">
                  <div className="text-danger small fw-semibold d-flex align-items-center gap-1">
                    <AlertTriangle size={14} /> Rejeitados
                  </div>
                  <div className="fs-3 fw-bold text-danger">{contadores.rejeitados}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={3}>
              <Card
                className={`border-0 shadow-sm h-100 cursor-pointer ${statusFiltro === 'Recebido' ? 'border-bottom border-info border-3' : ''}`}
                onClick={() =>
                  setStatusFiltro(statusFiltro === 'Recebido' ? '' : 'Recebido')
                }
              >
                <Card.Body className="py-3">
                  <div className="text-info small fw-semibold d-flex align-items-center gap-1">
                    <FileCheck size={14} /> Em Processamento
                  </div>
                  <div className="fs-3 fw-bold text-info">{contadores.recebidos}</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm h-100 bg-light">
            <Card.Body className="py-2 d-flex flex-column justify-content-center">
              <div className="small fw-bold text-dark mb-1 d-flex align-items-center gap-1">
                <Search size={14} className="text-primary" />
                <span>Consultar Protocolo Avulso Direto no TCESP</span>
              </div>
              <Form onSubmit={handleConsultaAvulsaSubmit}>
                <InputGroup size="sm">
                  <Form.Control
                    type="text"
                    placeholder="Digite o nº do protocolo (ex: F426...)"
                    value={protocoloAvulsoInput}
                    onChange={(e) => setProtocoloAvulsoInput(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={avulsoLoading}
                    className="d-flex align-items-center gap-1"
                  >
                    {avulsoLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <Search size={14} />
                    )}
                    <span>Consultar TCESP</span>
                  </Button>
                </InputGroup>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Barra de Filtros por Módulo, Situação e Busca */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Row className="g-2 align-items-center">
            <Col md={3}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light">
                  <Filter size={14} />
                </InputGroup.Text>
                <Form.Select
                  value={moduloFiltro}
                  onChange={(e) => setModuloFiltro(e.target.value)}
                >
                  <option value="">Todos os Módulos (4)</option>
                  <option value="edital">Editais</option>
                  <option value="licitacao">Licitações</option>
                  <option value="ata">Atas de Registro (ARP)</option>
                  <option value="ajuste">Ajustes e Contratos</option>
                </Form.Select>
              </InputGroup>
            </Col>

            <Col md={3}>
              <Form.Select
                size="sm"
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
              >
                <option value="">Todas as Situações</option>
                <option value="Armazenado">Armazenado</option>
                <option value="Rejeitado">Rejeitado</option>
                <option value="Recebido">Recebido / Em Processamento</option>
              </Form.Select>
            </Col>

            <Col md={6}>
              <Form onSubmit={handleSearchSubmit}>
                <InputGroup size="sm">
                  <Form.Control
                    type="text"
                    placeholder="Buscar por número de protocolo, código do documento, processo, compra ou fornecedor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button type="submit" variant="secondary">
                    <Search size={15} className="me-1" /> Filtrar
                  </Button>
                </InputGroup>
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Listagem de Protocolos */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2 mb-0">Carregando protocolos enviados...</p>
        </div>
      ) : itens.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <FileCheck size={42} className="text-muted mb-2 opacity-50" />
            <h6 className="fw-bold text-secondary">Nenhum protocolo encontrado</h6>
            <p className="text-muted small mb-0">
              Não há documentos com protocolo registrado para os filtros selecionados, ou você pode usar a caixa
              &ldquo;Consultar Protocolo Avulso Direto no TCESP&rdquo; acima para pesquisar qualquer protocolo.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div className="d-flex flex-column gap-3">
          {itens.map((item) => {
            const isItemLoading = actionLoadingUid === item.uid;
            return (
              <Card key={item.uid} className="border-0 shadow-sm">
                <Card.Body className="p-3">
                  <Row className="align-items-center g-3">
                    <Col lg={8}>
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                        {renderModuloBadge(item.modulo, item.modulo_label)}
                        {renderStatusProtocoloBadge(item.status_protocolo)}
                        {item.retificacao && (
                          <Badge bg="warning" text="dark">
                            Retificação
                          </Badge>
                        )}
                        <span className="small text-muted ms-1">
                          Protocolo:{' '}
                          <code className="fw-bold text-dark bg-light px-2 py-1 rounded border">
                            {item.protocolo}
                          </code>
                        </span>
                      </div>

                      <div className="fw-bold text-dark mb-1">
                        {item.identificacao}{' '}
                        <span className="text-muted fw-normal small">
                          (Cód: <span className="font-monospace">{item.codigo_documento}</span>)
                        </span>
                      </div>

                      {item.resumo && (
                        <div className="text-secondary small text-truncate" style={{ maxWidth: '820px' }}>
                          {item.resumo}
                        </div>
                      )}

                      {item.updated_at && (
                        <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                          Última atualização: {formatDateTimeBR(item.updated_at)}
                        </div>
                      )}

                      <ProtocoloErrosAlert
                        detalhesProtocolo={item.detalhes_protocolo}
                        errosDetalhados={item.erros_detalhados}
                        statusProtocolo={item.status_protocolo}
                      />
                    </Col>

                    <Col lg={4} className="d-flex flex-wrap justify-content-lg-end gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleConsultarStatus(item)}
                        disabled={isItemLoading}
                        className="d-flex align-items-center gap-1"
                        title="Consultar status atualizado do protocolo na API do TCESP"
                      >
                        {isItemLoading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        <span>Consultar TCESP</span>
                      </Button>

                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleAbrirHistorico(item)}
                        disabled={isItemLoading}
                        className="d-flex align-items-center gap-1"
                        title="Ver histórico de consultas deste protocolo"
                      >
                        <History size={14} />
                        <span>Histórico</span>
                      </Button>

                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => navigate(item.rota_modulo)}
                        className="d-flex align-items-center gap-1 border"
                        title="Abrir o formulário do documento"
                      >
                        <ExternalLink size={14} />
                        <span>Abrir Documento</span>
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Histórico do Documento */}
      <HistoricoProtocoloModal
        show={showHistoricoModal}
        onHide={() => setShowHistoricoModal(false)}
        protocolo={historicoDocInfo.protocolo}
        codigoDocumento={historicoDocInfo.codigo}
        historico={historicoItems}
        loading={historicoLoading}
      />

      {/* Modal de Resultado de Consulta Avulsa Direta no TCESP */}
      <Modal
        show={showAvulsoModal}
        onHide={() => setShowAvulsoModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
            <Search size={18} className="text-primary" />
            <span>Resultado da Consulta Direta no TCESP</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">
          {avulsoResultado && (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-center bg-light p-3 rounded border mb-3">
                <div>
                  <div className="text-muted">Protocolo Consultado:</div>
                  <code className="fs-6 fw-bold text-primary">{avulsoResultado.protocolo}</code>
                </div>
                <div>
                  <div className="text-muted">Situação no TCESP:</div>
                  {renderStatusProtocoloBadge(avulsoResultado.status_protocolo)}
                </div>
                {avulsoResultado.data_hora_audesp && (
                  <div>
                    <div className="text-muted">Data / Hora AUDESP:</div>
                    <strong>{avulsoResultado.data_hora_audesp}</strong>
                  </div>
                )}
              </div>

              <ProtocoloErrosAlert
                detalhesProtocolo={avulsoResultado.dados}
                errosDetalhados={avulsoResultado.erros_detalhados}
                statusProtocolo={avulsoResultado.status_protocolo}
                className="mb-3"
              />

              <div className="fw-bold mb-1">JSON completo retornado pelo TCESP:</div>
              <pre
                className="bg-dark text-light p-3 rounded mb-0"
                style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '0.78rem' }}
              >
                {JSON.stringify(avulsoResultado.dados || avulsoResultado, null, 2)}
              </pre>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowAvulsoModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

