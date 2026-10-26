import { api } from './api';
import type { AtaRegistroPreco } from '../types/ata';

export const ataService = {
  async getDominios(): Promise<any> {
    const response = await api.get('/api/atas/dominios');
    return response.data;
  },

  async getAtas(status?: string, search?: string): Promise<AtaRegistroPreco[]> {
    const params: any = {};
    if (status) params.status = status;
    if (search) params.search = search;
    const response = await api.get('/api/atas', { params });
    return response.data;
  },

  async getAtaById(id: number): Promise<{ ata: AtaRegistroPreco; documento: any }> {
    const response = await api.get(`/api/atas/${id}`);
    return response.data;
  },

  async salvarAta(payload: any): Promise<AtaRegistroPreco> {
    const response = await api.post('/api/atas', payload);
    return response.data;
  },

  async enviarAta(id: number, forcar: boolean = false): Promise<any> {
    const response = await api.post(`/api/atas/${id}/enviar?forcar=${forcar}`);
    return response.data;
  },

  async consultarProtocolo(id: number): Promise<any> {
    const response = await api.get(`/api/atas/${id}/consultar-protocolo`);
    return response.data;
  },

  async retornarRascunho(id: number): Promise<AtaRegistroPreco> {
    const response = await api.post(`/api/atas/${id}/retornar-rascunho`);
    return response.data;
  }
};
