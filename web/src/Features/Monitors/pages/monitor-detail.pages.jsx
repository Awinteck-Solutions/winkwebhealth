import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Button, Text, Group, SimpleGrid, TextInput, Table, Stack, Box, Menu, ActionIcon, Anchor, Skeleton, Center, SegmentedControl,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowUp, IconArrowDown, IconChevronRight, IconDots, IconPlayerPause, IconTrash, IconRefresh, IconEdit, IconBell,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { MonitorDetailSidebar } from '../../../components/MonitorDetailSidebar';
import { UptimeBarMini } from '../../../components/UptimeBarMini';
import { AppModal } from '../../../components/AppModal';
import { useConfirm } from '../../../components/ConfirmProvider';
import { DetailPageSkeleton } from '../../../components/PageSkeleton';
import { MonitorFormModal } from '../MonitorFormModal';
import { monitorsApi } from '../monitors.services';
import { monitorTarget } from '../monitorForm.utils';
import { STATUS, METRIC, uptimeMetricColor } from '../../../constants/colors';
import { canWrite } from '../../../utils/permissions';

dayjs.extend(relativeTime);
dayjs.extend(duration);

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '—';
  const d = dayjs.duration(seconds, 'seconds');
  const parts = [];
  if (d.days()) parts.push(`${d.days()}d`);
  if (d.hours()) parts.push(`${d.hours()}h`);
  if (d.minutes() || !parts.length) parts.push(`${d.minutes()}m`);
  return parts.join(' ');
}

function statusColor(status) {
  return { UP: STATUS.up, DOWN: STATUS.down, PAUSED: STATUS.paused, PENDING: STATUS.pending }[status] || STATUS.pending;
}

const CHART_RANGES = [
  { value: '30m', label: '30 minutes', shortLabel: '30m', hours: 0.5 },
  { value: '1h', label: '1 hour', shortLabel: '1h', hours: 1 },
  { value: '24h', label: '24 hours', shortLabel: '24h', hours: 24 },
  { value: '7d', label: '7 days', shortLabel: '7d', hours: 168 },
  { value: '30d', label: '30 days', shortLabel: '30d', hours: 720 },
];

function formatChartAxisTime(checkedAt, hours) {
  const d = dayjs(checkedAt);
  if (hours <= 1) return d.format('HH:mm');
  if (hours <= 24) return d.format('HH:mm');
  if (hours <= 168) return d.format('ddd HH:mm');
  return d.format('MMM D');
}

function formatChartTooltipTime(checkedAt) {
  return dayjs(checkedAt).format('MMM D, YYYY HH:mm');
}

