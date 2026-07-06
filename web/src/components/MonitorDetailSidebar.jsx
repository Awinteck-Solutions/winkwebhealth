import { Box, Stack, Text, Button, Group } from '@mantine/core';
import { STATUS } from '../constants/colors';
import { IconCalendar, IconBell, IconSettings, IconCertificate, IconWorldWww } from '@tabler/icons-react';
import dayjs from 'dayjs';

export function MonitorDetailSidebar({ monitor, maintenance, latestCheck, onScheduleMaintenance, readOnly = false }) {
  const nextMaint = maintenance
    .filter((w) => dayjs(w.startsAt).isAfter(dayjs()))
    .sort((a, b) => dayjs(a.startsAt).diff(dayjs(b.startsAt)))[0];

  const sslMeta = monitor.type === 'SSL' ? latestCheck?.metadata : null;
  const dnsMeta = monitor.type === 'DNS' ? latestCheck?.metadata : null;

  return (
    <Stack gap="md">
      {monitor.type === 'SSL' && (
        <Box className="stats-card">
          <Group gap="xs" mb="md">
            <IconCertificate size={16} color="var(--text-label)" />
            <Text className="stats-card-title" mb={0}>SSL certificate.</Text>
          </Group>
          {sslMeta ? (
            <Stack gap={8}>
              <Group justify="space-between">
                <Text size="xs" c="var(--text-label)">Subject</Text>
                <Text size="xs" c="var(--text-primary)" fw={500} ta="right">{sslMeta.subject || monitor.host}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="var(--text-label)">Expires</Text>
                <Text size="xs" c="var(--text-primary)" fw={500}>
                  {sslMeta.validTo ? dayjs(sslMeta.validTo).format('MMM D, YYYY') : '—'}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="var(--text-label)">Days remaining</Text>
                <Text size="xs" c={sslMeta.daysRemaining <= (monitor.sslAlertDaysBefore || 30) ? STATUS.down : STATUS.up} fw={500}>
                  {sslMeta.daysRemaining ?? '—'}
                </Text>
              </Group>
              {sslMeta.issuer && (
                <Group justify="space-between">
                  <Text size="xs" c="var(--text-label)">Issuer</Text>
                  <Text size="xs" c="var(--text-primary)" fw={500} ta="right">{sslMeta.issuer}</Text>
                </Group>
              )}
            </Stack>
          ) : (
            <Text size="sm" c="var(--text-secondary)">Waiting for first SSL check.</Text>
          )}
        </Box>
      )}

      {monitor.type === 'DNS' && (
        <Box className="stats-card">
          <Group gap="xs" mb="md">
            <IconWorldWww size={16} color="var(--text-label)" />
            <Text className="stats-card-title" mb={0}>DNS records.</Text>
          </Group>
          {dnsMeta?.records?.length ? (
            <Stack gap={8}>
              <Group justify="space-between">
                <Text size="xs" c="var(--text-label)">Record type</Text>
                <Text size="xs" c="var(--text-primary)" fw={500}>{dnsMeta.recordType || monitor.dnsRecordType || 'A'}</Text>
              </Group>
              {monitor.dnsExpectedValue && (
                <Group justify="space-between">
                  <Text size="xs" c="var(--text-label)">Expected</Text>
                  <Text size="xs" c="var(--text-primary)" fw={500} ta="right">{monitor.dnsExpectedValue}</Text>
                </Group>
              )}
              <Stack gap={4}>
                <Text size="xs" c="var(--text-label)">Resolved</Text>
                {dnsMeta.records.map((record) => (
                  <Text key={record} size="xs" c="var(--text-primary)" fw={500}>{record}</Text>
                ))}
              </Stack>
            </Stack>
          ) : (
            <Text size="sm" c="var(--text-secondary)">Waiting for first DNS check.</Text>
          )}
        </Box>
      )}

      <Box className="stats-card">
        <Group gap="xs" mb="md">
          <IconCalendar size={16} color="var(--text-label)" />
          <Text className="stats-card-title" mb={0}>Next maintenance.</Text>
        </Group>
        {nextMaint ? (
          <Stack gap={4}>
            <Text size="sm" c="var(--text-primary)" fw={500}>
              {dayjs(nextMaint.startsAt).format('MMM D, HH:mm')} — {dayjs(nextMaint.endsAt).format('HH:mm')}
            </Text>
            {nextMaint.note && <Text size="xs" c="var(--text-secondary)">{nextMaint.note}</Text>}
          </Stack>
        ) : (
          <Text size="sm" c="var(--text-secondary)" mb="md">No maintenance planned.</Text>
        )}
        {onScheduleMaintenance && !readOnly && (
        <Button variant="light" color="brand" size="xs" radius="md" onClick={onScheduleMaintenance}>
          Set up maintenance
        </Button>
        )}
      </Box>

      <Box className="stats-card">
        <Group gap="xs" mb="md">
          <IconSettings size={16} color="var(--text-label)" />
          <Text className="stats-card-title" mb={0}>Check settings.</Text>
        </Group>
        <Stack gap={8}>
          <Group justify="space-between">
            <Text size="xs" c="var(--text-label)">Type</Text>
            <Text size="xs" c="var(--text-primary)" fw={500}>{monitor.type}</Text>
          </Group>
          {monitor.type === 'SSL' && (
            <Group justify="space-between">
              <Text size="xs" c="var(--text-label)">Alert threshold</Text>
              <Text size="xs" c="var(--text-primary)" fw={500}>{monitor.sslAlertDaysBefore || 30} days</Text>
            </Group>
          )}
          {monitor.type === 'DNS' && (
            <Group justify="space-between">
              <Text size="xs" c="var(--text-label)">Record type</Text>
              <Text size="xs" c="var(--text-primary)" fw={500}>{monitor.dnsRecordType || 'A'}</Text>
            </Group>
          )}
          <Group justify="space-between">
            <Text size="xs" c="var(--text-label)">Interval</Text>
            <Text size="xs" c="var(--text-primary)" fw={500}>{Math.round(monitor.intervalSeconds / 60)} min</Text>
          </Group>
          <Group justify="space-between">
            <Text size="xs" c="var(--text-label)">Timeout</Text>
            <Text size="xs" c="var(--text-primary)" fw={500}>{monitor.timeoutSeconds}s</Text>
          </Group>
          <Group justify="space-between">
            <Text size="xs" c="var(--text-label)">Alert channels</Text>
            <Text size="xs" c="var(--text-primary)" fw={500}>{monitor.alertChannelIds?.length || 0}</Text>
          </Group>
        </Stack>
      </Box>

      <Box className="stats-card">
        <Group gap="xs" mb="sm">
          <IconBell size={16} color="var(--text-label)" />
          <Text className="stats-card-title" mb={0}>Alerts.</Text>
        </Group>
        <Text size="sm" c="var(--text-secondary)">
          {(monitor.alertChannelIds?.length || 0) > 0
            ? `${monitor.alertChannelIds.length} channel(s) linked to this monitor.`
            : 'No alert channels linked. Add channels and attach them in monitor settings.'}
        </Text>
      </Box>
    </Stack>
  );
}
