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
  Layers, 
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
import { ataService } from '../../services/ataService';
import type { AtaRegistroPreco } from '../../types/ata';
import { formatDateBR } from '../../utils/formatters';

export const AtasList: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'draft' | 'sent'>('draft');
  const [search, setSearch] = useState('');
  const [atas, setAtas] = useState<AtaRegistroPreco[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const carregarAtas = async () => {
    try {
      setLoading(true);
      const data = await ataService.getAtas(tab, search);
      setAtas(data);
    } catch {
      toast.error('Erro ao carregar Atas de Registro de Preços');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAtas();
  }, [tab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    carregarAtas();
  };

  const handleEnviar = async (id: number, numeroAta: string) => {
    if (!window.confirm(`Confirma o envio da Ata ${numeroAta} para o TCESP AUDESP Fase IV?`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      const res = await ataService.enviarAta(id);
      if (res.sucesso) {
        toast.success(`Ata transmitida com sucesso! Protocolo: ${res.protocolo}`);
        carregarAtas();
      } else {
        toast.error(res.mensagem || 'Erro na transmissão');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail?.mensagem || err.response?.data?.detail || 'Erro ao enviar ata';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConsultarProtocolo = async (id: number) => {
    try {
      setActionLoadingId(id);
      const res = await ataService.consultarProtocolo(id);
      if (res.sucesso) {
        toast.success(`Status atualizado: ${res.status}`);
        carregarAtas();
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
    if (!window.confirm('Deseja retornar esta ata para rascunho a fim de realizar alterações?')) {
      return;
    }
    try {
      setActionLoadingId(id);
      await ataService.retornarRascunho(id);
      toast.success('Ata retornada para rascunho');
      carregarAtas();
    } catch {
      toast.error('Erro ao retornar para rascunho');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Container fluid className="p-4">
      <PageHeader
        title="Atas de Registro de Preço (ARP)"
        description="Gerenciamento e transmissão de Atas decorrentes de Licitações (Fase IV - TCESP)"
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/atas/novo')}
            className="d-flex align-items-center gap-2"
          >
            <Plus size={18} />
            <span>Nova Ata de Registro</span>
          </Button>
        }
      />

      {/* Tabs e Barra de Busca com React-Bootstrap */}
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
              Transmitidas ao AUDESP
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
                placeholder="Buscar por número da ata, código do edital ou protocolo..."
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
            onClick={carregarAtas}
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
            Carregando atas...
          </div>
        ) : atas.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Layers size={40} className="mb-2 opacity-25" />
            <p className="mb-0">Nenhuma ata de registro de preços encontrada nesta aba.</p>
          </div>
        ) : (
          <Table responsive hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Nº Ata / Ano</th>
                <th>Edital de Origem</th>
                <th>Vigência</th>
                <th>Data Assinatura</th>
                <th>Situação / Protocolo</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {atas.map((ata) => (
                <tr key={ata.id}>
                  <td>
                    <span className="fw-bold text-dark d-block">
                      {ata.numero_ata_registro_preco}/{ata.ano_ata}
                    </span>
                    <small className="text-muted font-monospace">{ata.codigo_ata}</small>
                  </td>
                  <td>
                    <Badge bg="light" text="dark" className="border">
                      {ata.codigo_edital}
                    </Badge>
                    <small className="d-block text-muted">Ano compra: {ata.ano_compra}</small>
                  </td>
                  <td>
                    <span className="small text-muted d-block">
                      <Calendar size={13} className="me-1 inline" />
                      {formatDateBR(ata.data_vigencia_inicio)} até {formatDateBR(ata.data_vigencia_fim)}
                    </span>
                  </td>
                  <td>
                    <span className="small">{formatDateBR(ata.data_assinatura)}</span>
                  </td>
                  <td>
                    {ata.status === 'draft' && (
                      <Badge bg="secondary">Rascunho</Badge>
                    )}
                    {ata.status === 'sent' && (
                      <div>
                        <Badge bg="success" className="d-inline-flex align-items-center gap-1">
                          <CheckCircle2 size={12} />
                          {ata.status_protocolo || 'Transmitida'}
                        </Badge>
                        {ata.protocolo && (
                          <span className="d-block small font-monospace text-muted mt-1">
                            Prot: {ata.protocolo}
                          </span>
                        )}
                      </div>
                    )}
                    {ata.status === 'error' && (
                      <Badge bg="danger" className="d-inline-flex align-items-center gap-1">
                        <AlertTriangle size={12} />
                        Falha no Envio
                      </Badge>
                    )}
                  </td>
                  <td className="text-end">
                    <ButtonGroup size="sm">
                      {ata.status === 'draft' ? (
                        <>
                          <Button
                            variant="outline-primary"
                            onClick={() => navigate(`/atas/${ata.id}`)}
                            title="Editar rascunho"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="outline-success"
                            onClick={() => handleEnviar(ata.id, ata.numero_ata_registro_preco)}
                            disabled={actionLoadingId === ata.id}
                            title="Transmitir para o AUDESP"
                          >
                            <Send size={14} />
                          </Button>
                        </>
                      ) : (
                        <>
                          {ata.protocolo && (
                            <Button
                              variant="outline-info"
                              onClick={() => handleConsultarProtocolo(ata.id)}
                              disabled={actionLoadingId === ata.id}
                              title="Consultar status no TCESP"
                            >
                              <RefreshCw size={14} className={actionLoadingId === ata.id ? 'spin' : ''} />
                            </Button>
                          )}
                          <Button
                            variant="outline-warning"
                            onClick={() => handleRetornarRascunho(ata.id)}
                            disabled={actionLoadingId === ata.id}
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