const MonitorDetailPage = () => {
  const confirm = useConfirm();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [monitor, setMonitor] = useState(null);
  const [stats, setStats] = useState(null);
  const [checks24h, setChecks24h] = useState([]);
  const [chartRangeKey, setChartRangeKey] = useState('24h');
  const [chartChecks, setChartChecks] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [testingAlerts, setTestingAlerts] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [editOpen, setEditOpen] = useState(false);
  const [maintForm, setMaintForm] = useState({ startsAt: '', endsAt: '', note: '' });
  const writable = canWrite();

  const loadChartChecks = useCallback((rangeKey) => {
    const range = CHART_RANGES.find((r) => r.value === rangeKey) || CHART_RANGES[2];
    setChartLoading(true);
    return monitorsApi.checks(id, { hours: range.hours })
      .then((res) => setChartChecks(res.data.data || []))
      .catch(() => setChartChecks([]))
      .finally(() => setChartLoading(false));
  }, [id]);

  const loadMetrics = useCallback(() => {
    setMetricsLoading(true);
    return Promise.all([
      monitorsApi.stats(id),
      monitorsApi.checks(id, 1),
      monitorsApi.maintenance.list(id),
    ]).then(([s, c24, mw]) => {
      setStats(s.data.data);
      setChecks24h(c24.data.data || []);
      setMaintenance(mw.data.data || []);
    }).finally(() => setMetricsLoading(false));
  }, [id]);

  const refreshAll = useCallback(() => {
    setLoading(true);
    monitorsApi.get(id)
      .then((m) => setMonitor(m.data.data))
      .catch(() => setMonitor(null))
      .finally(() => setLoading(false));
    loadMetrics();
    loadChartChecks(chartRangeKey);
  }, [id, chartRangeKey, loadMetrics, loadChartChecks]);

  useEffect(() => {
    setLoading(true);
    monitorsApi.get(id)
      .then((m) => setMonitor(m.data.data))
      .catch(() => setMonitor(null))
      .finally(() => setLoading(false));
    loadMetrics();
  }, [id, loadMetrics]);

  useEffect(() => {
    loadChartChecks(chartRangeKey);
  }, [chartRangeKey, loadChartChecks]);

  useEffect(() => {
    if (searchParams.get('edit') === '1' && writable) {
      setEditOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, writable]);

  const chartRange = CHART_RANGES.find((r) => r.value === chartRangeKey) || CHART_RANGES[2];

  const chartData = useMemo(() =>
    chartChecks
      .filter((c) => c.status === 'UP')
      .slice()
      .reverse()
      .map((c) => ({
        time: formatChartAxisTime(c.checkedAt, chartRange.hours),
        fullTime: formatChartTooltipTime(c.checkedAt),
        ms: c.responseTimeMs,
      })),
  [chartChecks, chartRange.hours]);

  const responseStats = useMemo(() => {
    const times = chartChecks.filter((c) => c.status === 'UP').map((c) => c.responseTimeMs);
    if (!times.length) return { avg: null, min: null, max: null };
    return {
      avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      min: Math.min(...times),
      max: Math.max(...times),
    };
  }, [chartChecks]);

  const uptime24h = useMemo(() => {
    if (!checks24h.length) return null;
    const up = checks24h.filter((c) => c.status === 'UP').length;
    return Math.round((up / checks24h.length) * 100);
  }, [checks24h]);

  const upDuration = useMemo(() => {
    if (!monitor || monitor.currentStatus !== 'UP') return null;
    const incidents = stats?.incidents || [];
    const lastResolved = incidents.find((i) => i.resolvedAt);
    const since = lastResolved?.resolvedAt || monitor.createdAt;
    return formatDuration(dayjs().diff(dayjs(since), 'second'));
  }, [monitor, stats]);

  const mtbf = useMemo(() => {
    const resolved = (stats?.incidents || []).filter((i) => i.durationSeconds);
    if (!resolved.length) return 'N/A';
    const avg = resolved.reduce((s, i) => s + i.durationSeconds, 0) / resolved.length;
    return formatDuration(Math.round(avg));
  }, [stats]);

  const togglePause = async () => {
    await monitorsApi.update(id, { isActive: !monitor.isActive });
    notifications.show({
      title: monitor.isActive ? 'Paused' : 'Resumed',
      message: monitor.name,
      color: 'brand',
    });
    refreshAll();
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete monitor',
      message: 'Delete this monitor permanently? All check history will be lost.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await monitorsApi.remove(id);
    navigate('/dashboard/monitors');
  };

  const addMaintenance = async () => {
    await monitorsApi.maintenance.create(id, maintForm);
    notifications.show({ title: 'Scheduled', message: 'Maintenance window added', color: 'brand' });
    close();
    refreshAll();
  };

  const handleTestAlerts = async () => {
    if (!(monitor?.alertChannelIds?.length)) {
      notifications.show({
        title: 'No alert channels',
        message: 'Link alert channels in Edit monitor first.',
        color: 'yellow',
      });
      return;
    }
    setTestingAlerts(true);
    try {
      const res = await monitorsApi.testAlerts(id);
      notifications.show({
        title: 'Test sent',
        message: res.data.message || 'Test notification sent',
        color: 'brand',
      });
    } catch (err) {
      notifications.show({
        title: 'Test failed',
        message: err.response?.data?.message || 'Could not send test notification',
        color: 'red',
      });
    } finally {
      setTestingAlerts(false);
    }
  };

  const sidebar = monitor ? (
    <MonitorDetailSidebar
      monitor={monitor}
      maintenance={maintenance}
      latestCheck={checks24h[0]}
      onScheduleMaintenance={writable ? open : undefined}
      readOnly={!writable}
    />
  ) : null;

  if (loading) {
    return (
      <DashboardLayout>
        <DetailPageSkeleton />
      </DashboardLayout>
    );
  }

  if (!monitor) {
    return (
      <DashboardLayout>
        <Text c="var(--text-secondary)">Monitor not found</Text>
      </DashboardLayout>
    );
  }

  const color = statusColor(monitor.currentStatus);
  const StatusIcon = monitor.currentStatus === 'DOWN' ? IconArrowDown : IconArrowUp;
  const statusLabel = { UP: 'Up', DOWN: 'Down', PAUSED: 'Paused', PENDING: 'Pending' }[monitor.currentStatus];

  return (
    <DashboardLayout aside={sidebar}>
      <div className="monitor-detail-page">
      {/* Breadcrumb */}
      <Group gap={6} mb="lg">
        <Anchor component={Link} to="/dashboard/monitors" size="sm" c="var(--text-secondary)">Monitoring</Anchor>
        <IconChevronRight size={14} color="var(--text-muted)" />
        <Text size="sm" c="var(--text-muted)">{monitor.name}</Text>
      </Group>

      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="xl" wrap="wrap" gap="md">
        <Group align="flex-start" gap="md">
          <Box
            style={{
              width: 48, height: 48, borderRadius: '50%',
              border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <StatusIcon size={22} color={color} stroke={2.5} />
          </Box>
          <Stack gap={4}>
            <Text size="xl" fw={700} c="var(--text-primary)">{monitor.name}</Text>
            <Text size="sm" c="var(--text-secondary)">{monitor.type} · {monitorTarget(monitor)}</Text>
          </Stack>
        </Group>
        <Group gap="sm" className="detail-header-actions">
          {writable && (
          <>
          <Button
            variant="default"
            color="gray"
            radius="md"
            leftSection={<IconEdit size={16} />}
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="default"
            color="gray"
            radius="md"
            leftSection={<IconBell size={16} />}
            loading={testingAlerts}
            onClick={handleTestAlerts}
          >
            Test notification
          </Button>
          <Button variant="default" color="gray" radius="md" leftSection={<IconPlayerPause size={16} />} onClick={togglePause}>
            {monitor.isActive ? 'Pause' : 'Resume'}
          </Button>
          <Menu position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="default" size="lg" radius="md" color="gray">
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => setEditOpen(true)}>
                Edit monitor
              </Menu.Item>
              <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={handleDelete}>
                Delete monitor
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          </>
          )}
          <Button variant="default" color="gray" radius="md" leftSection={<IconRefresh size={16} />} onClick={refreshAll}>
            Refresh
          </Button>
        </Group>
      </Group>

      {/* Top status row */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
        <Box className="detail-stat-card">
          <Text className="detail-stat-label">Current status.</Text>
          <Text className="detail-stat-value" style={{ color }}>{statusLabel}</Text>
          <Text size="sm" c="var(--text-secondary)" mt={4}>
            {monitor.currentStatus === 'UP' && upDuration
              ? `Currently up for ${upDuration}.`
              : monitor.currentStatus === 'DOWN'
                ? 'Monitor is currently down.'
                : 'Waiting for first check.'}
          </Text>
        </Box>

        <Box className="detail-stat-card">
          <Text className="detail-stat-label">Last check.</Text>
          <Text className="detail-stat-value" c="var(--text-primary)" style={{ fontSize: 22 }}>
            {monitor.lastCheckedAt ? dayjs(monitor.lastCheckedAt).fromNow() : '—'}
          </Text>
          <Text size="sm" c="var(--text-secondary)" mt={4}>
            Checked every {Math.round(monitor.intervalSeconds / 60)} min.
          </Text>
        </Box>

        <Box className="detail-stat-card detail-stat-card-uptime">
          <Group justify="space-between" align="flex-start" mb="sm">
            <Text className="detail-stat-label" mb={0}>Last 24 hours.</Text>
            {metricsLoading ? (
              <Skeleton height={24} width={56} radius="sm" />
            ) : (
              <Text fw={700} className="detail-uptime-pct" style={{ color: uptimeMetricColor(uptime24h) }}>
                {uptime24h !== null ? `${uptime24h}%` : '—'}
              </Text>
            )}
          </Group>
          <Box className="uptime-bar-full">
            {metricsLoading ? (
              <Skeleton height={44} radius="md" />
            ) : (
              <UptimeBarMini checks={checks24h} bars={36} size="full" palette="detail" />
            )}
          </Box>
        </Box>
      </SimpleGrid>

      {/* Uptime period cards */}
      {metricsLoading ? (
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="md">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={88} radius="md" />
          ))}
        </SimpleGrid>
      ) : (
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="md">
        {[
          { key: '7d', label: 'Last 7 days.' },
          { key: '30d', label: 'Last 30 days.' },
          { key: '1d', label: 'Last 24 hours.' },
          { key: 'mtbf', label: 'Avg. incident duration.' },
        ].map(({ key, label }) => {
          const value = key === 'mtbf'
            ? mtbf
            : `${stats?.stats?.[key === '1d' ? '1d' : key]?.uptimePercent ?? (key === '1d' ? uptime24h : 100) ?? 100}%`;
          const pct = key === 'mtbf' ? null : parseInt(value, 10);
          return (
          <Box key={key} className="detail-stat-card detail-stat-card-sm">
            <Text className="detail-stat-label">{label}</Text>
            <Text className="detail-stat-value-sm detail-metric-value" style={{ color: key === 'mtbf' ? 'var(--text-primary)' : uptimeMetricColor(pct) }}>
              {value}
            </Text>
          </Box>
          );
        })}
      </SimpleGrid>
      )}

      {/* Response time chart */}
      <Box className="stats-card" mb="md">
        <Group justify="space-between" align="flex-start" mb="lg" wrap="wrap" gap="sm">
          <div>
            <Text fw={600} c="var(--text-primary)" mb={4}>Response time</Text>
            <Text size="xs" c="var(--text-secondary)">
              {chartRange.label} · milliseconds · successful checks only
            </Text>
          </div>
          <SegmentedControl
            value={chartRangeKey}
            onChange={setChartRangeKey}
            data={CHART_RANGES.map((r) => ({ value: r.value, label: r.shortLabel }))}
            size="xs"
            radius="md"
          />
        </Group>
        {chartLoading ? (
          <Skeleton height={220} radius="md" />
        ) : chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="time"
                  stroke="var(--chart-grid)"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  interval="preserveStartEnd"
                  minTickGap={chartRange.hours > 168 ? 24 : chartRange.hours <= 1 ? 4 : 8}
                />
                <YAxis stroke="var(--chart-grid)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} unit="ms" />
                <Tooltip
                  contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTime || ''}
                  formatter={(v) => [`${v} ms`, 'Response']}
                />
                <Line type="monotone" dataKey="ms" stroke={METRIC.chart} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <Group justify="center" gap={48} mt="lg" pt="md" style={{ borderTop: '1px solid var(--card-border)' }}>
              {[
                { label: 'Average', value: responseStats.avg },
                { label: 'Minimum', value: responseStats.min },
                { label: 'Maximum', value: responseStats.max },
              ].map(({ label, value }) => (
                <Stack key={label} gap={2} align="center">
                  <Text size="xs" c="var(--text-secondary)">{label}</Text>
                  <Text fw={700} c="var(--text-primary)">{value != null ? `${value} ms` : '—'}</Text>
                </Stack>
              ))}
            </Group>
          </>
        ) : (
          <Center h={160}>
            <Text c="var(--text-secondary)" size="sm" ta="center">
              {chartChecks.length > 0
                ? `No successful checks in the last ${chartRange.label.toLowerCase()}.`
                : 'No check data yet. Ensure the worker is running.'}
            </Text>
          </Center>
        )}
      </Box>

      {/* Incidents */}
      <Box className="stats-card">
        <Text fw={600} c="var(--text-primary)" mb="sm">Incidents.</Text>
        {metricsLoading ? (
          <Stack gap="xs">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={36} radius="sm" />
            ))}
          </Stack>
        ) : (stats?.incidents || []).length === 0 ? (
          <Text c="var(--text-secondary)" size="sm">No incidents recorded — looking good!</Text>
        ) : (
          <Table highlightOnHover withTableBorder={false}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th c="var(--text-secondary)">Started</Table.Th>
                <Table.Th c="var(--text-secondary)">Resolved</Table.Th>
                <Table.Th c="var(--text-secondary)">Duration</Table.Th>
                <Table.Th c="var(--text-secondary)">Cause</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {stats.incidents.map((inc) => (
                <Table.Tr key={inc._id}>
                  <Table.Td c="var(--text-primary)">{dayjs(inc.startedAt).format('MMM D, HH:mm')}</Table.Td>
                  <Table.Td c="var(--text-primary)">
                    {inc.resolvedAt ? dayjs(inc.resolvedAt).format('MMM D, HH:mm') : (
                      <Text span c={STATUS.down} fw={500}>Open</Text>
                    )}
                  </Table.Td>
                  <Table.Td c="var(--text-primary)">{inc.durationSeconds ? formatDuration(inc.durationSeconds) : '—'}</Table.Td>
                  <Table.Td c="var(--text-secondary)">{inc.cause || '—'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Box>

      <AppModal
        opened={opened}
        onClose={close}
        title="Schedule maintenance"
        footer={(
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={close}>Cancel</Button>
            <Button color="brand" onClick={addMaintenance}>Save</Button>
          </Group>
        )}
      >
        <Stack>
          <Text size="sm" c="var(--text-muted)">Alerts will be suppressed during this window. Checks still run.</Text>
          <TextInput label="Starts at" type="datetime-local" value={maintForm.startsAt} onChange={(e) => setMaintForm({ ...maintForm, startsAt: e.target.value })} />
          <TextInput label="Ends at" type="datetime-local" value={maintForm.endsAt} onChange={(e) => setMaintForm({ ...maintForm, endsAt: e.target.value })} />
          <TextInput label="Note" value={maintForm.note} onChange={(e) => setMaintForm({ ...maintForm, note: e.target.value })} />
        </Stack>
      </AppModal>

      <MonitorFormModal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        monitorId={id}
        onSuccess={() => refreshAll()}
      />
      </div>
    </DashboardLayout>
  );
};

export default MonitorDetailPage;
