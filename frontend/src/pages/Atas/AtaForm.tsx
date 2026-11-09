import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  ButtonGroup, 
  Badge, 
  ListGroup, 
  Spinner,
  Card
} from 'react-bootstrap';
import { 
  Save, 
  Send, 
  ArrowLeft, 
  CheckSquare, 
  Square, 
  AlertCircle,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  Download,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '../../components/PageHeader/PageHeader';
import { CardBox } from '../../components/CardBox/CardBox';
import {
  ProtocoloErrosAlert,
  HistoricoProtocoloModal,
  notificarResultadoProtocolo,
} from '../../components/ProtocoloInfo/ProtocoloComponents';
import {
  MunicipioEntidadeSelect,
  getSavedMunicipio,
  getSavedEntidade
} from '../../components/MunicipioEntidadeSelect/MunicipioEntidadeSelect';
import { ataService } from '../../services/ataService';
import { editalService } from '../../services/editalService';
import { licitacaoService } from '../../services/licitacaoService';
import type { Edital } from '../../types/edital';
import type { ReferenciaEditalResponse } from '../../types/licitacao';
import type { MunicipioAudesp, EntidadeAudesp } from '../../types/audesp';
import type { HistoricoProtocoloItem } from '../../utils/protocoloFormatter';

export const AtaForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [editais, setEditais] = useState<Edital[]>([]);
  const [selectedEdital, setSelectedEdital] = useState<any>(null);
  const [municipiosList, setMunicipiosList] = useState<MunicipioAudesp[]>([]);
  const [entidadesList, setEntidadesList] = useState<EntidadeAudesp[]>([]);

  // Status de Transmissão / Protocolo
  const [ataStatus, setAtaStatus] = useState<'draft' | 'sent' | 'error'>('draft');
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [statusProtocolo, setStatusProtocolo] = useState<string | null>(null);
  const [detalhesProtocolo, setDetalhesProtocolo] = useState<any>(null);
  const [historicoProtocolo, setHistoricoProtocolo] = useState<HistoricoProtocoloItem[]>([]);
  const [showHistoricoModal, setShowHistoricoModal] = useState<boolean>(false);

  // Form State
  const [editalId, setEditalId] = useState<number | ''>('');
  const [municipio, setMunicipio] = useState<number>(() => getSavedMunicipio(7071));
  const [entidade, setEntidade] = useState<number>(() => getSavedEntidade(11310));
  const [codigoEdital, setCodigoEdital] = useState('');
  const [codigoAta, setCodigoAta] = useState('');
  const [anoCompra, setAnoCompra] = useState<number>(new Date().getFullYear());
  const [retificacao, setRetificacao] = useState(false);

  const [numeroAtaRegistroPreco, setNumeroAtaRegistroPreco] = useState('');
  const [anoAta, setAnoAta] = useState<number>(new Date().getFullYear());
  const [dataAssinatura, setDataAssinatura] = useState('');
  const [dataVigenciaInicio, setDataVigenciaInicio] = useState('');
  const [dataVigenciaFim, setDataVigenciaFim] = useState('');

  // Itens selecionados da licitação/edital
  const [selectedItens, setSelectedItens] = useState<number[]>([]);
  const [referenciaEdital, setReferenciaEdital] = useState<ReferenciaEditalResponse | null>(null);
  const [showImportarModal, setShowImportarModal] = useState<boolean>(false);

  const carregarReferenciaEdital = async (eId: number) => {
    try {
      const ref = await licitacaoService.getReferenciaEdital(eId);
      setReferenciaEdital(ref);
    } catch {
      setReferenciaEdital(null);
    }
  };

  // Carrega lista de editais para vinculação
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [dataEditais, doms] = await Promise.all([
          editalService.getEditais(),
          ataService.getDominios()
        ]);
        setEditais(dataEditais);
        if (doms?.municipios) setMunicipiosList(doms.municipios);
        if (doms?.entidades) setEntidadesList(doms.entidades);
      } catch {
        toast.error('Erro ao carregar dados iniciais da Ata.');
      }
    };
    loadInitialData();
  }, []);

  // Carrega ata se for edição
  useEffect(() => {
    if (isEditing && id) {
      const loadAta = async () => {
        try {
          setLoading(true);
          const resp = await ataService.getAtaById(Number(id));
          const { ata, documento } = resp;
          if ((resp as any).historico_protocolo) {
            setHistoricoProtocolo((resp as any).historico_protocolo);
          }
          
          setEditalId(ata.edital_id || '');
          setMunicipio(ata.municipio);
          setEntidade(ata.entidade);
          setCodigoEdital(ata.codigo_edital);
          setCodigoAta(ata.codigo_ata);
          setAnoCompra(ata.ano_compra);
          setRetificacao(ata.retificacao);

          setNumeroAtaRegistroPreco(ata.numero_ata_registro_preco);
          setAnoAta(ata.ano_ata);
          setAtaStatus(ata.status as any || 'draft');
          setProtocolo(ata.protocolo || null);
          setStatusProtocolo(ata.status_protocolo || null);
          try {
            setDetalhesProtocolo(ata.detalhes_protocolo ? JSON.parse(ata.detalhes_protocolo) : null);
          } catch {
            setDetalhesProtocolo(null);
          }
          setDataAssinatura(ata.data_assinatura ? String(ata.data_assinatura).split('T')[0] : '');
          setDataVigenciaInicio(ata.data_vigencia_inicio ? String(ata.data_vigencia_inicio).split('T')[0] : '');
          setDataVigenciaFim(ata.data_vigencia_fim ? String(ata.data_vigencia_fim).split('T')[0] : '');

          if (documento.numeroItem && Array.isArray(documento.numeroItem)) {
            setSelectedItens(documento.numeroItem);
          }

          if (ata.edital_id) {
            const ed = await editalService.getEdital(ata.edital_id);
            setSelectedEdital(ed);
            await carregarReferenciaEdital(ata.edital_id);
          }
        } catch {
          toast.error('Erro ao carregar dados da Ata.');
          navigate('/atas');
        } finally {
          setLoading(false);
        }
      };
      loadAta();
    }
  }, [id, isEditing]);

  // Ao selecionar um edital de referência
  const handleSelectEdital = async (eId: number) => {
    setEditalId(eId);
    if (!eId) {
      setSelectedEdital(null);
      setReferenciaEdital(null);
      return;
    }
    try {
      const ed = await editalService.getEdital(eId);
      setSelectedEdital(ed);

      setMunicipio(ed.municipio);
      setEntidade(ed.entidade);
      setCodigoEdital(ed.codigo_edital);
      setAnoCompra(ed.ano_compra || new Date().getFullYear());

      const ref = await licitacaoService.getReferenciaEdital(eId).catch(() => null);
      setReferenciaEdital(ref);

      // Se houver itens homologados na licitação enviada, pré-seleciona apenas os homologados; caso contrário, os do edital
      if (ref && ref.situacao_licitacao === 'enviada' && ref.itens_homologados.length > 0) {
        setSelectedItens(ref.itens_homologados);
      } else {
        const itens = (ed as any).parsed_documento?.itensCompra || (ed as any).documento?.itensCompra;
        if (itens && Array.isArray(itens)) {
          setSelectedItens(itens.map((it: any) => it.numeroItem));
        }
      }
    } catch {
      toast.error('Erro ao carregar itens do edital selecionado.');
    }
  };

  const handleImportarItensHomologados = (itensParaImportar: number[]) => {
    if (!itensParaImportar.length) {
      toast.error('Nenhum item homologado encontrado para importar.');
      return;
    }
    const merged = Array.from(new Set([...selectedItens, ...itensParaImportar])).sort((a, b) => a - b);
    setSelectedItens(merged);
    setShowImportarModal(false);
    toast.success(`${itensParaImportar.length} item(ns) homologado(s) importado(s) para a ata!`);
  };

  const toggleItem = (numItem: number) => {
    setSelectedItens((prev) =>
      prev.includes(numItem) ? prev.filter((i) => i !== numItem) : [...prev, numItem].sort((a, b) => a - b)
    );
  };

  const selectAllItens = () => {
    if (!selectedEdital) return;
    const itens = (selectedEdital as any).parsed_documento?.itensCompra || (selectedEdital as any).documento?.itensCompra;
    if (itens && Array.isArray(itens)) {
      setSelectedItens(itens.map((it: any) => it.numeroItem));
    }
  };

  const unselectAllItens = () => {
    setSelectedItens([]);
  };

  const handleSalvar = async (transmitirAposSalvar: boolean = false) => {
    if (!codigoEdital) {
      toast.error('Informe o Código do Edital de referência.');
      return;
    }
    if (!numeroAtaRegistroPreco) {
      toast.error('Informe o Número da Ata de Registro de Preço.');
      return;
    }
    if (numeroAtaRegistroPreco.trim().length > 30) {
      toast.error('O Número da Ata de Registro de Preço não pode exceder 30 caracteres.');
      return;
    }
    if (!anoAta) {
      toast.error('Informe o Ano da Ata.');
      return;
    }
    if (!dataAssinatura || !dataVigenciaInicio || !dataVigenciaFim) {
      toast.error('Informe a data de assinatura e o período de vigência.');
      return;
    }
    if (dataVigenciaFim < dataVigenciaInicio) {
      toast.error('A data de fim de vigência não pode ser menor que a data de início.');
      return;
    }
    if (selectedItens.length === 0) {
      toast.error('Selecione ao menos um item da licitação vinculado à ata.');
      return;
    }

    const codAtaFinal = codigoAta || `ATA-${numeroAtaRegistroPreco}/${anoAta}`;
    if (codAtaFinal.trim().length > 31) {
      toast.error('Código único da Ata (codigoAta) deve ter no máximo 31 caracteres.');
      return;
    }

    const documentoJSON = {
      descritor: {
        municipio: Number(municipio),
        entidade: Number(entidade),
        codigoEdital: codigoEdital.trim(),
        codigoAta: codAtaFinal.trim(),
        anoCompra: Number(anoCompra),
        retificacao: Boolean(retificacao)
      },
      numeroItem: selectedItens,
      numeroAtaRegistroPreco: numeroAtaRegistroPreco.trim(),
      anoAta: Number(anoAta),
      dataAssinatura,
      dataVigenciaInicio,
      dataVigenciaFim
    };

    const payload = {
      id: isEditing ? Number(id) : undefined,
      edital_id: editalId ? Number(editalId) : undefined,
      documento: documentoJSON
    };

    try {
      setSaving(true);
      const resAta = await ataService.salvarAta(payload);
      toast.success(isEditing ? 'Ata atualizada com sucesso!' : 'Ata criada com sucesso!');

      if (transmitirAposSalvar) {
        if (selectedEdital) {
          const edDoc = selectedEdital.parsed_documento || selectedEdital.documento;
          if (selectedEdital.status !== 'sent') {
            toast.error('O edital vinculado ainda não foi enviado ao AUDESP.');
            if (!isEditing) navigate(`/atas/${resAta.id}`);
            return;
          }
          if (!edDoc?.srp) {
            toast.error('Ata de registro de preços exige edital SRP.');
            if (!isEditing) navigate(`/atas/${resAta.id}`);
            return;
          }
          if (referenciaEdital && referenciaEdital.situacao_licitacao !== 'enviada') {
            toast.error(
              referenciaEdital.situacao_licitacao === 'inexistente'
                ? 'O edital ainda não tem licitação.'
                : 'A licitação do edital ainda não foi enviada ao AUDESP.'
            );
            if (!isEditing) navigate(`/atas/${resAta.id}`);
            return;
          }
        }
        setSending(true);
        toast.loading('Transmitindo para o AUDESP...', { id: 'transmissao' });
        const resEnvio = await ataService.enviarAta(resAta.id);
        toast.dismiss('transmissao');
        setSending(false);
        if (resEnvio.sucesso) {
          notificarResultadoProtocolo(resEnvio, {
            prefixoSucesso: 'Ata transmitida com sucesso!',
            isTransmissao: true,
          });
          navigate('/atas');
        } else {
          toast.error(resEnvio.mensagem || 'Falha na transmissão da ata.');
          navigate(`/atas/${resAta.id}`);
        }
      } else {
        if (!isEditing) {
          navigate(`/atas/${resAta.id}`);
        }
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.erros?.length) {
        toast.error(detail.erros.join(' | '));
      } else {
        toast.error(detail?.mensagem || detail || 'Erro ao salvar/enviar ata.');
      }
    } finally {
      setSaving(false);
      setSending(false);
    }
  };

  const handleConsultarProtocolo = async () => {
    if (!id) return;
    try {
      setSending(true);
      const res = await ataService.consultarProtocolo(Number(id));
      if (res.sucesso) {
        setStatusProtocolo(res.status);
        setDetalhesProtocolo(res.detalhes || res.dados);
        if (res.historico) {
          setHistoricoProtocolo(res.historico);
        }
        notificarResultadoProtocolo(res, { isTransmissao: false });
      } else {
        toast.error(res.mensagem || 'Erro ao consultar protocolo.');
      }
    } catch {
      toast.error('Falha ao consultar protocolo no AUDESP');
    } finally {
      setSending(false);
    }
  };

  const handleRetornarRascunho = async () => {
    if (!id) return;
    if (!window.confirm('Deseja retornar esta ata para rascunho para corrigir eventuais dados?')) {
      return;
    }
    try {
      setLoading(true);
      await ataService.retornarRascunho(Number(id));
      setAtaStatus('draft');
      toast.success('Ata retornada para rascunho com sucesso!');
    } catch {
      toast.error('Erro ao retornar ata para rascunho');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="p-4 text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Carregando dados da Ata...</p>
      </Container>
    );
  }

  const isSent = ataStatus === 'sent';
  const itensCompra = selectedEdital?.parsed_documento?.itensCompra || selectedEdital?.documento?.itensCompra;
  const isEditalSrp = (ed: any) => {
    if (!ed) return false;
    if (ed.parsed_documento) return Boolean(ed.parsed_documento.srp);
    if (ed.documento_json) {
      try {
        const parsed = typeof ed.documento_json === 'string' ? JSON.parse(ed.documento_json) : ed.documento_json;
        return Boolean(parsed?.srp);
      } catch {
        return false;
      }
    }
    return false;
  };
  const editaisParaAta = editais.filter(
    (ed) => (ed.status === 'sent' && isEditalSrp(ed)) || ed.id === Number(editalId)
  );
  const selectedEditalSrp = selectedEdital ? isEditalSrp(selectedEdital) : true;
  const avisoBloqueioEnvio = selectedEdital
    ? selectedEdital.status !== 'sent'
      ? 'O edital selecionado ainda está em rascunho. Você pode salvar o rascunho da ata, mas o envio ao AUDESP exige que o edital seja enviado primeiro.'
      : !selectedEditalSrp
      ? 'Ata de registro de preços exige edital com Sistema de Registro de Preços (SRP) marcado.'
      : referenciaEdital?.situacao_licitacao === 'inexistente'
      ? 'O edital selecionado ainda não possui licitação cadastrada. O envio da ata ao AUDESP exige uma licitação enviada.'
      : referenciaEdital?.situacao_licitacao === 'rascunho'
      ? 'A licitação do edital ainda está em rascunho. Envie a licitação ao AUDESP antes de transmitir a ata.'
      : null
    : null;

  return (
    <Container fluid className="p-0 pb-5">
      <PageHeader
        title={isSent ? 'Ata Transmitida (Fase IV)' : id ? `Editar Ata: ${numeroAtaRegistroPreco}/${anoAta}` : 'Nova Ata de Registro de Preço (ARP)'}
        actions={
          <button
            onClick={() => navigate('/atas')}
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
          >
            <ArrowLeft size={16} /> Voltar à Lista
          </button>
        }
      />

      {/* Protocol Banner if Sent */}
      {isSent && (
        <div className={`alert ${statusProtocolo?.toLowerCase().includes('rejeitado') ? 'alert-danger' : 'alert-success'} shadow-sm mb-4`}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <h5 className="alert-heading mb-1 d-flex align-items-center gap-2">
                <CheckCircle2 size={20} /> Protocolo AUDESP: <strong>{protocolo}</strong>
              </h5>
              <p className="mb-0 small">
                Situação no Tribunal de Contas: <strong>{statusProtocolo || 'Recebido'}</strong>
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={handleConsultarProtocolo}
                disabled={sending}
                className="btn btn-sm btn-light border d-flex align-items-center gap-1"
              >
                <RefreshCw size={14} className={sending ? 'spin' : ''} /> Consultar Protocolo
              </button>
              <button
                type="button"
                onClick={() => setShowHistoricoModal(true)}
                className="btn btn-sm btn-light border d-flex align-items-center gap-1"
              >
                <History size={14} /> Histórico ({historicoProtocolo.length})
              </button>
              <span className="badge bg-white text-dark fs-6 px-3 py-2 border">
                Fase IV — TCESP
              </span>
            </div>
          </div>

          <ProtocoloErrosAlert
            detalhesProtocolo={detalhesProtocolo}
            statusProtocolo={statusProtocolo}
            className="mt-3"
          />
        </div>
      )}

      <HistoricoProtocoloModal
        show={showHistoricoModal}
        onHide={() => setShowHistoricoModal(false)}
        protocolo={protocolo}
        codigoDocumento={codigoAta || `${numeroAtaRegistroPreco}/${anoAta}`}
        historico={historicoProtocolo}
      />

      <Row className="g-4">
        {/* Seções em 100% de largura empilhadas verticalmente */}
        <Col xs={12}>
          <CardBox title="1. Edital / Licitação e Identificadores do TCESP">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Vincular a um Edital / Licitação SRP:</Form.Label>
              <Form.Select
                value={editalId}
                onChange={(e) => handleSelectEdital(Number(e.target.value))}
                disabled={isSent}
              >
                <option value="">-- Selecione o edital / certame homologado para puxar itens e preços --</option>
                {editaisParaAta.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.codigo_edital} - {ed.numero_compra}/{ed.ano_compra} ({ed.objeto_compra ? ed.objeto_compra.substring(0, 60) + '...' : ''})
                    {ed.status !== 'sent' ? ' [Edital Rascunho]' : ''}
                    {!isEditalSrp(ed) ? ' [Sem SRP]' : ' [SRP]'}
                  </option>
                ))}
              </Form.Select>
              {referenciaEdital && (
                <div className="mt-2 small">
                  {referenciaEdital.situacao_licitacao === 'enviada' ? (
                    <span className="text-success fw-semibold d-inline-flex align-items-center gap-1">
                      <CheckCircle2 size={14} /> Licitação homologada e transmitida ao AUDESP (preços atualizados disponíveis).
                    </span>
                  ) : referenciaEdital.situacao_licitacao === 'rascunho' ? (
                    <span className="text-warning fw-semibold d-inline-flex align-items-center gap-1">
                      <AlertCircle size={14} /> Licitação deste edital ainda está em rascunho (preços estimados do edital em uso).
                    </span>
                  ) : (
                    <span className="text-muted d-inline-flex align-items-center gap-1">
                      <AlertCircle size={14} /> Nenhuma licitação vinculada a este edital cadastrada ainda.
                    </span>
                  )}
                </div>
              )}
              {avisoBloqueioEnvio && (
                <div className="alert alert-warning py-2 px-3 mt-2 mb-0 small d-flex align-items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{avisoBloqueioEnvio}</span>
                </div>
              )}
            </Form.Group>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Código do Edital: *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ex: PREG-01/2026"
                    maxLength={30}
                    value={codigoEdital}
                    onChange={(e) => setCodigoEdital(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Ano da Compra/Contratação: *</Form.Label>
                  <Form.Control
                    type="number"
                    value={anoCompra}
                    onChange={(e) => setAnoCompra(Number(e.target.value))}
                    required
                  />
                </Form.Group>
              </Col>

              <MunicipioEntidadeSelect
                municipio={municipio}
                entidade={entidade}
                onMunicipioChange={setMunicipio}
                onEntidadeChange={setEntidade}
                municipiosList={municipiosList}
                entidadesList={entidadesList}
                disabled={retificacao}
                municipioColMd={6}
                entidadeColMd={6}
              />

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Código Único da Ata: *</Form.Label>
                  <Form.Control
                    type="text"
                    className="font-monospace"
                    placeholder="Ex: ATA-10/2026 (gerado automaticamente se vazio)"
                    maxLength={31}
                    value={codigoAta}
                    onChange={(e) => setCodigoAta(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Identificador unívoco da ata no TCESP (campo <code>codigoAta</code>).
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Check
                  type="switch"
                  id="chkRetificacao"
                  label="Esta remessa é uma Retificação de Ata já enviada anteriormente"
                  checked={retificacao}
                  onChange={(e) => setRetificacao(e.target.checked)}
                  className="fw-medium mt-2"
                />
              </Col>
            </Row>
          </CardBox>

          {/* Dados da Ata */}
          <div className="mt-4">
            <CardBox title="2. Dados da Ata de Registro de Preços">
              <Row className="g-3">
                <Col md={8}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Número da Ata no Sistema de Origem: *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: 014/2026 ou 14"
                      maxLength={30}
                      value={numeroAtaRegistroPreco}
                      onChange={(e) => setNumeroAtaRegistroPreco(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Ano da Ata: *</Form.Label>
                    <Form.Control
                      type="number"
                      value={anoAta}
                      onChange={(e) => setAnoAta(Number(e.target.value))}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Data de Assinatura: *</Form.Label>
                    <Form.Control
                      type="date"
                      value={dataAssinatura}
                      onChange={(e) => setDataAssinatura(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Início da Vigência: *</Form.Label>
                    <Form.Control
                      type="date"
                      value={dataVigenciaInicio}
                      onChange={(e) => setDataVigenciaInicio(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Fim da Vigência: *</Form.Label>
                    <Form.Control
                      type="date"
                      value={dataVigenciaFim}
                      onChange={(e) => setDataVigenciaFim(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </CardBox>
          </div>
        </Col>

        {/* Seção 3: Itens da Licitação Vinculados à Ata */}
        <Col xs={12}>
          <CardBox 
            title="3. Itens da Contratação Vinculados à Ata"
            actions={
              <div className="d-flex align-items-center gap-2">
                {!isSent && referenciaEdital?.situacao_licitacao === 'enviada' && (
                  <Button
                    size="sm"
                    variant="outline-success"
                    onClick={() => setShowImportarModal(true)}
                    className="d-flex align-items-center gap-1"
                  >
                    <Download size={14} /> Importar itens homologados
                  </Button>
                )}
                {itensCompra && itensCompra.length > 0 && !isSent && (
                  <ButtonGroup size="sm">
                    <Button variant="outline-primary" onClick={selectAllItens}>
                      Marcar Todos
                    </Button>
                    <Button variant="outline-secondary" onClick={unselectAllItens}>
                      Desmarcar Todos
                    </Button>
                  </ButtonGroup>
                )}
              </div>
            }
          >
            {itensCompra && itensCompra.length > 0 ? (
              <div>
                <p className="text-muted small mb-3">
                  Selecione quais itens do edital <strong>{codigoEdital}</strong> fazem parte desta Ata de Registro de Preços:
                </p>
                <ListGroup style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  {itensCompra.map((item: any) => {
                    const checked = selectedItens.includes(item.numeroItem);
                    const detalheLic = referenciaEdital?.itens_detalhes?.[item.numeroItem];
                    const temValorHomologado = detalheLic?.valorHomologado !== undefined && detalheLic?.valorHomologado !== null;

                    return (
                      <ListGroup.Item
                        key={item.numeroItem}
                        action
                        active={checked}
                        onClick={() => toggleItem(item.numeroItem)}
                        className="d-flex align-items-start gap-3 p-3 cursor-pointer"
                      >
                        <div className={`mt-1 ${checked ? 'text-white' : 'text-primary'}`}>
                          {checked ? <CheckSquare size={20} /> : <Square size={20} className="text-muted" />}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold">Item {item.numeroItem}</span>
                              {detalheLic?.homologado && (
                                <Badge bg={checked ? 'light' : 'success'} text={checked ? 'dark' : undefined}>
                                  Homologado
                                </Badge>
                              )}
                            </div>
                            <Badge bg={checked ? 'light' : 'secondary'} text={checked ? 'dark' : undefined}>
                              {item.materialOuServico === 'M' ? 'Material' : 'Serviço'}
                            </Badge>
                          </div>
                          <p className={`mb-1 small ${checked ? 'text-white' : 'text-dark'}`}>{item.descricao}</p>
                          <div className={`d-flex flex-wrap gap-3 small ${checked ? 'text-light' : 'text-muted'}`}>
                            <span>Qtd: <strong>{item.quantidade}</strong> {item.unidadeMedida}</span>
                            {temValorHomologado ? (
                              <span>
                                Unitário Homologado: <strong className={checked ? 'text-white fw-bold' : 'text-success fw-bold'}>R$ {Number(detalheLic.valorHomologado).toFixed(2)}</strong>
                                {item.valorUnitarioEstimado && (
                                  <span className={`ms-1 opacity-75 text-decoration-line-through`}>
                                    (Est: R$ {Number(item.valorUnitarioEstimado).toFixed(2)})
                                  </span>
                                )}
                              </span>
                            ) : item.valorUnitarioEstimado ? (
                              <span>Unitário Estimado: <strong>R$ {Number(item.valorUnitarioEstimado).toFixed(2)}</strong></span>
                            ) : null}
                            {detalheLic?.vencedorNome && (
                              <span>Vencedor: <strong>{detalheLic.vencedorNome}</strong></span>
                            )}
                          </div>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
                <div className="mt-3 p-2 bg-light rounded text-muted small d-flex justify-content-between align-items-center">
                  <span>Itens selecionados para esta ata:</span>
                  <Badge bg="primary" className="fs-6">{selectedItens.length} de {itensCompra.length}</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                <AlertCircle size={36} className="mb-2 opacity-50 text-warning" />
                <p className="fw-medium mb-1">Nenhum edital selecionado ou sem itens carregados.</p>
                <small className="d-block mb-3">
                  Selecione um Edital no passo 1 ou adicione manualmente os números dos itens abaixo:
                </small>
                
                {/* Fallback de inserção manual de números de item */}
                <Card body className="text-start bg-light">
                  <Form.Group>
                    <Form.Label className="fw-bold small">
                      Números dos itens (separados por vírgula):
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: 1, 2, 3, 4"
                      value={selectedItens.join(', ')}
                      onChange={(e) => {
                        const nums = e.target.value
                          .split(',')
                          .map((s) => parseInt(s.trim()))
                          .filter((n) => !isNaN(n) && n > 0);
                        setSelectedItens(Array.from(new Set(nums)));
                      }}
                    />
                    <Form.Text className="text-muted mt-1">
                      Ex: 1, 2, 5 (números dos itens vencedores do SRP)
                    </Form.Text>
                  </Form.Group>
                </Card>
              </div>
            )}
          </CardBox>
        </Col>
      </Row>

      {/* Botões de Ação no Final do Formulário */}
      <div className="card shadow-sm border-0 mt-4 p-3 bg-white">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/atas')}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          >
            <ArrowLeft size={16} /> Voltar à Lista
          </button>

          <div className="d-flex align-items-center gap-2">
            {!isSent ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSalvar(false)}
                  disabled={saving || sending}
                  className="btn btn-outline-success fw-bold btn-sm d-flex align-items-center gap-1 shadow-sm"
                >
                  <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Rascunho'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSalvar(true)}
                  disabled={saving || sending}
                  className="btn btn-warning text-dark fw-bold btn-sm d-flex align-items-center gap-1 shadow-sm"
                >
                  <Send size={16} /> {sending ? 'Transmitindo...' : 'Transmitir à AUDESP'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleConsultarProtocolo}
                  disabled={sending}
                  className="btn btn-outline-primary fw-bold btn-sm d-flex align-items-center gap-1 shadow-sm"
                >
                  <RefreshCw size={16} className={sending ? 'spin' : ''} /> Atualizar Status
                </button>
                {statusProtocolo?.toLowerCase().includes('rejeitado') && (
                  <button
                    type="button"
                    onClick={handleRetornarRascunho}
                    className="btn btn-warning text-dark fw-bold btn-sm d-flex align-items-center gap-1 shadow-sm"
                  >
                    <RotateCcw size={16} /> Corrigir e Reenviar
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Importar Itens Homologados da Licitação */}
      {showImportarModal && referenciaEdital && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fs-6 fw-bold">Importar Itens Homologados da Licitação</h5>
                <button type="button" className="btn-close" onClick={() => setShowImportarModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="small text-muted mb-3">
                  Escolha importar todos os itens homologados na licitação enviada ou apenas os itens vencidos por um fornecedor específico:
                </p>
                <div className="list-group">
                  <button
                    type="button"
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                    onClick={() => handleImportarItensHomologados(referenciaEdital.itens_homologados)}
                  >
                    <div>
                      <div className="fw-bold text-primary">Todos os itens homologados</div>
                      <div className="small text-muted">
                        Itens: {referenciaEdital.itens_homologados.join(', ') || 'Nenhum'}
                      </div>
                    </div>
                    <Badge bg="primary">{referenciaEdital.itens_homologados.length} item(ns)</Badge>
                  </button>

                  {referenciaEdital.fornecedores_vencedores.map((forn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      onClick={() => handleImportarItensHomologados(forn.itensVencidos)}
                    >
                      <div>
                        <div className="fw-bold font-monospace">
                          {forn.niFornecedor} ({forn.tipoPessoaFornecedor})
                        </div>
                        {forn.nomeRazaoSocial && (
                          <div className="small text-dark">{forn.nomeRazaoSocial}</div>
                        )}
                        <div className="small text-muted">
                          Itens vencidos: {forn.itensVencidos.join(', ')}
                        </div>
                      </div>
                      <Badge bg="success">{forn.itensVencidos.length} item(ns)</Badge>
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" size="sm" onClick={() => setShowImportarModal(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};
