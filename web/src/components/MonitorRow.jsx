import { Link } from 'react-router-dom';
import { Group, Text, Box, ActionIcon, Menu } from '@mantine/core';
import { IconDots, IconEye, IconPlayerPause, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { StatusDot, UptimeBarMini } from './UptimeBarMini';
import { monitorTarget } from '../Features/Monitors/monitorForm.utils';
import { uptimeMetricColor } from '../constants/colors';
import { canWrite } from '../utils/permissions';

dayjs.extend(relativeTime);

function statusLabel(monitor) {
  const map = { UP: 'Up', DOWN: 'Down', PAUSED: 'Paused', PENDING: 'Pending' };
  const label = map[monitor.currentStatus] || 'Pending';
  if (monitor.lastCheckedAt && monitor.currentStatus === 'UP') {
    return `${monitor.type} · ${label} · ${dayjs(monitor.lastCheckedAt).fromNow(true)}`;
  }
  return `${monitor.type} · ${label}`;
}

export function MonitorRow({ monitor, checks = [], summaryLoading = false, onPause, onDelete, readOnly = !canWrite(), preview = false }) {
  const uptime = monitor.uptimePercent ?? (summaryLoading ? null : (monitor.currentStatus === 'UP' ? 100 : monitor.currentStatus === 'DOWN' ? 0 : null));

  const Row = preview ? Box : Link;
  const rowClassName = preview ? 'monitor-row monitor-row--preview' : 'monitor-row';
  const rowProps = preview
    ? { className: rowClassName }
    : { className: rowClassName, to: `/dashboard/monitors/${monitor._id}` };

  return (
    <Row {...rowProps}>
      <StatusDot status={monitor.currentStatus} size={12} />

      <Box style={{ minWidth: 0 }}>
        <Text fw={600} size="sm" c="var(--text-primary)" lineClamp={1}>
          {monitor.name}
        </Text>
        <Text size="xs" c="var(--text-muted)" lineClamp={1}>
          {monitorTarget(monitor)}
        </Text>
        <Text size="xs" c="var(--text-secondary)" mt={2}>
          {statusLabel(monitor)}
        </Text>
      </Box>

      {preview ? (
        <Box className="monitor-row-uptime" style={{ minWidth: 120 }}>
          <UptimeBarMini checks={checks} bars={40} />
        </Box>
      ) : (
        <Box className="monitor-row-uptime" style={{ minWidth: 120 }} visibleFrom="md">
          <UptimeBarMini checks={checks} bars={40} />
        </Box>
      )}

      <Text size="xs" c="var(--text-secondary)" style={{ whiteSpace: 'nowrap' }}>
        {Math.round(monitor.intervalSeconds / 60)} min
      </Text>

      <Text
        size="sm"
        fw={700}
        style={{
          whiteSpace: 'nowrap',
          minWidth: 48,
          textAlign: 'right',
          color: uptimeMetricColor(uptime),
        }}
      >
        {uptime !== null ? `${uptime}%` : summaryLoading ? '…' : '—'}
      </Text>

      {!readOnly && !preview && (
      <Menu shadow="md" width={160} position="bottom-end">
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <IconDots size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconEye size={14} />}
            component={Link}
            to={`/dashboard/monitors/${monitor._id}`}
          >
            View details
          </Menu.Item>
          <Menu.Item
            leftSection={<IconPlayerPause size={14} />}
            onClick={(e) => { e.preventDefault(); onPause?.(monitor); }}
          >
            {monitor.isActive ? 'Pause' : 'Resume'}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            color="red"
            leftSection={<IconTrash size={14} />}
            onClick={(e) => { e.preventDefault(); onDelete?.(monitor); }}
          >
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      )}
    </Row>
  );
}
