import { api } from './api';

export type ModuloImportacao = 'editais' | 'licitacoes' | 'atas' | 'ajustes';

export interface EditalPreviewItem {
  linha: number;
  codigo_edital: string;
  sem_pncp: boolean;
  numero_compra: string;
  ano_compra: number;
  numero_processo: string;
  objeto_compra: string;
  modalidade_id: number;
  qtd_itens: number;
  qtd_publicacoes: number;
  exige_pdf: boolean;
  documento: any;
}

export interface ResultadoItemImportacao {
  linha: number | string;
  codigo_documento: string;
  descricao: string;
  registro_id?: number;
  salvo_bd: boolean;
  transmitido: boolean;
  sucesso: boolean;
  protocolo?: string | null;
  status_protocolo?: string | null;
  erros: string[];
}

export interface ImportacaoLoteResponse {
  sucesso: boolean;
  total: number;
  sucessos: number;
  falhas: number;
  resultados: ResultadoItemImportacao[];
}

export const importacaoExportacaoService = {
  async baixarModelo(modulo: ModuloImportacao): Promise<void> {
    const response = await api.get(`/api/importacao-exportacao/${modulo}/modelo`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `modelo_importacao_${modulo}_audesp.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async exportarPlanilha(modulo: ModuloImportacao): Promise<void> {
    const response = await api.get(`/api/importacao-exportacao/${modulo}/exportar`, {
      responseType: 'blob',
    });
    const hoje = new Date().toISOString().split('T')[0];
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `exportacao_${modulo}_${hoje}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async preVisualizarEditais(file: File): Promise<{
    sucesso: boolean;
    total: number;
    editais: EditalPreviewItem[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/importacao-exportacao/editais/pre-visualizar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async importarLoteEditais(
    editais: EditalPreviewItem[],
    mapaPdfs: Record<string, File>,
    transmitir: boolean
  ): Promise<ImportacaoLoteResponse> {
    const formData = new FormData();
    formData.append('dados_json', JSON.stringify(editais));
    formData.append('transmitir', String(transmitir));

    Object.entries(mapaPdfs).forEach(([codigoEdital, pdfFile]) => {
      if (pdfFile) {
        formData.append('arquivos_pdf', pdfFile);
        formData.append('pdfs_codigos', codigoEdital);
      }
    });

    const response = await api.post<ImportacaoLoteResponse>(
      '/api/importacao-exportacao/editais/importar-lote',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  async importarLoteModulo(
    modulo: Exclude<ModuloImportacao, 'editais'>,
    file: File,
    transmitir: boolean
  ): Promise<ImportacaoLoteResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('transmitir', String(transmitir));
    const response = await api.post<ImportacaoLoteResponse>(
      `/api/importacao-exportacao/${modulo}/importar-lote`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },
};

