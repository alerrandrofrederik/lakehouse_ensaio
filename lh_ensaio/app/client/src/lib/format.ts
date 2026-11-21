// Formatação e rótulos usados nas telas do Lead Score.

export const toNumber = (value: number | string | null | undefined): number => Number(value ?? 0);

export const formatInt = (value: number | string | null | undefined): string =>
  toNumber(value).toLocaleString('pt-BR');

export const formatPct = (value: number): string => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`;

/** "2026-11-17" -> "17/11/2026" */
export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const [y, m, d] = value.slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : value;
};

/** "2026-11-21 12:04:12.180" -> "21/11 12:04" */
export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const initials = (name: string | null | undefined): string =>
  (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const INTENCAO_LABEL: Record<string, string> = {
  compra_imediata: 'Compra imediata',
  avaliando: 'Avaliando',
  suporte: 'Suporte',
  spam: 'Spam',
};

export const CANAL_LABEL: Record<string, string> = {
  site: 'Site',
  google_ads: 'Google Ads',
  evento: 'Eventos',
  linkedin: 'LinkedIn',
  indicacao: 'Indicação',
};

export const labelIntencao = (value: string | null | undefined): string => INTENCAO_LABEL[value ?? ''] ?? value ?? '—';
export const labelCanal = (value: string | null | undefined): string => CANAL_LABEL[value ?? ''] ?? value ?? '—';

/** Tokens categóricos do AppKit, na ordem da referência (azul, verde, âmbar, ciano, rosa...). */
export const CATEGORICAL_TOKENS = [
  '--chart-cat-1',
  '--chart-cat-8',
  '--chart-cat-4',
  '--chart-cat-6',
  '--chart-cat-5',
  '--chart-cat-3',
] as const;
