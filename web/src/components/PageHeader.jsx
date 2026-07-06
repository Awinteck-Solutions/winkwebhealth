import { Stack, Text, Group } from '@mantine/core';

export const PageHeader = ({ title, description, action }) => (
  <Group justify="space-between" align="flex-start" mb="xl" className="page-header">
    <Stack gap={6} style={{ minWidth: 0, flex: 1 }}>
      <Text size="xl" fw={700} c="var(--text-primary)">{title}{title && !title.endsWith('.') ? '.' : ''}</Text>
      {description && (
        <Text size="sm" c="var(--text-secondary)" maw={560} lh={1.6}>
          {description}
        </Text>
      )}
    </Stack>
    {action}
  </Group>
);

export const FEATURE_DESCRIPTIONS = {
  monitors:
    'Track uptime for your websites and services. WinkWebHealth checks HTTP endpoints, keyword content, TCP ports, SSL certificates, and DNS records on a schedule.',
  monitorNew:
    'Set up a new check. Choose HTTP, Keyword, Port, SSL certificate expiry, or DNS record monitoring. Pick alert channels to notify you when status changes.',
  monitorEdit:
    'Update monitor settings, check interval, timeout, and linked alert channels. Changes take effect on the next scheduled check.',
  alerts:
    'Connect Slack, Discord, email, or webhooks to get notified when monitors go down or recover. Add integrations here, then link them to monitors during create or edit.',
  statusPages:
    'Publish a public page showing live status and 90-day uptime for selected monitors. Share the link with customers so they can see service health without logging in.',
  billing:
    'View your current plan and limits. Free includes 3 HTTP monitors at 5-minute intervals; Pro unlocks 50 monitors, all monitor types, and 1-minute checks.',
  team:
    'Invite colleagues by email. They receive an invitation, set their password, and join your workspace with the assigned role.',
};

export const Panel = ({ children, ...props }) => (
  <Stack
    gap="md"
    p="lg"
    style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: 12,
    }}
    {...props}
  >
    {children}
  </Stack>
);
