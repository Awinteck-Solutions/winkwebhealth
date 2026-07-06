import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Text, Loader, Center, Card, Group, Badge, Stack } from '@mantine/core';
import axios from 'axios';
import { statusPageEndpoints } from '../../Monitors/monitors.endpoints';
import dayjs from 'dayjs';

function UptimeBar({ checks }) {
  const days = 90;
  const buckets = Array.from({ length: days }, (_, i) => {
    const dayStart = dayjs().subtract(days - 1 - i, 'day').startOf('day');
    const dayEnd = dayStart.endOf('day');
    const dayChecks = checks.filter((c) => {
      const t = dayjs(c.checkedAt);
      return t.isAfter(dayStart) && t.isBefore(dayEnd);
    });
    if (dayChecks.length === 0) return 'empty';
    const up = dayChecks.filter((c) => c.status === 'UP').length;
    return up / dayChecks.length >= 0.5 ? 'up' : 'down';
  });

  const colors = { up: 'var(--brand)', down: '#e03131', empty: 'var(--card-border)' };

  return (
    <Group gap={2}>
      {buckets.map((b, i) => (
        <div key={i} style={{ width: 8, height: 24, borderRadius: 2, background: colors[b] }} title={`Day ${i + 1}`} />
      ))}
    </Group>
  );
}

const PublicStatusPage = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(statusPageEndpoints.PUBLIC(slug))
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Center h={300}><Loader /></Center>;
  if (!data) return <Center h={300}><Text>Status page not found</Text></Center>;

  const openIncidents = data.monitors.flatMap((m) =>
    (m.openIncidents || []).map((inc) => ({ ...inc, monitorName: m.name }))
  );

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
      <Text size="xl" fw={700} mb="lg">{data.title}</Text>

      {openIncidents.length > 0 && (
        <Card withBorder padding="md" mb="lg" style={{ borderColor: '#e03131' }}>
          <Text fw={600} c="red" mb="xs">Active incidents</Text>
          {openIncidents.map((inc, i) => (
            <Text key={i} size="sm">{inc.monitorName}: {inc.cause || 'Down since ' + dayjs(inc.startedAt).format('MMM D, HH:mm')}</Text>
          ))}
        </Card>
      )}

      <Stack gap="md">
        {data.monitors.map((m) => (
          <Card key={m.id} withBorder padding="md">
            <Group justify="space-between" mb="sm">
              <Text fw={600}>{m.name}</Text>
              <Badge color={m.currentStatus === 'UP' ? 'green' : m.currentStatus === 'DOWN' ? 'red' : 'gray'}>
                {m.currentStatus}
              </Badge>
            </Group>
            <UptimeBar checks={m.checks || []} />
            <Text size="xs" c="var(--text-muted)" mt="xs">90-day uptime history</Text>
          </Card>
        ))}
      </Stack>
    </div>
  );
};

export default PublicStatusPage;
