import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Upload,
  FileText,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Form } from 'react-bootstrap';

import { PageHeader } from '../../components/PageHeader';
import { CardBox as Card } from '../../components/CardBox';
import {
  ProtocoloErrosAlert,
  HistoricoProtocoloModal,
  notificarResultadoProtocolo,
} from '../../components/ProtocoloInfo/ProtocoloComponents';
import {
  MunicipioEntidadeSelect,
  getSavedMunicipio,
  getSavedEntidade
} from '../../components/MunicipioEntidadeSelect';
import { editalService } from '../../services/editalService';
import type {
  Edital,
  Publicacao,
  ItemCompra,
  DominiosResponse
} from '../../types/edital';
import type { HistoricoProtocoloItem } from '../../utils/protocoloFormatter';
import {
  formatBRL,
  formatDecimal4,
  formatDateBR,
  formatPncpMask,
  stripMask
} from '../../utils/formatters';

export const EditalForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();


  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [dominios, setDominios] = useState<DominiosResponse | null>(null);

  // Estado geral do Edital
  const [editalStatus, setEditalStatus] = useState<'draft' | 'sent' | 'error'>('draft');
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [statusProtocolo, setStatusProtocolo] = useState<string | null>(null);
  const [detalhesProtocolo, setDetalhesProtocolo] = useState<any>(null);
  const [historicoProtocolo, setHistoricoProtocolo] = useState<HistoricoProtocoloItem[]>([]);
  const [showHistoricoModal, setShowHistoricoModal] = useState<boolean>(false);
  const [dependentes, setDependentes] = useState<{ licitacoes: number; atas: number; ajustes: number }>({
    licitacoes: 0,
    atas: 0,
    ajustes: 0
  });

  // 1. Descritor
  const [municipio, setMunicipio] = useState<number>(() => getSavedMunicipio(7071));
  const [entidade, setEntidade] = useState<number>(() => getSavedEntidade(11310));
  const [semPncp, setSemPncp] = useState<boolean>(false);
  const [codigoEdital, setCodigoEdital] = useState<string>('');
  const [dataDocumento, setDataDocumento] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [retificacao, setRetificacao] = useState<boolean>(false);

  // 2. Publicidade
  const [houvePublicacao, setHouvePublicacao] = useState<boolean>(true);
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [showPubModal, setShowPubModal] = useState<boolean>(false);
  const [editingPubIndex, setEditingPubIndex] = useState<number | null>(null);
  const [pubForm, setPubForm] = useState<Publicacao>({
    veiculoPublicacao: 1,
    dataPublicacao: new Date().toISOString().split('T')[0],
    idContratacaoPNCP: '',
    veiculoPublicacaoNome: '',
  });

  // 3. Dados Gerais
  const [codigoUnidadeCompradora, setCodigoUnidadeCompradora] = useState<string>('');
  const [tipoInstrumentoId, setTipoInstrumentoId] = useState<number>(1);
  const [modalidadeId, setModalidadeId] = useState<number>(6); // Pregão Eletrônico
  const [modoDisputaId, setModoDisputaId] = useState<number>(1); // Aberto
  const [numeroCompra, setNumeroCompra] = useState<string>('');
  const [anoCompra, setAnoCompra] = useState<number>(new Date().getFullYear());
  const [numeroProcesso, setNumeroProcesso] = useState<string>('');
  const [objetoCompra, setObjetoCompra] = useState<string>('');
  const [informacaoComplementar, setInformacaoComplementar] = useState<string>('');
  const [srp, setSrp] = useState<boolean>(false);
  const [dataAberturaProposta, setDataAberturaProposta] = useState<string>('');
  const [dataEncerramentoProposta, setDataEncerramentoProposta] = useState<string>('');
  const [amparoLegalId, setAmparoLegalId] = useState<number>(1); // Pregão
  const [buscaAmparo, setBuscaAmparo] = useState<string>('');
  const [linkSistemaOrigem, setLinkSistemaOrigem] = useState<string>('');
  const [justificativaPresencial, setJustificativaPresencial] = useState<string>('');

  // 4. Itens de Compra
  const [itens, setItens] = useState<ItemCompra[]>([]);
  const [showItemModal, setShowItemModal] = useState<boolean>(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<ItemCompra>({
    numeroItem: 1,
    materialOuServico: 'M',
    tipoBeneficioId: 4, // Sem benefício
    incentivoProdutivoBasico: false,
    descricao: '',
    quantidade: 1,
    unidadeMedida: 'UN',
    orcamentoSigiloso: false,
    valorUnitarioEstimado: 0,
    valorTotal: 0,
    criterioJulgamentoId: 1, // Menor preço
    itemCategoriaId: 3, // Não se aplica
    patrimonio: '',
    codigoRegistroImobiliario: '',
  });

  // 5. PDF
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [pdfNomeOriginal, setPdfNomeOriginal] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState<boolean>(false);

  // Carregar dados e domínios
  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const dom = await editalService.getDominios();
        setDominios(dom);

        if (id) {
          const edital = await editalService.getEdital(Number(id));
          setEditalStatus(edital.status);
          setProtocolo(edital.protocolo || null);
          setStatusProtocolo(edital.status_protocolo || null);
          setDetalhesProtocolo(edital.parsed_detalhes_protocolo || null);
          setHistoricoProtocolo((edital as any).historico_protocolo || []);
          setPdfPath(edital.pdf_path || null);
          setPdfNomeOriginal(edital.pdf_nome_original || null);
          setSemPncp(edital.sem_pncp);
          if (edital.dependentes) {
            setDependentes(edital.dependentes);
          }

          const doc = edital.parsed_documento;
          if (doc) {
            if (doc.descritor) {
              setMunicipio(doc.descritor.municipio || 7071);
              setEntidade(doc.descritor.entidade || 11310);
              setCodigoEdital(doc.descritor.codigoEdital || edital.codigo_edital);
              setDataDocumento(doc.descritor.dataDocumento || '');
              setRetificacao(doc.descritor.retificacao || false);
            }
            if (doc.publicidade) {
              setHouvePublicacao(doc.publicidade.houvePublicacao);
              setPublicacoes(doc.publicidade.publicacoes || []);
            }
            setCodigoUnidadeCompradora(doc.codigoUnidadeCompradora || '');
            setTipoInstrumentoId(doc.tipoInstrumentoConvocatorioId || 1);
            setModalidadeId(doc.modalidadeId || 6);
            setModoDisputaId(doc.modoDisputaId || 1);
            setNumeroCompra(doc.numeroCompra || '');
            setAnoCompra(doc.anoCompra || new Date().getFullYear());
            setNumeroProcesso(doc.numeroProcesso || '');
            setObjetoCompra(doc.objetoCompra || '');
            setInformacaoComplementar(doc.informacaoComplementar || '');
            setSrp(doc.srp || false);
            setDataAberturaProposta(doc.dataAberturaProposta ? doc.dataAberturaProposta.slice(0, 16) : '');
            setDataEncerramentoProposta(doc.dataEncerramentoProposta ? doc.dataEncerramentoProposta.slice(0, 16) : '');
            setAmparoLegalId(doc.amparoLegalId || 1);
            setLinkSistemaOrigem(doc.linkSistemaOrigem || '');
            setJustificativaPresencial(doc.justificativaPresencial || '');
            setItens(doc.itensCompra || []);
          }
        }
      } catch (err: any) {
        toast.error('Erro ao carregar dados do edital');
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [id]);

  // Se o tipo de instrumento mudar, ajusta modalidade se não for permitida
  useEffect(() => {
    if (dominios?.regrasModalidadePorInstrumento) {
      const permitidas = dominios.regrasModalidadePorInstrumento[tipoInstrumentoId] || [];
      if (permitidas.length > 0 && !permitidas.includes(modalidadeId)) {
        setModalidadeId(permitidas[0]);
      }
    }
  }, [tipoInstrumentoId, dominios]);

  // Se a modalidade for leilão (1 ou 13), ajusta categoria dos itens
  const isLeilao = modalidadeId === 1 || modalidadeId === 13;
  const isSent = editalStatus === 'sent';
  const itensComCategoriaInvalidaLeilao = isLeilao
    ? itens.filter((it) => it.itemCategoriaId !== 1 && it.itemCategoriaId !== 2).length
    : 0;

  const handleDefinirCategoriaLeilaoEmLote = (categoriaId: 1 | 2) => {
    setItens((prev) =>
      prev.map((it) => ({
        ...it,
        materialOuServico: 'M',
        itemCategoriaId: categoriaId,
      }))
    );
    toast.success(
      `Categoria "${categoriaId === 1 ? '1 – Bens Imóveis' : '2 – Bens Móveis'}" aplicada a todos os itens.`
    );
  };

  // Montar payload JSON limpo conforme o Schema oficial
  const buildJsonDoc = () => {
    const rawCodigo = semPncp ? codigoEdital.trim() : stripMask(codigoEdital);

    const doc: any = {
      descritor: {
        municipio: Number(municipio),
        entidade: Number(entidade),
        codigoEdital: rawCodigo,
        dataDocumento,
        retificacao: Boolean(retificacao),
      },
      publicidade: {
        houvePublicacao: Boolean(houvePublicacao),
      },
      tipoInstrumentoConvocatorioId: Number(tipoInstrumentoId),
      modalidadeId: Number(modalidadeId),
      modoDisputaId: Number(modoDisputaId),
      numeroCompra: numeroCompra.trim(),
      anoCompra: Number(anoCompra),
      numeroProcesso: numeroProcesso.trim(),
      objetoCompra: objetoCompra.trim(),
      srp: Boolean(srp),
      amparoLegalId: Number(amparoLegalId),
      itensCompra: itens.map((it, idx) => ({
        numeroItem: idx + 1,
        materialOuServico: isLeilao ? 'M' : it.materialOuServico,
        tipoBeneficioId: Number(it.tipoBeneficioId),
        incentivoProdutivoBasico: Boolean(it.incentivoProdutivoBasico),
        descricao: it.descricao.trim(),
        quantidade: Number(Number(it.quantidade).toFixed(4)),
        unidadeMedida: it.unidadeMedida.trim(),
        orcamentoSigiloso: Boolean(it.orcamentoSigiloso),
        valorUnitarioEstimado: Number(Number(it.valorUnitarioEstimado).toFixed(4)),
        valorTotal: Number((Number(it.quantidade || 0) * Number(it.valorUnitarioEstimado || 0)).toFixed(4)),
        criterioJulgamentoId: Number(it.criterioJulgamentoId),
        itemCategoriaId: isLeilao
          ? ([1, 2].includes(Number(it.itemCategoriaId)) ? Number(it.itemCategoriaId) : 2)
          : 3,
        ...(it.patrimonio?.trim() ? { patrimonio: it.patrimonio.trim() } : {}),
        ...(it.codigoRegistroImobiliario?.trim() ? { codigoRegistroImobiliario: it.codigoRegistroImobiliario.trim() } : {}),
      })),
    };

    if (houvePublicacao && publicacoes.length > 0) {
      doc.publicidade.publicacoes = publicacoes.map((p) => {
        const veiculo = Number(p.veiculoPublicacao);
        const pubObj: any = {
          dataPublicacao: p.dataPublicacao,
          veiculoPublicacao: veiculo,
        };
        if (veiculo === 5 && p.idContratacaoPNCP) {
          pubObj.idContratacaoPNCP = stripMask(p.idContratacaoPNCP);
        }
        if (veiculo === 10 && p.veiculoPublicacaoNome?.trim()) {
          pubObj.veiculoPublicacaoNome = p.veiculoPublicacaoNome.trim();
        }
        return pubObj;
      });
    }

    if (codigoUnidadeCompradora.trim()) {
      doc.codigoUnidadeCompradora = codigoUnidadeCompradora.trim();
    }
    if (informacaoComplementar.trim()) {
      doc.informacaoComplementar = informacaoComplementar.trim();
    }
    if (dataAberturaProposta.trim()) {
      doc.dataAberturaProposta = `${dataAberturaProposta.trim()}:00`;
    }
    if (dataEncerramentoProposta.trim()) {
      doc.dataEncerramentoProposta = `${dataEncerramentoProposta.trim()}:00`;
    }
    if (linkSistemaOrigem.trim()) {
      doc.linkSistemaOrigem = linkSistemaOrigem.trim();
    }
    if (justificativaPresencial.trim()) {
      doc.justificativaPresencial = justificativaPresencial.trim();
    }

    return doc;
  };

  const handleSalvarRascunho = async () => {
    if (!codigoEdital.trim()) {
      toast.error('Informe o Código do Edital para salvar o rascunho.');
      return;
    }
    try {
      setSaving(true);
      const doc = buildJsonDoc();
      const payload = {
        documento: doc,
        sem_pncp: semPncp,
        pdf_path: pdfPath || undefined,
        pdf_nome_original: pdfNomeOriginal || undefined,
      };

      let savedEdital: Edital;
      if (id) {
        savedEdital = await editalService.updateEdital(Number(id), payload);
        toast.success('Rascunho atualizado com sucesso!');
      } else {
        savedEdital = await editalService.createEdital(payload);
        toast.success('Rascunho criado com sucesso!');
        navigate(`/editais/${savedEdital.id}`, { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Erro ao salvar rascunho';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarAudesp = async () => {
    // Validações básicas no frontend
    const rawCodigo = semPncp ? codigoEdital.trim() : stripMask(codigoEdital);
    if (!rawCodigo) {
      toast.error('Informe o Código do Edital.');
      return;
    }
    if (!semPncp && rawCodigo.length !== 25) {
      toast.error('O ID de Contratação PNCP deve ter exatamente 25 dígitos numéricos.');
      return;
    }
    if (!numeroCompra.trim()) {
      toast.error('Informe o Número da Compra.');
      return;
    }
    if (!numeroProcesso.trim()) {
      toast.error('Informe o Número do Processo.');
      return;
    }
    if (!objetoCompra.trim()) {
      toast.error('Informe o Objeto da Contratação.');
      return;
    }
    if ((tipoInstrumentoId === 1 || tipoInstrumentoId === 2) && (!dataAberturaProposta || !dataEncerramentoProposta)) {
      toast.error('Data de Abertura e Encerramento de Propostas são obrigatórias para Instrumento Tipo 1 e 2.');
      return;
    }
    if (itens.length === 0) {
      toast.error('Adicione ao menos um item de compra.');
      return;
    }
    if (isLeilao && itensComCategoriaInvalidaLeilao > 0) {
      toast.error(
        'Para Leilão (modalidade 1 ou 13), defina a Categoria do Item como Bens Imóveis (1) ou Bens Móveis (2).'
      );
      return;
    }
    if (semPncp && houvePublicacao && publicacoes.some((p) => Number(p.veiculoPublicacao) === 5)) {
      toast.error(
        'Há publicação no PNCP (veículo 5). Desmarque "Sem PNCP" e informe o ID de Contratação PNCP.'
      );
      return;
    }
    if (modalidadeId !== 9 && !pdfPath) {
      toast.error('O arquivo PDF do edital é obrigatório (exceto para Inexigibilidade).');
      return;
    }
    if (modalidadeId === 9 && !pdfPath) {
      if (!window.confirm('Nenhum arquivo PDF foi anexado para esta Inexigibilidade. Deseja enviar sem PDF?')) {
        return;
      }
    }

    try {
      setSending(true);
      // Salva rascunho primeiro
      const doc = buildJsonDoc();
      const payload = {
        documento: doc,
        sem_pncp: semPncp,
        pdf_path: pdfPath || undefined,
        pdf_nome_original: pdfNomeOriginal || undefined,
      };

      let currentId = id ? Number(id) : null;
      if (!currentId) {
        const saved = await editalService.createEdital(payload);
        currentId = saved.id;
      } else {
        await editalService.updateEdital(currentId, payload);
      }

      // Envia à AUDESP (já consulta o protocolo automaticamente no backend)
      const res = await editalService.enviarEdital(currentId);
      setEditalStatus('sent');
      setProtocolo(res.protocolo);
      setStatusProtocolo(res.status_protocolo || 'Recebido');
      if (res.dados || res.detalhes) {
        setDetalhesProtocolo(res.dados || res.detalhes);
      }
      if (res.historico_protocolo) {
        setHistoricoProtocolo(res.historico_protocolo);
      }
      notificarResultadoProtocolo(res, {
        prefixoSucesso: res.mensagem || 'Edital transmitido com sucesso!',
        isTransmissao: true,
      });
      navigate(`/editais/${currentId}`, { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.erros?.length) {
        toast.error(
          <div>
            <strong>Erros de Validação da Fase IV:</strong>
            <ul className="mb-0 mt-1 ps-3 text-start small">
              {detail.erros.map((e: string, i: number) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error(detail?.mensagem || detail || 'Erro ao transmitir edital ao AUDESP.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Selecione apenas arquivos no formato PDF.');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      toast.error('O arquivo excede o limite máximo permitido pelo AUDESP de 30 MB.');
      return;
    }

    try {
      setUploadingPdf(true);
      // Se ainda não salvou o edital, salva rascunho primeiro para obter ID
      let currentId = id ? Number(id) : null;
      if (!currentId) {
        const doc = buildJsonDoc();
        const saved = await editalService.createEdital({
          documento: doc,
          sem_pncp: semPncp,
        });
        currentId = saved.id;
        navigate(`/editais/${currentId}`, { replace: true });
      }

      const res = await editalService.uploadPdf(currentId, file);
      setPdfPath(res.pdf_path);
      setPdfNomeOriginal(res.pdf_nome_original);
      toast.success('Arquivo PDF anexado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao anexar arquivo PDF.');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleConsultarProtocolo = async () => {
    if (!id) return;
    try {
      setSending(true);
      const res = await editalService.consultarProtocolo(Number(id));
      setStatusProtocolo(res.status);
      setDetalhesProtocolo(res.dados || res.detalhes);
      if (res.historico) {
        setHistoricoProtocolo(res.historico);
      }
      notificarResultadoProtocolo(res, { isTransmissao: false });
    } catch (err: any) {
      toast.error('Erro ao consultar situação do protocolo');
    } finally {
      setSending(false);
    }
  };

  const handleRetornarRascunho = async () => {
    if (!id) return;
    const totalDep = (dependentes.licitacoes || 0) + (dependentes.atas || 0) + (dependentes.ajustes || 0);
    const msgConfirm =
      totalDep > 0
        ? `Atenção: este edital possui ${dependentes.licitacoes} licitação(ões), ${dependentes.atas} ata(s) e ${dependentes.ajustes} ajuste(s) vinculados. Deseja realmente retornar este edital para rascunho?`
        : 'Deseja retornar este edital para rascunho para reedição?';
    if (!window.confirm(msgConfirm)) return;
    try {
      await editalService.retornarRascunho(Number(id));
      setEditalStatus('draft');
      toast.success('Edital retornado para rascunho.');
    } catch {
      toast.error('Erro ao retornar edital para rascunho.');
    }
  };

  // Helper para gerar código Sem PNCP
  const handleGerarCodigoSemPncp = () => {
    const siglas: Record<number, string> = {
      1: 'LE', 2: 'DC', 3: 'CC', 4: 'CE', 5: 'CP', 6: 'PE', 7: 'PP',
      8: 'DISP', 9: 'INEX', 12: 'CRED', 13: 'LP', 14: 'INAP', 15: 'CHAP',
      997: 'RDC', 998: 'CV', 999: 'TP',
    };
    const sigla = siglas[modalidadeId] || 'PROC';
    const num = numeroCompra.trim() ? numeroCompra.padStart(6, '0') : '000001';
    const ano = anoCompra || new Date().getFullYear();
    setCodigoEdital(`${sigla}-${num}/${ano}`);
  };

  // Gerenciamento de Publicações
  const handleOpenPubModal = (index?: number) => {
    if (index !== undefined) {
      setEditingPubIndex(index);
      setPubForm({ ...publicacoes[index] });
    } else {
      setEditingPubIndex(null);
      setPubForm({
        veiculoPublicacao: 1,
        dataPublicacao: new Date().toISOString().split('T')[0],
        idContratacaoPNCP: '',
        veiculoPublicacaoNome: '',
      });
    }
    setShowPubModal(true);
  };

  const handleSavePublicacao = () => {
    if (!pubForm.dataPublicacao) {
      toast.error('Informe a data de publicação.');
      return;
    }
    if (pubForm.veiculoPublicacao === 5) {
      const clean = stripMask(pubForm.idContratacaoPNCP || '');
      if (clean.length !== 25) {
        toast.error('No veículo PNCP, o ID de Contratação deve ter exatamente 25 dígitos.');
        return;
      }
    }
    if (pubForm.veiculoPublicacao === 10 && !pubForm.veiculoPublicacaoNome?.trim()) {
      toast.error('Para o veículo "Outros", informe o nome do veículo.');
      return;
    }

    const sanitizedPub: Publicacao = {
      veiculoPublicacao: Number(pubForm.veiculoPublicacao),
      dataPublicacao: pubForm.dataPublicacao,
      ...(pubForm.veiculoPublicacao === 5 && pubForm.idContratacaoPNCP ? { idContratacaoPNCP: stripMask(pubForm.idContratacaoPNCP) } : {}),
      ...(pubForm.veiculoPublicacao === 10 && pubForm.veiculoPublicacaoNome?.trim() ? { veiculoPublicacaoNome: pubForm.veiculoPublicacaoNome.trim() } : {}),
    };

    if (editingPubIndex !== null) {
      const updated = [...publicacoes];
      updated[editingPubIndex] = sanitizedPub;
      setPublicacoes(updated);
    } else {
      setPublicacoes([...publicacoes, sanitizedPub]);
    }
    setShowPubModal(false);
  };

  // Gerenciamento de Itens de Compra
  const handleOpenItemModal = (index?: number) => {
    if (index !== undefined) {
      setEditingItemIndex(index);
      const current = itens[index];
      setItemForm({
        ...current,
        itemCategoriaId: isLeilao
          ? ([1, 2].includes(Number(current.itemCategoriaId)) ? Number(current.itemCategoriaId) : 2)
          : 3,
      });
    } else {
      setEditingItemIndex(null);
      setItemForm({
        numeroItem: itens.length + 1,
        materialOuServico: isLeilao ? 'M' : 'M',
        tipoBeneficioId: 4,
        incentivoProdutivoBasico: false,
        descricao: '',
        quantidade: 1,
        unidadeMedida: 'UN',
        orcamentoSigiloso: false,
        valorUnitarioEstimado: 0,
        valorTotal: 0,
        criterioJulgamentoId: 1,
        itemCategoriaId: isLeilao ? 2 : 3,
        patrimonio: '',
        codigoRegistroImobiliario: '',
      });
    }
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
    if (!itemForm.descricao.trim()) {
      toast.error('Informe a descrição do item.');
      return;
    }
    if (!itemForm.quantidade || Number(itemForm.quantidade) <= 0) {
      toast.error('A quantidade deve ser maior que zero.');
      return;
    }
    if (!itemForm.unidadeMedida.trim()) {
      toast.error('Informe a unidade de medida.');
      return;
    }
    if (Number(itemForm.valorUnitarioEstimado) < 0) {
      toast.error('O valor unitário não pode ser negativo.');
      return;
    }

    const totalCalculado = Number((Number(itemForm.quantidade) * Number(itemForm.valorUnitarioEstimado)).toFixed(4));
    const itemToSave = {
      ...itemForm,
      valorTotal: totalCalculado,
      materialOuServico: isLeilao ? ('M' as const) : itemForm.materialOuServico,
      itemCategoriaId: isLeilao ? Number(itemForm.itemCategoriaId) : 3,
    };

    if (editingItemIndex !== null) {
      const updated = [...itens];
      updated[editingItemIndex] = itemToSave;
      setItens(updated);
    } else {
      setItens([...itens, itemToSave]);
    }
    setShowItemModal(false);
  };

  if (loading) {
    return (
      <Container fluid className="p-0">
        <PageHeader title="Carregando edital..." />
        <Card>
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="text-muted mt-2 mb-0">Carregando dados e domínios do AUDESP...</p>
          </div>
        </Card>
      </Container>
    );
  }

  const modalidadesDisponiveis = dominios?.regrasModalidadePorInstrumento?.[tipoInstrumentoId] || [];

  return (
    <Container fluid className="p-0 pb-5">
      <PageHeader
        title={isSent ? 'Edital Transmitido (Fase IV)' : id ? 'Editar Edital' : 'Novo Edital (Fase IV)'}
        actions={
          <button
            onClick={() => navigate('/editais')}
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
        codigoDocumento={codigoEdital}
        historico={historicoProtocolo}
      />

      {/* Seção 1: Descritor */}
      <Card title="1. Descritor do Documento" className="mb-4">
        <div className="row g-3">
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
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Form.Label className="form-label fw-bold small text-secondary mb-0">
                {semPncp ? 'Código do Edital (Sem PNCP) *' : 'ID Contratação PNCP (25 Dígitos) *'}
              </Form.Label>
              {!isSent && !retificacao && (
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="toggleSemPncp"
                    checked={semPncp}
                    onChange={(e) => {
                      setSemPncp(e.target.checked);
                      setCodigoEdital('');
                    }}
                  />
                  <Form.Label className="form-check-label small text-muted" htmlFor="toggleSemPncp">
                    Sem PNCP
                  </Form.Label>
                </div>
              )}
            </div>

            <div className="input-group input-group-sm">
              <Form.Control
                type="text"
                className="form-control font-monospace"
                placeholder={semPncp ? 'Ex: PE-000001/2026' : '00.000.000/0000-00-1-000000/0000'}
                value={semPncp ? codigoEdital : formatPncpMask(codigoEdital)}
                onChange={(e) => {
                  if (semPncp) {
                    setCodigoEdital(e.target.value.slice(0, 25));
                  } else {
                    setCodigoEdital(stripMask(e.target.value).slice(0, 25));
                  }
                }}
                disabled={isSent || retificacao}
                maxLength={semPncp ? 25 : 36}
              />
              {semPncp && !isSent && !retificacao && (
                <button
                  type="button"
                  onClick={handleGerarCodigoSemPncp}
                  className="btn btn-outline-secondary"
                  title="Gerar código padrão baseado na modalidade e número"
                >
                  Gerar
                </button>
              )}
            </div>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              {semPncp
                ? 'Código único gerado pela entidade (máximo 25 caracteres)'
                : 'Formato PNCP: 14 dígitos CNPJ + "1" + 6 seq + 4 ano (total 25)'}
            </span>
          </div>

          <div className="col-md-2">
            <Form.Label className="form-label fw-bold small text-secondary">
              Data do Edital *
            </Form.Label>
            <Form.Control
              type="date"
              className="form-control form-control-sm"
              value={dataDocumento}
              onChange={(e) => setDataDocumento(e.target.value)}
              disabled={isSent}
            />
          </div>

          <div className="col-12 mt-2">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="checkRetificacao"
                checked={retificacao}
                onChange={(e) => setRetificacao(e.target.checked)}
                disabled={isSent}
              />
              <Form.Label className="form-check-label small text-dark fw-medium" htmlFor="checkRetificacao">
                Este envio é uma <strong>Retificação</strong> de edital previamente transmitido ao AUDESP
              </Form.Label>
            </div>
          </div>
        </div>
      </Card>

      {/* Seção 2: Publicidade */}
      <Card
        title="2. Publicidade do Instrumento Convocatório"
        className="mb-4"
        actions={
          houvePublicacao && !isSent && (
            <button
              type="button"
              onClick={() => handleOpenPubModal()}
              className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
            >
              <Plus size={14} /> Adicionar Veículo de Publicação
            </button>
          )
        }
      >
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="checkHouvePub"
            checked={houvePublicacao}
            onChange={(e) => setHouvePublicacao(e.target.checked)}
            disabled={isSent}
          />
          <Form.Label className="form-check-label small text-dark fw-bold" htmlFor="checkHouvePub">
            Houve publicação em veículos de comunicação
          </Form.Label>
        </div>

        {houvePublicacao && (
          <div>
            {publicacoes.length === 0 ? (
              <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-0">
                <AlertTriangle size={16} />
                <span>
                  A documentação da AUDESP exige ao menos uma publicação quando "Houve Publicação" estiver marcado.
                </span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Veículo</th>
                      <th>Data Publicação</th>
                      <th>Controle PNCP / Nome Outro</th>
                      {!isSent && <th className="text-end">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {publicacoes.map((pub, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold text-muted">{idx + 1}</td>
                        <td className="fw-medium">
                          {dominios?.veiculosPublicacao?.[pub.veiculoPublicacao] || `Veículo ${pub.veiculoPublicacao}`}
                        </td>
                        <td>{formatDateBR(pub.dataPublicacao)}</td>
                        <td className="font-monospace small">
                          {pub.veiculoPublicacao === 5 ? formatPncpMask(pub.idContratacaoPNCP || '') : pub.veiculoPublicacaoNome || '—'}
                        </td>
                        {!isSent && (
                          <td className="text-end">
                            <button
                              type="button"
                              onClick={() => handleOpenPubModal(idx)}
                              className="btn btn-outline-secondary btn-sm p-1 me-1"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPublicacoes(publicacoes.filter((_, i) => i !== idx))}
                              className="btn btn-outline-danger btn-sm p-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Seção 3: Dados Gerais */}
      <Card title="3. Dados Gerais da Contratação" className="mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <Form.Label className="form-label fw-bold small text-secondary">
              Tipo de Instrumento Convocatório *
            </Form.Label>
            <Form.Select
              className="form-select form-select-sm"
              value={tipoInstrumentoId}
              onChange={(e) => setTipoInstrumentoId(Number(e.target.value))}
              disabled={isSent}
            >
              {dominios && Object.entries(dominios.instrumentos).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </Form.Select>
          </div>

          <div className="col-md-6">
            <Form.Label className="form-label fw-bold small text-secondary">
              Modalidade de Contratação *
            </Form.Label>
            <Form.Select
              className="form-select form-select-sm"
              value={modalidadeId}
              onChange={(e) => setModalidadeId(Number(e.target.value))}
              disabled={isSent}
            >
              {modalidadesDisponiveis.map((mId) => (
                <option key={mId} value={mId}>
                  {dominios?.modalidades?.[mId] || `Modalidade ${mId}`}
                </option>
              ))}
            </Form.Select>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
              Filtradas conforme a regra de compatibilidade com o instrumento convocatório.
            </span>
          </div>

          <div className="col-md-4">
            <Form.Label className="form-label fw-bold small text-secondary">
              Modo de Disputa *
            </Form.Label>
            <Form.Select
              className="form-select form-select-sm"
              value={modoDisputaId}
              onChange={(e) => setModoDisputaId(Number(e.target.value))}
              disabled={isSent}
            >
              {dominios && Object.entries(dominios.modosDisputa).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </Form.Select>
          </div>

          <div className="col-md-4">
            <Form.Label className="form-label fw-bold small text-secondary">
              Número da Compra (no sistema de origem) *
            </Form.Label>
            <Form.Control
              type="text"
              className="form-control form-control-sm"
              placeholder="Ex: Pregão 14 ou 0001"
              value={numeroCompra}
              onChange={(e) => setNumeroCompra(e.target.value)}
              disabled={isSent}
              maxLength={50}
            />
          </div>

          <div className="col-md-4">
            <Form.Label className="form-label fw-bold small text-secondary">
              Ano da Compra *
            </Form.Label>
            <Form.Control
              type="number"
              className="form-control form-control-sm"
              value={anoCompra}
              onChange={(e) => setAnoCompra(Number(e.target.value))}
              disabled={isSent}
              min={1970}
              max={2099}
            />
          </div>

          <div className="col-md-4">
            <Form.Label className="form-label fw-bold small text-secondary">
              Número do Processo de Origem *
            </Form.Label>
            <Form.Control
              type="text"
              className="form-control form-control-sm"
              placeholder="Ex: 1234/2026"
              value={numeroProcesso}
              onChange={(e) => setNumeroProcesso(e.target.value)}
              disabled={isSent}
              maxLength={50}
            />
          </div>

          <div className="col-md-4">
            <Form.Label className="form-label fw-bold small text-secondary">
              Código Unidade Compradora
            </Form.Label>
            <Form.Control
              type="text"
              className="form-control form-control-sm"
              placeholder="Facultativo (máx 20 caracteres)"
              value={codigoUnidadeCompradora}
              onChange={(e) => setCodigoUnidadeCompradora(e.target.value)}
              disabled={isSent}
              maxLength={20}
            />
          </div>

          <div className="col-md-4 d-flex align-items-center">
            <div className="form-check mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="checkSrp"
                checked={srp}
                onChange={(e) => setSrp(e.target.checked)}
                disabled={isSent}
              />
              <Form.Label className="form-check-label small text-dark fw-medium" htmlFor="checkSrp">
                Sistema de Registro de Preços (SRP)
              </Form.Label>
            </div>
          </div>

          <div className="col-12">
            <Form.Label className="form-label fw-bold small text-secondary">
              Objeto da Contratação *
            </Form.Label>
            <Form.Control as="textarea"
              className="form-control form-control-sm"
              rows={3}
              placeholder="Descreva detalhadamente o objeto da licitação ou contratação direta..."
              value={objetoCompra}
              onChange={(e) => setObjetoCompra(e.target.value)}
              disabled={isSent}
              maxLength={5120}
            />
          </div>

          <div className="col-12">
            <Form.Label className="form-label fw-bold small text-secondary">
              Informações Complementares
            </Form.Label>
            <Form.Control as="textarea"
              className="form-control form-control-sm"
              rows={2}
              placeholder="Observações ou informações adicionais (se houver)..."
              value={informacaoComplementar}
              onChange={(e) => setInformacaoComplementar(e.target.value)}
              disabled={isSent}
              maxLength={5120}
            />
          </div>

          {/* Datas de abertura e encerramento */}
          <div className="col-md-6">
            <Form.Label className="form-label fw-bold small text-secondary">
              Data e Hora de Abertura de Propostas {(tipoInstrumentoId === 1 || tipoInstrumentoId === 2) && '*'}
            </Form.Label>
            <Form.Control
              type="datetime-local"
              className="form-control form-control-sm"
              value={dataAberturaProposta}
              onChange={(e) => setDataAberturaProposta(e.target.value)}
              disabled={isSent}
            />
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
              Obrigatório para Instrumento 1 (Edital) ou 2 (Dispensa com Disputa).
            </span>
          </div>

          <div className="col-md-6">
            <Form.Label className="form-label fw-bold small text-secondary">
              Data e Hora de Encerramento de Propostas {(tipoInstrumentoId === 1 || tipoInstrumentoId === 2) && '*'}
            </Form.Label>
            <Form.Control
              type="datetime-local"
              className="form-control form-control-sm"
              value={dataEncerramentoProposta}
              onChange={(e) => setDataEncerramentoProposta(e.target.value)}
              disabled={isSent}
            />
          </div>

          {/* Amparo Legal */}
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Form.Label className="form-label fw-bold small text-secondary mb-0">
                Amparo Legal (Lei 14.133 / Legislação Específica) *
              </Form.Label>
              <div style={{ maxWidth: '300px', width: '100%' }}>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="🔍 Filtrar amparo (ex: pregão, 28, dispensa)..."
                  value={buscaAmparo}
                  onChange={(e) => setBuscaAmparo(e.target.value)}
                  disabled={isSent}
                />
              </div>
            </div>

            <Form.Select
              className="form-select form-select-sm"
              value={amparoLegalId}
              onChange={(e) => setAmparoLegalId(Number(e.target.value))}
              disabled={isSent}
              style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
            >
              {dominios?.amparosLegais
                ?.filter((amp) => {
                  if (!buscaAmparo.trim()) return true;
                  const termo = buscaAmparo.toLowerCase();
                  return (
                    amp.artigo?.toLowerCase().includes(termo) ||
                    amp.detalhe?.toLowerCase().includes(termo) ||
                    amp.label?.toLowerCase().includes(termo) ||
                    amp.id === amparoLegalId
                  );
                })
                .map((amp) => (
                  <option key={amp.id} value={amp.id} title={amp.label}>
                    {amp.artigo ? `${amp.artigo} — ${amp.detalhe ? (amp.detalhe.length > 120 ? amp.detalhe.slice(0, 120) + '...' : amp.detalhe) : amp.label}` : amp.label}
                  </option>
                ))}
            </Form.Select>

            {/* Card com o texto completo do Amparo Legal selecionado */}
            {(() => {
              const selecionado = dominios?.amparosLegais?.find((a) => a.id === amparoLegalId);
              if (!selecionado) return null;
              return (
                <div className="p-2 mt-2 bg-light border rounded small">
                  <div className="fw-bold text-success mb-1">
                    {selecionado.artigo || `Amparo Legal #${selecionado.id}`}
                  </div>
                  <div className="text-secondary" style={{ lineHeight: '1.4' }}>
                    {selecionado.detalhe || selecionado.label}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="col-md-6">
            <Form.Label className="form-label fw-bold small text-secondary">
              Link do Sistema de Origem (Lances)
            </Form.Label>
            <Form.Control
              type="url"
              className="form-control form-control-sm"
              placeholder="https://..."
              value={linkSistemaOrigem}
              onChange={(e) => setLinkSistemaOrigem(e.target.value)}
              disabled={isSent}
              maxLength={500}
            />
          </div>

          <div className="col-md-6">
            <Form.Label className="form-label fw-bold small text-secondary">
              Justificativa Presencial (se aplicável)
            </Form.Label>
            <Form.Control
              type="text"
              className="form-control form-control-sm"
              placeholder="Justificativa pela escolha da modalidade presencial"
              value={justificativaPresencial}
              onChange={(e) => setJustificativaPresencial(e.target.value)}
              disabled={isSent}
              maxLength={500}
            />
          </div>
        </div>
      </Card>

      {/* Seção 4: Itens de Compra */}
      <Card
        title="4. Lista de Itens da Contratação"
        className="mb-4"
        actions={
          <div className="d-flex align-items-center gap-2">
            {itens.length > 0 && (
              <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-2 py-1 font-monospace">
                Total: {formatBRL(itens.reduce((acc, curr) => acc + Number((Number(curr.quantidade || 0) * Number(curr.valorUnitarioEstimado || 0)).toFixed(4)), 0))}
              </span>
            )}
            {!isSent && (
              <button
                type="button"
                onClick={() => handleOpenItemModal()}
                className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
              >
                <Plus size={14} /> Adicionar Item de Compra
              </button>
            )}
          </div>
        }
      >
        {isLeilao && itensComCategoriaInvalidaLeilao > 0 && !isSent && (
          <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2 py-2 px-3 mb-3 small">
            <div className="d-flex align-items-center gap-2">
              <AlertTriangle size={16} />
              <span>
                Para Leilão, os itens exigem categoria <strong>1 – Bens Imóveis</strong> ou <strong>2 – Bens Móveis</strong> ({itensComCategoriaInvalidaLeilao} item(ns) pendente(s)).
              </span>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-dark py-0 px-2"
                onClick={() => handleDefinirCategoriaLeilaoEmLote(2)}
              >
                Definir todos como Bens Móveis (2)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-dark py-0 px-2"
                onClick={() => handleDefinirCategoriaLeilaoEmLote(1)}
              >
                Definir todos como Bens Imóveis (1)
              </button>
            </div>
          </div>
        )}
        {itens.length === 0 ? (
          <div className="alert alert-warning py-3 text-center mb-0 small">
            <AlertTriangle size={20} className="mb-1 text-warning" />
            <p className="mb-0">
              Nenhum item adicionado. A Fase IV exige <strong>ao menos um item de compra</strong> com descrição, quantidade, valor unitário e critério de julgamento.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Item</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Critério Julgamento</th>
                  <th>Benefício ME/EPP</th>
                  <th className="text-end">Qtd</th>
                  <th>Unid</th>
                  <th className="text-end">Valor Unit.</th>
                  <th className="text-end">Valor Total</th>
                  {!isSent && <th className="text-end">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {itens.map((it, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold">{idx + 1}</td>
                    <td>
                      <span className={`badge ${it.materialOuServico === 'M' ? 'bg-primary' : 'bg-info'}`}>
                        {it.materialOuServico === 'M' ? 'Material' : 'Serviço'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px' }} className="text-truncate" title={it.descricao}>
                      {it.descricao}
                    </td>
                    <td className="small">
                      {dominios?.criteriosJulgamento?.[it.criterioJulgamentoId] || it.criterioJulgamentoId}
                    </td>
                    <td className="small">
                      {dominios?.tiposBeneficio?.[it.tipoBeneficioId] || it.tipoBeneficioId}
                    </td>
                    <td className="text-end font-monospace">{formatDecimal4(it.quantidade)}</td>
                    <td>{it.unidadeMedida}</td>
                    <td className="text-end font-monospace">{formatBRL(it.valorUnitarioEstimado)}</td>
                    <td className="text-end font-monospace fw-bold">
                      {formatBRL(Number((Number(it.quantidade || 0) * Number(it.valorUnitarioEstimado || 0)).toFixed(4)))}
                    </td>
                    {!isSent && (
                      <td className="text-end">
                        <button
                          type="button"
                          onClick={() => handleOpenItemModal(idx)}
                          className="btn btn-outline-secondary btn-sm p-1 me-1"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItens(itens.filter((_, i) => i !== idx))}
                          className="btn btn-outline-danger btn-sm p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan={8} className="text-end fw-bold">Total Geral Estimado:</td>
                  <td className="text-end fw-bold text-success font-monospace">
                    {formatBRL(itens.reduce((acc, curr) => acc + Number((Number(curr.quantidade || 0) * Number(curr.valorUnitarioEstimado || 0)).toFixed(4)), 0))}
                  </td>
                  {!isSent && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Seção 5: Arquivo PDF */}
      <Card title="5. Arquivo PDF do Edital" className="mb-4">
        <div className="p-3 bg-light rounded border">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h6 className="mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                <FileText className="text-danger" size={20} />
                {pdfNomeOriginal ? pdfNomeOriginal : 'Nenhum arquivo PDF anexado'}
              </h6>
              <p className="text-muted small mb-0">
                Regra AUDESP: Arquivo PDF com até 30 MB.
                {modalidadeId === 9
                  ? ' Facultativo apenas para Inexigibilidade de Licitação.'
                  : ' Obrigatório para a modalidade selecionada.'}
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              {pdfPath && id && (
                <a
                  href={editalService.getPdfUrl(Number(id))}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-secondary btn-sm"
                >
                  Visualizar PDF
                </a>
              )}

              {!isSent && (
                <Form.Label className="btn btn-success btn-sm mb-0 d-flex align-items-center gap-1 cursor-pointer">
                  <Upload size={14} />
                  {uploadingPdf ? 'Enviando...' : pdfPath ? 'Substituir PDF' : 'Selecionar PDF'}
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="d-none"
                    onChange={handleFileUpload}
                    disabled={uploadingPdf}
                  />
                </Form.Label>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Botões de Ação no Final do Formulário */}
      <div className="card shadow-sm border-0 mt-4 p-3 bg-white">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/editais')}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          >
            <ArrowLeft size={16} /> Voltar à Lista
          </button>

          <div className="d-flex align-items-center gap-2">
            {!isSent ? (
              <>
                <button
                  type="button"
                  onClick={handleSalvarRascunho}
                  disabled={saving || sending}
                  className="btn btn-outline-success fw-bold btn-sm d-flex align-items-center gap-1 shadow-sm"
                >
                  <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Rascunho'}
                </button>

                <button
                  type="button"
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

      {/* Modal: Publicação */}
      {showPubModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fs-6 fw-bold">
                  {editingPubIndex !== null ? 'Editar Publicação' : 'Adicionar Publicação'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowPubModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <Form.Label className="form-label small fw-bold text-secondary">Veículo de Publicação *</Form.Label>
                  <Form.Select
                    className="form-select form-select-sm"
                    value={pubForm.veiculoPublicacao}
                    onChange={(e) => {
                      const novoVeiculo = Number(e.target.value);
                      setPubForm({
                        ...pubForm,
                        veiculoPublicacao: novoVeiculo,
                        ...(novoVeiculo !== 5 ? { idContratacaoPNCP: '' } : {}),
                        ...(novoVeiculo !== 10 ? { veiculoPublicacaoNome: '' } : {}),
                      });
                    }}
                  >
                    {dominios && Object.entries(dominios.veiculosPublicacao).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </Form.Select>
                </div>

                <div className="mb-3">
                  <Form.Label className="form-label small fw-bold text-secondary">Data de Publicação *</Form.Label>
                  <Form.Control
                    type="date"
                    className="form-control form-control-sm"
                    value={pubForm.dataPublicacao}
                    onChange={(e) => setPubForm({ ...pubForm, dataPublicacao: e.target.value })}
                  />
                </div>

                {pubForm.veiculoPublicacao === 5 && (
                  <div className="mb-3">
                    <Form.Label className="form-label small fw-bold text-secondary">
                      ID de Contratação PNCP (25 Dígitos) *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      placeholder="00.000.000/0000-00-1-000000/0000"
                      value={formatPncpMask(pubForm.idContratacaoPNCP || '')}
                      onChange={(e) => setPubForm({ ...pubForm, idContratacaoPNCP: stripMask(e.target.value) })}
                    />
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Obrigatório para veículo 5 (PNCP). Apenas os 25 dígitos numéricos.
                    </span>
                  </div>
                )}

                {pubForm.veiculoPublicacao === 10 && (
                  <div className="mb-3">
                    <Form.Label className="form-label small fw-bold text-secondary">
                      Nome / Descrição do Veículo de Publicação <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Nome do jornal ou veículo (obrigatório para 'Outros')"
                      value={pubForm.veiculoPublicacaoNome || ''}
                      onChange={(e) => setPubForm({ ...pubForm, veiculoPublicacaoNome: e.target.value })}
                      maxLength={100}
                    />
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Exigido pelo AUDESP apenas para a opção 'Outros' (veículo 10).
                    </span>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPubModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-success btn-sm" onClick={handleSavePublicacao}>
                  Salvar Publicação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Item de Compra */}
      {showItemModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fs-6 fw-bold">
                  {editingItemIndex !== null ? `Editar Item ${editingItemIndex + 1}` : 'Adicionar Item de Compra'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowItemModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className={isLeilao ? 'col-md-4' : 'col-md-6'}>
                    <Form.Label className="form-label small fw-bold text-secondary">Tipo (Material / Serviço) *</Form.Label>
                    <Form.Select
                      className="form-select form-select-sm"
                      value={isLeilao ? 'M' : itemForm.materialOuServico}
                      onChange={(e) => setItemForm({ ...itemForm, materialOuServico: e.target.value as any })}
                      disabled={isLeilao}
                    >
                      <option value="M">Material</option>
                      <option value="S">Serviço</option>
                    </Form.Select>
                    {isLeilao && (
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Leilão exige obrigatoriamente Material.
                      </span>
                    )}
                  </div>

                  {isLeilao && (
                    <div className="col-md-4">
                      <Form.Label className="form-label small fw-bold text-secondary">Categoria do Item (Leilão) *</Form.Label>
                      <Form.Select
                        className="form-select form-select-sm"
                        value={[1, 2].includes(Number(itemForm.itemCategoriaId)) ? itemForm.itemCategoriaId : 2}
                        onChange={(e) => setItemForm({ ...itemForm, itemCategoriaId: Number(e.target.value) })}
                      >
                        <option value={1}>1 – Bens Imóveis</option>
                        <option value={2}>2 – Bens Móveis</option>
                      </Form.Select>
                    </div>
                  )}

                  <div className={isLeilao ? 'col-md-4' : 'col-md-6'}>
                    <Form.Label className="form-label small fw-bold text-secondary">Critério de Julgamento *</Form.Label>
                    <Form.Select
                      className="form-select form-select-sm"
                      value={itemForm.criterioJulgamentoId}
                      onChange={(e) => setItemForm({ ...itemForm, criterioJulgamentoId: Number(e.target.value) })}
                    >
                      {dominios && Object.entries(dominios.criteriosJulgamento).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </Form.Select>
                  </div>

                  <div className="col-md-6">
                    <Form.Label className="form-label small fw-bold text-secondary">Benefício ME/EPP *</Form.Label>
                    <Form.Select
                      className="form-select form-select-sm"
                      value={itemForm.tipoBeneficioId}
                      onChange={(e) => setItemForm({ ...itemForm, tipoBeneficioId: Number(e.target.value) })}
                    >
                      {dominios && Object.entries(dominios.tiposBeneficio).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </Form.Select>
                  </div>

                  <div className="col-md-6 d-flex align-items-center gap-3">
                    <div className="form-check mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="checkPpb"
                        checked={itemForm.incentivoProdutivoBasico}
                        onChange={(e) => setItemForm({ ...itemForm, incentivoProdutivoBasico: e.target.checked })}
                      />
                      <Form.Label className="form-check-label small" htmlFor="checkPpb">Incentivo Fiscal (PPB)</Form.Label>
                    </div>
                    <div className="form-check mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="checkSigiloso"
                        checked={itemForm.orcamentoSigiloso}
                        onChange={(e) => setItemForm({ ...itemForm, orcamentoSigiloso: e.target.checked })}
                      />
                      <Form.Label className="form-check-label small" htmlFor="checkSigiloso">Orçamento Sigiloso</Form.Label>
                    </div>
                  </div>

                  <div className="col-12">
                    <Form.Label className="form-label small fw-bold text-secondary">Descrição do Item *</Form.Label>
                    <Form.Control as="textarea"
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="Descrição detalhada do material ou serviço..."
                      value={itemForm.descricao}
                      onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })}
                      maxLength={2048}
                    />
                  </div>

                  <div className="col-md-4">
                    <Form.Label className="form-label small fw-bold text-secondary">Quantidade *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.0001"
                      className="form-control form-control-sm"
                      value={itemForm.quantidade}
                      onChange={(e) => {
                        const q = parseFloat(e.target.value) || 0;
                        setItemForm({
                          ...itemForm,
                          quantidade: q,
                          valorTotal: Number((q * (itemForm.valorUnitarioEstimado || 0)).toFixed(4)),
                        });
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <Form.Label className="form-label small fw-bold text-secondary">Unidade de Medida *</Form.Label>
                    <Form.Control
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Ex: UN, KG, METRO, HORA"
                      value={itemForm.unidadeMedida}
                      onChange={(e) => setItemForm({ ...itemForm, unidadeMedida: e.target.value })}
                      maxLength={30}
                    />
                  </div>

                  <div className="col-md-4">
                    <Form.Label className="form-label small fw-bold text-secondary">Valor Unitário Estimado (R$) *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.0001"
                      className="form-control form-control-sm"
                      value={itemForm.valorUnitarioEstimado}
                      onChange={(e) => {
                        const vu = parseFloat(e.target.value) || 0;
                        setItemForm({
                          ...itemForm,
                          valorUnitarioEstimado: vu,
                          valorTotal: Number(((itemForm.quantidade || 0) * vu).toFixed(4)),
                        });
                      }}
                    />
                  </div>

                  <div className="col-12 text-end bg-light p-2 rounded">
                    <span className="small text-muted me-2">Valor Total do Item:</span>
                    <strong className="text-success fs-6">
                      {formatBRL((itemForm.quantidade || 0) * (itemForm.valorUnitarioEstimado || 0))}
                    </strong>
                  </div>

                  {isLeilao && itemForm.itemCategoriaId === 2 && (
                    <div className="col-md-6">
                      <Form.Label className="form-label small fw-bold text-secondary">Código de Patrimônio (Bens Móveis)</Form.Label>
                      <Form.Control
                        type="text"
                        className="form-control form-control-sm"
                        value={itemForm.patrimonio || ''}
                        onChange={(e) => setItemForm({ ...itemForm, patrimonio: e.target.value })}
                        maxLength={255}
                      />
                    </div>
                  )}

                  {isLeilao && itemForm.itemCategoriaId === 1 && (
                    <div className="col-md-6">
                      <Form.Label className="form-label small fw-bold text-secondary">Código de Registro Imobiliário</Form.Label>
                      <Form.Control
                        type="text"
                        className="form-control form-control-sm"
                        value={itemForm.codigoRegistroImobiliario || ''}
                        onChange={(e) => setItemForm({ ...itemForm, codigoRegistroImobiliario: e.target.value })}
                        maxLength={255}
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
    </Container>
  );
};