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
  Layers, 
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

import { PageHeader } from '../../components/PageHeader';
import { CardBox } from '../../components/CardBox';
import { DataTable } from '../../components/DataTable';
import {
  ProtocoloErrosAlert,
  HistoricoProtocoloModal,
  notificarResultadoProtocolo,
} from '../../components/ProtocoloInfo/ProtocoloComponents';
import { ImportacaoExportacaoToolbar } from '../../components/ImportacaoExportacao/ImportacaoExportacaoModal';
import { ataService } from '../../services/ataService';
import type { AtaRegistroPreco } from '../../types/ata';
import type { HistoricoProtocoloItem } from '../../utils/protocoloFormatter';
import { extrairErrosDetalhadosProtocolo } from '../../utils/protocoloFormatter';
import { formatDateBR } from '../../utils/formatters';

export const AtasList: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'draft' | 'sent'>('draft');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [search, setSearch] = useState('');
  const [atas, setAtas] = useState<AtaRegistroPreco[]>([]);
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

  const handleExcluir = async (id: number, numeroAta: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o rascunho da Ata ${numeroAta}?`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      await ataService.deleteAta(id);
      toast.success('Rascunho de ata excluído com sucesso');
      carregarAtas();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Erro ao excluir rascunho de ata';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEnviar = async (id: number, numeroAta: string) => {
    if (!window.confirm(`Confirma o envio da Ata ${numeroAta} para o TCESP AUDESP Fase IV?`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      const res = await ataService.enviarAta(id);
      if (res.sucesso) {
        notificarResultadoProtocolo(res, {
          prefixoSucesso: 'Ata transmitida com sucesso!',
          isTransmissao: true,
        });
        carregarAtas();
      } else {
        toast.error(res.mensagem || 'Erro na transmissão');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail && detail.erros && detail.erros.length > 0) {
        toast.error(
          <div>
            <strong>Erros de Validação da Ata:</strong>
            <ul className="mb-0 ps-3 mt-1 small">
              {detail.erros.map((e: string, i: number) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>,
          { duration: 7000 }
        );
      } else {
        const msg = detail?.mensagem || detail || 'Erro ao enviar ata';
        toast.error(msg);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConsultarProtocolo = async (id: number) => {
    try {
      setActionLoadingId(id);
      const res = await ataService.consultarProtocolo(id);
      if (res.sucesso) {
        notificarResultadoProtocolo(res, { isTransmissao: false });
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

  const handleVerHistoricoProtocolo = async (ata: AtaRegistroPreco) => {
    setHistoricoDocInfo({
      codigo: ata.codigo_ata || `${ata.numero_ata_registro_preco}/${ata.ano_ata}`,
      protocolo: ata.protocolo,
    });
    setShowHistoricoModal(true);
    try {
      setHistoricoLoading(true);
      const data = await ataService.getHistoricoProtocolo(ata.id);
      setHistoricoItems(data);
    } catch {
      toast.error('Erro ao carregar histórico de consultas do protocolo');
    } finally {
      setHistoricoLoading(false);
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

  // Ações Coletivas
  const handleExcluirColetivo = async (itens: AtaRegistroPreco[], clearSelection: () => void) => {
    if (!window.confirm(`Tem certeza que deseja excluir os ${itens.length} rascunhos de atas selecionados?`)) {
      return;
    }
    try {
      setBatchLoading(true);
      let sucessos = 0;
      let erros = 0;
      for (const item of itens) {
        try {
          await ataService.deleteAta(item.id);
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
      carregarAtas();
    } finally {
      setBatchLoading(false);
    }
  };

  const handleConsultarProtocoloColetivo = async (itens: AtaRegistroPreco[], clearSelection: () => void) => {
    try {
      setBatchLoading(true);
      toast.loading(`Consultando ${itens.length} protocolo(s)...`, { id: 'batch-consultar-atas' });
      let sucessos = 0;
      let erros = 0;
      for (const item of itens) {
        try {
          await ataService.consultarProtocolo(item.id);
          sucessos++;
        } catch {
          erros++;
        }
      }
      toast.dismiss('batch-consultar-atas');
      clearSelection();
      toast.success(`${sucessos} protocolo(s) consultado(s) com sucesso! ${erros > 0 ? `(${erros} falha(s))` : ''}`);
      carregarAtas();
    } finally {
      setBatchLoading(false);
    }
  };

  const getStatusBadge = (ata: AtaRegistroPreco) => {
    if (ata.status === 'draft') {
      return <Badge bg="secondary">Rascunho Local</Badge>;
    }
    if (ata.status === 'error') {
      return (
        <Badge bg="danger" className="d-inline-flex align-items-center gap-1">
          <AlertTriangle size={12} /> Falha no Envio
        </Badge>
      );
    }
    const isRejected = (ata.status_protocolo || '').toLowerCase().includes('rejeitado');
    const isArmazenado = (ata.status_protocolo || '').toLowerCase().includes('armazenado');

    return (
      <Badge
        bg={isRejected ? 'danger' : isArmazenado ? 'success' : 'primary'}
        className="d-inline-flex align-items-center gap-1"
      >
        {isRejected ? <AlertTriangle size={12} /> : isArmazenado ? <CheckCircle2 size={12} /> : <CheckCircle2 size={12} />}
        {ata.status_protocolo || 'Transmitida'}
      </Badge>
    );
  };

  const columns: ColumnDef<AtaRegistroPreco, any>[] = useMemo(() => [
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
      accessorKey: 'numero_ata_registro_preco',
      header: 'Nº Ata / Ano',
      cell: ({ row }) => {
        const ata = row.original;
        return (
          <div>
            <span className="fw-bold text-dark d-block">
              {ata.numero_ata_registro_preco}/{ata.ano_ata}
            </span>
            <small className="text-muted font-monospace">{ata.codigo_ata}</small>
          </div>
        );
      },
    },
    {
      accessorKey: 'codigo_edital',
      header: 'Edital de Origem',
      cell: ({ row }) => {
        const ata = row.original;
        return (
          <div>
            <Badge bg="light" text="dark" className="border">
              {ata.codigo_edital}
            </Badge>
            <div className="text-muted small">Ano compra: {ata.ano_compra}</div>
          </div>
        );
      },
    },
    {
      id: 'vigencia',
      header: 'Vigência',
      cell: ({ row }) => {
        const ata = row.original;
        return (
          <span className="small text-muted d-block">
            <Calendar size={13} className="me-1 inline" />
            {formatDateBR(ata.data_vigencia_inicio)} até {formatDateBR(ata.data_vigencia_fim)}
          </span>
        );
      },
    },
    {
      accessorKey: 'data_assinatura',
      header: 'Assinatura',
      cell: ({ row }) => formatDateBR(row.original.data_assinatura),
    },
    {
      id: 'status',
      header: 'Situação / Protocolo',
      cell: ({ row }) => {
        const ata = row.original;
        return (
          <div>
            {getStatusBadge(ata)}
            {ata.protocolo && (
              <span className="d-block small font-monospace text-muted mt-1">
                Prot: {ata.protocolo}
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
        const ata = row.original;
        const isLoading = actionLoadingId === ata.id;

        return (
          <ButtonGroup size="sm">
            {tab === 'draft' ? (
              <>
                <Button
                  variant="outline-primary"
                  onClick={() => navigate(`/atas/${ata.id}`)}
                  disabled={isLoading}
                  title="Editar rascunho"
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleEnviar(ata.id, ata.numero_ata_registro_preco)}
                  disabled={isLoading}
                  title="Transmitir para o AUDESP"
                >
                  <Send size={14} />
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={() => handleExcluir(ata.id, ata.numero_ata_registro_preco)}
                  disabled={isLoading}
                  title="Excluir rascunho"
                >
                  <Trash2 size={14} />
                </Button>
              </>
            ) : (
              <>
                {ata.protocolo && (
                  <>
                    <Button
                      variant="outline-info"
                      onClick={() => handleConsultarProtocolo(ata.id)}
                      disabled={isLoading}
                      title="Consultar status no TCESP"
                    >
                      <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => handleVerHistoricoProtocolo(ata)}
                      disabled={isLoading}
                      title="Ver histórico de consultas de protocolo"
                    >
                      <History size={14} />
                    </Button>
                  </>
                )}
                <Button
                  variant="outline-warning"
                  onClick={() => handleRetornarRascunho(ata.id)}
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

          <ImportacaoExportacaoToolbar
            modulo="atas"
            tituloModulo="Atas de Registro de Preços"
            onImportSuccess={carregarAtas}
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
            size="sm"
            variant="outline-secondary"
            onClick={carregarAtas}
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
            <p className="text-muted mt-2 mb-0">Carregando atas...</p>
          </Card.Body>
        </Card>
      ) : atas.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <Layers size={48} className="text-muted opacity-50 mb-3" />
            <h5 className="text-secondary fw-semibold">
              {search ? 'Nenhuma ata encontrada para o filtro' : tab === 'draft' ? 'Nenhum rascunho de ata de registro' : 'Nenhuma ata enviada ao AUDESP'}
            </h5>
            <p className="text-muted small">
              {tab === 'draft'
                ? 'Clique no botão "+ Nova Ata de Registro" acima para vincular itens de um edital ou cadastrar uma ARP.'
                : 'As atas transmitidas com sucesso para a API do AUDESP aparecerão nesta aba.'}
            </p>
            {tab === 'draft' && (
              <Button
                variant="success"
                size="sm"
                onClick={() => navigate('/atas/novo')}
                className="mt-2"
              >
                Cadastrar Primeira Ata
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : viewMode === 'table' ? (
        <DataTable<AtaRegistroPreco>
          columns={columns}
          data={atas}
          title={`Atas de Registro de Preços (${tab === 'draft' ? 'Rascunhos' : 'Enviadas'})`}
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
                  title="Consultar protocolo das atas selecionadas no TCESP"
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
                <th>Nº Ata / Ano</th>
                <th>Edital de Origem</th>
                <th>Vigência</th>
                <th>Data Assinatura</th>
                <th>Situação / Protocolo</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {atas.map((ata) => {
                const isRejected = (ata.status_protocolo || '').toLowerCase().includes('rejeitado');
                const errosAta = extrairErrosDetalhadosProtocolo(ata.detalhes_protocolo);
                const mostrarLinhaErros = isRejected || errosAta.length > 0;

                return (
                  <React.Fragment key={ata.id}>
                    <tr>
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
                        {getStatusBadge(ata)}
                        {ata.protocolo && (
                          <span className="d-block small font-monospace text-muted mt-1">
                            Prot: {ata.protocolo}
                          </span>
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
                              <Button
                                variant="outline-danger"
                                onClick={() => handleExcluir(ata.id, ata.numero_ata_registro_preco)}
                                disabled={actionLoadingId === ata.id}
                                title="Excluir rascunho"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </>
                          ) : (
                            <>
                              {ata.protocolo && (
                                <>
                                  <Button
                                    variant="outline-info"
                                    onClick={() => handleConsultarProtocolo(ata.id)}
                                    disabled={actionLoadingId === ata.id}
                                    title="Consultar status no TCESP"
                                  >
                                    <RefreshCw size={14} className={`me-1 ${actionLoadingId === ata.id ? 'spin' : ''}`} /> Consultar Protocolo
                                  </Button>
                                  <Button
                                    variant="outline-secondary"
                                    onClick={() => handleVerHistoricoProtocolo(ata)}
                                    disabled={actionLoadingId === ata.id}
                                    title="Ver histórico de consultas de protocolo"
                                  >
                                    <History size={14} className="me-1" /> Histórico
                                  </Button>
                                </>
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
                    {mostrarLinhaErros && (
                      <tr>
                        <td colSpan={6} className="border-top-0 pt-0">
                          <ProtocoloErrosAlert
                            errosDetalhados={errosAta}
                            statusProtocolo={ata.status_protocolo}
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
