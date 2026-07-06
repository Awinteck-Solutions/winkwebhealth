import { Box, Group } from '@mantine/core';

import { STATUS } from '../constants/colors';

const DEFAULT_COLORS = {
  UP: STATUS.up,
  DOWN: STATUS.down,
  PAUSED: STATUS.paused,
  PENDING: STATUS.pending,
  empty: 'var(--detail-bar-empty, #334155)',
};

const DETAIL_COLORS = {
  UP: 'var(--detail-bar-up, #10b981)',
  DOWN: 'var(--detail-bar-down, #ef4444)',
  PAUSED: STATUS.paused,
  PENDING: STATUS.pending,
  empty: 'var(--detail-bar-empty, #cbd5e1)',
};

export function UptimeBarMini({ checks = [], bars = 48, size = 'compact', palette = 'default' }) {
  const isFull = size === 'full';
  const barHeight = isFull ? 44 : 28;
  const gap = isFull ? 3 : 2;
  const STATUS_COLOR = palette === 'detail' ? DETAIL_COLORS : DEFAULT_COLORS;

  const buckets = Array.from({ length: bars }, (_, i) => {
    if (!checks.length) return 'empty';
    const chunkSize = Math.max(1, Math.floor(checks.length / bars));
    const slice = checks.slice(i * chunkSize, (i + 1) * chunkSize);
    if (!slice.length) return 'empty';
    const up = slice.filter((c) => c.status === 'UP').length;
    return up / slice.length >= 0.5 ? 'UP' : 'DOWN';
  });

  return (
    <Group
      gap={gap}
      wrap="nowrap"
      className={isFull ? 'uptime-bar-mini uptime-bar-mini--full' : 'uptime-bar-mini'}
    >
      {buckets.map((status, i) => (
        <Box
          key={i}
          className={isFull ? 'uptime-bar-segment uptime-bar-segment--full' : 'uptime-bar-segment'}
          style={{
            width: isFull ? undefined : 3,
            height: barHeight,
            borderRadius: isFull ? 2 : 1,
            backgroundColor: STATUS_COLOR[status] || STATUS_COLOR.empty,
            flexShrink: isFull ? undefined : 0,
          }}
        />
      ))}
    </Group>
  );
}

export function StatusDot({ status, size = 10 }) {
  const color = DEFAULT_COLORS[status] || DEFAULT_COLORS.PENDING;
  return (
    <Box
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: status === 'UP' ? `0 0 8px ${color}66` : undefined,
        flexShrink: 0,
      }}
    />
  );
}
