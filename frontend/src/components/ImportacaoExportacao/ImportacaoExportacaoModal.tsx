import React, { useState } from 'react';
import {
  Modal,
  Button,
  Form,
  Table,
  Badge,
  Spinner,
  ButtonGroup,
  Row,
  Col,
  Nav,
} from 'react-bootstrap';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Send,
  Save,
  XCircle,
  Plus,
  Trash2,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Megaphone,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  importacaoExportacaoService,
  type ModuloImportacao,
  type EditalPreviewItem,
  type ImportacaoLoteResponse,
} from '../../services/importacaoExportacaoService';
import type { ItemCompra, Publicacao } from '../../types/edital';

interface ImportacaoExportacaoToolbarProps {
  modulo: ModuloImportacao;
  tituloModulo: string;
  onImportSuccess: () => void;
}

const INSTRUMENTOS_CONVOCATORIOS = [
  { id: 1, label: '1 - Edital' },
  { id: 2, label: '2 - Aviso de Contratação Direta' },
  { id: 3, label: '3 - Ato que autoriza a Contratação Direta' },
  { id: 4, label: '4 - Edital de Chamamento Público' },
];

const MODALIDADES = [
  { id: 1, label: '1 - Leilão - Eletrônico' },
  { id: 2, label: '2 - Diálogo Competitivo' },
  { id: 3, label: '3 - Concurso' },
  { id: 4, label: '4 - Concorrência - Eletrônica' },
  { id: 5, label: '5 - Concorrência - Presencial' },
  { id: 6, label: '6 - Pregão - Eletrônico' },
  { id: 7, label: '7 - Pregão - Presencial' },
  { id: 8, label: '8 - Dispensa de Licitação' },
  { id: 9, label: '9 - Inexigibilidade' },
  { id: 10, label: '10 - Manifestação de Interesse' },
  { id: 11, label: '11 - Pré-Qualificação' },
  { id: 12, label: '12 - Credenciamento' },
  { id: 13, label: '13 - Leilão - Presencial' },
  { id: 14, label: '14 - Inaplicabilidade da Licitação' },
  { id: 15, label: '15 - Chamada pública' },
  { id: 16, label: '16 - Concorrência – Eletrônica Internacional' },
  { id: 17, label: '17 - Concorrência – Presencial Internacional' },
  { id: 18, label: '18 - Pregão – Eletrônico Internacional' },
  { id: 19, label: '19 - Pregão – Presencial Internacional' },
  { id: 997, label: '997 - Regime Diferenciado de Contratação (RDC)' },
  { id: 998, label: '998 - Convite' },
  { id: 999, label: '999 - Tomada de Preços' },
];

const MODOS_DISPUTA = [
  { id: 1, label: '1 - Aberto' },
  { id: 2, label: '2 - Fechado' },
  { id: 3, label: '3 - Aberto-Fechado' },
  { id: 4, label: '4 - Dispensa com Disputa' },
  { id: 5, label: '5 - Não se aplica' },
  { id: 6, label: '6 - Fechado-Aberto' },
];

const VEICULOS_PUBLICACAO = [
  { id: 1, label: '1 - Diário Oficial do Município' },
  { id: 2, label: '2 - Diário Oficial do Estado' },
  { id: 3, label: '3 - Diário Oficial da União' },
  { id: 4, label: '4 - Diário da Justiça Eletrônico' },
  { id: 5, label: '5 - Portal Nacional de Compras Públicas (PNCP)' },
  { id: 6, label: '6 - Jornal de grande circulação nacional' },
  { id: 7, label: '7 - Jornal de grande circulação regional/municipal' },
  { id: 8, label: '8 - Quadro ou mural de acesso público' },
  { id: 9, label: '9 - Site da administração direta na Internet' },
  { id: 10, label: '10 - Outros' },
];

const TIPOS_BENEFICIO = [
  { id: 1, label: '1 - Participação exclusiva para ME/EPP' },
  { id: 2, label: '2 - Subcontratação para ME/EPP' },
  { id: 3, label: '3 - Cota reservada para ME/EPP' },
  { id: 4, label: '4 - Sem benefício' },
  { id: 5, label: '5 - Não se aplica' },
];

const CRITERIOS_JULGAMENTO = [
  { id: 1, label: '1 - Menor preço' },
  { id: 2, label: '2 - Maior desconto' },
  { id: 4, label: '4 - Técnica e preço' },
  { id: 5, label: '5 - Maior lance' },
  { id: 6, label: '6 - Maior retorno econômico' },
  { id: 7, label: '7 - Não se aplica' },
  { id: 8, label: '8 - Melhor técnica' },
  { id: 9, label: '9 - Conteúdo artístico' },
  { id: 1000, label: '1000 - Melhor destinação de bens alienados' },
  { id: 1001, label: '1001 - Maior oferta de preço' },
];

const CATEGORIAS_ITEM = [
  { id: 3, label: '3 - Não se aplica' },
  { id: 1, label: '1 - Bens Imóveis (Leilão)' },
  { id: 2, label: '2 - Bens Móveis (Leilão)' },
];

function criarItemCompraPadrao(numeroItem: number, modalidadeId?: number): ItemCompra {
  const isLeilao = modalidadeId === 1 || modalidadeId === 13;
  return {
    numeroItem,
    materialOuServico: 'M',
    tipoBeneficioId: 4,
    incentivoProdutivoBasico: false,
    descricao: '',
    quantidade: 1,
    unidadeMedida: 'UN',
    orcamentoSigiloso: false,
    valorUnitarioEstimado: 0,
    valorTotal: 0,
    criterioJulgamentoId: isLeilao ? 5 : 1,
    itemCategoriaId: isLeilao ? 2 : 3,
  };
}

