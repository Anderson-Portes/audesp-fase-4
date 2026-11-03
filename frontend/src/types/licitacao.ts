import type { MunicipioAudesp, EntidadeAudesp } from './audesp';

export interface Licitante {
  tipoPessoaId: 'PJ' | 'PF' | 'PE';
  niPessoa: string; // CNPJ, CPF or foreign ID
  nomeRazaoSocial?: string; // required if PE
  declaracaoMEouEPP: number; // 1-Sim ME, 2-Sim EPP, 3-Não
  valor?: number; // valor da proposta
  resultadoHabilitacao: number; // 1-Classificado Vencedor, 2-Classificado, 3-Habilitado, 4-Desclassificado, 5-Desistiu, 6-Não analisada, 7-Inabilitado
}

export interface ItemLicitacao {
  numeroItem: number;
  tipoOrcamento: number; // 0-Não, 1-Global, 2-Unitário, 3-Desconto
  valor?: number;
  dataOrcamento?: string; // YYYY-MM-DD
  situacaoCompraItemId: number; // 1-Em Andamento, 2-Homologado, 3-Anulado/Revogado, 4-Deserto, 5-Fracassado
  dataSituacaoItem: string; // YYYY-MM-DD
  tipoValor: 'M' | 'P'; // M-Monetário, P-Percentual
  tipoProposta: number; // 1-Global, 2-Unitário, 3-Desconto
  licitantes: Licitante[];
}

export interface IndiceEconomico {
  tipoIndice: number;
  nomeIndice?: string;
  valorIndice: number;
}

export interface CondutorCPF {
  cpfCondutor: string;
}

export interface LicitacaoJSON {
  descritor: {
    municipio: number;
    entidade: number;
    codigoEdital: string;
    retificacao: boolean;
  };
  recursoBID: number; // 1, 2, 3
  aberturaPreQualificacaoBID?: number;
  editalPreQualificacaoBID?: number;
  julgamentoPreQualificacaoBID?: number;
  edital2FaseBID?: number;
  julgamentoPropostasBID?: number;
  julgamentoNegociacaoBID?: number;
  tipoNatureza: number;
  viabilidadeContratacao?: number;
  interposicaoRecurso: number;
  audienciaPublica?: number;
  exigenciaGarantiaLicitantes: number;
  percentualValor?: number;
  exigenciaAmostra?: number;
  quitacaoTributosFederais?: boolean;
  quitacaoTributosEstaduais?: boolean;
  quitacaoTributosMunicipais?: boolean;
  exigenciaVisitaTecnica?: number;
  exigenciaCurriculo?: boolean;
  exigenciaVistoCREA?: boolean;
  declaracaoRecursosContratacao?: boolean;
  fonteRecursosContratacao?: number[];
  contratacaoConduzida: boolean;
  cpfsCondutores?: CondutorCPF[];
  exigenciaIndicesEconomicos?: number;
  indicesEconomicos?: IndiceEconomico[];
  itens: ItemLicitacao[];
}

export interface LicitacaoDependentes {
  atas: number;
  ajustes: number;
}

export interface FornecedorVencedorLicitacao {
  niFornecedor: string;
  tipoPessoaFornecedor: 'PJ' | 'PF' | 'PE';
  nomeRazaoSocial?: string | null;
  itensVencidos: number[];
  valorSugerido?: number | null;
}

export interface ReferenciaEditalResponse {
  edital_id: number;
  situacao_licitacao: 'inexistente' | 'rascunho' | 'enviada';
  licitacao_enviada_id?: number | null;
  numeros_itens_licitacao: number[];
  itens_homologados: number[];
  fornecedores_vencedores: FornecedorVencedorLicitacao[];
}

export interface Licitacao {
  id: number;
  edital_id?: number;
  municipio: number;
  entidade: number;
  codigo_edital: string;
  retificacao: boolean;
  status: 'draft' | 'sent' | 'error';
  protocolo?: string;
  status_protocolo?: string;
  detalhes_protocolo?: string;
  parsed_detalhes_protocolo?: any;
  recurso_bid: number;
  tipo_natureza: number;
  numero_compra?: string;
  ano_compra?: number;
  numero_processo?: string;
  objeto_edital?: string;
  documento_json: string;
  parsed_documento?: LicitacaoJSON;
  dependentes?: LicitacaoDependentes;
  created_at: string;
  updated_at: string;
}

export interface DominiosLicitacaoResponse {
  triState: Record<number, string>;
  tiposNatureza: Record<number, string>;
  exigenciasAmostra: Record<number, string>;
  exigenciasVisita: Record<number, string>;
  fontesRecurso: Record<number, string>;
  indicesEconomicos: Record<number, string>;
  tiposOrcamento: Record<number, string>;
  situacoesCompraItem: Record<number, string>;
  tiposProposta: Record<number, string>;
  tiposPessoa: Record<string, string>;
  declaracoesMeEpp: Record<number, string>;
  resultadosHabilitacao: Record<number, string>;
  municipios?: MunicipioAudesp[];
  entidades?: EntidadeAudesp[];
}
