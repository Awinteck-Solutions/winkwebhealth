/** WinkWebHealth — Pulse Teal brand + semantic uptime colors */
export const BRAND = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#2DD4BF',
  gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 50%, #0F766E 100%)',
  glow: 'rgba(13, 148, 136, 0.18)',
  glowStrong: 'rgba(13, 148, 136, 0.32)',
};

/** Operational status — green = up, red = down (never brand teal) */
export const STATUS = {
  up: '#10B981',
  down: '#EF4444',
  paused: '#64748B',
  pending: '#F59E0B',
};

export const METRIC = {
  uptimeGood: '#10B981',
  uptimeWarn: '#F59E0B',
  uptimeBad: '#EF4444',
  chart: '#14B8A6',
  barUp: '#10B981',
  barDown: '#EF4444',
  barEmpty: '#334155',
};

export function uptimeMetricColor(percent) {
  if (percent == null) return 'var(--text-secondary)';
  if (percent >= 99) return METRIC.uptimeGood;
  if (percent >= 95) return METRIC.uptimeWarn;
  return METRIC.uptimeBad;
}
