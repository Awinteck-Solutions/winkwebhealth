import { useCallback, useEffect, useState } from 'react';
import {
  Title, Text, Stack, Group, TextInput, Select, Table, Badge, Anchor, Pagination, Paper,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { PlatformAdminLayout } from '../../../components/PlatformAdminLayout';
import { platformAdminApi } from '../platform-admin.services';
import { TablePageSkeleton } from '../../../components/PageSkeleton';

export default function AdminTenantsPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    platformAdminApi.tenants({ page, search: search || undefined, plan: plan || undefined, status: status || undefined })
      .then((res) => {
        const d = res.data.data;
        setItems(d.items || []);
        setPages(d.pages || 1);
        setTotal(d.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, search, plan, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <PlatformAdminLayout>
      {loading && items.length === 0 ? (
        <TablePageSkeleton rows={8} columns={6} />
      ) : (
        <Stack gap="lg">
          <div>
            <Title order={2}>Tenants</Title>
            <Text c="dimmed" mt={4}>{total} workspace owners registered on the platform.</Text>
          </div>

          <Paper p="md" radius="md" withBorder>
            <Group gap="md" mb="md" wrap="wrap">
              <TextInput
                placeholder="Search email or name…"
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ flex: 1, minWidth: 200 }}
              />
              <Select
                placeholder="Plan"
                clearable
                data={[{ value: 'FREE', label: 'Free' }, { value: 'PRO', label: 'Pro' }]}
                value={plan || null}
                onChange={(v) => { setPlan(v || ''); setPage(1); }}
                w={120}
              />
              <Select
                placeholder="Status"
                clearable
                data={[{ value: 'ACTIVE', label: 'Active' }, { value: 'DEACTIVE', label: 'Deactivated' }]}
                value={status || null}
                onChange={(v) => { setStatus(v || ''); setPage(1); }}
                w={140}
              />
            </Group>

            <Table highlightOnHover striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tenant</Table.Th>
                  <Table.Th>Workspace</Table.Th>
                  <Table.Th>Plan</Table.Th>
                  <Table.Th>Monitors</Table.Th>
                  <Table.Th>Team</Table.Th>
                  <Table.Th>Joined</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((t) => (
                  <Table.Tr key={t.id}>
                    <Table.Td>
                      <Stack gap={2}>
                        <Anchor component={Link} to={`/admin/tenants/${t.id}`} fw={500} size="sm">
                          {t.email}
                        </Anchor>
                        <Group gap={6}>
                          <Badge size="xs" color={t.status === 'ACTIVE' ? 'green' : 'red'} variant="light">{t.status}</Badge>
                          {t.subscription && (
                            <Badge size="xs" color="teal" variant="outline">
                              {t.subscription.interval} · {t.subscription.provider}
                            </Badge>
                          )}
                        </Group>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{t.workspace?.name || '—'}</Text>
                      <Text size="xs" c="dimmed">{t.workspace?.slug}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={t.plan === 'PRO' ? 'teal' : 'gray'} variant="light">{t.plan}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{t.monitorCount}</Text>
                      {t.monitorsDown > 0 && (
                        <Text size="xs" c="red">{t.monitorsDown} down</Text>
                      )}
                    </Table.Td>
                    <Table.Td>{t.teamMemberCount}</Table.Td>
                    <Table.Td>{dayjs(t.createdAt).format('MMM D, YYYY')}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {pages > 1 && (
              <Group justify="center" mt="md">
                <Pagination total={pages} value={page} onChange={setPage} />
              </Group>
            )}
          </Paper>
        </Stack>
      )}
    </PlatformAdminLayout>
  );
}
