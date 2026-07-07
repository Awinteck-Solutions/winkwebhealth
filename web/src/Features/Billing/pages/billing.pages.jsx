import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Badge, Box, Button, Group, Stack, Text, Table, Anchor, Alert, Radio, Tooltip, Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { PageHeader, FEATURE_DESCRIPTIONS } from '../../../components/PageHeader';
import { PricingPlans } from '../../../components/PricingPlans';
import { CardsPageSkeleton } from '../../../components/PageSkeleton';
import { AppModal } from '../../../components/AppModal';
import { useConfirm } from '../../../components/ConfirmProvider';
import apiClient from '../../../utils/apiClient';
import { billingEndpoints } from '../../Monitors/monitors.endpoints';
import { canManageBilling } from '../../../utils/permissions';
import { Navigate } from 'react-router-dom';
import { PRO_MONTHLY_PRICE, PRO_ANNUAL_MONTHLY_PRICE } from '../../../constants/pricing';

function formatUsd(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatInvoiceDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function CheckoutPaymentModal({
  opened,
  onClose,
  interval,
  pricing,
  providers,
  provider,
  onProviderChange,
  onConfirm,
  loading,
}) {
  const isYearly = interval === 'yearly';
  const planPricing = isYearly ? pricing?.yearly : pricing?.monthly;
  const usdDisplay = isYearly
    ? `$${PRO_ANNUAL_MONTHLY_PRICE}/mo billed annually (${planPricing?.usdLabel || '$84.00'}/yr)`
    : `$${PRO_MONTHLY_PRICE}/mo (${planPricing?.usdLabel || '$9.00'}/mo)`;

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Choose payment method"
      size="md"
      footer={(
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button color="brand" onClick={onConfirm} loading={loading}>
            Continue to payment
          </Button>
        </Group>
      )}
    >
      <Stack gap="md">
        <Box p="md" style={{ border: '1px solid var(--card-border)', borderRadius: 10, background: 'var(--card-bg)' }}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={4}>
              <Text fw={700} c="var(--text-primary)">Pro plan</Text>
              <Text size="sm" c="var(--text-secondary)">
                {isYearly ? 'Annual billing' : 'Monthly billing'}
              </Text>
            </Stack>
            <Badge color="brand" variant="light">{isYearly ? 'Yearly' : 'Monthly'}</Badge>
          </Group>
            <Divider my="sm" color="var(--card-border)" />
          <Text fw={600} c="var(--text-primary)">{usdDisplay}</Text>
          {planPricing?.ghsLabel && (
            <Text size="sm" c="var(--text-secondary)" mt={6}>
              Paystack charge: <strong style={{ color: 'var(--text-primary)' }}>{planPricing.ghsLabel}</strong>
              {pricing?.usdToGhsRate ? (
                <>
                  {' · '}
                  1 USD ≈ {Number(pricing.usdToGhsRate).toFixed(2)} GHS
                  {pricing.rateSource && pricing.rateSource !== 'env-fallback' ? ' (live rate)' : ' (fallback rate)'}
                </>
              ) : null}
            </Text>
          )}
        </Box>

        <Stack gap="xs">
          <Text fw={600} size="sm" c="var(--text-primary)">Payment provider</Text>
          <Radio.Group value={provider} onChange={onProviderChange}>
            <Stack gap="sm">
              {providers.map((p) => (
                <Box
                  key={p.id}
                  p="sm"
                  style={{
                    border: `1px solid ${provider === p.id ? 'var(--brand)' : 'var(--card-border)'}`,
                    borderRadius: 10,
                    background: provider === p.id ? 'var(--nav-active-bg)' : 'var(--card-bg)',
                    opacity: p.enabled ? 1 : 0.65,
                  }}
                >
                  <Tooltip
                    label={p.enabled ? `Pay with ${p.label}` : `${p.label} is not configured yet`}
                    disabled={p.enabled}
                  >
                    <Radio
                      value={p.id}
                      label={(
                        <Stack gap={0}>
                          <Text size="sm" fw={600} c="var(--text-primary)">{p.label}</Text>
                          <Text size="xs" c="var(--text-muted)">
                            {p.id === 'PAYSTACK'
                              ? 'Card, mobile money & bank (charged in GHS)'
                              : 'International cards (USD)'}
                          </Text>
                        </Stack>
                      )}
                      disabled={!p.enabled}
                    />
                  </Tooltip>
                </Box>
              ))}
            </Stack>
          </Radio.Group>
          {!providers.some((p) => p.enabled) && (
            <Text size="sm" c="var(--text-muted)">
              Add PAYSTACK_SECRET_KEY to enable payments.
            </Text>
          )}
        </Stack>
      </Stack>
    </AppModal>
  );
}

