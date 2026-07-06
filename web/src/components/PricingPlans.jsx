import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Badge, Box, Button, Group, Stack, Text, Title,
} from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import {
  PLANS, PLAN_FEATURE_LISTS, planPrice, ANNUAL_SAVINGS_PERCENT, STATUS,
} from '../constants/pricing';
import './pricing.css';

function BillingToggle({ value, onChange }) {
  return (
    <Group gap="md" justify="center" wrap="wrap" className="pricing-billing-toggle">
      <Text size="sm" c="var(--text-secondary)">
        Save ~{ANNUAL_SAVINGS_PERCENT}% with annual billing
      </Text>
      <Group gap={0} className="pricing-toggle-track">
        <button
          type="button"
          className={`pricing-toggle-option${value === 'annual' ? ' active' : ''}`}
          onClick={() => onChange('annual')}
        >
          Annual
        </button>
        <button
          type="button"
          className={`pricing-toggle-option${value === 'monthly' ? ' active' : ''}`}
          onClick={() => onChange('monthly')}
        >
          Monthly
        </button>
      </Group>
    </Group>
  );
}

function PriceDisplay({ planId, billingPeriod }) {
  const { amount, compareAt } = planPrice(planId, billingPeriod);

  if (planId === 'FREE') {
    return (
      <Group align="baseline" gap={6} className="pricing-price-row">
        <Text className="pricing-price-amount">$0</Text>
        <Text className="pricing-price-period">/month</Text>
      </Group>
    );
  }

  return (
    <Group align="baseline" gap={8} className="pricing-price-row">
      {compareAt != null && (
        <Text className="pricing-price-compare">${compareAt}</Text>
      )}
      <Text className="pricing-price-amount">${amount}</Text>
      <Text className="pricing-price-period">/month</Text>
    </Group>
  );
}

function PlanFeatureList({ planId }) {
  const features = PLAN_FEATURE_LISTS[planId] || [];

  return (
    <Stack gap={10} className="pricing-feature-list">
      {features.map(({ label, included }) => (
        <Group
          key={label}
          gap="sm"
          wrap="nowrap"
          align="flex-start"
          className={`pricing-feature-row${included ? '' : ' is-excluded'}`}
        >
          {included ? (
            <IconCheck size={16} color={STATUS.up} stroke={2.5} className="pricing-feature-icon" />
          ) : (
            <IconX size={16} color="var(--text-muted)" stroke={2} className="pricing-feature-icon" />
          )}
          <Text size="sm" c={included ? 'var(--text-secondary)' : 'var(--text-muted)'} lh={1.45}>
            {label}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}

function PlanCard({
  planId,
  billingPeriod,
  currentPlan,
  onUpgrade,
  onManage,
  signupPath = '/auth/signup',
}) {
  const plan = PLANS[planId];
  const isCurrent = currentPlan === planId;
  const isPro = planId === 'PRO';

  let action = null;
  if (currentPlan != null) {
    if (isCurrent && isPro) {
      action = (
        <Button variant="light" color="brand" radius="md" fullWidth onClick={onManage}>
          Manage subscription
        </Button>
      );
    } else if (isCurrent) {
      action = (
        <Button variant="default" color="gray" radius="md" fullWidth disabled>
          Current plan
        </Button>
      );
    } else if (isPro) {
      action = (
        <Button color="brand" radius="md" fullWidth className="pricing-cta-primary" onClick={onUpgrade}>
          Upgrade to Pro
        </Button>
      );
    } else {
      action = null;
    }
  } else if (isPro) {
    action = (
      <Button
        component={Link}
        to={signupPath}
        color="brand"
        radius="md"
        fullWidth
        className="pricing-cta-primary"
      >
        {plan.cta}
      </Button>
    );
  } else {
    action = (
      <Button
        component={Link}
        to={signupPath}
        variant="default"
        color="gray"
        radius="md"
        fullWidth
        className="pricing-cta-outline"
      >
        {plan.cta}
      </Button>
    );
  }

  return (
    <Box className={`pricing-card${plan.popular ? ' pricing-card--popular' : ''}${isCurrent ? ' pricing-card--current' : ''}`}>
      {plan.popular && (
        <Badge className="pricing-popular-badge" variant="filled" color="brand" radius="sm">
          Most popular
        </Badge>
      )}
      {isCurrent && (
        <Badge className="pricing-current-badge" variant="light" color="brand" radius="sm">
          Current plan
        </Badge>
      )}

      <Stack gap="md" className="pricing-card-body">
        <div>
          <Text className="pricing-plan-name">{plan.name}</Text>
          <PriceDisplay planId={planId} billingPeriod={billingPeriod} />
          <Text size="sm" c="var(--text-secondary)" mt="sm" lh={1.5}>
            {plan.tagline}
          </Text>
        </div>

        {action}

        <PlanFeatureList planId={planId} />
      </Stack>
    </Box>
  );
}

export function PricingPlans({
  variant = 'landing',
  currentPlan,
  onUpgrade,
  onManage,
  showHeader = true,
  signupPath = '/auth/signup',
}) {
  const [billingPeriod, setBillingPeriod] = useState('annual');

  return (
    <Box className={`pricing-section pricing-section--${variant}`}>
      {showHeader && (
        <Stack align="center" gap="md" mb="xl" className="pricing-header">
          <Title order={2} className="pricing-headline" ta="center">
            {variant === 'billing'
              ? 'Choose the plan that fits your team.'
              : 'Unmatched affordability. Exceptional monitoring.'}
          </Title>
          <Text c="var(--text-secondary)" ta="center" maw={560} size="lg" lh={1.6}>
            {variant === 'billing'
              ? 'Upgrade for more monitors and faster check intervals. Cancel anytime.'
              : 'Start free with HTTP monitoring and email alerts. Upgrade when you need more monitors, faster checks, or team features.'}
          </Text>
          <BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
        </Stack>
      )}

      {!showHeader && (
        <Box mb="lg">
          <BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
        </Box>
      )}

      <div className="pricing-cards-grid">
        <PlanCard planId="FREE" billingPeriod={billingPeriod} currentPlan={currentPlan} signupPath={signupPath} />
        <PlanCard
          planId="PRO"
          billingPeriod={billingPeriod}
          currentPlan={currentPlan}
          onUpgrade={onUpgrade}
          onManage={onManage}
          signupPath={signupPath}
        />
      </div>
    </Box>
  );
}
