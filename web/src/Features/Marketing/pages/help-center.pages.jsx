import { Container, Stack, Text, Title, Accordion, SimpleGrid, Box, Anchor, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import {
  IconActivity, IconBell, IconWorld, IconUsers, IconCreditCard, IconHelp,
} from '@tabler/icons-react';
import { MarketingLayout } from '../../../components/MarketingLayout';
import { BRAND } from '../../../constants/colors';

const CATEGORIES = [
  {
    icon: IconActivity,
    title: 'Getting started',
    items: [
      {
        q: 'How do I create my first monitor?',
        a: 'Sign up for a free account, open Monitors, and click New. Choose a monitor type (HTTP on Free; keyword, port, SSL, and DNS on Pro), enter your target URL or host, set a check interval, and save. Checks begin within seconds.',
      },
      {
        q: 'What is included on the Free plan?',
        a: 'Free includes 3 HTTP monitors, 5-minute checks, email alerts, incident tracking, uptime history, and one public status page. Upgrade to Pro for more monitors, faster intervals, all monitor types, Slack/Discord/webhooks, team workspaces, and maintenance windows.',
      },
      {
        q: 'Do I need to install an agent?',
        a: 'No. WinkWebHealth runs checks from our infrastructure. You only provide URLs, hostnames, or ports to monitor.',
      },
    ],
  },
  {
    icon: IconBell,
    title: 'Alerts & incidents',
    items: [
      {
        q: 'How do alert notifications work?',
        a: 'When a monitor transitions from up to down (or back up), we create an incident and send alerts through your linked channels. Connect email on Free; add Slack, Discord, or webhooks on Pro under Integrations.',
      },
      {
        q: 'Why did I not receive an alert?',
        a: 'Confirm the monitor has alert channels linked, channels are active, and your email provider is not blocking messages. Check spam folders and verify SMTP settings if using a custom mail setup.',
      },
      {
        q: 'What counts as downtime?',
        a: 'A monitor is marked down when checks fail consecutively based on your configuration. Pending status appears briefly while we confirm failures before opening an incident.',
      },
    ],
  },
  {
    icon: IconWorld,
    title: 'Status pages',
    items: [
      {
        q: 'How do I publish a status page?',
        a: 'Go to Status pages, create a page with a unique slug, select monitors to display, and set it public. Share the link at /status/your-slug with customers.',
      },
      {
        q: 'Can I customize what appears on the status page?',
        a: 'Status pages show monitor health, uptime bars, and recent incidents for the monitors you include. Branding and custom domains may be added in future updates.',
      },
    ],
  },
  {
    icon: IconUsers,
    title: 'Team & access',
    items: [
      {
        q: 'Can I invite teammates?',
        a: 'Team invites are available on Pro. Owners can invite Admins, Members, or Viewers. Viewers have read-only access to monitors and cannot change settings.',
      },
      {
        q: 'Who can manage billing?',
        a: 'Only the workspace owner can upgrade, manage subscriptions, and access the Stripe customer portal.',
      },
    ],
  },
  {
    icon: IconCreditCard,
    title: 'Billing',
    items: [
      {
        q: 'How do I upgrade to Pro?',
        a: 'Open Billing from the sidebar (owner only) and click Upgrade to Pro. You will be redirected to Stripe for secure checkout.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes. Use Manage subscription in Billing to open the Stripe portal where you can cancel. Your Pro features remain until the end of the billing period.',
      },
    ],
  },
];

export default function HelpCenterPage() {
  return (
    <MarketingLayout>
      <Container size="md">
        <Stack gap="xl">
          <Stack gap="sm" className="marketing-hero">
            <Box className="marketing-security-pill">
              <IconHelp size={16} />
              Help center
            </Box>
            <Title order={1} className="marketing-hero-title">How can we help?</Title>
            <Text c="var(--text-secondary)" size="lg" className="marketing-hero-lead">
              Guides and answers for monitors, alerts, status pages, teams, and billing.
              Can&apos;t find what you need?{' '}
              <Anchor component={Link} to="/contact" c="brand">Contact us</Anchor>.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {CATEGORIES.map(({ icon: Icon, title }) => (
              <Box key={title} className="marketing-card">
                <Group gap="sm" mb="xs">
                  <Icon size={20} color={BRAND.primary} stroke={1.75} />
                  <Text fw={600} c="var(--text-primary)">{title}</Text>
                </Group>
                <Text size="sm" c="var(--text-muted)">
                  {CATEGORIES.find((c) => c.title === title)?.items.length} articles
                </Text>
              </Box>
            ))}
          </SimpleGrid>

          {CATEGORIES.map(({ title, items }) => (
            <Stack key={title} gap="sm">
              <Title order={2} size="h4" c="var(--text-primary)">{title}</Title>
              <Accordion variant="separated" radius="md" className="marketing-faq-list">
                {items.map(({ q, a }) => (
                  <Accordion.Item key={q} value={q} className="marketing-faq-item">
                    <Accordion.Control>{q}</Accordion.Control>
                    <Accordion.Panel>
                      <Text size="sm" c="var(--text-secondary)" lh={1.65}>{a}</Text>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Stack>
          ))}
        </Stack>
      </Container>
    </MarketingLayout>
  );
}