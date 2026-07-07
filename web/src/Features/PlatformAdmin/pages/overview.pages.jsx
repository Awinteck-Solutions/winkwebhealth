import { useEffect, useState } from 'react';
import {
  Title, Text, SimpleGrid, Paper, Stack, Group, Badge, Table, Anchor,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { PlatformAdminLayout } from '../../../components/PlatformAdminLayout';
import { platformAdminApi } from '../platform-admin.services';
import { CardsPageSkeleton } from '../../../components/PageSkeleton';

function StatCard({ label, value, sub, color }) {
  return (
    <Paper p="lg" radius="md" withBorder>
      <Stack gap={4}>
        <Text size="xs" tt="uppercase" fw={600} c="dimmed">{label}</Text>
        <Text size="xl" fw={700} c={color}>{value}</Text>
        {sub && <Text size="sm" c="dimmed">{sub}</Text>}
      </Stack>
    </Paper>
  );
}

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    platformAdminApi.overview()
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PlatformAdminLayout>
        <CardsPageSkeleton cards={4} />
      </PlatformAdminLayout>
    );
  }

  if (!data) {
    return (
      <PlatformAdminLayout>
        <Text c="red">Failed to load overview.</Text>
      </PlatformAdminLayout>
    );
  }

  return (
    <PlatformAdminLayout>
      <Stack gap="xl">
        <div>
          <Title order={2}>Platform overview</Title>
          <Text c="dimmed" mt={4}>Complete snapshot of tenants, monitors, and billing.</Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <StatCard
            label="Total tenants"
            value={data.users.total}
            sub={`${data.users.active} active · ${data.users.newThisWeek} new this week`}
          />
          <StatCard
            label="Plans"
            value={`${data.plans.pro} Pro`}
            sub={`${data.plans.free} on Free`}
            color="teal"
          />
          <StatCard
            label="Monitors"
            value={data.monitors.total}
            sub={`${data.monitors.up} up · ${data.monitors.down} down`}
          />
          <StatCard
            label="Est. MRR"
            value={`$${data.billing.mrrUsd}`}
            sub={`${data.billing.activeSubscriptions} active subs · $${data.billing.totalRevenueUsd} total revenue`}
            color="teal"
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Paper p="lg" radius="md" withBorder>
            <Title order={4} mb="md">Monitor health</Title>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm">Up</Text>
                <Badge color="green" variant="light">{data.monitors.up}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Down</Text>
                <Badge color="red" variant="light">{data.monitors.down}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Paused</Text>
                <Badge color="gray" variant="light">{data.monitors.paused}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Pending</Text>
                <Badge color="yellow" variant="light">{data.monitors.pending}</Badge>
              </Group>
            </Stack>
          </Paper>

          <Paper p="lg" radius="md" withBorder>
            <Title order={4} mb="md">Platform resources</Title>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm">Workspaces</Text>
                <Text fw={600}>{data.workspaces.total}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Alert channels</Text>
                <Text fw={600}>{data.integrations.alertChannels}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Status pages</Text>
                <Text fw={600}>{data.integrations.statusPages}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Team members</Text>
                <Text fw={600}>{data.integrations.teamMembers}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Open invoices</Text>
                <Text fw={600}>{data.billing.openInvoices}</Text>
              </Group>
            </Stack>
          </Paper>
        </SimpleGrid>

        <Paper p="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={4}>Recent signups</Title>
            <Anchor component={Link} to="/admin/tenants" size="sm">View all tenants</Anchor>
          </Group>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Email</Table.Th>
                <Table.Th>Plan</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Joined</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data.recentSignups || []).map((u) => (
                <Table.Tr key={u._id}>
                  <Table.Td>
                    <Anchor component={Link} to={`/admin/tenants/${u._id}`} size="sm">
                      {u.email}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" color={u.plan === 'PRO' ? 'teal' : 'gray'} variant="light">{u.plan}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" color={u.status === 'ACTIVE' ? 'green' : 'red'} variant="light">{u.status}</Badge>
                  </Table.Td>
                  <Table.Td>{dayjs(u.createdAt).format('MMM D, YYYY')}</Table.Td>
                </Table.Tr>
              ))}
              {(!data.recentSignups || data.recentSignups.length === 0) && (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed" size="sm">No signups in the last 7 days.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    </PlatformAdminLayout>
  );
}
