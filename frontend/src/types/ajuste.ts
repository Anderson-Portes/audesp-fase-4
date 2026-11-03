import type { MunicipioAudesp, EntidadeAudesp } from './audesp';

export interface AjusteDescritor {
  municipio: number;
  entidade: number;
  adesaoParticipacao: boolean;
  gerenciadoraJurisdicionada?: boolean;
  cnpjGerenciadora?: string;
  municipioGerenciador?: number;
  entidadeGerenciadora?: number;
  codigoEdital: string;
  codigoAta?: string;
  codigoContrato: string;
  retificacao: boolean;
}

export interface AjusteJSON {
  descritor: AjusteDescritor;
  fonteRecursosContratacao: number[];
  itens: number[];
  tipoContratoId: number;
  numeroContratoEmpenho: string;
  anoContrato: number;
  processo: string;
  categoriaProcessoId: number;
  receita: boolean;
  despesas?: string[];
  codigoUnidade?: string;
  niFornecedor: string;
  tipoPessoaFornecedor: 'PJ' | 'PF' | 'PE';
  nomeRazaoSocialFornecedor: string;
  niFornecedorSubContratado?: string;
  tipoPessoaFornecedorSubContratado?: 'PJ' | 'PF' | 'PE';
  nomeRazaoSocialFornecedorSubContratado?: string;
  objetoContrato: string;
  informacaoComplementar?: string;
  valorInicial: number;
  numeroParcelas?: number;
  valorParcela?: number;
  valorGlobal?: number;
  valorAcumulado?: number;
  dataAssinatura: string; // YYYY-MM-DD
  dataVigenciaInicio?: string; // YYYY-MM-DD
  dataVigenciaFim?: string; // YYYY-MM-DD
  vigenciaMeses?: number;
  tipoObjetoContrato: number;
}

export interface AjusteContrato {
  id: number;
  edital_id?: number;
  licitacao_id?: number;
  ata_id?: number;
  municipio: number;
  entidade: number;
  codigo_edital: string;
  codigo_ata?: string;
  codigo_contrato: string;
  retificacao: boolean;
  numero_contrato_empenho: string;
  ano_contrato: number;
  tipo_contrato_id: number;
  processo: string;
  categoria_processo_id: number;
  tipo_objeto_contrato: number;
  receita: boolean;
  ni_fornecedor: string;
  tipo_pessoa_fornecedor: string;
  nome_razao_social_fornecedor: string;
  valor_inicial: number;
  valor_global: number;
  data_assinatura: string;
  data_vigencia_inicio?: string;
  data_vigencia_fim?: string;
  status: 'draft' | 'sent' | 'error';
  protocolo?: string;
  status_protocolo?: string;
  detalhes_protocolo?: string;
  documento_json: string;
  created_at: string;
  updated_at: string;
}

export interface DominiosAjusteResponse {
  tiposContrato: Record<string, string>;
  categoriasProcesso: Record<string, string>;
  tiposObjetoContrato: Record<string, string>;
  objetosPorCategoria?: Record<number, number[]>;
  fontesRecurso?: Record<number, string>;
  municipios?: MunicipioAudesp[];
  entidades?: EntidadeAudesp[];
}
