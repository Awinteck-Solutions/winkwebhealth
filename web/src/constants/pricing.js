import { STATUS } from './colors';

export const PRO_MONTHLY_PRICE = 9;
export const PRO_ANNUAL_MONTHLY_PRICE = 7;
export const ANNUAL_SAVINGS_PERCENT = 20;

export const PLAN_LIMITS = {
  FREE: {
    maxMonitors: 3,
    minIntervalSeconds: 300,
    allowedMonitorTypes: ['HTTP'],
    allowedAlertTypes: ['EMAIL'],
    maxStatusPages: 1,
    teamInvites: false,
    maintenanceWindows: false,
  },
  PRO: {
    maxMonitors: 50,
    minIntervalSeconds: 60,
    allowedMonitorTypes: ['HTTP', 'KEYWORD', 'PORT', 'SSL', 'DNS'],
    allowedAlertTypes: ['EMAIL', 'DISCORD', 'SLACK', 'WEBHOOK'],
    maxStatusPages: 50,
    teamInvites: true,
    maintenanceWindows: true,
  },
};

export const PLANS = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    tagline: 'Perfect for side projects and personal sites. No credit card required.',
    cta: 'Register now',
    ctaVariant: 'outline',
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    tagline: 'For production apps, teams, and faster incident response.',
    cta: 'Subscribe now',
    ctaVariant: 'filled',
    popular: true,
  },
};

/** Per-plan feature rows — each card shows only its own list (no duplicate monitor counts). */
export const PLAN_FEATURE_LISTS = {
  FREE: [
    { label: '3 monitors', included: true },
    { label: '5 min. check interval', included: true },
    { label: 'HTTP website monitoring', included: true },
    { label: 'Email alerts', included: true },
    { label: 'Incident tracking & uptime history', included: true },
    { label: '1 public status page', included: true },
    { label: 'Keyword, port, SSL & DNS monitors', included: false },
    { label: 'Slack, Discord & webhook alerts', included: false },
    { label: 'Maintenance windows', included: false },
    { label: 'Team workspaces', included: false },
    { label: 'Priority support', included: false },
  ],
  PRO: [
    { label: '50 monitors', included: true },
    { label: '1 min. check interval', included: true },
    { label: 'All monitor types (HTTP, keyword, port, SSL, DNS)', included: true },
    { label: 'Email, Slack, Discord & webhook alerts', included: true },
    { label: 'Incident tracking & uptime history', included: true },
    { label: 'Unlimited status pages', included: true },
    { label: 'Maintenance windows', included: true },
    { label: 'Team workspaces & role-based access', included: true },
    { label: 'Priority support', included: true },
  ],
};

export function planPrice(planId, billingPeriod) {
  if (planId === 'FREE') return { amount: 0, compareAt: null };
  const amount = billingPeriod === 'annual' ? PRO_ANNUAL_MONTHLY_PRICE : PRO_MONTHLY_PRICE;
  const compareAt = billingPeriod === 'annual' ? PRO_MONTHLY_PRICE : null;
  return { amount, compareAt };
}

export { STATUS };
