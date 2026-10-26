import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  ButtonGroup, 
  Button, 
  InputGroup, 
  Form, 
  Table, 
  Badge, 
  Spinner 
} from 'react-bootstrap';
import { 
  FileCheck, 
  Plus, 
  Search, 
  RefreshCw, 
  Send, 
  Edit, 
  RotateCcw,
  CheckCircle2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '../../components/PageHeader/PageHeader';
import { CardBox } from '../../components/CardBox/CardBox';
import { ajusteService } from '../../services/ajusteService';
import type { AjusteContrato } from '../../types/ajuste';
import { formatDateBR, formatBRL } from '../../utils/formatters';

export const AjustesList: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'draft' | 'sent'>('draft');
  const [search, setSearch] = useState('');
  const [ajustes, setAjustes] = useState<AjusteContrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const carregarAjustes = async () => {
    try {
      setLoading(true);
      const data = await ajusteService.getAjustes(tab, search);
      setAjustes(data);
    } catch {
      toast.error('Erro ao carregar Ajustes e Contratos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAjustes();
  }, [tab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    carregarAjustes();
  };

  const handleEnviar = async (id: number, numeroContrato: string) => {
    if (!window.confirm(`Confirma o envio do Contrato/Ajuste ${numeroContrato} para o TCESP AUDESP Fase IV?`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      const res = await ajusteService.enviarAjuste(id);
      if (res.sucesso) {
        toast.success(`Ajuste transmitido com sucesso! Protocolo: ${res.protocolo}`);
        carregarAjustes();
      } else {
        toast.error(res.mensagem || 'Erro na transmissão');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail?.mensagem || err.response?.data?.detail || 'Erro ao enviar ajuste';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConsultarProtocolo = async (id: number) => {
    try {
      setActionLoadingId(id);
      const res = await ajusteService.consultarProtocolo(id);
      if (res.sucesso) {
        toast.success(`Status atualizado: ${res.status}`);
        carregarAjustes();
      } else {
        toast.error(res.mensagem || 'Erro ao consultar protocolo');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Falha na consulta');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRetornarRascunho = async (id: number) => {
    if (!window.confirm('Deseja retornar este ajuste para rascunho para realizar correções?')) {
      return;
    }
    try {
      setActionLoadingId(id);
      await ajusteService.retornarRascunho(id);
      toast.success('Ajuste retornado para rascunho');
      carregarAjustes();
    } catch {
      toast.error('Erro ao retornar para rascunho');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Container fluid className="p-4">
      <PageHeader
        title="Ajustes e Contratos (Fase IV)"
        description="Gestão de instrumentos contratuais, termos aditivos e apostilamentos (TCESP)"
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/ajustes/novo')}
            className="d-flex align-items-center gap-2"
          >
            <Plus size={18} />
            <span>Novo Contrato / Ajuste</span>
          </Button>
        }
      />

      {/* Tabs e Barra de Busca */}
      <Row className="g-3 mb-4 align-items-center">
        <Col xs="auto">
          <ButtonGroup className="shadow-sm">
            <Button
              variant={tab === 'draft' ? 'primary' : 'outline-primary'}
              onClick={() => setTab('draft')}
            >
              Rascunhos Locais
            </Button>
            <Button
              variant={tab === 'sent' ? 'primary' : 'outline-primary'}
              onClick={() => setTab('sent')}
            >
              Transmitidos ao AUDESP
            </Button>
          </ButtonGroup>
        </Col>

        <Col>
          <Form onSubmit={handleSearchSubmit} className="d-flex gap-2">
            <InputGroup>
              <InputGroup.Text className="bg-white">
                <Search size={16} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Buscar por número do contrato, processo, fornecedor ou protocolo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Button type="submit" variant="outline-secondary">
              Buscar
            </Button>
          </Form>
        </Col>

        <Col xs="auto">
          <Button
            variant="outline-secondary"
            onClick={carregarAjustes}
            className="d-flex align-items-center gap-1"
            title="Atualizar lista"
          >
            <RefreshCw size={16} />
          </Button>
        </Col>
      </Row>

      {/* Tabela com React-Bootstrap */}
      <CardBox>
        {loading ? (
          <div className="text-center py-5 text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Carregando contratos e ajustes...
          </div>
        ) : ajustes.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FileCheck size={40} className="mb-2 opacity-25" />
            <p className="mb-0">Nenhum contrato ou ajuste encontrado nesta aba.</p>
          </div>
        ) : (
          <Table responsive hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Nº Contrato / Ano</th>
                <th>Fornecedor Contratado</th>
                <th>Processo / Edital</th>
                <th>Valor Inicial</th>
                <th>Vigência</th>
                <th>Situação / Protocolo</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ajustes.map((ajuste) => (
                <tr key={ajuste.id}>
                  <td>
                    <span className="fw-bold text-dark d-block">
                      {ajuste.numero_contrato_empenho}/{ajuste.ano_contrato}
                    </span>
                    <small className="text-muted font-monospace">{ajuste.codigo_contrato}</small>
                  </td>
                  <td>
                    <span className="fw-semibold text-dark d-block">
                      {ajuste.nome_razao_social_fornecedor}
                    </span>
                    <small className="text-muted font-monospace">{ajuste.ni_fornecedor} ({ajuste.tipo_pessoa_fornecedor})</small>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">
                      {ajuste.processo}
                    </span>
                    <small className="d-block text-muted">Edital: {ajuste.codigo_edital}</small>
                  </td>
                  <td>
                    <strong className="text-success">{formatBRL(ajuste.valor_inicial)}</strong>
                  </td>
                  <td>
                    <span className="small text-muted d-block">
                      <Calendar size={13} className="me-1 inline" />
                      {ajuste.data_vigencia_inicio ? formatDateBR(ajuste.data_vigencia_inicio) : '-'} até {ajuste.data_vigencia_fim ? formatDateBR(ajuste.data_vigencia_fim) : '-'}
                    </span>
                  </td>
                  <td>
                    {ajuste.status === 'draft' && (
                      <Badge bg="secondary">Rascunho</Badge>
                    )}
                    {ajuste.status === 'sent' && (
                      <div>
                        <Badge bg="success" className="d-inline-flex align-items-center gap-1">
                          <CheckCircle2 size={12} />
                          {ajuste.status_protocolo || 'Transmitido'}
                        </Badge>
                        {ajuste.protocolo && (
                          <span className="d-block small font-monospace text-muted mt-1">
                            Prot: {ajuste.protocolo}
                          </span>
                        )}
                      </div>
                    )}
                    {ajuste.status === 'error' && (
                      <Badge bg="danger" className="d-inline-flex align-items-center gap-1">
                        <AlertTriangle size={12} />
                        Falha no Envio
                      </Badge>
                    )}
                  </td>
                  <td className="text-end">
                    <ButtonGroup size="sm">
                      {ajuste.status === 'draft' ? (
                        <>
                          <Button
                            variant="outline-primary"
                            onClick={() => navigate(`/ajustes/${ajuste.id}`)}
                            title="Editar rascunho"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="outline-success"
                            onClick={() => handleEnviar(ajuste.id, ajuste.numero_contrato_empenho)}
                            disabled={actionLoadingId === ajuste.id}
                            title="Transmitir para o AUDESP"
                          >
                            <Send size={14} />
                          </Button>
                        </>
                      ) : (
                        <>
                          {ajuste.protocolo && (
                            <Button
                              variant="outline-info"
                              onClick={() => handleConsultarProtocolo(ajuste.id)}
                              disabled={actionLoadingId === ajuste.id}
                              title="Consultar status no TCESP"
                            >
                              <RefreshCw size={14} className={actionLoadingId === ajuste.id ? 'spin' : ''} />
                            </Button>
                          )}
                          <Button
                            variant="outline-warning"
                            onClick={() => handleRetornarRascunho(ajuste.id)}
                            disabled={actionLoadingId === ajuste.id}
                            title="Reabrir para rascunho"
                          >
                            <RotateCcw size={14} />
                          </Button>
                        </>
                      )}
                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardBox>
    </Container>
  );
};
