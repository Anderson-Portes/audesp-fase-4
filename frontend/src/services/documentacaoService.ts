import { api } from './api';

export interface DocumentacaoStatusResponse {
  possui_alerta: boolean;
  alteracoes: string[];
  detectada_em?: string | null;
  ultimo_periodo_verificado?: string | null;
  pagina_tce: string;
  pagina_api: string;
  erro_verificacao?: string;
}

export const documentacaoService = {
  async getStatus(forcar: boolean = false): Promise<DocumentacaoStatusResponse> {
    const response = await api.get<DocumentacaoStatusResponse>('/api/documentacao/status', {
      params: { forcar },
    });
    return response.data;
  },

  async marcarVerificada(): Promise<DocumentacaoStatusResponse> {
    const response = await api.post<DocumentacaoStatusResponse>('/api/documentacao/marcar-verificada');
    return response.data;
  },
};
