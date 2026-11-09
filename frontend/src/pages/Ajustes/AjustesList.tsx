import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  ButtonGroup, 
  Button, 
  InputGroup, 
  Form, 
  Table, 
  Badge, 
  Spinner,
  Card
} from 'react-bootstrap';
import { 
  FileCheck, 
  Plus, 
  Search, 
  RefreshCw, 
  Send, 
  Edit, 
  Trash2,
  RotateCcw,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  History,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';

import { PageHeader } from '../../components/PageHeader/PageHeader';
import { CardBox } from '../../components/CardBox/CardBox';
import { DataTable } from '../../components/DataTable/DataTable';
import {
  ProtocoloErrosAlert,
  HistoricoProtocoloModal,
  notificarResultadoProtocolo,
} from '../../components/ProtocoloInfo/ProtocoloComponents';
import { ImportacaoExportacaoToolbar } from '../../components/ImportacaoExportacao/ImportacaoExportacaoModal';
import { ajusteService } from '../../services/ajusteService';
import type { AjusteContrato } from '../../types/ajuste';
import type { HistoricoProtocoloItem } from '../../utils/protocoloFormatter';
import { extrairErrosDetalhadosProtocolo } from '../../utils/protocoloFormatter';
import { formatDateBR, formatBRL } from '../../utils/formatters';

export const AjustesList: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'draft' | 'sent'>('draft');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [search, setSearch] = useState('');
  const [ajustes, setAjustes] = useState<AjusteContrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoItems, setHistoricoItems] = useState<HistoricoProtocoloItem[]>([]);
  const [historicoDocInfo, setHistoricoDocInfo] = useState<{ codigo: string; protocolo?: string | null }>({
    codigo: '',
    protocolo: null,
  });

  const carregarAjustes = async () => {
    try {
      setLoading(true);
      const data = await ajusteService.getAjustes(tab, search);
      setAjustes(data);
    } catch {
      toast.error('Erro ao carregar Contratos e Ajustes');
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

  const handleExcluir = async (id: number, numeroContrato: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o rascunho do Contrato/Ajuste ${numeroContrato}?`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      await ajusteService.deleteAjuste(id);
      toast.success('Rascunho de contrato/ajuste excluído com sucesso');
      carregarAjustes();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Erro ao excluir rascunho';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEnviar = async (id: number, numeroContrato: string) => {
    if (!window.confirm(`Confirma o envio do Contrato ${numeroContrato} para o TCESP AUDESP Fase IV?`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      const res = await ajusteService.enviarAjuste(id);
      if (res.sucesso) {
        notificarResultadoProtocolo(res, {
          prefixoSucesso: 'Contrato transmitido com sucesso!',
          isTransmissao: true,
        });
        carregarAjustes();
      } else {
        toast.error(res.mensagem || 'Erro na transmissão');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail && detail.erros && detail.erros.length > 0) {
        toast.error(
          <div>
            <strong>Erros de Validação do Contrato:</strong>
            <ul className="mb-0 ps-3 mt-1 small">
              {detail.erros.map((e: string, i: number) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>,
          { duration: 7000 }
        );
      } else {
        const msg = detail?.mensagem || detail || 'Erro ao enviar contrato';
        toast.error(msg);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConsultarProtocolo = async (id: number) => {
    try {
      setActionLoadingId(id);
      const res = await ajusteService.consultarProtocolo(id);
      if (res.sucesso) {
        notificarResultadoProtocolo(res, { isTransmissao: false });
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

  const handleVerHistoricoProtocolo = async (ajuste: AjusteContrato) => {
    setHistoricoDocInfo({
      codigo: ajuste.codigo_contrato || `${ajuste.numero_contrato_empenho}/${ajuste.ano_contrato}`,
      protocolo: ajuste.protocolo,
    });
    setShowHistoricoModal(true);
    try {
      setHistoricoLoading(true);
      const data = await ajusteService.getHistoricoProtocolo(ajuste.id);
      setHistoricoItems(data);
    } catch {
      toast.error('Erro ao carregar histórico de consultas do protocolo');
    } finally {
      setHistoricoLoading(false);
    }
  };

  const handleRetornarRascunho = async (id: number) => {
    if (!window.confirm('Deseja retornar este contrato para rascunho a fim de realizar alterações?')) {
      return;
    }
    try {
      setActionLoadingId(id);
      await ajusteService.retornarRascunho(id);
      toast.success('Contrato retornado para rascunho');
      carregarAjustes();
    } catch {
      toast.error('Erro ao retornar para rascunho');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Ações Coletivas
  const handleExcluirColetivo = async (itens: AjusteContrato[], clearSelection: () => void) => {
    if (!window.confirm(`Tem certeza que deseja excluir os ${itens.length} rascunhos de contratos/ajustes selecionados?`)) {
      return;
    }
    try {
      setBatchLoading(true);
      let sucessos = 0;
      let erros = 0;
      for (const item of itens) {
        try {
          await ajusteService.deleteAjuste(item.id);
          sucessos++;
        } catch {
          erros++;
        }
      }
      clearSelection();
      if (erros === 0) {
        toast.success(`${sucessos} rascunho(s) excluído(s) com sucesso!`);
      } else {
        toast.error(`Exclusão concluída: ${sucessos} sucesso(s) e ${erros} falha(s).`);
      }
      carregarAjustes();
    } finally {
      setBatchLoading(false);
    }
  };

  const handleConsultarProtocoloColetivo = async (itens: AjusteContrato[], clearSelection: () => void) => {
    try {
      setBatchLoading(true);
      toast.loading(`Consultando ${itens.length} protocolo(s)...`, { id: 'batch-consultar-ajustes' });
      let sucessos = 0;
      let erros = 0;
      for (const item of itens) {
        try {
          await ajusteService.consultarProtocolo(item.id);
          sucessos++;
        } catch {
          erros++;
        }
      }
      toast.dismiss('batch-consultar-ajustes');
      clearSelection();
      toast.success(`${sucessos} protocolo(s) consultado(s) com sucesso! ${erros > 0 ? `(${erros} falha(s))` : ''}`);
      carregarAjustes();
    } finally {
      setBatchLoading(false);
    }
  };

  const getStatusBadge = (ajuste: AjusteContrato) => {
    if (ajuste.status === 'draft') {
      return <Badge bg="secondary">Rascunho Local</Badge>;
    }
    if (ajuste.status === 'error') {
      return (
        <Badge bg="danger" className="d-inline-flex align-items-center gap-1">
          <AlertTriangle size={12} /> Falha no Envio
        </Badge>
      );
    }
    const isRejected = (ajuste.status_protocolo || '').toLowerCase().includes('rejeitado');
    const isArmazenado = (ajuste.status_protocolo || '').toLowerCase().includes('armazenado');

    return (
      <Badge
        bg={isRejected ? 'danger' : isArmazenado ? 'success' : 'primary'}
        className="d-inline-flex align-items-center gap-1"
      >
        {isRejected ? <AlertTriangle size={12} /> : isArmazenado ? <CheckCircle2 size={12} /> : <CheckCircle2 size={12} />}
        {ajuste.status_protocolo || 'Transmitido'}
      </Badge>
    );
  };

  const columns: ColumnDef<AjusteContrato, any>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Form.Check
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          aria-label="Selecionar todos"
        />
      ),
      cell: ({ row }) => (
        <Form.Check
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label="Selecionar linha"
        />
      ),
      size: 40,
      enableSorting: false,
    },
    {
      accessorKey: 'numero_contrato_empenho',
      header: 'Nº Contrato / Ano',
      cell: ({ row }) => {
        const aj = row.original;
        return (
          <div>
            <span className="fw-bold text-dark d-block">
              {aj.numero_contrato_empenho}/{aj.ano_contrato}
            </span>
            <small className="text-muted font-monospace">{aj.codigo_contrato}</small>
          </div>
        );
      },
    },
    {
      accessorKey: 'nome_razao_social_fornecedor',
      header: 'Fornecedor Contratado',
      cell: ({ row }) => {
        const aj = row.original;
        return (
          <div>
            <span className="fw-semibold text-dark d-block text-truncate" style={{ maxWidth: '240px' }} title={aj.nome_razao_social_fornecedor}>
              {aj.nome_razao_social_fornecedor}
            </span>
            <small className="text-muted font-monospace">{aj.ni_fornecedor} ({aj.tipo_pessoa_fornecedor})</small>
          </div>
        );
      },
    },
    {
      id: 'processo_edital',
      header: 'Processo / Edital',
      cell: ({ row }) => {
        const aj = row.original;
        return (
          <div>
            <Badge bg="light" text="dark" className="border">
              {aj.processo}
            </Badge>
            <small className="d-block text-muted">
              {aj.edital_id ? `Edital: ${aj.codigo_edital}` : `Adesão (PNCP): ${aj.codigo_edital}`}
            </small>
          </div>
        );
      },
    },
    {
      accessorKey: 'valor_inicial',
      header: 'Valor Inicial',
      cell: ({ row }) => <strong className="text-success">{formatBRL(row.original.valor_inicial)}</strong>,
    },
    {
      id: 'vigencia',
      header: 'Vigência',
      cell: ({ row }) => {
        const aj = row.original;
        return (
          <span className="small text-muted d-block">
            <Calendar size={13} className="me-1 inline" />
            {aj.data_vigencia_inicio ? formatDateBR(aj.data_vigencia_inicio) : '-'} até {aj.data_vigencia_fim ? formatDateBR(aj.data_vigencia_fim) : '-'}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Situação / Protocolo',
      cell: ({ row }) => {
        const aj = row.original;
        return (
          <div>
            {getStatusBadge(aj)}
            {aj.protocolo && (
              <span className="d-block small font-monospace text-muted mt-1">
                Prot: {aj.protocolo}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'updated_at',
      header: 'Atualizado em',
      cell: ({ row }) => formatDateBR(row.original.updated_at),
    },
    {
      id: 'acoes',
      header: 'Ações',
      enableSorting: false,
      cell: ({ row }) => {
        const aj = row.original;
        const isLoading = actionLoadingId === aj.id;

        return (
          <ButtonGroup size="sm">
            {tab === 'draft' ? (
              <>
                <Button
                  variant="outline-primary"
                  onClick={() => navigate(`/ajustes/${aj.id}`)}
                  disabled={isLoading}
                  title="Editar rascunho"
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleEnviar(aj.id, aj.numero_contrato_empenho)}
                  disabled={isLoading}
                  title="Transmitir para o AUDESP"
                >
                  <Send size={14} />
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={() => handleExcluir(aj.id, aj.numero_contrato_empenho)}
                  disabled={isLoading}
                  title="Excluir rascunho"
                >
                  <Trash2 size={14} />
                </Button>
              </>
            ) : (
              <>
                {aj.protocolo && (
                  <>
                    <Button
                      variant="outline-info"
                      onClick={() => handleConsultarProtocolo(aj.id)}
                      disabled={isLoading}
                      title="Consultar status no TCESP"
                    >
                      <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => handleVerHistoricoProtocolo(aj)}
                      disabled={isLoading}
                      title="Ver histórico de consultas de protocolo"
                    >
                      <History size={14} />
                    </Button>
                  </>
                )}
                <Button
                  variant="outline-warning"
                  onClick={() => handleRetornarRascunho(aj.id)}
                  disabled={isLoading}
                  title="Reabrir para rascunho"
                >
                  <RotateCcw size={14} />
                </Button>
              </>
            )}
          </ButtonGroup>
        );
      },
    },
  ], [tab, actionLoadingId]);

  return (
    <Container fluid className="p-0">
      <PageHeader
        title="Contratos e Ajustes (Fase IV)"
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

          <ImportacaoExportacaoToolbar
            modulo="ajustes"
            tituloModulo="Contratos e Ajustes"
            onImportSuccess={carregarAjustes}
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
              placeholder="Buscar por contrato, fornecedor, processo..."
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
            size="sm"
            variant="outline-secondary"
            onClick={carregarAjustes}
            className="d-flex align-items-center gap-1"
            title="Atualizar lista"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </Button>

          {/* Toggle de Visualização: Tabela vs Cards */}
          <ButtonGroup size="sm" className="shadow-sm">
            <Button
              variant={viewMode === 'table' ? 'success' : 'outline-secondary'}
              onClick={() => setViewMode('table')}
              title="Visualização em Tabela (DataTable)"
              className="d-flex align-items-center gap-1"
            >
              <TableIcon size={14} /> Tabela
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'success' : 'outline-secondary'}
              onClick={() => setViewMode('cards')}
              title="Visualização em Cards"
              className="d-flex align-items-center gap-1"
            >
              <LayoutGrid size={14} /> Cards
            </Button>
          </ButtonGroup>
        </Form>
      </div>

      {loading ? (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <Spinner animation="border" variant="success" />
            <p className="text-muted mt-2 mb-0">Carregando contratos e ajustes...</p>
          </Card.Body>
        </Card>
      ) : ajustes.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <FileCheck size={48} className="text-muted opacity-50 mb-3" />
            <h5 className="text-secondary fw-semibold">
              {search ? 'Nenhum contrato encontrado para o filtro' : tab === 'draft' ? 'Nenhum rascunho de contrato ou ajuste' : 'Nenhum contrato enviado ao AUDESP'}
            </h5>
            <p className="text-muted small">
              {tab === 'draft'
                ? 'Clique no botão "+ Novo Contrato / Ajuste" acima para cadastrar instrumentos contratuais ou termos.'
                : 'Os contratos transmitidos com sucesso para a API do AUDESP aparecerão nesta aba.'}
            </p>
            {tab === 'draft' && (
              <Button
                variant="success"
                size="sm"
                onClick={() => navigate('/ajustes/novo')}
                className="mt-2"
              >
                Cadastrar Primeiro Contrato
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : viewMode === 'table' ? (
        <DataTable<AjusteContrato>
          columns={columns}
          data={ajustes}
          title={`Contratos e Ajustes (${tab === 'draft' ? 'Rascunhos' : 'Enviados'})`}
          enableSelection={true}
          getRowId={(row) => String(row.id)}
          renderBatchActions={(selected, clearSelection) => (
            <>
              {tab === 'draft' ? (
                <Button
                  variant="outline-danger"
                  size="sm"
                  disabled={batchLoading}
                  onClick={() => handleExcluirColetivo(selected, clearSelection)}
                  className="d-flex align-items-center gap-1"
                  title="Excluir rascunhos selecionados"
                >
                  <Trash2 size={14} />
                  <span>Excluir Selecionados ({selected.length})</span>
                </Button>
              ) : (
                <Button
                  variant="outline-info"
                  size="sm"
                  disabled={batchLoading}
                  onClick={() => handleConsultarProtocoloColetivo(selected, clearSelection)}
                  className="d-flex align-items-center gap-1"
                  title="Consultar protocolo dos contratos selecionados no TCESP"
                >
                  <RefreshCw size={14} className={batchLoading ? 'spin' : ''} />
                  <span>Consultar Protocolos ({selected.length})</span>
                </Button>
              )}
            </>
          )}
        />
      ) : (
        <CardBox>
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
              {ajustes.map((ajuste) => {
                const isRejected = (ajuste.status_protocolo || '').toLowerCase().includes('rejeitado');
                const errosAjuste = extrairErrosDetalhadosProtocolo(ajuste.detalhes_protocolo);
                const mostrarLinhaErros = isRejected || errosAjuste.length > 0;

                return (
                  <React.Fragment key={ajuste.id}>
                    <tr>
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
                        {getStatusBadge(ajuste)}
                        {ajuste.protocolo && (
                          <span className="d-block small font-monospace text-muted mt-1">
                            Prot: {ajuste.protocolo}
                          </span>
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
                              <Button
                                variant="outline-danger"
                                onClick={() => handleExcluir(ajuste.id, ajuste.numero_contrato_empenho)}
                                disabled={actionLoadingId === ajuste.id}
                                title="Excluir rascunho"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </>
                          ) : (
                            <>
                              {ajuste.protocolo && (
                                <>
                                  <Button
                                    variant="outline-info"
                                    onClick={() => handleConsultarProtocolo(ajuste.id)}
                                    disabled={actionLoadingId === ajuste.id}
                                    title="Consultar status no TCESP"
                                  >
                                    <RefreshCw size={14} className={`me-1 ${actionLoadingId === ajuste.id ? 'spin' : ''}`} /> Consultar Protocolo
                                  </Button>
                                  <Button
                                    variant="outline-secondary"
                                    onClick={() => handleVerHistoricoProtocolo(ajuste)}
                                    disabled={actionLoadingId === ajuste.id}
                                    title="Ver histórico de consultas de protocolo"
                                  >
                                    <History size={14} className="me-1" /> Histórico
                                  </Button>
                                </>
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
                    {mostrarLinhaErros && (
                      <tr>
                        <td colSpan={7} className="border-top-0 pt-0">
                          <ProtocoloErrosAlert
                            errosDetalhados={errosAjuste}
                            statusProtocolo={ajuste.status_protocolo}
                            className="mt-1"
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>
        </CardBox>
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
