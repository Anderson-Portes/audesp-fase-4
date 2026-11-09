import React, { useState, useEffect, useMemo } from 'react';
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
  Calendar,
  History,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';

import { PageHeader } from '../../components/PageHeader/PageHeader';
import { DataTable } from '../../components/DataTable/DataTable';
import {
  ProtocoloErrosAlert,
  HistoricoProtocoloModal,
  notificarResultadoProtocolo,
} from '../../components/ProtocoloInfo/ProtocoloComponents';
import { ImportacaoExportacaoToolbar } from '../../components/ImportacaoExportacao/ImportacaoExportacaoModal';
import { licitacaoService } from '../../services/licitacaoService';
import type { Licitacao } from '../../types/licitacao';
import type { HistoricoProtocoloItem } from '../../utils/protocoloFormatter';
import { formatDateBR, formatPncpMask } from '../../utils/formatters';

export const LicitacoesList: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'draft' | 'sent'>('draft');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [search, setSearch] = useState('');
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
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
      notificarResultadoProtocolo(res, {
        prefixoSucesso: 'Licitação transmitida com sucesso!',
        isTransmissao: true,
      });
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
      notificarResultadoProtocolo(res, { isTransmissao: false });
      carregarLicitacoes();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Erro ao consultar protocolo';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleVerHistoricoProtocolo = async (lic: Licitacao) => {
    setHistoricoDocInfo({
      codigo: lic.codigo_edital,
      protocolo: lic.protocolo,
    });
    setShowHistoricoModal(true);
    try {
      setHistoricoLoading(true);
      const data = await licitacaoService.getHistoricoProtocolo(lic.id);
      setHistoricoItems(data);
    } catch {
      toast.error('Erro ao carregar histórico de consultas do protocolo');
    } finally {
      setHistoricoLoading(false);
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

  // Ações Coletivas
  const handleExcluirColetivo = async (itens: Licitacao[], clearSelection: () => void) => {
    if (!window.confirm(`Tem certeza que deseja excluir os ${itens.length} rascunhos de licitações selecionados?`)) {
      return;
    }
    try {
      setBatchLoading(true);
      let sucessos = 0;
      let erros = 0;
      for (const item of itens) {
        try {
          await licitacaoService.deleteLicitacao(item.id);
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
      carregarLicitacoes();
    } finally {
      setBatchLoading(false);
    }
  };

  const handleConsultarProtocoloColetivo = async (itens: Licitacao[], clearSelection: () => void) => {
    try {
      setBatchLoading(true);
      toast.loading(`Consultando ${itens.length} protocolo(s)...`, { id: 'batch-consultar-lic' });
      let sucessos = 0;
      let erros = 0;
      for (const item of itens) {
        try {
          await licitacaoService.consultarProtocolo(item.id);
          sucessos++;
        } catch {
          erros++;
        }
      }
      toast.dismiss('batch-consultar-lic');
      clearSelection();
      toast.success(`${sucessos} protocolo(s) consultado(s) com sucesso! ${erros > 0 ? `(${erros} falha(s))` : ''}`);
      carregarLicitacoes();
    } finally {
      setBatchLoading(false);
    }
  };

  const columns: ColumnDef<Licitacao, any>[] = useMemo(() => [
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
      accessorKey: 'codigo_edital',
      header: 'Código Edital / PNCP',
      cell: ({ row }) => {
        const lic = row.original;
        const display = lic.codigo_edital.length === 25 ? formatPncpMask(lic.codigo_edital) : lic.codigo_edital;
        return (
          <div>
            <span className="font-monospace fw-bold text-dark">{display}</span>
            {lic.retificacao && (
              <Badge bg="warning" text="dark" className="ms-2 small">Retificação</Badge>
            )}
            <div className="text-muted small">Mun: {lic.municipio} | Ent: {lic.entidade}</div>
          </div>
        );
      },
    },
    {
      id: 'compra_processo',
      header: 'Compra / Processo',
      cell: ({ row }) => {
        const lic = row.original;
        return (
          <div>
            <div><strong>Nº Compra:</strong> {lic.numero_compra || '-'} / {lic.ano_compra || '-'}</div>
            <div className="text-muted small"><strong>Proc:</strong> {lic.numero_processo || '-'}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'objeto_edital',
      header: 'Objeto / Detalhes',
      cell: ({ row }) => {
        const obj = row.original.objeto_edital;
        const totalItens = row.original.parsed_documento?.itens?.length || 0;
        return (
          <div>
            <div className="text-truncate" style={{ maxWidth: '280px' }} title={obj || ''}>
              {obj || '-'}
            </div>
            {totalItens > 0 && (
              <Badge bg="light" text="dark" className="border mt-1">
                {totalItens} {totalItens === 1 ? 'item julgado' : 'itens julgados'}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original),
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
        const lic = row.original;
        const isLoading = actionLoadingId === lic.id;
        const isRejected = (lic.status_protocolo || '').toLowerCase().includes('rejeitado');

        return (
          <ButtonGroup size="sm">
            {tab === 'draft' ? (
              <>
                <Button
                  variant="outline-primary"
                  onClick={() => navigate(`/licitacoes/${lic.id}`)}
                  disabled={isLoading}
                  title="Editar rascunho"
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleEnviar(lic.id, lic.codigo_edital)}
                  disabled={isLoading}
                  title="Transmitir licitação para a API do AUDESP"
                >
                  <Send size={14} />
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
                  <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => handleVerHistoricoProtocolo(lic)}
                  disabled={isLoading}
                  title="Ver histórico de consultas de protocolo"
                >
                  <History size={14} />
                </Button>
                {isRejected && (
                  <Button
                    variant="outline-warning"
                    onClick={() => handleRetornarRascunho(lic.id)}
                    disabled={isLoading}
                    title="Retornar para rascunho e corrigir erros apontados pelo AUDESP"
                  >
                    <RotateCcw size={14} />
                  </Button>
                )}
              </>
            )}
          </ButtonGroup>
        );
      },
    },
  ], [tab, actionLoadingId]);

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
            onClick={() => navigate('/licitacoes/novo')}
            className="fw-bold d-flex align-items-center gap-2 shadow-sm py-2 px-3"
          >
            <Plus size={18} /> Nova Licitação
          </Button>

          <ImportacaoExportacaoToolbar
            modulo="licitacoes"
            tituloModulo="Licitações"
            onImportSuccess={carregarLicitacoes}
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
      ) : viewMode === 'table' ? (
        <DataTable<Licitacao>
          columns={columns}
          data={licitacoes}
          title={`Licitações (${tab === 'draft' ? 'Rascunhos' : 'Enviadas'})`}
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
                  title="Consultar protocolo das licitações selecionadas no TCESP"
                >
                  <RefreshCw size={14} className={batchLoading ? 'spin' : ''} />
                  <span>Consultar Protocolos ({selected.length})</span>
                </Button>
              )}
            </>
          )}
        />
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
                          <Button
                            variant="outline-secondary"
                            onClick={() => handleVerHistoricoProtocolo(lic)}
                            disabled={isLoading}
                            title="Ver histórico de consultas de protocolo"
                          >
                            <History size={14} className="me-1" /> Histórico
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

                  {lic.detalhes_protocolo && (
                    <ProtocoloErrosAlert
                      detalhesProtocolo={lic.detalhes_protocolo}
                      statusProtocolo={lic.status_protocolo}
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
