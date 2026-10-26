import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Plus, 
  Trash2, 
  Edit2, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  RotateCcw,
  Link
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Form } from 'react-bootstrap';

import { PageHeader } from '../../components/PageHeader/PageHeader';
import { CardBox as Card } from '../../components/CardBox/CardBox';
import { MunicipioEntidadeSelect } from '../../components/MunicipioEntidadeSelect/MunicipioEntidadeSelect';
import { licitacaoService } from '../../services/licitacaoService';
import { editalService } from '../../services/editalService';
import type { 
  ItemLicitacao, 
  Licitante, 
  DominiosLicitacaoResponse,
  IndiceEconomico
} from '../../types/licitacao';
import type { Edital } from '../../types/edital';
import { 
  formatBRL, 
  formatPncpMask, 
  stripMask 
} from '../../utils/formatters';

export const LicitacaoForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [dominios, setDominios] = useState<DominiosLicitacaoResponse | null>(null);
  const [editaisDisponiveis, setEditaisDisponiveis] = useState<Edital[]>([]);

  // Estado geral
  const [licitacaoStatus, setLicitacaoStatus] = useState<'draft' | 'sent' | 'error'>('draft');
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [statusProtocolo, setStatusProtocolo] = useState<string | null>(null);
  const [detalhesProtocolo, setDetalhesProtocolo] = useState<any>(null);

  // 1. Descritor & Vínculo com Edital
  const [editalId, setEditalId] = useState<number | undefined>(undefined);
  const [municipio, setMunicipio] = useState<number>(7107);
  const [entidade, setEntidade] = useState<number>(10048);
  const [codigoEdital, setCodigoEdital] = useState<string>('');
  const [retificacao, setRetificacao] = useState<boolean>(false);
  const [numeroCompra, setNumeroCompra] = useState<string>('');
  const [anoCompra, setAnoCompra] = useState<number>(new Date().getFullYear());
  const [numeroProcesso, setNumeroProcesso] = useState<string>('');
  const [objetoEdital, setObjetoEdital] = useState<string>('');

  // 2. Seção BID
  const [recursoBID, setRecursoBID] = useState<number>(2); // 2 - Não
  const [aberturaPreQualificacaoBID, setAberturaPreQualificacaoBID] = useState<number>(3);
  const [editalPreQualificacaoBID, setEditalPreQualificacaoBID] = useState<number>(3);
  const [julgamentoPreQualificacaoBID, setJulgamentoPreQualificacaoBID] = useState<number>(3);
  const [edital2FaseBID, setEdital2FaseBID] = useState<number>(3);
  const [julgamentoPropostasBID, setJulgamentoPropostasBID] = useState<number>(3);
  const [julgamentoNegociacaoBID, setJulgamentoNegociacaoBID] = useState<number>(3);

  // 3. Regras Gerais
  const [tipoNatureza, setTipoNatureza] = useState<number>(1); // Normal
  const [viabilidadeContratacao, setViabilidadeContratacao] = useState<number>(1); // Sim
  const [interposicaoRecurso, setInterposicaoRecurso] = useState<number>(2); // Não
  const [audienciaPublica, setAudienciaPublica] = useState<number>(2); // Não
  const [exigenciaGarantiaLicitantes, setExigenciaGarantiaLicitantes] = useState<number>(2); // Não
  const [percentualValor, setPercentualValor] = useState<number>(1);
  const [exigenciaAmostra, setExigenciaAmostra] = useState<number>(3); // Não
  const [quitacaoTributosFederais, setQuitacaoTributosFederais] = useState<boolean>(true);
  const [quitacaoTributosEstaduais, setQuitacaoTributosEstaduais] = useState<boolean>(true);
  const [quitacaoTributosMunicipais, setQuitacaoTributosMunicipais] = useState<boolean>(true);
  const [exigenciaVisitaTecnica, setExigenciaVisitaTecnica] = useState<number>(2); // Não
  const [exigenciaCurriculo, setExigenciaCurriculo] = useState<boolean>(false);
  const [exigenciaVistoCREA, setExigenciaVistoCREA] = useState<boolean>(false);
  
  // Fontes de Recursos
  const [declaracaoRecursosContratacao, setDeclaracaoRecursosContratacao] = useState<boolean>(true);
  const [fontesRecurso, setFontesRecurso] = useState<number[]>([1]); // Tesouro

  // Condutores da Contratação
  const [contratacaoConduzida, setContratacaoConduzida] = useState<boolean>(true);
  const [cpfsCondutores, setCpfsCondutores] = useState<string[]>(['']);

  // Índices Econômicos
  const [exigenciaIndicesEconomicos, setExigenciaIndicesEconomicos] = useState<number>(2); // Não
  const [indicesEconomicos, setIndicesEconomicos] = useState<IndiceEconomico[]>([]);

  // 4. Itens da Licitação
  const [itens, setItens] = useState<ItemLicitacao[]>([]);
  const [selectedItemIdx, setSelectedItemIdx] = useState<number>(0);

  // Modais de Item e Licitante
  const [showItemModal, setShowItemModal] = useState<boolean>(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<ItemLicitacao>({
    numeroItem: 1,
    tipoOrcamento: 1,
    valor: 0,
    dataOrcamento: new Date().toISOString().split('T')[0],
    situacaoCompraItemId: 2, // Homologado
    dataSituacaoItem: new Date().toISOString().split('T')[0],
    tipoValor: 'M',
    tipoProposta: 1,
    licitantes: []
  });

  const [showLicitanteModal, setShowLicitanteModal] = useState<boolean>(false);
  const [editingLicitanteIdx, setEditingLicitanteIdx] = useState<number | null>(null);
  const [licitanteForm, setLicitanteForm] = useState<Licitante>({
    tipoPessoaId: 'PJ',
    niPessoa: '',
    nomeRazaoSocial: '',
    declaracaoMEouEPP: 3,
    valor: 0,
    resultadoHabilitacao: 1
  });

  // Carregamento inicial
  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const [dom, edList] = await Promise.all([
          licitacaoService.getDominios(),
          editalService.getEditais()
        ]);
        setDominios(dom);
        setEditaisDisponiveis(edList);

        if (id) {
          const lic = await licitacaoService.getLicitacao(Number(id));
          setLicitacaoStatus(lic.status);
          setProtocolo(lic.protocolo || null);
          setStatusProtocolo(lic.status_protocolo || null);
          setDetalhesProtocolo(lic.parsed_detalhes_protocolo || null);
          setEditalId(lic.edital_id);
          setMunicipio(lic.municipio);
          setEntidade(lic.entidade);
          setCodigoEdital(lic.codigo_edital);
          setRetificacao(lic.retificacao);
          setNumeroCompra(lic.numero_compra || '');
          setAnoCompra(lic.ano_compra || new Date().getFullYear());
          setNumeroProcesso(lic.numero_processo || '');
          setObjetoEdital(lic.objeto_edital || '');

          const doc = lic.parsed_documento;
          if (doc) {
            setRecursoBID(doc.recursoBID || 2);
            setAberturaPreQualificacaoBID(doc.aberturaPreQualificacaoBID || 3);
            setEditalPreQualificacaoBID(doc.editalPreQualificacaoBID || 3);
            setJulgamentoPreQualificacaoBID(doc.julgamentoPreQualificacaoBID || 3);
            setEdital2FaseBID(doc.edital2FaseBID || 3);
            setJulgamentoPropostasBID(doc.julgamentoPropostasBID || 3);
            setJulgamentoNegociacaoBID(doc.julgamentoNegociacaoBID || 3);
            setTipoNatureza(doc.tipoNatureza || 1);
            setViabilidadeContratacao(doc.viabilidadeContratacao || 1);
            setInterposicaoRecurso(doc.interposicaoRecurso || 2);
            setAudienciaPublica(doc.audienciaPublica || 2);
            setExigenciaGarantiaLicitantes(doc.exigenciaGarantiaLicitantes || 2);
            setPercentualValor(doc.percentualValor || 1);
            setExigenciaAmostra(doc.exigenciaAmostra || 3);
            setQuitacaoTributosFederais(doc.quitacaoTributosFederais ?? true);
            setQuitacaoTributosEstaduais(doc.quitacaoTributosEstaduais ?? true);
            setQuitacaoTributosMunicipais(doc.quitacaoTributosMunicipais ?? true);
            setExigenciaVisitaTecnica(doc.exigenciaVisitaTecnica || 2);
            setExigenciaCurriculo(doc.exigenciaCurriculo ?? false);
            setExigenciaVistoCREA(doc.exigenciaVistoCREA ?? false);
            setDeclaracaoRecursosContratacao(doc.declaracaoRecursosContratacao ?? true);
            setFontesRecurso(doc.fonteRecursosContratacao || [1]);
            setContratacaoConduzida(doc.contratacaoConduzida ?? true);
            setCpfsCondutores(doc.cpfsCondutores?.map(c => c.cpfCondutor) || ['']);
            setExigenciaIndicesEconomicos(doc.exigenciaIndicesEconomicos || 2);
            setIndicesEconomicos(doc.indicesEconomicos || []);
            setItens(doc.itens || []);
          }
        }
      } catch {
        toast.error('Erro ao carregar dados da licitação');
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [id]);

  const isSent = licitacaoStatus === 'sent';

  // Seleção e preenchimento a partir do Edital
  const handleSelecionarEdital = (edId: number) => {
    const ed = editaisDisponiveis.find(e => e.id === edId);
    if (!ed) return;
    setEditalId(ed.id);
    setMunicipio(ed.municipio);
    setEntidade(ed.entidade);
    setCodigoEdital(ed.codigo_edital);
    setNumeroCompra(ed.numero_compra || '');
    setAnoCompra(ed.ano_compra || new Date().getFullYear());
    setNumeroProcesso(ed.numero_processo || '');
    setObjetoEdital(ed.objeto_compra || '');

    // Se a licitação ainda não tiver itens e o edital tiver itens, popula automaticamente
    if (itens.length === 0 && ed.parsed_documento?.itensCompra?.length) {
      const novosItens: ItemLicitacao[] = ed.parsed_documento.itensCompra.map((it) => ({
        numeroItem: it.numeroItem,
        tipoOrcamento: 1,
        valor: it.valorTotal,
        dataOrcamento: new Date().toISOString().split('T')[0],
        situacaoCompraItemId: 2, // Homologado
        dataSituacaoItem: new Date().toISOString().split('T')[0],
        tipoValor: 'M',
        tipoProposta: 1,
        licitantes: []
      }));
      setItens(novosItens);
      toast.success(`${novosItens.length} itens do edital importados para a licitação.`);
    }
  };

  // Montar payload JSON oficial
  const buildJsonDoc = () => {
    const rawCodigo = codigoEdital.length === 25 && /^\d+$/.test(stripMask(codigoEdital))
      ? stripMask(codigoEdital)
      : codigoEdital.trim();

    const doc: any = {
      descritor: {
        municipio: Number(municipio),
        entidade: Number(entidade),
        codigoEdital: rawCodigo,
        retificacao: Boolean(retificacao)
      },
      recursoBID: Number(recursoBID),
      tipoNatureza: Number(tipoNatureza),
      interposicaoRecurso: Number(interposicaoRecurso),
      exigenciaGarantiaLicitantes: Number(exigenciaGarantiaLicitantes),
      contratacaoConduzida: Boolean(contratacaoConduzida),
      itens: itens.map((it) => ({
        numeroItem: Number(it.numeroItem),
        tipoOrcamento: Number(it.tipoOrcamento),
        ...(it.tipoOrcamento !== 0 ? {
          valor: Number(Number(it.valor || 0).toFixed(4)),
          dataOrcamento: it.dataOrcamento
        } : {}),
        situacaoCompraItemId: Number(it.situacaoCompraItemId),
        dataSituacaoItem: it.dataSituacaoItem,
        tipoValor: it.tipoValor,
        tipoProposta: Number(it.tipoProposta),
        licitantes: (it.licitantes || []).map((lic) => ({
          tipoPessoaId: lic.tipoPessoaId,
          niPessoa: stripMask(lic.niPessoa),
          ...(lic.tipoPessoaId === 'PE' && lic.nomeRazaoSocial?.trim() ? { nomeRazaoSocial: lic.nomeRazaoSocial.trim() } : {}),
          declaracaoMEouEPP: Number(lic.declaracaoMEouEPP),
          resultadoHabilitacao: Number(lic.resultadoHabilitacao),
          ...([1, 2].includes(Number(lic.resultadoHabilitacao)) ? { valor: Number(Number(lic.valor || 0).toFixed(4)) } : {})
        }))
      }))
    };

    if (recursoBID === 1) {
      doc.aberturaPreQualificacaoBID = Number(aberturaPreQualificacaoBID);
      doc.editalPreQualificacaoBID = Number(editalPreQualificacaoBID);
      doc.julgamentoPreQualificacaoBID = Number(julgamentoPreQualificacaoBID);
      doc.edital2FaseBID = Number(edital2FaseBID);
      doc.julgamentoPropostasBID = Number(julgamentoPropostasBID);
      doc.julgamentoNegociacaoBID = Number(julgamentoNegociacaoBID);
    }

    if (viabilidadeContratacao) doc.viabilidadeContratacao = Number(viabilidadeContratacao);
    if (audienciaPublica) doc.audienciaPublica = Number(audienciaPublica);
    if (exigenciaGarantiaLicitantes === 1) doc.percentualValor = Number(percentualValor);
    if (exigenciaAmostra) doc.exigenciaAmostra = Number(exigenciaAmostra);

    doc.quitacaoTributosFederais = Boolean(quitacaoTributosFederais);
    doc.quitacaoTributosEstaduais = Boolean(quitacaoTributosEstaduais);
    doc.quitacaoTributosMunicipais = Boolean(quitacaoTributosMunicipais);

    if (exigenciaVisitaTecnica) {
      doc.exigenciaVisitaTecnica = Number(exigenciaVisitaTecnica);
      if (exigenciaVisitaTecnica === 1) {
        doc.exigenciaCurriculo = Boolean(exigenciaCurriculo);
        doc.exigenciaVistoCREA = Boolean(exigenciaVistoCREA);
      }
    }

    doc.declaracaoRecursosContratacao = Boolean(declaracaoRecursosContratacao);
    if (declaracaoRecursosContratacao && fontesRecurso.length > 0) {
      doc.fonteRecursosContratacao = fontesRecurso.map(f => Number(f));
    }

    if (contratacaoConduzida) {
      const validCpfs = cpfsCondutores.map(c => stripMask(c)).filter(c => c.length === 11);
      if (validCpfs.length > 0) {
        doc.cpfsCondutores = validCpfs.map(cpf => ({ cpfCondutor: cpf }));
      }
    }

    if (exigenciaIndicesEconomicos) {
      doc.exigenciaIndicesEconomicos = Number(exigenciaIndicesEconomicos);
      if (exigenciaIndicesEconomicos === 1 && indicesEconomicos.length > 0) {
        doc.indicesEconomicos = indicesEconomicos.map(ind => ({
          tipoIndice: Number(ind.tipoIndice),
          valorIndice: Number(ind.valorIndice),
          ...(ind.tipoIndice === 8 && ind.nomeIndice ? { nomeIndice: ind.nomeIndice.trim() } : {})
        }));
      }
    }

    return doc;
  };

  const handleSalvarRascunho = async () => {
    if (!codigoEdital.trim()) {
      toast.error('Informe ou vincule o Código do Edital para salvar.');
      return;
    }
    try {
      setSaving(true);
      const doc = buildJsonDoc();
      const payload = {
        documento: doc,
        edital_id: editalId,
        numero_compra: numeroCompra,
        ano_compra: anoCompra,
        numero_processo: numeroProcesso,
        objeto_edital: objetoEdital,
      };

      if (id) {
        await licitacaoService.updateLicitacao(Number(id), payload);
        toast.success('Rascunho da licitação atualizado com sucesso!');
      } else {
        const saved = await licitacaoService.createLicitacao(payload);
        toast.success('Rascunho da licitação criado com sucesso!');
        navigate(`/licitacoes/${saved.id}`, { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Erro ao salvar licitação';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarAudesp = async () => {
    if (!codigoEdital.trim()) {
      toast.error('Informe o Código do Edital vinculado.');
      return;
    }
    if (itens.length === 0) {
      toast.error('Adicione ao menos um item de julgamento da licitação.');
      return;
    }
    for (let i = 0; i < itens.length; i++) {
      const it = itens[i];
      if (it.situacaoCompraItemId === 2 && (!it.licitantes || it.licitantes.length === 0)) {
        toast.error(`Item ${it.numeroItem} está marcado como Homologado, mas não possui licitantes cadastrados.`);
        return;
      }
    }

    try {
      setSending(true);
      const doc = buildJsonDoc();
      const payload = {
        documento: doc,
        edital_id: editalId,
        numero_compra: numeroCompra,
        ano_compra: anoCompra,
        numero_processo: numeroProcesso,
        objeto_edital: objetoEdital,
      };

      let currentId = id ? Number(id) : null;
      if (!currentId) {
        const saved = await licitacaoService.createLicitacao(payload);
        currentId = saved.id;
      } else {
        await licitacaoService.updateLicitacao(currentId, payload);
      }

      const res = await licitacaoService.enviarLicitacao(currentId);
      toast.success(res.mensagem || `Licitação transmitida! Protocolo: ${res.protocolo}`);
      setLicitacaoStatus('sent');
      setProtocolo(res.protocolo);
      setStatusProtocolo('Recebido');
      navigate(`/licitacoes/${currentId}`, { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.erros?.length) {
        toast.error(
          <div>
            <strong>Erros de Validação da Fase IV (Licitação):</strong>
            <ul className="mb-0 mt-1 ps-3 text-start small">
              {detail.erros.map((e: string, i: number) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error(detail?.mensagem || detail || 'Erro ao transmitir licitação ao AUDESP.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleConsultarProtocolo = async () => {
    if (!id) return;
    try {
      setSending(true);
      const res = await licitacaoService.consultarProtocolo(Number(id));
      setStatusProtocolo(res.status);
      setDetalhesProtocolo(res.dados);
      toast.success(`Situação atualizada: ${res.status}`);
    } catch {
      toast.error('Erro ao consultar situação do protocolo');
    } finally {
      setSending(false);
    }
  };

  const handleRetornarRascunho = async () => {
    if (!id) return;
    if (!window.confirm('Deseja retornar esta licitação para rascunho para reedição?')) return;
    try {
      await licitacaoService.retornarRascunho(Number(id));
      setLicitacaoStatus('draft');
      toast.success('Licitação retornada para rascunho.');
    } catch {
      toast.error('Erro ao retornar licitação para rascunho.');
    }
  };

  // Gerenciamento de Itens
  const handleOpenItemModal = (idx?: number) => {
    if (idx !== undefined) {
      setEditingItemIdx(idx);
      setItemForm({ ...itens[idx] });
    } else {
      setEditingItemIdx(null);
      setItemForm({
        numeroItem: itens.length + 1,
        tipoOrcamento: 1,
        valor: 0,
        dataOrcamento: new Date().toISOString().split('T')[0],
        situacaoCompraItemId: 2,
        dataSituacaoItem: new Date().toISOString().split('T')[0],
        tipoValor: 'M',
        tipoProposta: 1,
        licitantes: []
      });
    }
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
    if (itemForm.tipoOrcamento !== 0 && (!itemForm.valor || Number(itemForm.valor) < 0)) {
      toast.error('Informe o valor orçado para o item.');
      return;
    }
    if (!itemForm.dataSituacaoItem) {
      toast.error('Informe a data da situação do item.');
      return;
    }

    if (editingItemIdx !== null) {
      const updated = [...itens];
      updated[editingItemIdx] = { ...itemForm };
      setItens(updated);
    } else {
      setItens([...itens, { ...itemForm }]);
    }
    setShowItemModal(false);
  };

  // Gerenciamento de Licitantes dentro do Item selecionado
  const currentItem = itens[selectedItemIdx];

  const handleOpenLicitanteModal = (lIdx?: number) => {
    if (lIdx !== undefined && currentItem) {
      setEditingLicitanteIdx(lIdx);
      setLicitanteForm({ ...currentItem.licitantes[lIdx] });
    } else {
      setEditingLicitanteIdx(null);
      setLicitanteForm({
        tipoPessoaId: 'PJ',
        niPessoa: '',
        nomeRazaoSocial: '',
        declaracaoMEouEPP: 3,
        valor: 0,
        resultadoHabilitacao: 1
      });
    }
    setShowLicitanteModal(true);
  };

  const handleSaveLicitante = () => {
    const ni = stripMask(licitanteForm.niPessoa);
    if (!ni) {
      toast.error('Informe o CNPJ/CPF do licitante.');
      return;
    }
    if (licitanteForm.tipoPessoaId === 'PJ' && ni.length !== 14) {
      toast.error('CNPJ deve ter 14 dígitos.');
      return;
    }
    if (licitanteForm.tipoPessoaId === 'PF' && ni.length !== 11) {
      toast.error('CPF deve ter 11 dígitos.');
      return;
    }
    if (licitanteForm.tipoPessoaId === 'PE' && !licitanteForm.nomeRazaoSocial?.trim()) {
      toast.error('Para empresa estrangeira (PE), informe a Razão Social.');
      return;
    }
    if ([1, 2].includes(Number(licitanteForm.resultadoHabilitacao)) && Number(licitanteForm.valor) <= 0) {
      toast.error('Informe o valor da proposta para licitante vencedor ou classificado.');
      return;
    }

    if (!currentItem) return;
    const updatedItens = [...itens];
    const licitantesItem = [...(currentItem.licitantes || [])];

    if (editingLicitanteIdx !== null) {
      licitantesItem[editingLicitanteIdx] = { ...licitanteForm };
    } else {
      licitantesItem.push({ ...licitanteForm });
    }

    updatedItens[selectedItemIdx] = {
      ...currentItem,
      licitantes: licitantesItem
    };
    setItens(updatedItens);
    setShowLicitanteModal(false);
  };

  const handleDeleteLicitante = (lIdx: number) => {
    if (!currentItem) return;
    const updatedItens = [...itens];
    const licitantesItem = currentItem.licitantes.filter((_, i) => i !== lIdx);
    updatedItens[selectedItemIdx] = {
      ...currentItem,
      licitantes: licitantesItem
    };
    setItens(updatedItens);
  };

  if (loading) {
    return (
      <Container fluid className="p-0">
        <PageHeader title="Carregando licitação..." />
        <Card>
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="text-muted mt-2 mb-0">Carregando dados da licitação...</p>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0 pb-5">
      <PageHeader 
        title={isSent ? 'Licitação Transmitida (Fase IV)' : id ? 'Editar Licitação' : 'Nova Licitação (Fase IV)'}
        actions={
          <div className="d-flex align-items-center gap-2">
            <button 
              onClick={() => navigate('/licitacoes')}
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
            >
              <ArrowLeft size={16} /> Voltar à Lista
            </button>

            {!isSent ? (
              <>
                <button
                  onClick={handleSalvarRascunho}
                  disabled={saving || sending}
                  className="btn btn-light text-success fw-bold btn-sm d-flex align-items-center gap-1 shadow-sm"
                >
                  <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Rascunho'}
                </button>

                <button
                  onClick={handleEnviarAudesp}
                  disabled={saving || sending}
                  className="btn btn-warning text-dark fw-bold btn-sm d-flex align-items-center gap-1 shadow-sm"
                >
                  <Send size={16} /> {sending ? 'Transmitindo...' : 'Transmitir à AUDESP'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleConsultarProtocolo}
                  disabled={sending}
                  className="btn btn-light text-primary fw-bold btn-sm d-flex align-items-center gap-1 shadow-sm"
                >
                  <RefreshCw size={16} className={sending ? 'spin' : ''} /> Atualizar Status
                </button>
                {statusProtocolo?.toLowerCase().includes('rejeitado') && (
                  <button
                    onClick={handleRetornarRascunho}
                    className="btn btn-warning text-dark fw-bold btn-sm d-flex align-items-center gap-1 shadow-sm"
                  >
                    <RotateCcw size={16} /> Corrigir e Reenviar
                  </button>
                )}
              </>
            )}
          </div>
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

      {/* Seção 1: Descritor e Vínculo com Edital */}
      <Card title="1. Descritor e Vínculo com o Edital" className="mb-4">
        <div className="row g-3">
          {!isSent && editaisDisponiveis.length > 0 && (
            <div className="col-12 bg-light p-3 rounded border mb-2">
              <Form.Label className="form-label fw-bold small text-success d-flex align-items-center gap-1">
                <Link size={16} /> Vincular a um Edital Cadastrado (Preenchimento Rápido)
              </Form.Label>
              <Form.Select
                className="form-select form-select-sm"
                value={editalId || ''}
                onChange={(e) => {
                  if (e.target.value) handleSelecionarEdital(Number(e.target.value));
                }}
              >
                <option value="">Selecione um Edital para carregar automaticamente...</option>
                {editaisDisponiveis.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.codigo_edital} — {e.objeto_compra ? e.objeto_compra.slice(0, 70) + '...' : `Edital #${e.id}`} ({e.status === 'sent' ? 'Enviado' : 'Rascunho'})
                  </option>
                ))}
              </Form.Select>
            </div>
          )}

          <MunicipioEntidadeSelect
            municipio={municipio}
            entidade={entidade}
            onMunicipioChange={setMunicipio}
            onEntidadeChange={setEntidade}
            municipiosList={dominios?.municipios}
            entidadesList={dominios?.entidades}
            disabled={isSent || retificacao}
            municipioColMd={3}
            entidadeColMd={3}
          />

          <div className="col-md-4">
            <Form.Label className="form-label fw-bold small text-secondary">Código do Edital de Referência *</Form.Label>
            <Form.Control 
              type="text"
              className="form-control form-control-sm font-monospace"
              placeholder="Ex: PE-000001/2026 ou ID PNCP"
              value={codigoEdital.length === 25 ? formatPncpMask(codigoEdital) : codigoEdital}
              onChange={(e) => setCodigoEdital(e.target.value.slice(0, 36))}
              disabled={isSent || retificacao}
            />
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
              Deve corresponder ao código informado no envio do Edital correspondente.
            </span>
          </div>

          <div className="col-md-2 d-flex align-items-center">
            <div className="form-check mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="checkRetifLic"
                checked={retificacao}
                onChange={(e) => setRetificacao(e.target.checked)}
                disabled={isSent}
              />
              <Form.Label className="form-check-label small text-dark fw-bold" htmlFor="checkRetifLic">
                Retificação
              </Form.Label>
            </div>
          </div>
        </div>
      </Card>

      {/* Seção 2: Recursos do BID */}
      <Card title="2. Recursos do BID (Banco Interamericano de Desenvolvimento)" className="mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <Form.Label className="form-label fw-bold small text-secondary">Recurso do BID Envolvido? *</Form.Label>
            <Form.Select
              className="form-select form-select-sm"
              value={recursoBID}
              onChange={(e) => setRecursoBID(Number(e.target.value))}
              disabled={isSent}
            >
              <option value={1}>1 – Sim</option>
              <option value={2}>2 – Não</option>
              <option value={3}>3 – Não se aplica</option>
            </Form.Select>
          </div>

          {recursoBID === 1 && (
            <>
              <div className="col-md-4">
                <Form.Label className="form-label fw-bold small text-secondary">Objeção Abertura Pré-Qualificação</Form.Label>
                <Form.Select
                  className="form-select form-select-sm"
                  value={aberturaPreQualificacaoBID}
                  onChange={(e) => setAberturaPreQualificacaoBID(Number(e.target.value))}
                  disabled={isSent}
                >
                  <option value={1}>1 – Sim</option>
                  <option value={2}>2 – Não</option>
                  <option value={3}>3 – Não se aplica</option>
                </Form.Select>
              </div>

              <div className="col-md-4">
                <Form.Label className="form-label fw-bold small text-secondary">Objeção Julgamento Propostas</Form.Label>
                <Form.Select
                  className="form-select form-select-sm"
                  value={julgamentoPropostasBID}
                  onChange={(e) => setJulgamentoPropostasBID(Number(e.target.value))}
                  disabled={isSent}
                >
                  <option value={1}>1 – Sim</option>
                  <option value={2}>2 – Não</option>
                  <option value={3}>3 – Não se aplica</option>
                </Form.Select>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Seção 3: Regras Gerais da Licitação */}
      <Card title="3. Dados Gerais e Exigências do Procedimento" className="mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <Form.Label className="form-label fw-bold small text-secondary">Tipo de Natureza da Contratação *</Form.Label>
            <Form.Select
              className="form-select form-select-sm"
              value={tipoNatureza}
              onChange={(e) => setTipoNatureza(Number(e.target.value))}
              disabled={isSent}
            >
              {dominios && Object.entries(dominios.tiposNatureza).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </Form.Select>
          </div>

          <div className="col-md-3">
            <Form.Label className="form-label fw-bold small text-secondary">Interposição de Recurso *</Form.Label>
            <Form.Select
              className="form-select form-select-sm"
              value={interposicaoRecurso}
              onChange={(e) => setInterposicaoRecurso(Number(e.target.value))}
              disabled={isSent}
            >
              <option value={1}>1 – Sim</option>
              <option value={2}>2 – Não</option>
              <option value={3}>3 – Não se aplica</option>
            </Form.Select>
          </div>

          <div className="col-md-3">
            <Form.Label className="form-label fw-bold small text-secondary">Audiência Pública</Form.Label>
            <Form.Select
              className="form-select form-select-sm"
              value={audienciaPublica}
              onChange={(e) => setAudienciaPublica(Number(e.target.value))}
              disabled={isSent}
            >
              <option value={1}>1 – Sim</option>
              <option value={2}>2 – Não</option>
              <option value={3}>3 – Não se aplica</option>
            </Form.Select>
          </div>

          <div className="col-md-4">
            <Form.Label className="form-label fw-bold small text-secondary">Exigência de Garantia de Proposta *</Form.Label>
            <Form.Select
              className="form-select form-select-sm"
              value={exigenciaGarantiaLicitantes}
              onChange={(e) => setExigenciaGarantiaLicitantes(Number(e.target.value))}
              disabled={isSent}
            >
              <option value={1}>1 – Sim</option>
              <option value={2}>2 – Não</option>
              <option value={3}>3 – Não se aplica</option>
            </Form.Select>
          </div>

          {exigenciaGarantiaLicitantes === 1 && (
            <div className="col-md-4">
              <Form.Label className="form-label fw-bold small text-secondary">Percentual de Garantia (%) *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="form-control form-control-sm"
                value={percentualValor}
                onChange={(e) => setPercentualValor(parseFloat(e.target.value) || 0)}
                disabled={isSent}
              />
            </div>
          )}

          <div className="col-md-4">
            <Form.Label className="form-label fw-bold small text-secondary">Exigência de Amostra</Form.Label>
            <Form.Select
              className="form-select form-select-sm"
              value={exigenciaAmostra}
              onChange={(e) => setExigenciaAmostra(Number(e.target.value))}
              disabled={isSent}
            >
              {dominios && Object.entries(dominios.exigenciasAmostra).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </Form.Select>
          </div>

          {/* Quitação de Tributos */}
          <div className="col-12 border-top pt-2 mt-2">
            <span className="fw-bold small text-secondary d-block mb-1">
              Exigência de Quitação Prévia de Tributos:
            </span>
            <div className="d-flex flex-wrap gap-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="chkFed"
                  checked={quitacaoTributosFederais}
                  onChange={(e) => setQuitacaoTributosFederais(e.target.checked)}
                  disabled={isSent}
                />
                <Form.Label className="form-check-label small" htmlFor="chkFed">Tributos Federais</Form.Label>
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="chkEst"
                  checked={quitacaoTributosEstaduais}
                  onChange={(e) => setQuitacaoTributosEstaduais(e.target.checked)}
                  disabled={isSent}
                />
                <Form.Label className="form-check-label small" htmlFor="chkEst">Tributos Estaduais</Form.Label>
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="chkMun"
                  checked={quitacaoTributosMunicipais}
                  onChange={(e) => setQuitacaoTributosMunicipais(e.target.checked)}
                  disabled={isSent}
                />
                <Form.Label className="form-check-label small" htmlFor="chkMun">Tributos Municipais</Form.Label>
              </div>
            </div>
          </div>

          {/* Declaração de Recursos e Fontes */}
          <div className="col-12 border-top pt-2 mt-2">
            <div className="form-check mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="chkDeclRec"
                checked={declaracaoRecursosContratacao}
                onChange={(e) => setDeclaracaoRecursosContratacao(e.target.checked)}
                disabled={isSent}
              />
              <Form.Label className="form-check-label small text-dark fw-bold" htmlFor="chkDeclRec">
                Declaração da Existência de Recursos Orçamentários para a Contratação
              </Form.Label>
            </div>

            {declaracaoRecursosContratacao && (
              <div className="p-3 bg-light rounded border">
                <span className="small fw-bold text-secondary d-block mb-2">
                  Selecione as Fontes de Recursos Envolvidas:
                </span>
                <div className="row g-2">
                  {dominios && Object.entries(dominios.fontesRecurso).map(([cStr, desc]) => {
                    const cNum = Number(cStr);
                    const isChecked = fontesRecurso.includes(cNum);
                    return (
                      <div key={cStr} className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`fr_${cStr}`}
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFontesRecurso([...fontesRecurso, cNum]);
                              } else {
                                setFontesRecurso(fontesRecurso.filter(f => f !== cNum));
                              }
                            }}
                            disabled={isSent}
                          />
                          <Form.Label className="form-check-label small" htmlFor={`fr_${cStr}`}>
                            {desc}
                          </Form.Label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Condutores da Contratação (CPFs) */}
          <div className="col-12 border-top pt-2 mt-2">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="form-check mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="chkCond"
                  checked={contratacaoConduzida}
                  onChange={(e) => setContratacaoConduzida(e.target.checked)}
                  disabled={isSent}
                />
                <Form.Label className="form-check-label small text-dark fw-bold" htmlFor="chkCond">
                  Contratação Conduzida por Agente de Contratação / Comissão de Licitação
                </Form.Label>
              </div>

              {contratacaoConduzida && !isSent && (
                <button
                  type="button"
                  onClick={() => setCpfsCondutores([...cpfsCondutores, ''])}
                  className="btn btn-outline-success btn-sm py-0 px-2"
                >
                  <Plus size={12} /> Adicionar CPF Condutor
                </button>
              )}
            </div>

            {contratacaoConduzida && (
              <div className="d-flex flex-wrap gap-2">
                {cpfsCondutores.map((cpf, idx) => (
                  <div key={idx} className="input-group input-group-sm" style={{ width: '220px' }}>
                    <Form.Control
                      type="text"
                      className="form-control font-monospace"
                      placeholder="CPF do condutor (11 dígitos)"
                      value={cpf}
                      onChange={(e) => {
                        const updated = [...cpfsCondutores];
                        updated[idx] = e.target.value.slice(0, 14);
                        setCpfsCondutores(updated);
                      }}
                      disabled={isSent}
                    />
                    {!isSent && cpfsCondutores.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCpfsCondutores(cpfsCondutores.filter((_, i) => i !== idx))}
                        className="btn btn-outline-danger"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Seção 4: Itens e Licitantes Vencedores/Participantes */}
      <Card 
        title="4. Julgamento de Itens e Fornecedores/Licitantes" 
        className="mb-4"
        actions={
          !isSent && (
            <button
              type="button"
              onClick={() => handleOpenItemModal()}
              className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
            >
              <Plus size={14} /> Adicionar Item de Julgamento
            </button>
          )
        }
      >
        {itens.length === 0 ? (
          <div className="alert alert-warning py-3 text-center mb-0 small">
            <AlertTriangle size={20} className="mb-1 text-warning" />
            <p className="mb-0">
              Nenhum item adicionado. Adicione os itens da licitação para informar os fornecedores participantes e as propostas homologadas.
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {/* Lista lateral de itens */}
            <div className="col-md-4">
              <span className="small fw-bold text-secondary d-block mb-2">
                Itens Licitados ({itens.length}):
              </span>
              <div className="list-group shadow-sm">
                {itens.map((it, idx) => {
                  const isSelected = selectedItemIdx === idx;
                  const vencedores = it.licitantes?.filter(l => l.resultadoHabilitacao === 1).length || 0;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedItemIdx(idx)}
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                        isSelected ? 'active bg-success border-success' : ''
                      }`}
                    >
                      <div>
                        <strong>Item #{it.numeroItem}</strong>
                        <div className={`small ${isSelected ? 'text-white-50' : 'text-muted'}`}>
                          {dominios?.situacoesCompraItem?.[it.situacaoCompraItemId] || `Situação ${it.situacaoCompraItemId}`}
                        </div>
                      </div>
                      <div className="text-end">
                        <span className={`badge ${isSelected ? 'bg-white text-dark' : 'bg-primary'} rounded-pill`}>
                          {it.licitantes?.length || 0} licitantes
                        </span>
                        {vencedores > 0 && (
                          <div className={`small ${isSelected ? 'text-white' : 'text-success'} fw-bold`}>
                            ✓ Vencedor
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Painel do item selecionado e seus licitantes */}
            <div className="col-md-8">
              {currentItem ? (
                <div className="border rounded p-3 bg-white shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                    <div>
                      <h6 className="fw-bold mb-0 text-dark">
                        Item #{currentItem.numeroItem} — {dominios?.situacoesCompraItem?.[currentItem.situacaoCompraItemId]}
                      </h6>
                      <span className="text-muted small">
                        Tipo Proposta: {dominios?.tiposProposta?.[currentItem.tipoProposta]} | Valor Orçado: {formatBRL(currentItem.valor)}
                      </span>
                    </div>

                    {!isSent && (
                      <div className="d-flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenItemModal(selectedItemIdx)}
                          className="btn btn-outline-secondary btn-sm p-1 px-2"
                          title="Editar parâmetros do item"
                        >
                          <Edit2 size={13} /> Editar Item
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Excluir item #${currentItem.numeroItem}?`)) {
                              const updated = itens.filter((_, i) => i !== selectedItemIdx);
                              setItens(updated);
                              setSelectedItemIdx(0);
                            }
                          }}
                          className="btn btn-outline-danger btn-sm p-1 px-2"
                          title="Excluir item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Licitantes do item */}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold small text-secondary">
                      Propostas e Licitantes Concorrentes ({currentItem.licitantes?.length || 0}):
                    </span>
                    {!isSent && (
                      <button
                        type="button"
                        onClick={() => handleOpenLicitanteModal()}
                        className="btn btn-sm btn-outline-success py-1 px-2 d-flex align-items-center gap-1"
                      >
                        <Plus size={13} /> Adicionar Proposta / Licitante
                      </button>
                    )}
                  </div>

                  {(!currentItem.licitantes || currentItem.licitantes.length === 0) ? (
                    <div className="alert alert-light border py-3 text-center small text-muted">
                      Nenhum licitante cadastrado para este item. Clique no botão acima para informar as propostas e o fornecedor vencedor.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Licitante (CNPJ/CPF)</th>
                            <th>ME/EPP</th>
                            <th>Resultado</th>
                            <th className="text-end">Valor Proposta</th>
                            {!isSent && <th className="text-end">Ações</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {currentItem.licitantes.map((lic, lIdx) => {
                            const isVencedor = lic.resultadoHabilitacao === 1;
                            return (
                              <tr key={lIdx} className={isVencedor ? 'table-success bg-opacity-25' : ''}>
                                <td>
                                  <div className="fw-medium font-monospace">
                                    {lic.tipoPessoaId === 'PJ' ? formatPncpMask(lic.niPessoa) : lic.niPessoa}
                                  </div>
                                  {lic.nomeRazaoSocial && (
                                    <div className="small text-muted">{lic.nomeRazaoSocial}</div>
                                  )}
                                </td>
                                <td className="small">
                                  {dominios?.declaracoesMeEpp?.[lic.declaracaoMEouEPP]}
                                </td>
                                <td>
                                  <span className={`badge ${isVencedor ? 'bg-success' : 'bg-secondary'}`}>
                                    {dominios?.resultadosHabilitacao?.[lic.resultadoHabilitacao] || lic.resultadoHabilitacao}
                                  </span>
                                </td>
                                <td className="text-end font-monospace fw-bold">
                                  {formatBRL(lic.valor)}
                                </td>
                                {!isSent && (
                                  <td className="text-end">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenLicitanteModal(lIdx)}
                                      className="btn btn-outline-secondary btn-sm p-1 me-1"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLicitante(lIdx)}
                                      className="btn btn-outline-danger btn-sm p-1"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </Card>

      {/* Modal: Item da Licitação */}
      {showItemModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fs-6 fw-bold">
                  {editingItemIdx !== null ? `Editar Item #${itemForm.numeroItem}` : 'Adicionar Item de Julgamento'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowItemModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <Form.Label className="form-label small fw-bold text-secondary">Número do Item *</Form.Label>
                    <Form.Control
                      type="number"
                      className="form-control form-control-sm"
                      value={itemForm.numeroItem}
                      onChange={(e) => setItemForm({ ...itemForm, numeroItem: Number(e.target.value) })}
                    />
                  </div>

                  <div className="col-md-6">
                    <Form.Label className="form-label small fw-bold text-secondary">Situação do Item *</Form.Label>
                    <Form.Select
                      className="form-select form-select-sm"
                      value={itemForm.situacaoCompraItemId}
                      onChange={(e) => setItemForm({ ...itemForm, situacaoCompraItemId: Number(e.target.value) })}
                    >
                      {dominios && Object.entries(dominios.situacoesCompraItem).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </Form.Select>
                  </div>

                  <div className="col-md-6">
                    <Form.Label className="form-label small fw-bold text-secondary">Data da Situação *</Form.Label>
                    <Form.Control
                      type="date"
                      className="form-control form-control-sm"
                      value={itemForm.dataSituacaoItem}
                      onChange={(e) => setItemForm({ ...itemForm, dataSituacaoItem: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <Form.Label className="form-label small fw-bold text-secondary">Tipo do Valor *</Form.Label>
                    <Form.Select
                      className="form-select form-select-sm"
                      value={itemForm.tipoValor}
                      onChange={(e) => setItemForm({ ...itemForm, tipoValor: e.target.value as any })}
                    >
                      <option value="M">M – Monetário</option>
                      <option value="P">P – Percentual</option>
                    </Form.Select>
                  </div>

                  <div className="col-md-6">
                    <Form.Label className="form-label small fw-bold text-secondary">Tipo de Orçamento Realizado *</Form.Label>
                    <Form.Select
                      className="form-select form-select-sm"
                      value={itemForm.tipoOrcamento}
                      onChange={(e) => setItemForm({ ...itemForm, tipoOrcamento: Number(e.target.value) })}
                    >
                      {dominios && Object.entries(dominios.tiposOrcamento).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </Form.Select>
                  </div>

                  {itemForm.tipoOrcamento !== 0 && (
                    <div className="col-md-6">
                      <Form.Label className="form-label small fw-bold text-secondary">Valor Orçado Estimado *</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.0001"
                        className="form-control form-control-sm"
                        value={itemForm.valor || 0}
                        onChange={(e) => setItemForm({ ...itemForm, valor: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowItemModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-success btn-sm" onClick={handleSaveItem}>
                  Salvar Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Licitante / Fornecedor */}
      {showLicitanteModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fs-6 fw-bold">
                  {editingLicitanteIdx !== null ? 'Editar Proposta / Licitante' : 'Adicionar Proposta / Licitante'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowLicitanteModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <Form.Label className="form-label small fw-bold text-secondary">Tipo de Pessoa *</Form.Label>
                    <Form.Select
                      className="form-select form-select-sm"
                      value={licitanteForm.tipoPessoaId}
                      onChange={(e) => setLicitanteForm({ ...licitanteForm, tipoPessoaId: e.target.value as any })}
                    >
                      <option value="PJ">PJ – Pessoa Jurídica (CNPJ)</option>
                      <option value="PF">PF – Pessoa Física (CPF)</option>
                      <option value="PE">PE – Pessoa Estrangeira</option>
                    </Form.Select>
                  </div>

                  <div className="col-md-6">
                    <Form.Label className="form-label small fw-bold text-secondary">
                      {licitanteForm.tipoPessoaId === 'PJ' ? 'CNPJ *' : licitanteForm.tipoPessoaId === 'PF' ? 'CPF *' : 'Documento / ID *'}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      placeholder={licitanteForm.tipoPessoaId === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                      value={licitanteForm.niPessoa}
                      onChange={(e) => setLicitanteForm({ ...licitanteForm, niPessoa: e.target.value })}
                    />
                  </div>

                  {licitanteForm.tipoPessoaId === 'PE' && (
                    <div className="col-12">
                      <Form.Label className="form-label small fw-bold text-secondary">Razão Social / Nome Estrangeiro *</Form.Label>
                      <Form.Control
                        type="text"
                        className="form-control form-control-sm"
                        value={licitanteForm.nomeRazaoSocial || ''}
                        onChange={(e) => setLicitanteForm({ ...licitanteForm, nomeRazaoSocial: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="col-md-6">
                    <Form.Label className="form-label small fw-bold text-secondary">Declaração ME/EPP *</Form.Label>
                    <Form.Select
                      className="form-select form-select-sm"
                      value={licitanteForm.declaracaoMEouEPP}
                      onChange={(e) => setLicitanteForm({ ...licitanteForm, declaracaoMEouEPP: Number(e.target.value) })}
                    >
                      {dominios && Object.entries(dominios.declaracoesMeEpp).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </Form.Select>
                  </div>

                  <div className="col-md-6">
                    <Form.Label className="form-label small fw-bold text-secondary">Resultado da Habilitação *</Form.Label>
                    <Form.Select
                      className="form-select form-select-sm"
                      value={licitanteForm.resultadoHabilitacao}
                      onChange={(e) => setLicitanteForm({ ...licitanteForm, resultadoHabilitacao: Number(e.target.value) })}
                    >
                      {dominios && Object.entries(dominios.resultadosHabilitacao).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </Form.Select>
                  </div>

                  <div className="col-12">
                    <Form.Label className="form-label small fw-bold text-secondary">Valor da Proposta Final (R$) *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.0001"
                      className="form-control form-control-sm"
                      value={licitanteForm.valor || 0}
                      onChange={(e) => setLicitanteForm({ ...licitanteForm, valor: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowLicitanteModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-success btn-sm" onClick={handleSaveLicitante}>
                  Salvar Licitante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};