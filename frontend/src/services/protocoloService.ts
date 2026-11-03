import { api } from './api';
import type { ErroProtocoloDetalhado, HistoricoProtocoloItem } from '../utils/protocoloFormatter';

export interface ProtocoloUnificadoItem {
  uid: string;
  modulo: 'edital' | 'licitacao' | 'ata' | 'ajuste';
  modulo_label: string;
  rota_modulo: string;
  registro_id: number;
  codigo_documento: string;
  identificacao: string;
  resumo: string;
  protocolo: string;
  status_sistema: string;
  status_protocolo: string;
  retificacao: boolean;
  detalhes_protocolo?: any;
  erros_detalhados?: ErroProtocoloDetalhado[];
  updated_at?: string | null;
}

export interface ProtocolosListResponse {
  contadores: {
    total: number;
    armazenados: number;
    rejeitados: number;
    recebidos: number;
  };
  itens: ProtocoloUnificadoItem[];
}

export interface ConsultaAvulsaResponse {
  sucesso: boolean;
  protocolo: string;
  status_protocolo: string;
  data_hora_audesp?: string | null;
  codigo_documento?: string | null;
  is_rejeitado: boolean;
  erros_detalhados: ErroProtocoloDetalhado[];
  erros_formatados: string[];
  dados?: any;
  mensagem?: string | null;
}

export const protocoloService = {
  async listarProtocolos(filtros?: {
    modulo?: string;
    status_protocolo?: string;
    search?: string;
  }): Promise<ProtocolosListResponse> {
    const params: Record<string, string> = {};
    if (filtros?.modulo) params.modulo = filtros.modulo;
    if (filtros?.status_protocolo) params.status_protocolo = filtros.status_protocolo;
    if (filtros?.search) params.search = filtros.search;
    const { data } = await api.get<ProtocolosListResponse>('/api/protocolos', { params });
    return data;
  },

  async consultarProtocoloRegistro(modulo: string, registroId: number): Promise<any> {
    const { data } = await api.post(`/api/protocolos/${modulo}/${registroId}/consultar`);
    return data;
  },

  async obterHistoricoRegistro(
    modulo: string,
    registroId: number,
    protocolo?: string | null
  ): Promise<HistoricoProtocoloItem[]> {
    const params = protocolo ? { protocolo } : undefined;
    const { data } = await api.get<HistoricoProtocoloItem[]>(
      `/api/protocolos/${modulo}/${registroId}/historico`,
      { params }
    );
    return data;
  },

  async consultarProtocoloAvulso(protocolo: string): Promise<ConsultaAvulsaResponse> {
    const { data } = await api.post<ConsultaAvulsaResponse>(
      '/api/protocolos/consultar-avulso',
      null,
      { params: { protocolo } }
    );
    return data;
  },
};