const BillingPage = () => {
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState('PAYSTACK');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState('yearly');

  const loadPlan = useCallback(() => {
    setLoading(true);
    apiClient.get(billingEndpoints.PLAN)
      .then((res) => {
        const data = res.data.data || {};
        setBillingData(data);
        const enabled = (data.providers || []).find((p) => p.enabled);
        if (enabled) setProvider(enabled.id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  useEffect(() => {
    const payment = searchParams.get('payment');
    const ref = searchParams.get('ref');
    if (payment && ref) {
      apiClient.post(billingEndpoints.VERIFY, { reference: ref })
        .then(() => {
          notifications.show({ title: 'Payment successful', message: 'Your Pro plan is now active.', color: 'green' });
          loadPlan();
        })
        .catch(() => {
          notifications.show({ title: 'Verification pending', message: 'We are confirming your payment.', color: 'yellow' });
        })
        .finally(() => setSearchParams({}, { replace: true }));
    }
  }, [searchParams, setSearchParams, loadPlan]);

  const openCheckoutModal = (interval) => {
    setSelectedInterval(interval);
    setCheckoutModalOpen(true);
  };

  const closeCheckoutModal = () => {
    if (!checkoutLoading) setCheckoutModalOpen(false);
  };

  const confirmCheckout = async () => {
    const selected = billingData?.providers?.find((p) => p.id === provider);
    if (!selected?.enabled) {
      notifications.show({ title: 'Unavailable', message: `${selected?.label || 'This provider'} is not configured yet.`, color: 'red' });
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await apiClient.post(billingEndpoints.CHECKOUT, {
        provider,
        interval: selectedInterval,
      });
      const url = res.data.data?.url;
      if (url) window.location.href = url;
    } catch (err) {
      notifications.show({
        title: 'Checkout failed',
        message: err.response?.data?.message || 'Could not start checkout',
        color: 'red',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const portal = async () => {
    try {
      const res = await apiClient.post(billingEndpoints.PORTAL);
      if (res.data.data?.url) window.location.href = res.data.data.url;
    } catch (err) {
      notifications.show({
        title: 'Portal unavailable',
        message: err.response?.data?.message || 'Stripe billing portal is not available',
        color: 'yellow',
      });
    }
  };

  const handleCancel = async () => {
    const endDate = billingData?.subscription?.currentPeriodEnd
      ? formatInvoiceDate(billingData.subscription.currentPeriodEnd)
      : 'the end of your billing period';
    const ok = await confirm({
      title: 'Cancel Pro subscription?',
      message: `Your Pro plan stays active until ${endDate}. After that you'll move to the Free plan.`,
      confirmLabel: 'Cancel subscription',
      danger: true,
    });
    if (!ok) return;

    setCancelLoading(true);
    try {
      await apiClient.post(billingEndpoints.CANCEL);
      notifications.show({
        title: 'Cancellation scheduled',
        message: `Pro remains active until ${endDate}.`,
        color: 'brand',
      });
      loadPlan();
    } catch (err) {
      notifications.show({
        title: 'Could not cancel',
        message: err.response?.data?.message || 'Something went wrong',
        color: 'red',
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const providers = useMemo(() => billingData?.providers || [], [billingData]);

  if (loading) {
    return (
      <DashboardLayout>
        <CardsPageSkeleton cards={2} />
      </DashboardLayout>
    );
  }

  if (!canManageBilling()) {
    return <Navigate to="/dashboard/monitors" replace />;
  }

  const invoices = billingData?.invoices || [];
  const webUrl = window.location.origin;

  return (
    <DashboardLayout>
      <PageHeader title="Billing" description={FEATURE_DESCRIPTIONS.billing} />

      {searchParams.get('success') === 'true' && (
        <Alert color="green" mb="md" title="Subscription updated">Your plan has been upgraded successfully.</Alert>
      )}

      <PricingPlans
        variant="billing"
        currentPlan={billingData?.plan || 'FREE'}
        subscription={billingData?.subscription}
        onUpgrade={openCheckoutModal}
        onManage={portal}
        onCancel={handleCancel}
        cancelLoading={cancelLoading}
      />

      <CheckoutPaymentModal
        opened={checkoutModalOpen}
        onClose={closeCheckoutModal}
        interval={selectedInterval}
        pricing={billingData?.pricing}
        providers={providers}
        provider={provider}
        onProviderChange={setProvider}
        onConfirm={confirmCheckout}
        loading={checkoutLoading}
      />

      {billingData?.subscription && (
        <Alert
          color={billingData.subscription.cancelAtPeriodEnd ? 'yellow' : 'teal'}
          variant="light"
          mt="xl"
          title={billingData.subscription.cancelAtPeriodEnd ? 'Cancellation scheduled' : 'Active subscription'}
        >
          {billingData.subscription.interval === 'yearly' ? 'Annual' : 'Monthly'} Pro plan
          {' · '}
          {billingData.subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews'}
          {' '}
          {formatInvoiceDate(billingData.subscription.currentPeriodEnd)}
          {' · '}
          via {billingData.subscription.provider}
        </Alert>
      )}

      {invoices.length > 0 && (
        <Stack gap="md" mt="xl">
          <Text fw={600} size="lg" c="var(--text-primary)">Invoices</Text>
          <Box style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Invoice</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Period start</Table.Th>
                  <Table.Th>Period end</Table.Th>
                  <Table.Th>Paid</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {invoices.map((inv) => (
                  <Table.Tr key={inv.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>{inv.invoiceNumber}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text size="sm">{formatUsd(inv.amountCents)}</Text>
                        {inv.chargeCurrency === 'GHS' && inv.chargeAmountMinor && (
                          <Text size="xs" c="var(--text-muted)">
                            GH₵{(inv.chargeAmountMinor / 100).toFixed(2)} charged
                          </Text>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={inv.status === 'paid' ? 'green' : inv.status === 'open' ? 'yellow' : 'gray'}
                        variant="light"
                        size="sm"
                      >
                        {inv.status.toUpperCase()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="var(--text-secondary)">{formatInvoiceDate(inv.periodStart)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="var(--text-secondary)">{formatInvoiceDate(inv.periodEnd)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="var(--text-secondary)">{formatInvoiceDate(inv.paidAt)}</Text>
                    </Table.Td>
                    <Table.Td>
                      {inv.status === 'open' && inv.paymentUrl && (
                        <Anchor href={inv.paymentUrl} target="_blank" rel="noreferrer" size="sm" c="brand">
                          Pay now
                        </Anchor>
                      )}
                      {inv.status === 'paid' && inv.receiptToken && (
                        <Anchor href={`${webUrl}/receipt/${inv.receiptToken}`} size="sm" c="brand">
                          Receipt
                        </Anchor>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        </Stack>
      )}
    </DashboardLayout>
  );
};

export default BillingPage;
