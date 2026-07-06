import { useEffect, useState } from 'react';
import { Loader, Center } from '@mantine/core';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { PageHeader, FEATURE_DESCRIPTIONS } from '../../../components/PageHeader';
import { PricingPlans } from '../../../components/PricingPlans';
import apiClient from '../../../utils/apiClient';
import { billingEndpoints } from '../../Monitors/monitors.endpoints';
import { canManageBilling } from '../../../utils/permissions';
import { Navigate } from 'react-router-dom';

const BillingPage = () => {
  const [plan, setPlan] = useState('FREE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(billingEndpoints.PLAN)
      .then((res) => setPlan(res.data.data?.plan || 'FREE'))
      .finally(() => setLoading(false));
  }, []);

  const upgrade = async () => {
    const res = await apiClient.post(billingEndpoints.CHECKOUT);
    if (res.data.data?.url) window.location.href = res.data.data.url;
  };

  const portal = async () => {
    const res = await apiClient.post(billingEndpoints.PORTAL);
    if (res.data.data?.url) window.location.href = res.data.data.url;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Center h={400}><Loader color="brand" /></Center>
      </DashboardLayout>
    );
  }

  if (!canManageBilling()) {
    return <Navigate to="/dashboard/monitors" replace />;
  }

  return (
    <DashboardLayout>
      <PageHeader title="Billing" description={FEATURE_DESCRIPTIONS.billing} />
      <PricingPlans
        variant="billing"
        currentPlan={plan}
        onUpgrade={upgrade}
        onManage={portal}
      />
    </DashboardLayout>
  );
};

export default BillingPage;
