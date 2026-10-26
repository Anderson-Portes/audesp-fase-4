import type { MunicipioAudesp, EntidadeAudesp } from './audesp';

export interface AtaDescritor {
  municipio: number;
  entidade: number;
  codigoEdital: string;
  codigoAta: string;
  anoCompra: number;
  retificacao: boolean;
}

export interface AtaJSON {
  descritor: AtaDescritor;
  numeroItem: number[];
  numeroAtaRegistroPreco: string;
  anoAta: number;
  dataAssinatura: string; // YYYY-MM-DD
  dataVigenciaInicio: string; // YYYY-MM-DD
  dataVigenciaFim: string; // YYYY-MM-DD
}

export interface AtaRegistroPreco {
  id: number;
  edital_id?: number;
  licitacao_id?: number;
  municipio: number;
  entidade: number;
  codigo_edital: string;
  codigo_ata: string;
  ano_compra: number;
  retificacao: boolean;
  numero_ata_registro_preco: string;
  ano_ata: number;
  data_assinatura: string;
  data_vigencia_inicio: string;
  data_vigencia_fim: string;
  status: 'draft' | 'sent' | 'error';
  protocolo?: string;
  status_protocolo?: string;
  detalhes_protocolo?: string;
  documento_json: string;
  created_at: string;
  updated_at: string;
}

export interface DominiosAtaResponse {
  municipios?: MunicipioAudesp[];
  entidades?: EntidadeAudesp[];
}
