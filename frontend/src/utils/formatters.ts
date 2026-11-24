export const formatBRL = (value?: number | null): string => {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
};

export const formatDecimal4 = (value?: number | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0,0000';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
};

export const formatDateBR = (isoDate?: string | null): string => {
  if (!isoDate) return '';
  try {
    const [year, month, day] = isoDate.split('T')[0].split('-');
    if (!year || !month || !day) return isoDate;
    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
};

export const formatDateTimeBR = (isoDateTime?: string | null): string => {
  if (!isoDateTime) return '';
  try {
    const date = new Date(isoDateTime);
    if (isNaN(date.getTime())) return isoDateTime;
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDateTime;
  }
};

/**
 * Aplica máscara de 25 dígitos do PNCP:
 * CNPJ (14) + '1' (1) + Seq (6) + Ano (4)
 * Exemplo: 00.000.000/0000-00-1-000000/0000
 */
export const formatPncpMask = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 25);
  let res = '';
  if (digits.length > 0) res += digits.slice(0, 2);
  if (digits.length > 2) res += '.' + digits.slice(2, 5);
  if (digits.length > 5) res += '.' + digits.slice(5, 8);
  if (digits.length > 8) res += '/' + digits.slice(8, 12);
  if (digits.length > 12) res += '-' + digits.slice(12, 14);
  if (digits.length > 14) res += '-' + digits.slice(14, 15);
  if (digits.length > 15) res += '-' + digits.slice(15, 21);
  if (digits.length > 21) res += '/' + digits.slice(21, 25);
  return res;
};

export const stripMask = (val: string): string => {
  return val.replace(/\D/g, '');
};

/**
 * Normaliza identificação de pessoa:
 * - PJ: dígitos e letras maiúsculas (suporta CNPJ numérico e alfanumérico)
 * - PF: somente dígitos
 * - PE: preserva caracteres externos com trim
 */
export const normalizarNiPessoa = (tipoPessoa: string, val: string): string => {
  const tipo = (tipoPessoa || '').trim().toUpperCase();
  if (tipo === 'PJ') {
    return (val || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }
  if (tipo === 'PF') {
    return (val || '').replace(/\D/g, '');
  }
  return (val || '').trim();
};

/**
 * Formata CPF (11 dígitos) ou CNPJ numérico/alfanumérico (14 caracteres).
 */
export const formatCpfCnpj = (val: string): string => {
  const ni = (val || '').replace(/[\s./-]/g, '').toUpperCase();
  if (/^\d{11}$/.test(ni)) {
    return `${ni.slice(0, 3)}.${ni.slice(3, 6)}.${ni.slice(6, 9)}-${ni.slice(9, 11)}`;
  }
  if (/^[A-Z0-9]{12}\d{2}$/.test(ni)) {
    return `${ni.slice(0, 2)}.${ni.slice(2, 5)}.${ni.slice(5, 8)}/${ni.slice(8, 12)}-${ni.slice(12, 14)}`;
  }
  return val;
};
