import type { MunicipioAudesp, EntidadeAudesp } from './audesp';

export type { MunicipioAudesp, EntidadeAudesp };

export interface EditalDescritor {
  municipio: number;
  entidade: number;
  codigoEdital: string;
  dataDocumento: string; // YYYY-MM-DD
  retificacao: boolean;
}

export interface Publicacao {
  dataPublicacao: string; // YYYY-MM-DD
  veiculoPublicacao: number; // 1..10
  idContratacaoPNCP?: string; // 25 digits if veiculo == 5
  veiculoPublicacaoNome?: string; // string if veiculo == 10
}

export interface ItemCompra {
  numeroItem: number;
  materialOuServico: 'M' | 'S';
  tipoBeneficioId: number;
  incentivoProdutivoBasico: boolean;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  orcamentoSigiloso: boolean;
  valorUnitarioEstimado: number;
  valorTotal: number;
  criterioJulgamentoId: number;
  itemCategoriaId: number; // 1: Bens Imóveis, 2: Bens Móveis, 3: Não se aplica
  patrimonio?: string;
  codigoRegistroImobiliario?: string;
}

export interface EditalJSON {
  descritor: EditalDescritor;
  publicidade: {
    houvePublicacao: boolean;
    publicacoes?: Publicacao[];
  };
  codigoUnidadeCompradora?: string;
  tipoInstrumentoConvocatorioId: number;
  modalidadeId: number;
  modoDisputaId: number;
  numeroCompra: string;
  anoCompra: number;
  numeroProcesso: string;
  objetoCompra: string;
  informacaoComplementar?: string;
  srp: boolean;
  dataAberturaProposta?: string; // YYYY-MM-DDTHH:MM:SS
  dataEncerramentoProposta?: string; // YYYY-MM-DDTHH:MM:SS
  amparoLegalId: number;
  linkSistemaOrigem?: string;
  justificativaPresencial?: string;
  itensCompra: ItemCompra[];
}

export interface EditalDependentes {
  licitacoes: number;
  atas: number;
  ajustes: number;
}

export interface Edital {
  id: number;
  municipio: number;
  entidade: number;
  codigo_edital: string;
  sem_pncp: boolean;
  retificacao: boolean;
  status: 'draft' | 'sent' | 'error';
  protocolo?: string;
  status_protocolo?: string;
  detalhes_protocolo?: string;
  parsed_detalhes_protocolo?: any;
  numero_compra?: string;
  ano_compra?: number;
  numero_processo?: string;
  objeto_compra?: string;
  modalidade_id?: number;
  modo_disputa_id?: number;
  tipo_instrumento_id?: number;
  pdf_path?: string;
  pdf_nome_original?: string;
  documento_json: string;
  parsed_documento?: EditalJSON;
  dependentes?: EditalDependentes;
  created_at: string;
  updated_at: string;
}

export interface AmparoLegal {
  id: number;
  label: string;
  artigo: string;
  detalhe: string;
}

export interface DominiosResponse {
  instrumentos: Record<number, string>;
  modalidades: Record<number, string>;
  regrasModalidadePorInstrumento: Record<number, number[]>;
  modosDisputa: Record<number, string>;
  veiculosPublicacao: Record<number, string>;
  tiposBeneficio: Record<number, string>;
  criteriosJulgamento: Record<number, string>;
  categoriasItem: Record<number, string>;
  categoriasItemLeilao?: Record<number, string>;
  amparosLegais: AmparoLegal[];
  municipios?: MunicipioAudesp[];
  entidades?: EntidadeAudesp[];
}
