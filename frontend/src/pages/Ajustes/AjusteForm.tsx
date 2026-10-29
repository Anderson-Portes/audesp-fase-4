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
  Card as BSCard
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
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '../../components/PageHeader/PageHeader';
import { CardBox } from '../../components/CardBox/CardBox';
import { MunicipioEntidadeSelect } from '../../components/MunicipioEntidadeSelect/MunicipioEntidadeSelect';
import { ajusteService } from '../../services/ajusteService';
import { editalService } from '../../services/editalService';
import { ataService } from '../../services/ataService';
import type { Edital } from '../../types/edital';
import type { AtaRegistroPreco } from '../../types/ata';
import type { DominiosAjusteResponse } from '../../types/ajuste';

export const AjusteForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [dominios, setDominios] = useState<DominiosAjusteResponse | null>(null);

  // Status de Transmissão / Protocolo
  const [ajusteStatus, setAjusteStatus] = useState<'draft' | 'sent' | 'error'>('draft');
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [statusProtocolo, setStatusProtocolo] = useState<string | null>(null);
  const [detalhesProtocolo, setDetalhesProtocolo] = useState<any>(null);

  // Listas de origem para autopreenchimento
  const [editais, setEditais] = useState<Edital[]>([]);
  const [atas, setAtas] = useState<AtaRegistroPreco[]>([]);
  const [selectedEdital, setSelectedEdital] = useState<any>(null);

  // Vínculos
  const [origemTipo, setOrigemTipo] = useState<'edital' | 'ata'>('edital');
  const [editalId, setEditalId] = useState<number | ''>('');
  const [ataId, setAtaId] = useState<number | ''>('');

  // 1. Descritor
  const [municipio, setMunicipio] = useState<number>(7071);
  const [entidade, setEntidade] = useState<number>(11310);
  const [adesaoParticipacao, setAdesaoParticipacao] = useState<boolean>(false);
  const [codigoEdital, setCodigoEdital] = useState('');
  const [codigoAta, setCodigoAta] = useState('');
  const [codigoContrato, setCodigoContrato] = useState('');
  const [retificacao, setRetificacao] = useState(false);

  // 2. Dados do Contrato
  const [tipoContratoId, setTipoContratoId] = useState<number>(1);
  const [numeroContratoEmpenho, setNumeroContratoEmpenho] = useState('');
  const [anoContrato, setAnoContrato] = useState<number>(new Date().getFullYear());
  const [processo, setProcesso] = useState('');
  const [categoriaProcessoId, setCategoriaProcessoId] = useState<number>(2); // Compras
  const [tipoObjetoContrato, setTipoObjetoContrato] = useState<number>(11); // Outros materiais de consumo
  const [receita, setReceita] = useState<boolean>(false);

  // 3. Fornecedor Contratado
  const [tipoPessoaFornecedor, setTipoPessoaFornecedor] = useState<'PJ' | 'PF' | 'PE'>('PJ');
  const [niFornecedor, setNiFornecedor] = useState('');
  const [nomeRazaoSocialFornecedor, setNomeRazaoSocialFornecedor] = useState('');

  // Subcontratado (opcional)
  const [hasSubcontratado, setHasSubcontratado] = useState<boolean>(false);
  const [tipoPessoaSub, setTipoPessoaSub] = useState<'PJ' | 'PF' | 'PE'>('PJ');
  const [niSub, setNiSub] = useState('');
  const [nomeSub, setNomeSub] = useState('');

  // 4. Objeto e Valores
  const [objetoContrato, setObjetoContrato] = useState('');
  const [informacaoComplementar, setInformacaoComplementar] = useState('');
  const [valorInicial, setValorInicial] = useState<number>(0);
  const [valorGlobal, setValorGlobal] = useState<number>(0);
  const [numeroParcelas, setNumeroParcelas] = useState<number>(1);
  const [valorParcela, setValorParcela] = useState<number>(0);

  // 5. Vigência
  const [dataAssinatura, setDataAssinatura] = useState('');
  const [dataVigenciaInicio, setDataVigenciaInicio] = useState('');
  const [dataVigenciaFim, setDataVigenciaFim] = useState('');
  const [vigenciaMeses, setVigenciaMeses] = useState<number | ''>('');

  // 6. Itens e Fontes de Recursos
  const [fontesRecursos, setFontesRecursos] = useState<number[]>([1]); // Tesouro
  const [selectedItens, setSelectedItens] = useState<number[]>([]);

  // Carrega domínios e listas de editais/atas
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        const [doms, eds, atList] = await Promise.all([
          ajusteService.getDominios(),
          editalService.getEditais(),
          ataService.getAtas()
        ]);
        setDominios(doms);
        setEditais(eds);
        setAtas(atList);
      } catch {
        toast.error('Erro ao carregar dados auxiliares de contratos.');
      }
    };
    carregarDadosIniciais();
  }, []);

  // Carrega dados se for edição
  useEffect(() => {
    if (isEditing && id) {
      const loadAjuste = async () => {
        try {
          setLoading(true);
          const { ajuste, documento } = await ajusteService.getAjusteById(Number(id));

          setEditalId(ajuste.edital_id || '');
          setAtaId(ajuste.ata_id || '');
          setMunicipio(ajuste.municipio);
          setEntidade(ajuste.entidade);
          setCodigoEdital(ajuste.codigo_edital);
          setCodigoAta(ajuste.codigo_ata || '');
          setCodigoContrato(ajuste.codigo_contrato);
          setRetificacao(ajuste.retificacao);
          setAjusteStatus(ajuste.status as any || 'draft');
          setProtocolo(ajuste.protocolo || null);
          setStatusProtocolo(ajuste.status_protocolo || null);
          try {
            setDetalhesProtocolo(ajuste.detalhes_protocolo ? JSON.parse(ajuste.detalhes_protocolo) : null);
          } catch {
            setDetalhesProtocolo(null);
          }

          setTipoContratoId(ajuste.tipo_contrato_id);
          setNumeroContratoEmpenho(ajuste.numero_contrato_empenho);
          setAnoContrato(ajuste.ano_contrato);
          setProcesso(ajuste.processo);
          setCategoriaProcessoId(ajuste.categoria_processo_id);
          setTipoObjetoContrato(ajuste.tipo_objeto_contrato);
          setReceita(ajuste.receita);

          setTipoPessoaFornecedor((ajuste.tipo_pessoa_fornecedor as any) || 'PJ');
          setNiFornecedor(ajuste.ni_fornecedor);
          setNomeRazaoSocialFornecedor(ajuste.nome_razao_social_fornecedor);

          if (documento.niFornecedorSubContratado) {
            setHasSubcontratado(true);
            setNiSub(documento.niFornecedorSubContratado);
            setTipoPessoaSub(documento.tipoPessoaFornecedorSubContratado || 'PJ');
            setNomeSub(documento.nomeRazaoSocialFornecedorSubContratado || '');
          }

          setObjetoContrato(documento.objetoContrato || '');
          setInformacaoComplementar(documento.informacaoComplementar || '');
          setValorInicial(ajuste.valor_inicial);
          setValorGlobal(ajuste.valor_global);
          setNumeroParcelas(documento.numeroParcelas || 1);
          setValorParcela(documento.valorParcela || 0);

          setDataAssinatura(ajuste.data_assinatura ? String(ajuste.data_assinatura).split('T')[0] : '');
          setDataVigenciaInicio(ajuste.data_vigencia_inicio ? String(ajuste.data_vigencia_inicio).split('T')[0] : '');
          setDataVigenciaFim(ajuste.data_vigencia_fim ? String(ajuste.data_vigencia_fim).split('T')[0] : '');
          setVigenciaMeses(documento.vigenciaMeses || '');

          if (documento.itens && Array.isArray(documento.itens)) {
            setSelectedItens(documento.itens);
          }
          if (documento.fonteRecursosContratacao && Array.isArray(documento.fonteRecursosContratacao)) {
            setFontesRecursos(documento.fonteRecursosContratacao);
          }

          if (ajuste.edital_id) {
            const ed = await editalService.getEdital(ajuste.edital_id);
            setSelectedEdital(ed);
          }
        } catch {
          toast.error('Erro ao carregar dados do Ajuste/Contrato.');
          navigate('/ajustes');
        } finally {
          setLoading(false);
        }
      };
      loadAjuste();
    }
  }, [id, isEditing]);

  // Atas filtradas para o edital selecionado (ou todas se nenhum selecionado)
  const atasDisponiveis = editalId
    ? atas.filter((a) => a.edital_id === Number(editalId) || (codigoEdital && a.codigo_edital === codigoEdital))
    : atas;

  const handleSelectEdital = async (eId: number) => {
    setEditalId(eId);
    if (!eId) {
      setSelectedEdital(null);
      setAtaId('');
      setCodigoAta('');
      return;
    }
    try {
      const ed = await editalService.getEdital(eId);
      setSelectedEdital(ed);

      setMunicipio(ed.municipio);
      setEntidade(ed.entidade);
      setCodigoEdital(ed.codigo_edital);
      setProcesso(ed.numero_processo || '');
      setObjetoContrato(ed.objeto_compra || '');

      // Se havia uma ata selecionada que não pertence a este edital, reseta
      if (ataId) {
        const ataAtual = atas.find((a) => a.id === Number(ataId));
        if (ataAtual && ataAtual.edital_id !== eId && ataAtual.codigo_edital !== ed.codigo_edital) {
          setAtaId('');
          setCodigoAta('');
        }
      }

      const itens = (ed as any).parsed_documento?.itensCompra || (ed as any).documento?.itensCompra;
      if (itens && Array.isArray(itens)) {
        setSelectedItens(itens.map((it: any) => it.numeroItem));
      }
    } catch {
      toast.error('Erro ao carregar dados do edital selecionado.');
    }
  };

  const handleSelectAta = async (aId: number) => {
    setAtaId(aId);
    if (!aId) {
      setCodigoAta('');
      return;
    }
    try {
      const { ata, documento } = await ataService.getAtaById(aId);
      setCodigoAta(ata.codigo_ata);
      if (!editalId && ata.codigo_edital) {
        setCodigoEdital(ata.codigo_edital);
      }
      setMunicipio(ata.municipio);
      setEntidade(ata.entidade);
      if (ata.edital_id && ata.edital_id !== editalId) {
        setEditalId(ata.edital_id);
        const ed = await editalService.getEdital(ata.edital_id);
        setSelectedEdital(ed);
      }
      if (documento.numeroItem && Array.isArray(documento.numeroItem)) {
        setSelectedItens(documento.numeroItem);
      }
    } catch {
      toast.error('Erro ao vincular ata selecionada.');
    }
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
    if (!codigoEdital) {
      toast.error('Informe o Código do Edital.');
      return;
    }

    // Validação SRP: se edital é SRP e não é adesão, a ata vinculada é obrigatória
    const editalDoc = selectedEdital?.parsed_documento || selectedEdital?.documento;
    const isSrp = Boolean(editalDoc?.srp);
    if (!adesaoParticipacao && isSrp && !codigoAta) {
      toast.error('O Edital selecionado é do tipo SRP (Sistema de Registro de Preços): informe ou selecione a Ata vinculada.');
      return;
    }

    // Código do contrato: até 25 caracteres (se sem PNCP, validação flexível de tamanho local)
    const codContratoFinal = codigoContrato || `CONTR-${numeroContratoEmpenho}/${anoContrato}`;
    if (codContratoFinal.length > 25) {
      toast.error('Código único do contrato (codigoContrato) deve ter no máximo 25 caracteres.');
      return;
    }
    if (codigoAta && codigoAta.length > 31) {
      toast.error('Código da Ata deve ter no máximo 31 caracteres.');
      return;
    }
    if (!processo) {
      toast.error('Informe o Número do Processo administrativo.');
      return;
    }
    if (!niFornecedor || !nomeRazaoSocialFornecedor) {
      toast.error('Informe o CPF/CNPJ e a Razão Social do Fornecedor contratado.');
      return;
    }
    if (!objetoContrato) {
      toast.error('Informe a descrição do objeto do contrato.');
      return;
    }
    if (!dataAssinatura) {
      toast.error('Informe a data de assinatura do contrato.');
      return;
    }
    if (dataVigenciaInicio && dataVigenciaFim && dataVigenciaFim < dataVigenciaInicio) {
      toast.error('A data de fim da vigência não pode ser menor que a data de início.');
      return;
    }
    if (selectedItens.length === 0) {
      toast.error('Selecione ao menos um item contratado.');
      return;
    }

    const descritor: any = {
      municipio: Number(municipio),
      entidade: Number(entidade),
      adesaoParticipacao: Boolean(adesaoParticipacao),
      codigoEdital: codigoEdital.trim(),
      codigoContrato: codContratoFinal.trim(),
      retificacao: Boolean(retificacao)
    };
    if (codigoAta) {
      descritor.codigoAta = codigoAta.trim();
    }

    const documentoJSON: any = {
      descritor,
      fonteRecursosContratacao: fontesRecursos,
      itens: selectedItens,
      tipoContratoId: Number(tipoContratoId),
      numeroContratoEmpenho: numeroContratoEmpenho.trim(),
      anoContrato: Number(anoContrato),
      processo: processo.trim(),
      categoriaProcessoId: Number(categoriaProcessoId),
      receita: Boolean(receita),
      niFornecedor: niFornecedor.trim(),
      tipoPessoaFornecedor,
      nomeRazaoSocialFornecedor: nomeRazaoSocialFornecedor.trim(),
      objetoContrato: objetoContrato.trim(),
      valorInicial: Number(valorInicial),
      valorGlobal: valorGlobal ? Number(valorGlobal) : Number(valorInicial),
      dataAssinatura,
      tipoObjetoContrato: Number(tipoObjetoContrato)
    };

    if (informacaoComplementar) {
      documentoJSON.informacaoComplementar = informacaoComplementar.trim();
    }
    if (dataVigenciaInicio) {
      documentoJSON.dataVigenciaInicio = dataVigenciaInicio;
    }
    if (dataVigenciaFim) {
      documentoJSON.dataVigenciaFim = dataVigenciaFim;
    }
    if (vigenciaMeses) {
      documentoJSON.vigenciaMeses = Number(vigenciaMeses);
    }
    if (numeroParcelas) {
      documentoJSON.numeroParcelas = Number(numeroParcelas);
      documentoJSON.valorParcela = valorParcela ? Number(valorParcela) : Number((valorInicial / numeroParcelas).toFixed(4));
    }
    if (hasSubcontratado && niSub && nomeSub) {
      documentoJSON.niFornecedorSubContratado = niSub.trim();
      documentoJSON.tipoPessoaFornecedorSubContratado = tipoPessoaSub;
      documentoJSON.nomeRazaoSocialFornecedorSubContratado = nomeSub.trim();
    }

    const payload = {
      id: isEditing ? Number(id) : undefined,
      edital_id: editalId ? Number(editalId) : undefined,
      ata_id: ataId ? Number(ataId) : undefined,
      documento: documentoJSON
    };

    try {
      setSaving(true);
      const resAjuste = await ajusteService.salvarAjuste(payload);
      toast.success(isEditing ? 'Ajuste/Contrato atualizado com sucesso!' : 'Ajuste/Contrato criado com sucesso!');

      if (transmitirAposSalvar) {
        setSending(true);
        toast.loading('Transmitindo para o AUDESP...', { id: 'transmissao' });
        const resEnvio = await ajusteService.enviarAjuste(resAjuste.id);
        toast.dismiss('transmissao');
        setSending(false);
        if (resEnvio.sucesso) {
          toast.success(`Contrato transmitido! Protocolo: ${resEnvio.protocolo}`);
          navigate('/ajustes');
        } else {
          toast.error(resEnvio.mensagem || 'Falha na transmissão do contrato.');
          navigate(`/ajustes/${resAjuste.id}`);
        }
      } else {
        if (!isEditing) {
          navigate(`/ajustes/${resAjuste.id}`);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Erro ao salvar ajuste.';
      toast.error(msg);
    } finally {
      setSaving(false);
      setSending(false);
    }
  };

  const handleConsultarProtocolo = async () => {
    if (!id) return;
    try {
      setSending(true);
      const res = await ajusteService.consultarProtocolo(Number(id));
      if (res.sucesso) {
        setStatusProtocolo(res.status);
        setDetalhesProtocolo(res.detalhes);
        toast.success(`Status atualizado: ${res.status}`);
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
    if (!window.confirm('Deseja retornar este contrato para rascunho para corrigir eventuais dados?')) {
      return;
    }
    try {
      setLoading(true);
      await ajusteService.retornarRascunho(Number(id));
      setAjusteStatus('draft');
      toast.success('Contrato retornado para rascunho com sucesso!');
    } catch {
      toast.error('Erro ao retornar contrato para rascunho');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="p-4 text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Carregando dados do Ajuste/Contrato...</p>
      </Container>
    );
  }

  const isSent = ajusteStatus === 'sent';
  const itensEdital = selectedEdital?.parsed_documento?.itensCompra || selectedEdital?.documento?.itensCompra;

  return (
    <Container fluid className="p-0 pb-5">
      <PageHeader
        title={isSent ? 'Contrato Transmitido (Fase IV)' : id ? `Editar Ajuste: ${numeroContratoEmpenho}/${anoContrato}` : 'Novo Ajuste / Contrato (Fase IV)'}
        actions={
          <button
            onClick={() => navigate('/ajustes')}
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
          >
            <ArrowLeft size={16} /> Voltar à Lista
          </button>
        }
      />

      {/* Protocol Banner if Sent */}
      {isSent && (
        <div className={`alert ${statusProtocolo?.toLowerCase().includes('rejeitado') ? 'alert-danger' : 'alert-success'} d-flex justify-content-between align-items-center shadow-sm mb-4`}>
          <div>
            <h5 className="alert-heading mb-1 d-flex align-items-center gap-2">
              <CheckCircle2 size={20} /> Protocolo AUDESP: <strong>{protocolo}</strong>
            </h5>
            <p className="mb-0 small">
              Situação no Tribunal de Contas: <strong>{statusProtocolo || 'Recebido'}</strong>
            </p>
            {detalhesProtocolo?.erros?.length > 0 && (
              <div className="mt-2 pt-2 border-top border-danger-subtle small">
                <strong>Erros / Notificações do TCESP:</strong>
                <ul className="mb-0 ps-3 mt-1">
                  {detalhesProtocolo.erros.map((err: any, idx: number) => (
                    <li key={idx}>{err.mensagem || err.campo || JSON.stringify(err)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <span className="badge bg-white text-dark fs-6 px-3 py-2 border">
            Fase IV — TCESP
          </span>
        </div>
      )}

      <Row className="g-4">
        {/* Coluna 1: Origem e Dados Contratuais */}
        <Col lg={7}>
          {/* Card 1: Origem e Descritor */}
          <CardBox title="1. Descritor e Origem da Contratação">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Tipo de Origem da Contratação:</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="origemEdital"
                  name="origemTipo"
                  label="Licitação / Edital Direto"
                  checked={origemTipo === 'edital'}
                  onChange={() => setOrigemTipo('edital')}
                />
                <Form.Check
                  type="radio"
                  id="origemAta"
                  name="origemTipo"
                  label="Ata de Registro de Preços (ARP)"
                  checked={origemTipo === 'ata'}
                  onChange={() => setOrigemTipo('ata')}
                />
              </div>
            </Form.Group>

            {adesaoParticipacao && (
              <div className="alert alert-info py-2 px-3 small mb-3">
                <strong>Adesão / Participação (Carona):</strong> O vínculo com um edital local é <strong>opcional</strong>.
                Informe no campo <em>Código do Edital</em> o <strong>ID de Contratação PNCP (25 dígitos)</strong> da entidade gerenciadora e, caso haja ata, o <strong>ID da Ata PNCP (31 dígitos)</strong>.
              </div>
            )}

            {origemTipo === 'edital' ? (
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  Vincular Edital Local {adesaoParticipacao ? '(Opcional na Adesão)' : ''}:
                  {selectedEdital?.parsed_documento?.srp || selectedEdital?.documento?.srp ? (
                    <span className="badge bg-info ms-2">SRP (Exige Ata)</span>
                  ) : null}
                  {selectedEdital?.sem_pncp ? (
                    <span className="badge bg-secondary ms-2">Sem PNCP</span>
                  ) : null}
                </Form.Label>
                <Form.Select
                  value={editalId}
                  onChange={(e) => handleSelectEdital(Number(e.target.value))}
                >
                  <option value="">{adesaoParticipacao ? '-- Nenhum (Adesão Externa) --' : '-- Selecione o edital de origem --'}</option>
                  {editais.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.codigo_edital} - {ed.numero_compra}/{ed.ano_compra} {ed.sem_pncp ? '(Sem PNCP)' : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Vincular Ata de Registro de Preços:</Form.Label>
                <Form.Select
                  value={ataId}
                  onChange={(e) => handleSelectAta(Number(e.target.value))}
                >
                  <option value="">-- Selecione a ata de origem --</option>
                  {atasDisponiveis.map((at) => (
                    <option key={at.id} value={at.id}>
                      {at.numero_ata_registro_preco}/{at.ano_ata} ({at.codigo_ata}) - Edital: {at.codigo_edital}
                    </option>
                  ))}
                </Form.Select>
                {editalId && atasDisponiveis.length === 0 && (
                  <Form.Text className="text-warning d-block mt-1">
                    Nenhuma ata encontrada para o edital selecionado.
                  </Form.Text>
                )}
              </Form.Group>
            )}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Código do Edital: *</Form.Label>
                  <Form.Control
                    type="text"
                    value={codigoEdital}
                    onChange={(e) => setCodigoEdital(e.target.value)}
                    placeholder="Ex: PREG-01/2026"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Código Único do Contrato (codigoContrato): *</Form.Label>
                  <Form.Control
                    type="text"
                    className="font-monospace"
                    value={codigoContrato}
                    onChange={(e) => setCodigoContrato(e.target.value)}
                    placeholder="Ex: CONTR-05/2026 (gerado auto se vazio)"
                  />
                </Form.Group>
              </Col>

              <MunicipioEntidadeSelect
                municipio={municipio}
                entidade={entidade}
                onMunicipioChange={setMunicipio}
                onEntidadeChange={setEntidade}
                municipiosList={dominios?.municipios}
                entidadesList={dominios?.entidades}
                disabled={retificacao}
                municipioColMd={4}
                entidadeColMd={4}
              />

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Código da Ata (se houver):</Form.Label>
                  <Form.Control
                    type="text"
                    className="font-monospace"
                    value={codigoAta}
                    onChange={(e) => setCodigoAta(e.target.value)}
                    placeholder="Ex: ATA-10/2026"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Check
                  type="switch"
                  id="chkAdesao"
                  label="Adesão / Participação (carona em outro órgão)"
                  checked={adesaoParticipacao}
                  onChange={(e) => setAdesaoParticipacao(e.target.checked)}
                  className="fw-medium mt-2"
                />
              </Col>

              <Col md={6}>
                <Form.Check
                  type="switch"
                  id="chkRetificacaoAjuste"
                  label="Esta remessa é uma Retificação de Ajuste"
                  checked={retificacao}
                  onChange={(e) => setRetificacao(e.target.checked)}
                  className="fw-medium mt-2"
                />
              </Col>
            </Row>
          </CardBox>

          {/* Card 2: Identificação do Instrumento */}
          <div className="mt-4">
            <CardBox title="2. Identificação do Instrumento e Objeto">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Nº Contrato/Empenho no Sistema: *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: 005/2026 ou 5"
                      value={numeroContratoEmpenho}
                      onChange={(e) => setNumeroContratoEmpenho(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Ano Contrato: *</Form.Label>
                    <Form.Control
                      type="number"
                      value={anoContrato}
                      onChange={(e) => setAnoContrato(Number(e.target.value))}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Nº Processo: *</Form.Label>
                    <Form.Control
                      type="text"
                      value={processo}
                      onChange={(e) => setProcesso(e.target.value)}
                      placeholder="Ex: 123/2026"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Tipo de Contrato: *</Form.Label>
                    <Form.Select
                      value={tipoContratoId}
                      onChange={(e) => setTipoContratoId(Number(e.target.value))}
                    >
                      {dominios?.tiposContrato && Object.entries(dominios.tiposContrato).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Categoria do Processo: *</Form.Label>
                    <Form.Select
                      value={categoriaProcessoId}
                      onChange={(e) => setCategoriaProcessoId(Number(e.target.value))}
                    >
                      {dominios?.categoriasProcesso && Object.entries(dominios.categoriasProcesso).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={8}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Tipo Objeto do Contrato: *</Form.Label>
                    <Form.Select
                      value={tipoObjetoContrato}
                      onChange={(e) => setTipoObjetoContrato(Number(e.target.value))}
                    >
                      {dominios?.tiposObjetoContrato && Object.entries(dominios.tiposObjetoContrato).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Natureza Orçamentária: *</Form.Label>
                    <Form.Select
                      value={receita ? 'receita' : 'despesa'}
                      onChange={(e) => setReceita(e.target.value === 'receita')}
                    >
                      <option value="despesa">Despesa para a Entidade</option>
                      <option value="receita">Receita para a Entidade</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Descrição do Objeto do Contrato: *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={objetoContrato}
                      onChange={(e) => setObjetoContrato(e.target.value)}
                      placeholder="Descreva detalhadamente o objeto contratado..."
                      maxLength={5120}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Informações Complementares:</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={informacaoComplementar}
                      onChange={(e) => setInformacaoComplementar(e.target.value)}
                      placeholder="Cláusulas específicas, prazos de entrega ou garantias..."
                      maxLength={5120}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </CardBox>
          </div>

          {/* Card 3: Fornecedor Contratado */}
          <div className="mt-4">
            <CardBox title="3. Dados do Fornecedor / Contratado">
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Tipo de Pessoa: *</Form.Label>
                    <Form.Select
                      value={tipoPessoaFornecedor}
                      onChange={(e) => setTipoPessoaFornecedor(e.target.value as any)}
                    >
                      <option value="PJ">PJ – Pessoa Jurídica (CNPJ)</option>
                      <option value="PF">PF – Pessoa Física (CPF)</option>
                      <option value="PE">PE – Empresa Estrangeira</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">CNPJ / CPF / NI: *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Somente números ou código"
                      value={niFornecedor}
                      onChange={(e) => setNiFornecedor(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Razão Social / Nome: *</Form.Label>
                    <Form.Control
                      type="text"
                      value={nomeRazaoSocialFornecedor}
                      onChange={(e) => setNomeRazaoSocialFornecedor(e.target.value)}
                      placeholder="Nome completo do fornecedor"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Check
                    type="checkbox"
                    id="chkSubcontratacao"
                    label="Haverá fornecedor subcontratado para este contrato"
                    checked={hasSubcontratado}
                    onChange={(e) => setHasSubcontratado(e.target.checked)}
                    className="fw-medium mt-1"
                  />
                </Col>

                {hasSubcontratado && (
                  <>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Tipo Pessoa Subcontratado:</Form.Label>
                        <Form.Select
                          size="sm"
                          value={tipoPessoaSub}
                          onChange={(e) => setTipoPessoaSub(e.target.value as any)}
                        >
                          <option value="PJ">PJ – Pessoa Jurídica</option>
                          <option value="PF">PF – Pessoa Física</option>
                          <option value="PE">PE – Estrangeira</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">CNPJ / CPF Subcontratado:</Form.Label>
                        <Form.Control
                          size="sm"
                          type="text"
                          value={niSub}
                          onChange={(e) => setNiSub(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Razão Social Subcontratado:</Form.Label>
                        <Form.Control
                          size="sm"
                          type="text"
                          value={nomeSub}
                          onChange={(e) => setNomeSub(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </>
                )}
              </Row>
            </CardBox>
          </div>
        </Col>

        {/* Coluna 2: Valores, Vigência e Itens Contratados */}
        <Col lg={5}>
          {/* Card 4: Valores e Vigência */}
          <CardBox title="4. Valores e Prazos de Vigência">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Valor Inicial (R$): *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.0001"
                    value={valorInicial}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setValorInicial(v);
                      if (!valorGlobal) setValorGlobal(v);
                    }}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Valor Global (R$):</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.0001"
                    value={valorGlobal}
                    onChange={(e) => setValorGlobal(parseFloat(e.target.value) || 0)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nº de Parcelas:</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    value={numeroParcelas}
                    onChange={(e) => {
                      const n = parseInt(e.target.value) || 1;
                      setNumeroParcelas(n);
                      setValorParcela(Number((valorInicial / n).toFixed(4)));
                    }}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Valor da Parcela (R$):</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.0001"
                    value={valorParcela}
                    onChange={(e) => setValorParcela(parseFloat(e.target.value) || 0)}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <hr className="my-2" />
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Assinatura: *</Form.Label>
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
                  <Form.Label className="fw-bold">Início Vigência:</Form.Label>
                  <Form.Control
                    type="date"
                    value={dataVigenciaInicio}
                    onChange={(e) => setDataVigenciaInicio(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Fim Vigência:</Form.Label>
                  <Form.Control
                    type="date"
                    value={dataVigenciaFim}
                    onChange={(e) => setDataVigenciaFim(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small text-muted">Validade em Meses (caso sem data inicial):</Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    placeholder="Ex: 12"
                    value={vigenciaMeses}
                    onChange={(e) => setVigenciaMeses(e.target.value ? Number(e.target.value) : '')}
                  />
                </Form.Group>
              </Col>
            </Row>
          </CardBox>

          {/* Card 5: Itens Contratados */}
          <div className="mt-4">
            <CardBox 
              title="5. Itens Contratados"
              actions={
                itensEdital && itensEdital.length > 0 && (
                  <ButtonGroup size="sm">
                    <Button variant="outline-primary" onClick={selectAllItens}>
                      Todos
                    </Button>
                    <Button variant="outline-secondary" onClick={unselectAllItens}>
                      Limpar
                    </Button>
                  </ButtonGroup>
                )
              }
            >
              {itensEdital && itensEdital.length > 0 ? (
                <div>
                  <p className="text-muted small mb-3">
                    Selecione quais itens do edital/certame constam neste contrato:
                  </p>
                  <ListGroup style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {itensEdital.map((item: any) => {
                      const checked = selectedItens.includes(item.numeroItem);
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
                              <span className="fw-bold">Item {item.numeroItem}</span>
                              <Badge bg={checked ? 'light' : 'secondary'} text={checked ? 'dark' : undefined}>
                                {item.materialOuServico === 'M' ? 'Material' : 'Serviço'}
                              </Badge>
                            </div>
                            <p className={`mb-1 small ${checked ? 'text-white' : 'text-dark'}`}>{item.descricao}</p>
                            <div className={`d-flex gap-3 small ${checked ? 'text-light' : 'text-muted'}`}>
                              <span>Qtd: <strong>{item.quantidade}</strong> {item.unidadeMedida}</span>
                              {item.valorUnitarioEstimado && (
                                <span>Unit: <strong>R$ {Number(item.valorUnitarioEstimado).toFixed(2)}</strong></span>
                              )}
                            </div>
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                  <div className="mt-3 p-2 bg-light rounded text-muted small d-flex justify-content-between align-items-center">
                    <span>Itens vinculados:</span>
                    <Badge bg="primary" className="fs-6">{selectedItens.length} de {itensEdital.length}</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <AlertCircle size={32} className="mb-2 opacity-50 text-warning" />
                  <p className="fw-medium mb-1 small">Nenhum edital selecionado com itens.</p>
                  
                  {/* Fallback manual */}
                  <BSCard body className="text-start bg-light mt-3">
                    <Form.Group>
                      <Form.Label className="fw-bold small">
                        Informe os números dos itens (separados por vírgula):
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ex: 1, 2, 3"
                        value={selectedItens.join(', ')}
                        onChange={(e) => {
                          const nums = e.target.value
                            .split(',')
                            .map((s) => parseInt(s.trim()))
                            .filter((n) => !isNaN(n) && n > 0);
                          setSelectedItens(Array.from(new Set(nums)));
                        }}
                      />
                    </Form.Group>
                  </BSCard>
                </div>
              )}
            </CardBox>
          </div>
        </Col>
      </Row>

      {/* Botões de Ação no Final do Formulário */}
      <div className="card shadow-sm border-0 mt-4 p-3 bg-white">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/ajustes')}
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
    </Container>
  );
};
