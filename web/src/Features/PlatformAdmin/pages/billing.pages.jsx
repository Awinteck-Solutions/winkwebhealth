import { useCallback, useEffect, useState } from 'react';
import {
  Title, Text, Stack, Group, Table, Badge, Anchor, Pagination, Paper, Tabs, Select,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { PlatformAdminLayout } from '../../../components/PlatformAdminLayout';
import { platformAdminApi } from '../platform-admin.services';
import { TablePageSkeleton } from '../../../components/PageSkeleton';

function formatCharge(item) {
  if (item.chargeAmountMinor != null && item.chargeCurrency === 'GHS') {
    return `GH₵${(item.chargeAmountMinor / 100).toFixed(2)}`;
  }
  return `$${(item.amountCents / 100).toFixed(2)}`;
}

export default function AdminBillingPage() {
  const [tab, setTab] = useState('subscriptions');
  const [subs, setSubs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [subStatus, setSubStatus] = useState('');
  const [invStatus, setInvStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const req = tab === 'subscriptions'
      ? platformAdminApi.subscriptions({ page, status: subStatus || undefined })
      : platformAdminApi.invoices({ page, status: invStatus || undefined });

    req.then((res) => {
      const d = res.data.data;
      if (tab === 'subscriptions') setSubs(d.items || []);
      else setInvoices(d.items || []);
      setPages(d.pages || 1);
    }).finally(() => setLoading(false));
  }, [tab, page, subStatus, invStatus]);

  useEffect(() => { setPage(1); }, [tab, subStatus, invStatus]);
  useEffect(() => { load(); }, [load]);

  return (
    <PlatformAdminLayout>
      <Stack gap="lg">
        <div>
          <Title order={2}>Billing</Title>
          <Text c="dimmed" mt={4}>Subscriptions and invoices across all tenants.</Text>
        </div>

        <Tabs value={tab} onChange={setTab}>
          <Tabs.List>
            <Tabs.Tab value="subscriptions">Subscriptions</Tabs.Tab>
            <Tabs.Tab value="invoices">Invoices</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="subscriptions" pt="md">
            {loading && subs.length === 0 ? (
              <TablePageSkeleton rows={6} columns={5} />
            ) : (
              <Paper p="md" withBorder radius="md">
                <Select
                  placeholder="Filter status"
                  clearable
                  data={[
                    { value: 'active', label: 'Active' },
                    { value: 'past_due', label: 'Past due' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                  value={subStatus || null}
                  onChange={(v) => setSubStatus(v || '')}
                  mb="md"
                  w={160}
                />
                <Table highlightOnHover striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Tenant</Table.Th>
                      <Table.Th>Provider</Table.Th>
                      <Table.Th>Interval</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Period end</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {subs.map((s) => (
                      <Table.Tr key={s.id}>
                        <Table.Td>
                          <Anchor component={Link} to={`/admin/tenants/${s.userId}`} size="sm">{s.userEmail}</Anchor>
                        </Table.Td>
                        <Table.Td><Badge variant="outline">{s.provider}</Badge></Table.Td>
                        <Table.Td>{s.interval}</Table.Td>
                        <Table.Td>
                          <Badge color={s.status === 'active' ? 'green' : s.status === 'past_due' ? 'yellow' : 'gray'}>{s.status}</Badge>
                          {s.cancelAtPeriodEnd && <Text size="xs" c="dimmed">Cancels at end</Text>}
                        </Table.Td>
                        <Table.Td>{dayjs(s.currentPeriodEnd).format('MMM D, YYYY')}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="invoices" pt="md">
            {loading && invoices.length === 0 ? (
              <TablePageSkeleton rows={6} columns={5} />
            ) : (
              <Paper p="md" withBorder radius="md">
                <Select
                  placeholder="Filter status"
                  clearable
                  data={[
                    { value: 'paid', label: 'Paid' },
                    { value: 'open', label: 'Open' },
                    { value: 'void', label: 'Void' },
                  ]}
                  value={invStatus || null}
                  onChange={(v) => setInvStatus(v || '')}
                  mb="md"
                  w={160}
                />
                <Table highlightOnHover striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Invoice</Table.Th>
                      <Table.Th>Tenant</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Date</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {invoices.map((inv) => (
                      <Table.Tr key={inv.id}>
                        <Table.Td>{inv.invoiceNumber}</Table.Td>
                        <Table.Td>
                          <Anchor component={Link} to={`/admin/tenants/${inv.userId}`} size="sm">{inv.userEmail}</Anchor>
                        </Table.Td>
                        <Table.Td>{formatCharge(inv)}</Table.Td>
                        <Table.Td>
                          <Badge color={inv.status === 'paid' ? 'green' : inv.status === 'open' ? 'yellow' : 'gray'}>{inv.status}</Badge>
                        </Table.Td>
                        <Table.Td>{dayjs(inv.paidAt || inv.createdAt).format('MMM D, YYYY')}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Tabs.Panel>
        </Tabs>

        {pages > 1 && (
          <Group justify="center">
            <Pagination total={pages} value={page} onChange={setPage} />
          </Group>
        )}
      </Stack>
    </PlatformAdminLayout>
  );
}
