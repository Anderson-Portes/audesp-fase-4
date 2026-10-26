import { api } from './api';
import type { Edital, DominiosResponse } from '../types/edital';

export const editalService = {
  async getDominios(): Promise<DominiosResponse> {
    const response = await api.get<DominiosResponse>('/api/editais/dominios');
    return response.data;
  },

  async getEditais(status?: 'draft' | 'sent', search?: string): Promise<Edital[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (search) params.search = search;
    const response = await api.get<Edital[]>('/api/editais', { params });
    return response.data;
  },

  async getEdital(id: number): Promise<Edital> {
    const response = await api.get<Edital>(`/api/editais/${id}`);
    return response.data;
  },

  async createEdital(payload: {
    documento: any;
    pdf_path?: string;
    pdf_nome_original?: string;
    sem_pncp?: boolean;
    status?: string;
  }): Promise<Edital> {
    const response = await api.post<Edital>('/api/editais', payload);
    return response.data;
  },

  async updateEdital(id: number, payload: {
    documento: any;
    pdf_path?: string;
    pdf_nome_original?: string;
    sem_pncp?: boolean;
  }): Promise<Edital> {
    const response = await api.put<Edital>(`/api/editais/${id}`, payload);
    return response.data;
  },

  async deleteEdital(id: number): Promise<{ sucesso: boolean; mensagem: string }> {
    const response = await api.delete<{ sucesso: boolean; mensagem: string }>(`/api/editais/${id}`);
    return response.data;
  },

  async uploadPdf(id: number, file: File): Promise<{
    sucesso: boolean;
    mensagem: string;
    pdf_path: string;
    pdf_nome_original: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/editais/${id}/upload-pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPdfUrl(id: number): string {
    const baseURL = api.defaults.baseURL || 'http://localhost:8000';
    return `${baseURL}/api/editais/${id}/pdf`;
  },

  async downloadPdf(id: number): Promise<Blob> {
    const response = await api.get(`/api/editais/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  },

  async enviarEdital(id: number): Promise<{
    sucesso: boolean;
    mensagem: string;
    protocolo: string;
    status_protocolo: string;
  }> {
    const response = await api.post(`/api/editais/${id}/enviar`);
    return response.data;
  },

  async consultarProtocolo(id: number): Promise<{
    sucesso: boolean;
    protocolo: string;
    status: string;
    dados?: any;
  }> {
    const response = await api.post(`/api/editais/${id}/consultar-protocolo`);
    return response.data;
  },

  async retornarRascunho(id: number): Promise<{ sucesso: boolean; mensagem: string }> {
    const response = await api.post(`/api/editais/${id}/retornar-rascunho`);
    return response.data;
  }
};
