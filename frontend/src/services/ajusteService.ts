import { api } from './api';
import type { AjusteContrato, DominiosAjusteResponse } from '../types/ajuste';

export const ajusteService = {
  async getDominios(): Promise<DominiosAjusteResponse> {
    const response = await api.get('/api/ajustes/dominios');
    return response.data;
  },

  async getAjustes(status?: string, search?: string): Promise<AjusteContrato[]> {
    const params: any = {};
    if (status) params.status = status;
    if (search) params.search = search;
    const response = await api.get('/api/ajustes', { params });
    return response.data;
  },

  async getAjusteById(id: number): Promise<{ ajuste: AjusteContrato; documento: any }> {
    const response = await api.get(`/api/ajustes/${id}`);
    return response.data;
  },

  async salvarAjuste(payload: any): Promise<AjusteContrato> {
    const response = await api.post('/api/ajustes', payload);
    return response.data;
  },

  async enviarAjuste(id: number, forcar: boolean = false): Promise<any> {
    const response = await api.post(`/api/ajustes/${id}/enviar?forcar=${forcar}`);
    return response.data;
  },

  async consultarProtocolo(id: number): Promise<any> {
    const response = await api.get(`/api/ajustes/${id}/consultar-protocolo`);
    return response.data;
  },

  async retornarRascunho(id: number): Promise<AjusteContrato> {
    const response = await api.post(`/api/ajustes/${id}/retornar-rascunho`);
    return response.data;
  }
};
