import { api } from './api';
import type { Licitacao, DominiosLicitacaoResponse } from '../types/licitacao';

export const licitacaoService = {
  async getDominios(): Promise<DominiosLicitacaoResponse> {
    const response = await api.get<DominiosLicitacaoResponse>('/api/licitacoes/dominios');
    return response.data;
  },

  async getLicitacoes(status?: 'draft' | 'sent', search?: string): Promise<Licitacao[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (search) params.search = search;
    const response = await api.get<Licitacao[]>('/api/licitacoes', { params });
    return response.data;
  },

  async getLicitacao(id: number): Promise<Licitacao> {
    const response = await api.get<Licitacao>(`/api/licitacoes/${id}`);
    return response.data;
  },

  async createLicitacao(payload: {
    documento: any;
    edital_id?: number;
    numero_compra?: string;
    ano_compra?: number;
    numero_processo?: string;
    objeto_edital?: string;
    status?: string;
  }): Promise<Licitacao> {
    const response = await api.post<Licitacao>('/api/licitacoes', payload);
    return response.data;
  },

  async updateLicitacao(id: number, payload: {
    documento: any;
    edital_id?: number;
    numero_compra?: string;
    ano_compra?: number;
    numero_processo?: string;
    objeto_edital?: string;
  }): Promise<Licitacao> {
    const response = await api.put<Licitacao>(`/api/licitacoes/${id}`, payload);
    return response.data;
  },

  async deleteLicitacao(id: number): Promise<{ sucesso: boolean; mensagem: string }> {
    const response = await api.delete<{ sucesso: boolean; mensagem: string }>(`/api/licitacoes/${id}`);
    return response.data;
  },

  async enviarLicitacao(id: number): Promise<{
    sucesso: boolean;
    mensagem: string;
    protocolo: string;
    status_protocolo: string;
  }> {
    const response = await api.post(`/api/licitacoes/${id}/enviar`);
    return response.data;
  },

  async consultarProtocolo(id: number): Promise<{
    sucesso: boolean;
    protocolo: string;
    status: string;
    dados?: any;
  }> {
    const response = await api.post(`/api/licitacoes/${id}/consultar-protocolo`);
    return response.data;
  },

  async retornarRascunho(id: number): Promise<{ sucesso: boolean; mensagem: string }> {
    const response = await api.post(`/api/licitacoes/${id}/retornar-rascunho`);
    return response.data;
  }
};
