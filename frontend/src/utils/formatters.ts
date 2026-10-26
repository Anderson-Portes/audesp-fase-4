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
