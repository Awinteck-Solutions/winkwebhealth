import { useEffect, useState } from 'react';
import { Box, Stack, Text, Group, RingProgress, Center, Progress } from '@mantine/core';
import {
  IconArrowUp, IconArrowDown, IconPlayerPause, IconClock, IconActivity, IconAlertTriangle,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { STATUS } from '../constants/colors';

function AnimatedValue({ value, className = '' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [value]);

  return (
    <span className={`monitor-stat-value ${visible ? 'is-visible' : ''} ${className}`}>
      {value}
    </span>
  );
}

function StatTile({ icon: Icon, value, label, tone = 'neutral' }) {
  return (
    <div className={`monitor-stat-tile tone-${tone}`}>
      <div className="monitor-stat-tile-icon">
        <Icon size={14} stroke={2} />
      </div>
      <div className="monitor-stat-tile-body">
        <AnimatedValue value={value} className="monitor-stat-tile-value" />
        <span className="monitor-stat-tile-label">{label}</span>
      </div>
    </div>
  );
}

function UptimeStrip({ uptime, segments = 24 }) {
  const upCount = Math.round((uptime / 100) * segments);
  return (
    <div className="monitor-uptime-strip" aria-hidden>
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className={`monitor-uptime-segment ${i < upCount ? 'is-up' : 'is-down'}`}
          style={{ animationDelay: `${i * 18}ms` }}
        />
      ))}
    </div>
  );
}

function healthMessage(up, down, total) {
  if (!total) return 'Add monitors to start tracking';
  if (down > 0) return `${down} monitor${down === 1 ? '' : 's'} need attention`;
  if (up === total) return 'All systems operational';
  return 'Monitoring in progress';
}

export function MonitorsSidebar({ monitors, plan = 'FREE', planLimit = 5, preview = false }) {
  const up = monitors.filter((m) => m.currentStatus === 'UP').length;
  const down = monitors.filter((m) => m.currentStatus === 'DOWN').length;
  const paused = monitors.filter((m) => m.currentStatus === 'PAUSED' || m.currentStatus === 'PENDING').length;
  const total = monitors.length;

  const overallUptime = total
    ? Math.round(monitors.reduce((sum, m) => sum + (m.uptimePercent ?? 100), 0) / total)
    : 100;

  const healthPct = total ? Math.round((up / total) * 100) : 100;
  const ringColor = down > 0 ? STATUS.down : STATUS.up;
  const uptimeTone = overallUptime >= 99 ? 'up' : overallUptime >= 95 ? 'warn' : 'down';
  const planUsage = planLimit ? Math.min(100, Math.round((total / planLimit) * 100)) : 0;

  return (
    <Stack gap="md" className="monitors-sidebar">
      <Box className="monitor-stats-card monitor-stats-card--status">
        <Group justify="space-between" align="flex-start" mb="sm" wrap="nowrap">
          <div>
            <Text className="monitor-stats-card-title">Current status</Text>
            <Text size="xs" c="var(--text-muted)" mt={2} className="monitor-health-message">
              {healthMessage(up, down, total)}
            </Text>
          </div>
          {total > 0 && (
            <span className={`monitor-live-dot ${down > 0 ? 'is-alert' : 'is-healthy'}`} title="Live status" />
          )}
        </Group>

        <Center className="monitor-ring-wrap" mb="md">
          <RingProgress
            size={96}
            thickness={6}
            roundCaps
            rootColor="var(--stat-ring-track)"
            sections={[{ value: healthPct, color: ringColor }]}
            label={(
              <Center className="monitor-ring-label">
                {down > 0 ? (
                  <IconAlertTriangle size={26} color={ringColor} stroke={2} />
                ) : (
                  <IconArrowUp size={28} color={ringColor} stroke={2.5} />
                )}
              </Center>
            )}
            styles={{
              root: { transition: 'transform 0.4s ease' },
            }}
          />
          <Text className="monitor-ring-caption" ta="center" mt={8}>
            <AnimatedValue value={`${healthPct}%`} /> healthy
          </Text>
        </Center>

        <div className="monitor-stat-grid">
          <StatTile icon={IconArrowDown} value={down} label="Down" tone="down" />
          <StatTile icon={IconArrowUp} value={up} label="Up" tone="up" />
          <StatTile icon={IconPlayerPause} value={paused} label="Paused" tone="neutral" />
        </div>

        <div className="monitor-plan-usage">
          <Group justify="space-between" mb={6}>
            <Text size="xs" c="var(--text-muted)">Plan usage</Text>
            <Text size="xs" fw={600} c="var(--text-primary)">{total} / {planLimit}</Text>
          </Group>
          <Progress
            value={planUsage}
            size="sm"
            radius="xl"
            color={planUsage >= 100 ? 'red' : 'brand'}
            className="monitor-plan-progress"
          />
          {plan === 'FREE' && !preview && (
            <Text size="xs" c="var(--text-muted)" ta="center" mt="sm">
              <Text component={Link} to="/dashboard/billing" size="xs" c="brand" span inherit fw={600}>
                Upgrade
              </Text>
              {' '}for more monitors
            </Text>
          )}
        </div>
      </Box>

      <Box className="monitor-stats-card monitor-stats-card--uptime">
        <Group justify="space-between" align="center" mb="xs">
          <Text className="monitor-stats-card-title" mb={0}>Last 24 hours</Text>
          <IconClock size={16} className="monitor-stats-card-icon" stroke={1.75} />
        </Group>

        <div className={`monitor-uptime-hero tone-${uptimeTone}`}>
          <AnimatedValue value={`${overallUptime}%`} className="monitor-uptime-hero-value" />
          <Text size="xs" className="monitor-uptime-hero-label">Overall uptime</Text>
        </div>

        <UptimeStrip uptime={overallUptime} />

        <div className="monitor-stat-grid monitor-stat-grid--two">
          <StatTile
            icon={IconAlertTriangle}
            value={down}
            label="Incidents"
            tone={down > 0 ? 'down' : 'neutral'}
          />
          <StatTile icon={IconActivity} value={total} label="Active checks" tone="up" />
        </div>
      </Box>
    </Stack>
  );
}
