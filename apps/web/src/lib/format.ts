/**
 * Format tampilan. Selalu locale `id-ID` dan zona waktu `Asia/Jakarta`
 * agar harga & tanggal identik antara SSR dan browser.
 */

const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const longDate = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'long',
  timeZone: 'Asia/Jakarta',
});

const shortDateTime = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
});

/** `149000` → `Rp 149.000` (spasi tipis dinormalisasi agar aman di CSS). */
export function formatIdr(value: number): string {
  return idr.format(value).replace(/\u00a0/g, ' ');
}

/** `4967` → `≈ Rp 4.967/hari`. */
export function formatPerDay(value: number): string {
  if (value <= 0) return 'Gratis';
  return `≈ ${formatIdr(value)}/hari`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : longDate.format(date);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : shortDateTime.format(date);
}

/** Persentase hemat terhadap harga coret, atau `null` bila tidak relevan. */
export function discountPercent(price: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
