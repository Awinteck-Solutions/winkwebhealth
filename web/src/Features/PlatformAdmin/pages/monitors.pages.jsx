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
import { STATUS } from '../../../constants/colors';

function statusColor(s) {
  if (s === 'UP') return STATUS.up;
  if (s === 'DOWN') return STATUS.down;
  if (s === 'PAUSED') return STATUS.paused;
  return STATUS.pending;
}

export default function AdminMonitorsPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    platformAdminApi.monitors({ page, search: search || undefined, status: status || undefined })
      .then((res) => {
        const d = res.data.data;
        setItems(d.items || []);
        setPages(d.pages || 1);
        setTotal(d.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <PlatformAdminLayout>
      {loading && items.length === 0 ? (
        <TablePageSkeleton rows={10} columns={6} />
      ) : (
        <Stack gap="lg">
          <div>
            <Title order={2}>All monitors</Title>
            <Text c="dimmed" mt={4}>{total} monitors across all tenants.</Text>
          </div>

          <Paper p="md" radius="md" withBorder>
            <Group gap="md" mb="md" wrap="wrap">
              <TextInput
                placeholder="Search name, URL, or host…"
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ flex: 1, minWidth: 200 }}
              />
              <Select
                placeholder="Status"
                clearable
                data={[
                  { value: 'UP', label: 'Up' },
                  { value: 'DOWN', label: 'Down' },
                  { value: 'PAUSED', label: 'Paused' },
                  { value: 'PENDING', label: 'Pending' },
                ]}
                value={status || null}
                onChange={(v) => { setStatus(v || ''); setPage(1); }}
                w={140}
              />
            </Group>

            <Table highlightOnHover striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Monitor</Table.Th>
                  <Table.Th>Tenant</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Target</Table.Th>
                  <Table.Th>Last check</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((m) => (
                  <Table.Tr key={m.id}>
                    <Table.Td>
                      <Text fw={500} size="sm">{m.name}</Text>
                      {!m.isActive && <Badge size="xs" color="gray">Inactive</Badge>}
                    </Table.Td>
                    <Table.Td>
                      <Anchor component={Link} to={`/admin/tenants/${m.userId}`} size="sm">{m.userEmail}</Anchor>
                    </Table.Td>
                    <Table.Td><Badge size="sm" variant="outline">{m.type}</Badge></Table.Td>
                    <Table.Td>
                      <Badge size="sm" style={{ background: `${statusColor(m.currentStatus)}22`, color: statusColor(m.currentStatus) }}>
                        {m.currentStatus}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" truncate maw={200}>{m.url || m.host || '—'}</Text>
                    </Table.Td>
                    <Table.Td>
                      {m.lastCheckedAt ? dayjs(m.lastCheckedAt).format('MMM D, HH:mm') : '—'}
                    </Table.Td>
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
