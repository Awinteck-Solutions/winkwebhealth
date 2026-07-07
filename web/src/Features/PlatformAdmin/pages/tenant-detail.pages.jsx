import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Title, Text, Stack, Group, Badge, Paper, SimpleGrid, Table, Button, Select,
  Anchor, Divider,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { PlatformAdminLayout } from '../../../components/PlatformAdminLayout';
import { platformAdminApi } from '../platform-admin.services';
import { DetailPageSkeleton } from '../../../components/PageSkeleton';
import { STATUS } from '../../../constants/colors';

function statusColor(s) {
  if (s === 'UP') return STATUS.up;
  if (s === 'DOWN') return STATUS.down;
  if (s === 'PAUSED') return STATUS.paused;
  return STATUS.pending;
}

export default function AdminTenantDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    platformAdminApi.tenant(id)
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const update = async (body) => {
    setSaving(true);
    try {
      await platformAdminApi.updateTenant(id, body);
      notifications.show({ title: 'Updated', message: 'Tenant settings saved.', color: 'teal' });
      load();
    } catch {
      notifications.show({ title: 'Error', message: 'Could not update tenant.', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PlatformAdminLayout>
        <DetailPageSkeleton />
      </PlatformAdminLayout>
    );
  }

  if (!data?.user) {
    return (
      <PlatformAdminLayout>
        <Text c="red">Tenant not found.</Text>
      </PlatformAdminLayout>
    );
  }

  const { user, workspace, monitors, teamMembers, subscription, invoices, alertChannels, statusPages } = data;
  const name = [user.firstname, user.lastname].filter(Boolean).join(' ') || user.email;

  return (
    <PlatformAdminLayout>
      <Stack gap="lg">
        <Group>
          <Button component={Link} to="/admin/tenants" variant="subtle" leftSection={<IconArrowLeft size={16} />} size="sm">
            All tenants
          </Button>
        </Group>

        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div>
            <Title order={2}>{name}</Title>
            <Text c="dimmed">{user.email}</Text>
            <Group gap="xs" mt="xs">
              <Badge color={user.plan === 'PRO' ? 'teal' : 'gray'}>{user.plan}</Badge>
              <Badge color={user.status === 'ACTIVE' ? 'green' : 'red'}>{user.status}</Badge>
              {workspace && <Badge variant="outline">{workspace.slug}</Badge>}
            </Group>
          </div>
          <Group gap="sm">
            <Select
              label="Plan"
              data={[{ value: 'FREE', label: 'Free' }, { value: 'PRO', label: 'Pro' }]}
              value={user.plan}
              onChange={(v) => v && update({ plan: v })}
              disabled={saving}
              w={120}
            />
            <Select
              label="Account status"
              data={[{ value: 'ACTIVE', label: 'Active' }, { value: 'DEACTIVE', label: 'Deactivated' }]}
              value={user.status}
              onChange={(v) => v && update({ status: v })}
              disabled={saving}
              w={140}
            />
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          <Paper p="md" withBorder radius="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Monitors</Text>
            <Text size="xl" fw={700}>{monitors.length}</Text>
          </Paper>
          <Paper p="md" withBorder radius="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Team</Text>
            <Text size="xl" fw={700}>{teamMembers.length}</Text>
          </Paper>
          <Paper p="md" withBorder radius="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Alerts</Text>
            <Text size="xl" fw={700}>{alertChannels.length}</Text>
          </Paper>
          <Paper p="md" withBorder radius="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Status pages</Text>
            <Text size="xl" fw={700}>{statusPages.length}</Text>
          </Paper>
        </SimpleGrid>

        {subscription && (
          <Paper p="lg" withBorder radius="md">
            <Title order={5} mb="sm">Subscription</Title>
            <Group gap="md">
              <Badge color="teal">{subscription.provider}</Badge>
              <Text size="sm">{subscription.interval} · {subscription.status}</Text>
              <Text size="sm" c="dimmed">
                Period ends {dayjs(subscription.currentPeriodEnd).format('MMM D, YYYY')}
                {subscription.cancelAtPeriodEnd ? ' (cancels at period end)' : ''}
              </Text>
            </Group>
          </Paper>
        )}

        <Paper p="lg" withBorder radius="md">
          <Title order={5} mb="md">Monitors</Title>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Target</Table.Th>
                <Table.Th>Interval</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {monitors.map((m) => (
                <Table.Tr key={m.id}>
                  <Table.Td>{m.name}</Table.Td>
                  <Table.Td><Badge size="sm" variant="outline">{m.type}</Badge></Table.Td>
                  <Table.Td>
                    <Badge size="sm" style={{ background: `${statusColor(m.currentStatus)}22`, color: statusColor(m.currentStatus) }}>
                      {m.currentStatus}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" truncate maw={240}>{m.url || m.host || '—'}</Text>
                  </Table.Td>
                  <Table.Td>{m.intervalSeconds}s</Table.Td>
                </Table.Tr>
              ))}
              {monitors.length === 0 && (
                <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" size="sm">No monitors.</Text></Table.Td></Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Paper p="lg" withBorder radius="md">
            <Title order={5} mb="md">Team members</Title>
            <Stack gap="xs">
              {teamMembers.map((t) => (
                <Group key={t.id} justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>{t.name}</Text>
                    <Text size="xs" c="dimmed">{t.email}</Text>
                  </div>
                  <Group gap={6}>
                    <Badge size="sm" variant="light">{t.role}</Badge>
                    <Badge size="sm" color={t.status === 'ACTIVE' ? 'green' : 'gray'} variant="outline">{t.status}</Badge>
                  </Group>
                </Group>
              ))}
              {teamMembers.length === 0 && <Text c="dimmed" size="sm">No team members.</Text>}
            </Stack>
          </Paper>

          <Paper p="lg" withBorder radius="md">
            <Title order={5} mb="md">Recent invoices</Title>
            <Stack gap="xs">
              {invoices.map((inv) => (
                <Group key={inv.id} justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>{inv.invoiceNumber}</Text>
                    <Text size="xs" c="dimmed">{dayjs(inv.createdAt).format('MMM D, YYYY')}</Text>
                  </div>
                  <Group gap="xs">
                    <Text size="sm">${(inv.amountCents / 100).toFixed(2)}</Text>
                    <Badge size="sm" color={inv.status === 'paid' ? 'green' : inv.status === 'open' ? 'yellow' : 'gray'}>{inv.status}</Badge>
                  </Group>
                </Group>
              ))}
              {invoices.length === 0 && <Text c="dimmed" size="sm">No invoices.</Text>}
            </Stack>
          </Paper>
        </SimpleGrid>

        <Divider />
        <Text size="xs" c="dimmed">
          Joined {dayjs(user.createdAt).format('MMMM D, YYYY h:mm A')}
          {workspace && <> · Workspace <Anchor component={Link} to={`/status/${workspace.slug}`} size="xs">{workspace.slug}</Anchor></>}
        </Text>
      </Stack>
    </PlatformAdminLayout>
  );
}
