import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
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
    <Container fluid className="p-0">
      <PageHeader
        title="Ajustes e Contratos (Fase IV)"
      />

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        {/* Tabs com ButtonGroup e Botão Novo */}
        <div className="d-flex align-items-center gap-3">
          <ButtonGroup className="shadow-sm bg-white p-1 rounded">
            <Button
              size="sm"
              variant={tab === 'draft' ? 'success' : 'light'}
              className={`px-4 py-2 fw-medium ${tab === 'draft' ? 'text-white shadow-sm' : 'text-dark'}`}
              onClick={() => setTab('draft')}
            >
              <Edit size={16} className="me-1 d-inline" /> Rascunhos Locais
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
            onClick={() => navigate('/ajustes/novo')}
            className="fw-bold d-flex align-items-center gap-2 shadow-sm py-2 px-3"
          >
            <Plus size={18} /> Novo Contrato / Ajuste
          </Button>
        </div>

        {/* Busca com Form e InputGroup */}
        <Form onSubmit={handleSearchSubmit} className="d-flex align-items-center gap-2">
          <InputGroup size="sm" style={{ width: '340px' }}>
            <InputGroup.Text className="bg-white border-end-0">
              <Search size={16} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              className="border-start-0 ps-0"
              placeholder="Buscar por contrato, processo, fornecedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button
                variant="outline-secondary"
                onClick={() => { setSearch(''); carregarAjustes(); }}
              >
                ×
              </Button>
            )}
            <Button type="submit" variant="outline-success">
              Filtrar
            </Button>
          </InputGroup>

          <Button
            variant="light"
            size="sm"
            onClick={carregarAjustes}
            className="border shadow-sm text-secondary p-2"
            title="Atualizar lista"
          >
            <RefreshCw size={16} />
          </Button>
        </Form>
      </div>

      {/* Tabela com React-Bootstrap */}
      <CardBox>
        {loading ? (
          <div className="text-center py-5 text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Carregando contratos e ajustes...
          </div>
        ) : ajustes.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FileCheck size={48} className="mb-3 opacity-25" />
            <h5 className="text-secondary fw-semibold">
              {search ? 'Nenhum contrato encontrado para o filtro' : tab === 'draft' ? 'Nenhum rascunho de contrato ou ajuste' : 'Nenhum contrato enviado ao AUDESP'}
            </h5>
            <p className="text-muted small mb-3">
              {tab === 'draft'
                ? 'Clique no botão "+ Novo Contrato / Ajuste" acima para cadastrar instrumentos contratuais ou termos.'
                : 'Os contratos transmitidos com sucesso para a API do AUDESP aparecerão nesta aba.'}
            </p>
            {tab === 'draft' && (
              <Button
                variant="success"
                size="sm"
                onClick={() => navigate('/ajustes/novo')}
                className="mt-1"
              >
                Cadastrar Primeiro Contrato
              </Button>
            )}
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
                    <small className="d-block text-muted">
                      {ajuste.edital_id ? `Edital: ${ajuste.codigo_edital}` : `Adesão (PNCP): ${ajuste.codigo_edital}`}
                    </small>
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
                            disabled={actionLoadingId === ajuste.id}
                            title="Editar rascunho"
                          >
                            <Edit size={14} className="me-1" /> Editar
                          </Button>
                          <Button
                            variant="success"
                            onClick={() => handleEnviar(ajuste.id, ajuste.numero_contrato_empenho)}
                            disabled={actionLoadingId === ajuste.id}
                            title="Transmitir para o AUDESP"
                          >
                            <Send size={14} className="me-1" /> Transmitir
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
                              <RefreshCw size={14} className={`me-1 ${actionLoadingId === ajuste.id ? 'spin' : ''}`} /> Consultar Protocolo
                            </Button>
                          )}
                          <Button
                            variant="outline-warning"
                            onClick={() => handleRetornarRascunho(ajuste.id)}
                            disabled={actionLoadingId === ajuste.id}
                            title="Reabrir para rascunho"
                          >
                            <RotateCcw size={14} className="me-1" /> Destravar
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