export const ImportacaoExportacaoToolbar: React.FC<ImportacaoExportacaoToolbarProps> = ({
  modulo,
  tituloModulo,
  onImportSuccess,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transmitirAposImportar, setTransmitirAposImportar] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Estado específico para Editais (anexar PDF + adicionar/editar itens pelo modal)
  const [previewEditais, setPreviewEditais] = useState<EditalPreviewItem[] | null>(null);
  const [mapaPdfs, setMapaPdfs] = useState<Record<string, File>>({});
  const [expandedEditalCodigo, setExpandedEditalCodigo] = useState<string | null>(null);
  const [activeTabEdital, setActiveTabEdital] = useState<Record<string, 'itens' | 'config' | 'publicacoes'>>({});

  // Estado de Log final da importação
  const [logResultado, setLogResultado] = useState<ImportacaoLoteResponse | null>(null);

  const resetModal = () => {
    setSelectedFile(null);
    setTransmitirAposImportar(false);
    setPreviewEditais(null);
    setMapaPdfs({});
    setExpandedEditalCodigo(null);
    setActiveTabEdital({});
    setLogResultado(null);
    setProcessing(false);
  };

  const handleOpenModal = () => {
    resetModal();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (logResultado) {
      onImportSuccess();
    }
    setShowModal(false);
  };

  const handleBaixarModelo = async () => {
    try {
      setDownloading(true);
      await importacaoExportacaoService.baixarModelo(modulo);
      toast.success(`Planilha modelo de ${tituloModulo} baixada!`);
    } catch {
      toast.error('Erro ao baixar planilha de modelo.');
    } finally {
      setDownloading(false);
    }
  };

  const handleExportarDados = async () => {
    try {
      setDownloading(true);
      await importacaoExportacaoService.exportarPlanilha(modulo);
      toast.success(`Dados de ${tituloModulo} exportados para Excel!`);
    } catch {
      toast.error('Erro ao exportar planilha.');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setLogResultado(null);

    if (file && modulo === 'editais') {
      try {
        setProcessing(true);
        const res = await importacaoExportacaoService.preVisualizarEditais(file);
        // Garante que nenhum item de exemplo venha pré-carregado no modal
        const editaisLimpos = (res.editais || []).map((ed) => {
          const itens = Array.isArray(ed.documento?.itensCompra)
            ? ed.documento.itensCompra.filter(
                (it: ItemCompra) =>
                  !it.descricao?.toLowerCase().includes('papel sulfite') &&
                  !it.descricao?.toLowerCase().includes('exemplo')
              )
            : [];
          const pubs = Array.isArray(ed.documento?.publicidade?.publicacoes)
            ? ed.documento.publicidade.publicacoes.filter(
                (p: Publicacao) => !String(p.idContratacaoPNCP || '').includes('EXEMPLO')
              )
            : [];
          return {
            ...ed,
            qtd_itens: itens.length,
            qtd_publicacoes: pubs.length,
            documento: {
              ...ed.documento,
              itensCompra: itens,
              publicidade: {
                ...ed.documento?.publicidade,
                publicacoes: pubs,
              },
            },
          };
        });
        setPreviewEditais(editaisLimpos);
        setMapaPdfs({});
        setExpandedEditalCodigo(null);
        setActiveTabEdital({});
        toast.success(
          `${res.total} edital(is) lido(s). Você pode anexar o PDF, gerenciar itens e instrumentos convocatórios/publicações abaixo.`
        );
      } catch (err: any) {
        const msg = err.response?.data?.detail || 'Erro ao ler planilha de editais.';
        toast.error(msg);
        setSelectedFile(null);
        setPreviewEditais(null);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleSelecionarPdfEdital = (codigoEdital: string, file: File | null) => {
    setMapaPdfs((prev) => {
      const next = { ...prev };
      if (file) {
        next[codigoEdital] = file;
      } else {
        delete next[codigoEdital];
      }
      return next;
    });
  };

  const toggleExpandItensEdital = (codigoEdital: string) => {
    setExpandedEditalCodigo((prev) => (prev === codigoEdital ? null : codigoEdital));
  };

  const atualizarItensDoEdital = (codigoEdital: string, novosItens: ItemCompra[]) => {
    setPreviewEditais((prev) => {
      if (!prev) return prev;
      return prev.map((ed) => {
        if (ed.codigo_edital !== codigoEdital) return ed;
        return {
          ...ed,
          qtd_itens: novosItens.length,
          documento: {
            ...ed.documento,
            itensCompra: novosItens,
          },
        };
      });
    });
  };

  const handleAdicionarItemNoModal = (ed: EditalPreviewItem) => {
    const itensAtuais: ItemCompra[] = Array.isArray(ed.documento?.itensCompra)
      ? ed.documento.itensCompra
      : [];
    const proximoNumero =
      itensAtuais.length > 0
        ? Math.max(...itensAtuais.map((i) => Number(i.numeroItem) || 0)) + 1
        : 1;
    const novoItem = criarItemCompraPadrao(proximoNumero, ed.modalidade_id);
    atualizarItensDoEdital(ed.codigo_edital, [...itensAtuais, novoItem]);
  };

  const handleRemoverItemNoModal = (ed: EditalPreviewItem, index: number) => {
    const itensAtuais: ItemCompra[] = Array.isArray(ed.documento?.itensCompra)
      ? [...ed.documento.itensCompra]
      : [];
    itensAtuais.splice(index, 1);
    atualizarItensDoEdital(ed.codigo_edital, itensAtuais);
  };

  const handleAlterarCampoItemNoModal = (
    ed: EditalPreviewItem,
    index: number,
    campo: keyof ItemCompra,
    valor: any
  ) => {
    const itensAtuais: ItemCompra[] = Array.isArray(ed.documento?.itensCompra)
      ? [...ed.documento.itensCompra]
      : [];
    const itemAtual = { ...itensAtuais[index], [campo]: valor };

    if (campo === 'quantidade' || campo === 'valorUnitarioEstimado') {
      const qtd = Number(campo === 'quantidade' ? valor : itemAtual.quantidade) || 0;
      const unit =
        Number(campo === 'valorUnitarioEstimado' ? valor : itemAtual.valorUnitarioEstimado) || 0;
      itemAtual.valorTotal = Number((qtd * unit).toFixed(4));
    }

    itensAtuais[index] = itemAtual;
    atualizarItensDoEdital(ed.codigo_edital, itensAtuais);
  };

  const atualizarPublicacoesDoEdital = (codigoEdital: string, novasPubs: Publicacao[]) => {
    setPreviewEditais((prev) => {
      if (!prev) return prev;
      return prev.map((ed) => {
        if (ed.codigo_edital !== codigoEdital) return ed;
        return {
          ...ed,
          qtd_publicacoes: novasPubs.length,
          documento: {
            ...ed.documento,
            publicidade: {
              ...ed.documento?.publicidade,
              houvePublicacao: novasPubs.length > 0,
              publicacoes: novasPubs,
            },
          },
        };
      });
    });
  };

  const handleAdicionarPublicacaoNoModal = (ed: EditalPreviewItem) => {
    const pubsAtuais: Publicacao[] = Array.isArray(ed.documento?.publicidade?.publicacoes)
      ? ed.documento.publicidade.publicacoes
      : [];
    const novaPub: Publicacao = {
      veiculoPublicacao: 1,
      dataPublicacao: new Date().toISOString().split('T')[0],
      idContratacaoPNCP: '',
      veiculoPublicacaoNome: '',
    };
    atualizarPublicacoesDoEdital(ed.codigo_edital, [...pubsAtuais, novaPub]);
  };

  const handleRemoverPublicacaoNoModal = (ed: EditalPreviewItem, index: number) => {
    const pubsAtuais: Publicacao[] = Array.isArray(ed.documento?.publicidade?.publicacoes)
      ? [...ed.documento.publicidade.publicacoes]
      : [];
    pubsAtuais.splice(index, 1);
    atualizarPublicacoesDoEdital(ed.codigo_edital, pubsAtuais);
  };

  const handleAlterarCampoPublicacaoNoModal = (
    ed: EditalPreviewItem,
    index: number,
    campo: keyof Publicacao,
    valor: any
  ) => {
    const pubsAtuais: Publicacao[] = Array.isArray(ed.documento?.publicidade?.publicacoes)
      ? [...ed.documento.publicidade.publicacoes]
      : [];
    pubsAtuais[index] = { ...pubsAtuais[index], [campo]: valor };
    atualizarPublicacoesDoEdital(ed.codigo_edital, pubsAtuais);
  };

  const handleAlterarConfigEdital = (
    codigoEdital: string,
    campo: 'tipoInstrumentoConvocatorioId' | 'modalidadeId' | 'modoDisputaId',
    valor: number
  ) => {
    setPreviewEditais((prev) => {
      if (!prev) return prev;
      return prev.map((ed) => {
        if (ed.codigo_edital !== codigoEdital) return ed;
        const novoDoc = { ...ed.documento, [campo]: valor };
        return {
          ...ed,
          modalidade_id: campo === 'modalidadeId' ? valor : ed.modalidade_id,
          exige_pdf: campo === 'modalidadeId' ? valor !== 9 : ed.exige_pdf,
          documento: novoDoc,
        };
      });
    });
  };

  const handleExecutarImportacao = async () => {
    if (modulo === 'editais') {
      if (!previewEditais || previewEditais.length === 0) {
        toast.error('Selecione uma planilha válida de editais.');
        return;
      }

      const semItens = previewEditais.filter(
        (ed) => !ed.documento?.itensCompra || ed.documento.itensCompra.length === 0
      );
      if (semItens.length > 0) {
        toast.error(
          `Adicione pelo menos 1 item para o(s) edital(is): ${semItens
            .map((e) => e.codigo_edital)
            .join(', ')}`
        );
        return;
      }

      if (transmitirAposImportar) {
        const faltandoPdf = previewEditais.filter(
          (ed) => ed.exige_pdf && !mapaPdfs[ed.codigo_edital]
        );
        if (faltandoPdf.length > 0) {
          toast.error(
            `Para transmitir imediatamente à AUDESP, anexe o PDF dos editais: ${faltandoPdf
              .map((f) => f.codigo_edital)
              .join(', ')}`
          );
          return;
        }
      }
      try {
        setProcessing(true);
        const res = await importacaoExportacaoService.importarLoteEditais(
          previewEditais,
          mapaPdfs,
          transmitirAposImportar
        );
        setLogResultado(res);
        onImportSuccess();
        if (res.falhas === 0) {
          toast.success(`Todos os ${res.sucessos} edital(is) foram processados com sucesso!`);
        } else {
          toast.error(
            `Processamento concluído com ${res.sucessos} sucesso(s) e ${res.falhas} ocorrência(s). Verifique o log.`
          );
        }
      } catch (err: any) {
        toast.error(err.response?.data?.detail || 'Erro ao importar lote de editais.');
      } finally {
        setProcessing(false);
      }
    } else {
      if (!selectedFile) {
        toast.error('Selecione o arquivo Excel (.xlsx) para importar.');
        return;
      }
      try {
        setProcessing(true);
        const res = await importacaoExportacaoService.importarLoteModulo(
          modulo,
          selectedFile,
          transmitirAposImportar
        );
        setLogResultado(res);
        onImportSuccess();
        if (res.falhas === 0) {
          toast.success(`Todos os ${res.sucessos} registro(s) foram processados com sucesso!`);
        } else {
          toast.error(
            `Processamento concluído com ${res.sucessos} sucesso(s) e ${res.falhas} ocorrência(s). Verifique o log.`
          );
        }
      } catch (err: any) {
        toast.error(err.response?.data?.detail || 'Erro ao importar planilha em lote.');
      } finally {
        setProcessing(false);
      }
    }
  };

  return (
    <>
      <ButtonGroup size="sm" className="shadow-sm">
        <Button
          variant="outline-secondary"
          onClick={handleBaixarModelo}
          disabled={downloading}
          className="d-flex align-items-center gap-1 bg-white"
          title={`Baixar planilha modelo (.xlsx) de ${tituloModulo}`}
        >
          <FileSpreadsheet size={15} className="text-success" />
          <span>Planilha Modelo</span>
        </Button>

        <Button
          variant="outline-primary"
          onClick={handleOpenModal}
          className="d-flex align-items-center gap-1 bg-white fw-medium"
          title={`Importar lote de ${tituloModulo} via Excel (.xlsx)`}
        >
          <Upload size={15} />
          <span>Importar Lote</span>
        </Button>

        <Button
          variant="outline-secondary"
          onClick={handleExportarDados}
          disabled={downloading}
          className="d-flex align-items-center gap-1 bg-white"
          title={`Exportar registros de ${tituloModulo} para Excel (.xlsx)`}
        >
          <Download size={15} />
          <span>Exportar Excel</span>
        </Button>
      </ButtonGroup>

      <Modal show={showModal} onHide={handleCloseModal} size="xl" centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
            <FileSpreadsheet size={20} className="text-success" />
            <span>Importação em Lote — {tituloModulo}</span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {!logResultado ? (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-center bg-light p-3 rounded border mb-3">
                <div className="small">
                  <strong>1. Selecione a Planilha (.xlsx):</strong> Utilize a planilha no formato padrão do sistema.
                </div>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={handleBaixarModelo}
                  disabled={downloading}
                  className="d-flex align-items-center gap-1"
                >
                  <Download size={14} /> Baixar Planilha Modelo ({tituloModulo})
                </Button>
              </div>

              <Form.Group className="mb-3">
                <Form.Control
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  disabled={processing}
                />
              </Form.Group>

              {/* Tabela interativa para anexar PDFs e gerenciar Itens individualmente quando o módulo for Editais */}
              {modulo === 'editais' && previewEditais && previewEditais.length > 0 && (
                <div className="mt-3 mb-3">
                  <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
                    <span className="fw-bold small text-dark">
                      2. Confira os Editais ({previewEditais.length}), anexe os PDFs e adicione/edite os Itens se desejar:
                    </span>
                    <div className="d-flex gap-2">
                      <Badge bg="info" text="dark">
                        PDFs anexados: {Object.keys(mapaPdfs).length} de {previewEditais.length}
                      </Badge>
                    </div>
                  </div>

                  <div style={{ maxHeight: '460px', overflowY: 'auto' }} className="border rounded">
                    <Table responsive hover size="sm" className="align-middle small mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Linha</th>
                          <th>Código do Edital / PNCP</th>
                          <th>Compra / Processo</th>
                          <th>Objeto</th>
                          <th>Itens / Pubs</th>
                          <th style={{ minWidth: '250px' }}>Arquivo PDF do Edital</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewEditais.map((ed) => {
                          const pdfAnexado = mapaPdfs[ed.codigo_edital];
                          const isExpanded = expandedEditalCodigo === ed.codigo_edital;
                          const itensCompra: ItemCompra[] = Array.isArray(ed.documento?.itensCompra)
                            ? ed.documento.itensCompra
                            : [];
                          const isLeilao = ed.modalidade_id === 1 || ed.modalidade_id === 13;

                          return (
                            <React.Fragment key={ed.codigo_edital}>
                              <tr>
                                <td>{ed.linha}</td>
                                <td className="font-monospace fw-bold">{ed.codigo_edital}</td>
                                <td>
                                  {ed.numero_compra}/{ed.ano_compra}
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    Proc: {ed.numero_processo}
                                  </div>
                                </td>
                                <td>
                                  <div
                                    className="text-truncate"
                                    style={{ maxWidth: '210px' }}
                                    title={ed.objeto_compra}
                                  >
                                    {ed.objeto_compra}
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-1 flex-wrap">
                                    <Button
                                      variant={itensCompra.length === 0 ? 'outline-danger' : isExpanded ? 'primary' : 'outline-primary'}
                                      size="sm"
                                      onClick={() => toggleExpandItensEdital(ed.codigo_edital)}
                                      className="py-0 px-2 d-inline-flex align-items-center gap-1"
                                      style={{ fontSize: '0.75rem' }}
                                      title="Clique para adicionar ou editar itens deste edital"
                                    >
                                      <ListChecks size={13} />
                                      <span>{itensCompra.length} item(ns)</span>
                                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </Button>
                                    <Badge bg="light" text="dark" className="border">
                                      {ed.qtd_publicacoes} pub(s)
                                    </Badge>
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <Form.Control
                                      type="file"
                                      size="sm"
                                      accept=".pdf"
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        handleSelecionarPdfEdital(
                                          ed.codigo_edital,
                                          e.target.files?.[0] || null
                                        )
                                      }
                                    />
                                    {pdfAnexado ? (
                                      <Badge
                                        bg="success"
                                        className="d-inline-flex align-items-center gap-1"
                                      >
                                        <FileText size={12} /> OK
                                      </Badge>
                                    ) : ed.exige_pdf ? (
                                      <Badge bg="warning" text="dark">
                                        Pendente
                                      </Badge>
                                    ) : (
                                      <Badge bg="secondary">Opcional</Badge>
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {/* Painel expansível para gerenciar Itens, Modalidade/Instrumento e Publicações do Edital */}
                              {isExpanded && (
                                <tr className="bg-light">
                                  <td colSpan={6} className="p-3">
                                    <div className="bg-white border rounded p-3 shadow-sm">
                                      {/* Navegação entre as seções de Itens, Configurações e Publicações */}
                                      <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-2 mb-3 gap-2">
                                        <Nav
                                          variant="pills"
                                          className="small"
                                          activeKey={activeTabEdital[ed.codigo_edital] || 'itens'}
                                          onSelect={(k) =>
                                            setActiveTabEdital((prev) => ({
                                              ...prev,
                                              [ed.codigo_edital]: (k as any) || 'itens',
                                            }))
                                          }
                                        >
                                          <Nav.Item>
                                            <Nav.Link eventKey="itens" className="py-1 px-3 d-flex align-items-center gap-1">
                                              <ListChecks size={14} />
                                              <span>Itens da Compra ({itensCompra.length})</span>
                                            </Nav.Link>
                                          </Nav.Item>
                                          <Nav.Item>
                                            <Nav.Link eventKey="config" className="py-1 px-3 d-flex align-items-center gap-1">
                                              <Settings size={14} />
                                              <span>Instrumento / Modalidade</span>
                                            </Nav.Link>
                                          </Nav.Item>
                                          <Nav.Item>
                                            <Nav.Link eventKey="publicacoes" className="py-1 px-3 d-flex align-items-center gap-1">
                                              <Megaphone size={14} />
                                              <span>Publicações ({Array.isArray(ed.documento?.publicidade?.publicacoes) ? ed.documento.publicidade.publicacoes.length : 0})</span>
                                            </Nav.Link>
                                          </Nav.Item>
                                        </Nav>

                                        <div className="text-muted small font-monospace">
                                          Edital: <strong>{ed.codigo_edital}</strong>
                                        </div>
                                      </div>

                                      {/* ABA 1: ITENS DA COMPRA */}
                                      {(activeTabEdital[ed.codigo_edital] || 'itens') === 'itens' && (
                                        <div>
                                          <div className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="small text-muted">
                                              Adicione ou personalize os itens que serão contratados neste edital.
                                            </div>
                                            <Button
                                              variant="success"
                                              size="sm"
                                              onClick={() => handleAdicionarItemNoModal(ed)}
                                              className="d-flex align-items-center gap-1 py-1 px-2"
                                            >
                                              <Plus size={14} /> Adicionar Item
                                            </Button>
                                          </div>

                                          {itensCompra.length === 0 ? (
                                            <div className="text-center py-3 text-muted border rounded bg-light">
                                              Nenhum item informado para este edital. Clique em{' '}
                                              <strong>&ldquo;Adicionar Item&rdquo;</strong> acima para incluir.
                                            </div>
                                          ) : (
                                            <div className="d-flex flex-column gap-2">
                                              {itensCompra.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  className="border rounded p-2 bg-light"
                                                >
                                                  <Row className="g-2 align-items-end">
                                                    <Col md={1}>
                                                      <Form.Label className="mb-1 small fw-semibold">
                                                        Nº Item
                                                      </Form.Label>
                                                      <Form.Control
                                                        size="sm"
                                                        type="number"
                                                        min={1}
                                                        value={item.numeroItem}
                                                        onChange={(e) =>
                                                          handleAlterarCampoItemNoModal(
                                                            ed,
                                                            idx,
                                                            'numeroItem',
                                                            Number(e.target.value) || 1
                                                          )
                                                        }
                                                      />
                                                    </Col>

                                                    <Col md={4}>
                                                      <Form.Label className="mb-1 small fw-semibold">
                                                        Descrição do Item *
                                                      </Form.Label>
                                                      <Form.Control
                                                        size="sm"
                                                        type="text"
                                                        placeholder="Descrição detalhada do item"
                                                        value={item.descricao}
                                                        onChange={(e) =>
                                                          handleAlterarCampoItemNoModal(
                                                            ed,
                                                            idx,
                                                            'descricao',
                                                            e.target.value
                                                          )
                                                        }
                                                      />
                                                    </Col>

                                                    <Col md={1}>
                                                      <Form.Label className="mb-1 small fw-semibold">
                                                        Tipo
                                                      </Form.Label>
                                                      <Form.Select
                                                        size="sm"
                                                        value={item.materialOuServico}
                                                        onChange={(e) =>
                                                          handleAlterarCampoItemNoModal(
                                                            ed,
                                                            idx,
                                                            'materialOuServico',
                                                            e.target.value as 'M' | 'S'
                                                          )
                                                        }
                                                      >
                                                        <option value="M">M - Mat.</option>
                                                        <option value="S">S - Serv.</option>
                                                      </Form.Select>
                                                    </Col>

                                                    <Col md={1}>
                                                      <Form.Label className="mb-1 small fw-semibold">
                                                        Unid.
                                                      </Form.Label>
                                                      <Form.Control
                                                        size="sm"
                                                        type="text"
                                                        placeholder="UN"
                                                        value={item.unidadeMedida}
                                                        onChange={(e) =>
                                                          handleAlterarCampoItemNoModal(
                                                            ed,
                                                            idx,
                                                            'unidadeMedida',
                                                            e.target.value.toUpperCase()
                                                          )
                                                        }
                                                      />
                                                    </Col>

                                                    <Col md={1}>
                                                      <Form.Label className="mb-1 small fw-semibold">
                                                        Qtd.
                                                      </Form.Label>
                                                      <Form.Control
                                                        size="sm"
                                                        type="number"
                                                        step="0.0001"
                                                        min={0.0001}
                                                        value={item.quantidade}
                                                        onChange={(e) =>
                                                          handleAlterarCampoItemNoModal(
                                                            ed,
                                                            idx,
                                                            'quantidade',
                                                            parseFloat(e.target.value) || 0
                                                          )
                                                        }
                                                      />
                                                    </Col>

                                                    <Col md={2}>
                                                      <Form.Label className="mb-1 small fw-semibold">
                                                        Vl. Unitário (R$)
                                                      </Form.Label>
                                                      <Form.Control
                                                        size="sm"
                                                        type="number"
                                                        step="0.0001"
                                                        min={0}
                                                        value={item.valorUnitarioEstimado}
                                                        onChange={(e) =>
                                                          handleAlterarCampoItemNoModal(
                                                            ed,
                                                            idx,
                                                            'valorUnitarioEstimado',
                                                            parseFloat(e.target.value) || 0
                                                          )
                                                        }
                                                      />
                                                    </Col>

                                                    <Col md={2}>
                                                      <div className="d-flex align-items-end gap-1">
                                                        <div className="flex-grow-1">
                                                          <Form.Label className="mb-1 small fw-semibold">
                                                            Vl. Total (R$)
                                                          </Form.Label>
                                                          <Form.Control
                                                            size="sm"
                                                            type="number"
                                                            step="0.0001"
                                                            min={0}
                                                            value={item.valorTotal}
                                                            onChange={(e) =>
                                                              handleAlterarCampoItemNoModal(
                                                                ed,
                                                                idx,
                                                                'valorTotal',
                                                                parseFloat(e.target.value) || 0
                                                              )
                                                            }
                                                          />
                                                        </div>
                                                        <Button
                                                          variant="outline-danger"
                                                          size="sm"
                                                          onClick={() =>
                                                            handleRemoverItemNoModal(ed, idx)
                                                          }
                                                          title="Remover este item"
                                                        >
                                                          <Trash2 size={14} />
                                                        </Button>
                                                      </div>
                                                    </Col>
                                                  </Row>

                                                  <Row className="g-2 mt-1 align-items-center">
                                                    <Col md={4}>
                                                      <Form.Select
                                                        size="sm"
                                                        value={item.tipoBeneficioId}
                                                        onChange={(e) =>
                                                          handleAlterarCampoItemNoModal(
                                                            ed,
                                                            idx,
                                                            'tipoBeneficioId',
                                                            Number(e.target.value)
                                                          )
                                                        }
                                                        title="Tipo de Benefício ME/EPP"
                                                      >
                                                        {TIPOS_BENEFICIO.map((tb) => (
                                                          <option key={tb.id} value={tb.id}>
                                                            Benefício: {tb.label}
                                                          </option>
                                                        ))}
                                                      </Form.Select>
                                                    </Col>

                                                    <Col md={4}>
                                                      <Form.Select
                                                        size="sm"
                                                        value={item.criterioJulgamentoId}
                                                        onChange={(e) =>
                                                          handleAlterarCampoItemNoModal(
                                                            ed,
                                                            idx,
                                                            'criterioJulgamentoId',
                                                            Number(e.target.value)
                                                          )
                                                        }
                                                        title="Critério de Julgamento"
                                                      >
                                                        {CRITERIOS_JULGAMENTO.map((cj) => (
                                                          <option key={cj.id} value={cj.id}>
                                                            Critério: {cj.label}
                                                          </option>
                                                        ))}
                                                      </Form.Select>
                                                    </Col>

                                                    {isLeilao && (
                                                      <Col md={2}>
                                                        <Form.Select
                                                          size="sm"
                                                          value={item.itemCategoriaId}
                                                          onChange={(e) =>
                                                            handleAlterarCampoItemNoModal(
                                                              ed,
                                                              idx,
                                                              'itemCategoriaId',
                                                              Number(e.target.value)
                                                            )
                                                          }
                                                        >
                                                          {CATEGORIAS_ITEM.map((cat) => (
                                                            <option key={cat.id} value={cat.id}>
                                                              {cat.label}
                                                            </option>
                                                          ))}
                                                        </Form.Select>
                                                      </Col>
                                                    )}

                                                    <Col md={isLeilao ? 2 : 4} className="d-flex gap-3">
                                                      <Form.Check
                                                        type="checkbox"
                                                        id={`sigiloso_${ed.codigo_edital}_${idx}`}
                                                        label="Orç. Sigiloso"
                                                        checked={Boolean(item.orcamentoSigiloso)}
                                                        onChange={(e) =>
                                                          handleAlterarCampoItemNoModal(
                                                            ed,
                                                            idx,
                                                            'orcamentoSigiloso',
                                                            e.target.checked
                                                          )
                                                        }
                                                      />
                                                      <Form.Check
                                                        type="checkbox"
                                                        id={`incentivo_${ed.codigo_edital}_${idx}`}
                                                        label="Incentivo Prod."
                                                        checked={Boolean(item.incentivoProdutivoBasico)}
                                                        onChange={(e) =>
                                                          handleAlterarCampoItemNoModal(
                                                            ed,
                                                            idx,
                                                            'incentivoProdutivoBasico',
                                                            e.target.checked
                                                          )
                                                        }
                                                      />
                                                    </Col>
                                                  </Row>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* ABA 2: INSTRUMENTO CONVOCATÓRIO E MODALIDADE */}
                                      {activeTabEdital[ed.codigo_edital] === 'config' && (
                                        <div className="bg-light p-3 rounded border">
                                          <div className="fw-semibold text-dark mb-2">
                                            Ajuste dos Parâmetros Convocatórios:
                                          </div>
                                          <Row className="g-3">
                                            <Col md={4}>
                                              <Form.Label className="small fw-semibold">
                                                Instrumento Convocatório *
                                              </Form.Label>
                                              <Form.Select
                                                size="sm"
                                                value={ed.documento?.tipoInstrumentoConvocatorioId || 1}
                                                onChange={(e) =>
                                                  handleAlterarConfigEdital(
                                                    ed.codigo_edital,
                                                    'tipoInstrumentoConvocatorioId',
                                                    Number(e.target.value)
                                                  )
                                                }
                                              >
                                                {INSTRUMENTOS_CONVOCATORIOS.map((inst) => (
                                                  <option key={inst.id} value={inst.id}>
                                                    {inst.label}
                                                  </option>
                                                ))}
                                              </Form.Select>
                                            </Col>

                                            <Col md={4}>
                                              <Form.Label className="small fw-semibold">
                                                Modalidade de Contratação *
                                              </Form.Label>
                                              <Form.Select
                                                size="sm"
                                                value={ed.modalidade_id || ed.documento?.modalidadeId || 6}
                                                onChange={(e) =>
                                                  handleAlterarConfigEdital(
                                                    ed.codigo_edital,
                                                    'modalidadeId',
                                                    Number(e.target.value)
                                                  )
                                                }
                                              >
                                                {MODALIDADES.map((m) => (
                                                  <option key={m.id} value={m.id}>
                                                    {m.label}
                                                  </option>
                                                ))}
                                              </Form.Select>
                                            </Col>

                                            <Col md={4}>
                                              <Form.Label className="small fw-semibold">
                                                Modo de Disputa *
                                              </Form.Label>
                                              <Form.Select
                                                size="sm"
                                                value={ed.documento?.modoDisputaId || 1}
                                                onChange={(e) =>
                                                  handleAlterarConfigEdital(
                                                    ed.codigo_edital,
                                                    'modoDisputaId',
                                                    Number(e.target.value)
                                                  )
                                                }
                                              >
                                                {MODOS_DISPUTA.map((md) => (
                                                  <option key={md.id} value={md.id}>
                                                    {md.label}
                                                  </option>
                                                ))}
                                              </Form.Select>
                                            </Col>
                                          </Row>
                                        </div>
                                      )}

                                      {/* ABA 3: PUBLICAÇÕES DO EDITAL */}
                                      {activeTabEdital[ed.codigo_edital] === 'publicacoes' && (
                                        <div>
                                          <div className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="small text-muted">
                                              Adicione os veículos oficiais de publicação do edital (PNCP, Diário Oficial, etc.):
                                            </div>
                                            <Button
                                              variant="success"
                                              size="sm"
                                              onClick={() => handleAdicionarPublicacaoNoModal(ed)}
                                              className="d-flex align-items-center gap-1 py-1 px-2"
                                            >
                                              <Plus size={14} /> Adicionar Publicação
                                            </Button>
                                          </div>

                                          {(!ed.documento?.publicidade?.publicacoes ||
                                            ed.documento.publicidade.publicacoes.length === 0) ? (
                                            <div className="text-center py-3 text-muted border rounded bg-light">
                                              Nenhuma publicação cadastrada. Se houver exigência de publicação pela AUDESP, clique em{' '}
                                              <strong>&ldquo;Adicionar Publicação&rdquo;</strong>.
                                            </div>
                                          ) : (
                                            <div className="d-flex flex-column gap-2">
                                              {ed.documento.publicidade.publicacoes.map(
                                                (pub: Publicacao, pIdx: number) => (
                                                  <div
                                                    key={pIdx}
                                                    className="border rounded p-2 bg-light"
                                                  >
                                                    <Row className="g-2 align-items-end">
                                                      <Col md={4}>
                                                        <Form.Label className="small fw-semibold mb-1">
                                                          Veículo de Publicação *
                                                        </Form.Label>
                                                        <Form.Select
                                                          size="sm"
                                                          value={pub.veiculoPublicacao}
                                                          onChange={(e) =>
                                                            handleAlterarCampoPublicacaoNoModal(
                                                              ed,
                                                              pIdx,
                                                              'veiculoPublicacao',
                                                              Number(e.target.value)
                                                            )
                                                          }
                                                        >
                                                          {VEICULOS_PUBLICACAO.map((v) => (
                                                            <option key={v.id} value={v.id}>
                                                              {v.label}
                                                            </option>
                                                          ))}
                                                        </Form.Select>
                                                      </Col>

                                                      <Col md={3}>
                                                        <Form.Label className="small fw-semibold mb-1">
                                                          Data de Publicação *
                                                        </Form.Label>
                                                        <Form.Control
                                                          size="sm"
                                                          type="date"
                                                          value={pub.dataPublicacao || ''}
                                                          onChange={(e) =>
                                                            handleAlterarCampoPublicacaoNoModal(
                                                              ed,
                                                              pIdx,
                                                              'dataPublicacao',
                                                              e.target.value
                                                            )
                                                          }
                                                        />
                                                      </Col>

                                                      <Col md={pub.veiculoPublicacao === 10 || pub.veiculoPublicacao === 5 ? 4 : 4}>
                                                        {pub.veiculoPublicacao === 5 ? (
                                                          <>
                                                            <Form.Label className="small fw-semibold mb-1">
                                                              ID PNCP (25 dígitos) *
                                                            </Form.Label>
                                                            <Form.Control
                                                              size="sm"
                                                              type="text"
                                                              placeholder="Ex: 5820001500018310000012026"
                                                              value={pub.idContratacaoPNCP || ''}
                                                              onChange={(e) =>
                                                                handleAlterarCampoPublicacaoNoModal(
                                                                  ed,
                                                                  pIdx,
                                                                  'idContratacaoPNCP',
                                                                  e.target.value
                                                                )
                                                              }
                                                            />
                                                          </>
                                                        ) : pub.veiculoPublicacao === 10 ? (
                                                          <>
                                                            <Form.Label className="small fw-semibold mb-1">
                                                              Nome do Veículo *
                                                            </Form.Label>
                                                            <Form.Control
                                                              size="sm"
                                                              type="text"
                                                              placeholder="Nome do veículo de divulgação"
                                                              value={pub.veiculoPublicacaoNome || ''}
                                                              onChange={(e) =>
                                                                handleAlterarCampoPublicacaoNoModal(
                                                                  ed,
                                                                  pIdx,
                                                                  'veiculoPublicacaoNome',
                                                                  e.target.value
                                                                )
                                                              }
                                                            />
                                                          </>
                                                        ) : (
                                                          <div className="small text-muted py-2">
                                                            Veículo oficial AUDESP Fase IV
                                                          </div>
                                                        )}
                                                      </Col>

                                                      <Col md={1} className="d-flex justify-content-end">
                                                        <Button
                                                          variant="outline-danger"
                                                          size="sm"
                                                          onClick={() =>
                                                            handleRemoverPublicacaoNoModal(ed, pIdx)
                                                          }
                                                          title="Remover publicação"
                                                        >
                                                          <Trash2 size={14} />
                                                        </Button>
                                                      </Col>
                                                    </Row>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="p-3 bg-light rounded border mt-3">
                <Form.Check
                  type="switch"
                  id={`switchTransmitirLote_${modulo}`}
                  label={
                    <span className="fw-bold text-dark">
                      Transmitir automaticamente para a AUDESP após inserir no banco de dados
                    </span>
                  }
                  checked={transmitirAposImportar}
                  onChange={(e) => setTransmitirAposImportar(e.target.checked)}
                  disabled={processing}
                />
                <Form.Text className="text-muted d-block mt-1">
                  {transmitirAposImportar
                    ? 'Os registros serão salvos no banco, transmitidos à AUDESP Fase IV e terão seus protocolos consultados automaticamente.'
                    : 'Os registros serão salvos apenas como Rascunho Local no banco de dados para conferência antes do envio.'}
                </Form.Text>
              </div>
            </>
          ) : (
            /* Relatório / Log Detalhado Pós-Importação */
            <div>
              <div className="d-flex flex-wrap justify-content-between align-items-center p-3 rounded border bg-light mb-3">
                <div className="d-flex align-items-center gap-3">
                  <Badge bg="primary" className="fs-6 px-3 py-2">
                    Total Processado: {logResultado.total}
                  </Badge>
                  <Badge bg="success" className="fs-6 px-3 py-2 d-inline-flex align-items-center gap-1">
                    <CheckCircle2 size={15} /> Sucessos: {logResultado.sucessos}
                  </Badge>
                  <Badge
                    bg={logResultado.falhas > 0 ? 'danger' : 'secondary'}
                    className="fs-6 px-3 py-2 d-inline-flex align-items-center gap-1"
                  >
                    <AlertTriangle size={15} /> Com Erros / Alertas: {logResultado.falhas}
                  </Badge>
                </div>
                <Button variant="outline-secondary" size="sm" onClick={resetModal}>
                  Nova Importação
                </Button>
              </div>

              <div style={{ maxHeight: '420px', overflowY: 'auto' }} className="border rounded">
                <Table responsive hover size="sm" className="align-middle small mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Linha</th>
                      <th>Código Documento</th>
                      <th>Descrição</th>
                      <th>Banco Local</th>
                      <th>Envio AUDESP / Protocolo</th>
                      <th>Log de Erros / Ocorrências</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logResultado.resultados.map((r, idx) => (
                      <tr key={idx}>
                        <td>{r.linha}</td>
                        <td className="font-monospace fw-bold">{r.codigo_documento}</td>
                        <td>{r.descricao}</td>
                        <td>
                          {r.salvo_bd ? (
                            <Badge bg="success" className="d-inline-flex align-items-center gap-1">
                              <CheckCircle2 size={12} /> Salvo (#{r.registro_id})
                            </Badge>
                          ) : (
                            <Badge bg="danger" className="d-inline-flex align-items-center gap-1">
                              <XCircle size={12} /> Não Salvo
                            </Badge>
                          )}
                        </td>
                        <td>
                          {r.transmitido ? (
                            <div>
                              <Badge
                                bg={
                                  (r.status_protocolo || '').toLowerCase().includes('rejeitado')
                                    ? 'danger'
                                    : (r.status_protocolo || '').toLowerCase().includes('armazenado')
                                    ? 'success'
                                    : 'primary'
                                }
                              >
                                {r.status_protocolo || 'Recebido'}
                              </Badge>
                              {r.protocolo && (
                                <div
                                  className="font-monospace text-muted mt-1"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  Prot: {r.protocolo}
                                </div>
                              )}
                            </div>
                          ) : transmitirAposImportar ? (
                            <Badge bg="danger">Não Transmitido</Badge>
                          ) : (
                            <Badge bg="secondary">Apenas Rascunho</Badge>
                          )}
                        </td>
                        <td style={{ minWidth: '280px' }}>
                          {r.erros && r.erros.length > 0 ? (
                            <ul className="mb-0 ps-3 text-danger">
                              {r.erros.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-success d-inline-flex align-items-center gap-1">
                              <CheckCircle2 size={13} /> Processado sem erros
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          {!logResultado ? (
            <>
              <Button variant="secondary" size="sm" onClick={handleCloseModal} disabled={processing}>
                Cancelar
              </Button>
              <Button
                variant={transmitirAposImportar ? 'warning' : 'success'}
                size="sm"
                onClick={handleExecutarImportacao}
                disabled={processing || !selectedFile || (modulo === 'editais' && !previewEditais)}
                className="fw-bold d-flex align-items-center gap-2"
              >
                {processing ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    <span>Processando Lote...</span>
                  </>
                ) : transmitirAposImportar ? (
                  <>
                    <Send size={15} />
                    <span>Importar e Transmitir à AUDESP</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Importar como Rascunhos no Banco</span>
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={handleCloseModal}>
              Concluir e Fechar
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};
