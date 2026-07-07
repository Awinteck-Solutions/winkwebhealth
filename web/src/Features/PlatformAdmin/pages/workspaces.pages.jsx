import { useCallback, useEffect, useState } from 'react';
import {
  Title, Text, Stack, Group, TextInput, Table, Badge, Anchor, Pagination, Paper,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { PlatformAdminLayout } from '../../../components/PlatformAdminLayout';
import { platformAdminApi } from '../platform-admin.services';
import { TablePageSkeleton } from '../../../components/PageSkeleton';

export default function AdminWorkspacesPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    platformAdminApi.workspaces({ page, search: search || undefined })
      .then((res) => {
        const d = res.data.data;
        setItems(d.items || []);
        setPages(d.pages || 1);
        setTotal(d.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <PlatformAdminLayout>
      {loading && items.length === 0 ? (
        <TablePageSkeleton rows={8} columns={5} />
      ) : (
        <Stack gap="lg">
          <div>
            <Title order={2}>Workspaces</Title>
            <Text c="dimmed" mt={4}>{total} workspaces across the platform.</Text>
          </div>

          <Paper p="md" radius="md" withBorder>
            <TextInput
              placeholder="Search workspace or owner email…"
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              mb="md"
              maw={400}
            />

            <Table highlightOnHover striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Workspace</Table.Th>
                  <Table.Th>Owner</Table.Th>
                  <Table.Th>Plan</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Created</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((w) => (
                  <Table.Tr key={w.id}>
                    <Table.Td>
                      <Text fw={500} size="sm">{w.name}</Text>
                      <Text size="xs" c="dimmed">{w.slug}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Anchor component={Link} to={`/admin/tenants/${w.owner?.id}`} size="sm">
                        {w.owner?.email}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={w.owner?.plan === 'PRO' ? 'teal' : 'gray'} variant="light">{w.owner?.plan}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={w.owner?.status === 'ACTIVE' ? 'green' : 'red'} variant="light">{w.owner?.status}</Badge>
                    </Table.Td>
                    <Table.Td>{dayjs(w.createdAt).format('MMM D, YYYY')}</Table.Td>
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
