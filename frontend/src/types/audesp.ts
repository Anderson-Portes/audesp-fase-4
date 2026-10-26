export interface MunicipioAudesp {
  codigo: number;
  nome: string;
  uf: string;
}

export interface EntidadeAudesp {
  codigo: number;
  municipio: number;
  nome: string;
  tipo: string;
  cnpj?: string;
}
