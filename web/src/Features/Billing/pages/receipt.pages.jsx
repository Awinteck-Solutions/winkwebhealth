import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Stack, Text, Title, Badge, Group, Anchor, Divider, Box } from '@mantine/core';
import { DetailPageSkeleton } from '../../../components/PageSkeleton';
import { BrandedDocumentPage } from '../../../components/BrandedDocumentShell';
import { BrandLogo } from '../../../components/BrandLogo';
import { SITE_NAME } from '../../../constants/site';
import axios from 'axios';
import { BASEURL } from '../../../constants/api.constant';

function formatUsd(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatCharge(invoice) {
  if (invoice.chargeAmountMinor != null && invoice.chargeCurrency === 'GHS') {
    return `GH₵${(invoice.chargeAmountMinor / 100).toFixed(2)}`;
  }
  return `${formatUsd(invoice.amountCents)} ${invoice.currency || 'USD'}`;
}

export default function ReceiptPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${BASEURL}/billing/receipt/${token}`)
      .then((res) => setData(res.data.data))
      .catch(() => setError('Receipt not found or payment is still pending.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <BrandedDocumentPage py="xl">
        <DetailPageSkeleton />
      </BrandedDocumentPage>
    );
  }

  if (error || !data?.invoice) {
    return (
      <Box py="xl" px="md" style={{ backgroundColor: '#EEF2F6', minHeight: '60vh' }}>
        <Box maw={600} mx="auto" ta="center" p="xl">
          <BrandLogo size={48} showName linkTo="/" />
          <Title order={2} mt="lg" mb="sm">Receipt unavailable</Title>
          <Text c="var(--text-secondary)" mb="lg">{error}</Text>
          <Anchor component={Link} to="/" c="brand">Back to home</Anchor>
        </Box>
      </Box>
    );
  }

  const { invoice, user } = data;
  const customerName = [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.email;

  return (
    <BrandedDocumentPage footerNote="Keep this receipt for your records.">
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Title order={2} c="#0F172A" style={{ letterSpacing: '-0.02em' }}>Payment receipt</Title>
          <Text size="sm" c="#64748B" mt={4}>{SITE_NAME} Pro subscription</Text>
        </div>
        <Badge color="green" variant="light" size="lg">Paid</Badge>
      </Group>

      <Divider color="#E2E8F0" mb="lg" />

      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="sm" c="#475569" fw={600}>Invoice</Text>
          <Text size="sm" fw={600} c="#0F172A">{invoice.invoiceNumber}</Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="#475569" fw={600}>Customer</Text>
          <Text size="sm" fw={600} c="#0F172A">{customerName}</Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="#475569" fw={600}>Amount</Text>
          <Text size="sm" fw={600} c="#047857">{formatCharge(invoice)}</Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="#475569" fw={600}>Billing period</Text>
          <Text size="sm" fw={600} c="#0F172A">
            {new Date(invoice.periodStart).toLocaleDateString()} – {new Date(invoice.periodEnd).toLocaleDateString()}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="#475569" fw={600}>Paid on</Text>
          <Text size="sm" fw={600} c="#0F172A">
            {invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : '—'}
          </Text>
        </Group>
      </Stack>

      <Text size="sm" c="#334155" ta="center" mt="xl">
        Thank you for subscribing to {SITE_NAME} Pro.
      </Text>
    </BrandedDocumentPage>
  );
}
