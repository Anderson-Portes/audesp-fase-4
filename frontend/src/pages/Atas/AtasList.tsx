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
    <Container fluid className="p-0">
      <PageHeader
        title="Atas de Registro de Preço (ARP)"
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
            onClick={() => navigate('/atas/novo')}
            className="fw-bold d-flex align-items-center gap-2 shadow-sm py-2 px-3"
          >
            <Plus size={18} /> Nova Ata de Registro
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
              placeholder="Buscar por número da ata, edital, protocolo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button
                variant="outline-secondary"
                onClick={() => { setSearch(''); carregarAtas(); }}
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
            onClick={carregarAtas}
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
            Carregando atas...
          </div>
        ) : atas.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Layers size={48} className="mb-3 opacity-25" />
            <h5 className="text-secondary fw-semibold">
              {search ? 'Nenhuma ata encontrada para o filtro' : tab === 'draft' ? 'Nenhum rascunho de ata de registro' : 'Nenhuma ata enviada ao AUDESP'}
            </h5>
            <p className="text-muted small mb-3">
              {tab === 'draft'
                ? 'Clique no botão "+ Nova Ata de Registro" acima para vincular itens de um edital ou cadastrar uma ARP.'
                : 'As atas transmitidas com sucesso para a API do AUDESP aparecerão nesta aba.'}
            </p>
            {tab === 'draft' && (
              <Button
                variant="success"
                size="sm"
                onClick={() => navigate('/atas/novo')}
                className="mt-1"
              >
                Cadastrar Primeira Ata
              </Button>
            )}
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
                            disabled={actionLoadingId === ata.id}
                            title="Editar rascunho"
                          >
                            <Edit size={14} className="me-1" /> Editar
                          </Button>
                          <Button
                            variant="success"
                            onClick={() => handleEnviar(ata.id, ata.numero_ata_registro_preco)}
                            disabled={actionLoadingId === ata.id}
                            title="Transmitir para o AUDESP"
                          >
                            <Send size={14} className="me-1" /> Transmitir
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
                              <RefreshCw size={14} className={`me-1 ${actionLoadingId === ata.id ? 'spin' : ''}`} /> Consultar Protocolo
                            </Button>
                          )}
                          <Button
                            variant="outline-warning"
                            onClick={() => handleRetornarRascunho(ata.id)}
                            disabled={actionLoadingId === ata.id}
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
