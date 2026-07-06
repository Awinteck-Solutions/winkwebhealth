import { useState } from 'react';
import { Button, Text, Group, Container, Title, SimpleGrid, List, Stack, Box, TextInput, Anchor } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconActivity, IconBell, IconWorld, IconCertificate, IconWorldWww,
  IconNetwork, IconKey, IconChartLine, IconShieldCheck, IconUsers,
  IconCalendarTime, IconChevronRight, IconCheck,
} from '@tabler/icons-react';
import { BRAND, STATUS } from '../../constants/colors';
import { ThemeToggle } from '../../components/ThemeToggle';
import { MarketingLogo } from '../../components/MarketingLayout';
import { PricingPlans } from '../../components/PricingPlans';
import { DashboardPreview } from '../../components/DashboardPreview';
import './landing.css';

const heroBullets = [
  'HTTP monitoring on Free — all types on Pro',
  'Email alerts on Free — Slack, Discord & webhooks on Pro',
  'Incidents, status pages & uptime history',
  '3 monitors free — no credit card required',
];

const monitorTypes = [
  { icon: IconActivity, title: 'Website monitoring', description: 'Monitor any HTTP(S) endpoint or page and get alerted when it goes down.' },
  { icon: IconKey, title: 'Keyword monitoring', description: 'Verify a keyword appears or disappears in the response body.' },
  { icon: IconNetwork, title: 'Port monitoring', description: 'Confirm SMTP, databases, and TCP services are accepting connections.' },
  { icon: IconCertificate, title: 'SSL monitoring', description: 'Track certificate expiry and get warned before certificates expire.' },
  { icon: IconWorldWww, title: 'DNS monitoring', description: 'Catch unauthorized DNS changes and verify records resolve correctly.' },
  { icon: IconChartLine, title: 'Response time', description: 'Track latency over time with charts and historical check data.' },
];

const platformFeatures = [
  {
    icon: IconShieldCheck,
    title: 'Incidents & uptime history',
    description: 'Automatic incident tracking with duration, cause, and uptime percentages over 24 hours, 7 days, and 30 days.',
  },
  {
    icon: IconWorld,
    title: 'Public status pages',
    description: 'Share a branded status page with live monitor health, uptime bars, and incident history for your customers.',
  },
  {
    icon: IconBell,
    title: 'Multi-channel alerts',
    description: 'Email alerts on Free. Pro adds Slack, Discord, and custom webhooks — link channels per monitor.',
  },
  {
    icon: IconUsers,
    title: 'Team workspaces',
    description: 'Pro teams can invite collaborators with Admin, Member, or Viewer roles in a shared workspace.',
  },
  {
    icon: IconCalendarTime,
    title: 'Maintenance windows',
    description: 'Schedule planned maintenance to suppress alerts while checks keep running — no false alarms during deploys.',
  },
  {
    icon: IconChartLine,
    title: 'Response time analytics',
    description: 'Track latency trends with 24-hour charts, per-check history, and average response times on every monitor.',
  },
];

const steps = [
  'Create a free account and invite your team',
  'Add monitors — URL, keyword, port, SSL, or DNS',
  'Link alert channels and publish a status page',
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');

  const startMonitoring = () => {
    const params = url.trim() ? `?url=${encodeURIComponent(url.trim())}` : '';
    navigate(`/auth/signup${params}`);
  };

  return (
    <Box className="landing-page">
      {/* Nav */}
      <Box className="landing-nav-wrap">
        <Container size="lg">
          <Group justify="space-between" py="md">
            <MarketingLogo />
            <Group gap="lg" visibleFrom="sm">
              <Anchor href="#features" className="landing-nav-link">Features</Anchor>
              <Anchor href="#monitoring" className="landing-nav-link">Monitoring</Anchor>
              <Anchor href="#pricing" className="landing-nav-link">Pricing</Anchor>
              <Anchor component={Link} to="/help" className="landing-nav-link">Help</Anchor>
            </Group>
            <Group gap="sm">
              <ThemeToggle />
              <Button component={Link} to="/auth/login" variant="subtle" color="gray">Log in</Button>
              <Button component={Link} to="/auth/signup" color="brand" radius="md">Get started free</Button>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Hero */}
      <Box className="landing-hero-section">
        <Container size="xl" px={{ base: 'md', sm: 'lg' }}>
          <Stack gap="xl" className="landing-hero-inner">
          <Stack gap="lg" maw={640} className="landing-hero-copy">
            <Text className="landing-eyebrow">Trusted uptime monitoring for modern teams</Text>
            <Title order={1} className="landing-headline">
              Know instantly when<br />your services go down.
            </Title>
            <List spacing="xs" className="landing-hero-list">
              {heroBullets.map((item) => (
                <List.Item key={item} icon={<IconCheck size={16} color={STATUS.up} stroke={2.5} />}>
                  <Text span c="var(--text-secondary)">{item}</Text>
                </List.Item>
              ))}
            </List>
            <Group className="landing-url-form" wrap="nowrap">
              <TextInput
                className="landing-url-input"
                placeholder="https://your-website.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startMonitoring()}
                radius="md"
                size="md"
                style={{ flex: 1 }}
              />
              <Button color="brand" size="md" radius="md" onClick={startMonitoring} className="landing-cta-btn">
                Start monitoring
              </Button>
            </Group>
            <Text size="sm" c="var(--text-muted)">No credit card required · Setup in 30 seconds</Text>
          </Stack>

          <Box className="landing-hero-preview landing-hero-preview-wide" visibleFrom="sm">
            <DashboardPreview />
          </Box>
        </Stack>
        </Container>
      </Box>

      {/* Platform features */}
      <Box className="landing-section landing-section-alt" id="features">
        <Container size="xl">
          <Stack gap="md" mb="xl" className="landing-section-intro">
            <Title order={2} c="var(--text-primary)">Everything you need to stay online.</Title>
            <Text c="var(--text-secondary)" size="lg" lh={1.7} maw={720}>
              Monitor uptime, SSL certificates, ports, and DNS in real time. Track incidents,
              alert your team, schedule maintenance, and share status pages — all from one dashboard.
            </Text>
          </Stack>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 'md', md: 'lg', lg: 'xl' }} className="landing-features-grid">
            {platformFeatures.map(({ icon: Icon, title, description }) => (
              <Box key={title} className="landing-feature-card">
                <Group gap="md" wrap="nowrap" align="flex-start" mb="sm" className="landing-feature-card-header">
                  <Box className="landing-feature-icon">
                    <Icon size={22} color={BRAND.primary} stroke={1.75} />
                  </Box>
                  <Text fw={600} c="var(--text-primary)" className="landing-feature-title">{title}</Text>
                </Group>
                <Text size="sm" c="var(--text-secondary)" lh={1.65}>{description}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Monitor types */}
      <Box className="landing-section" id="monitoring">
        <Container size="xl">
          <Stack gap="xs" mb="xl" className="landing-section-intro">
            <Title order={2} c="var(--text-primary)">Every monitor type you need.</Title>
            <Text c="var(--text-secondary)" maw={640}>
              From simple HTTP pings to SSL expiry, keyword checks, and DNS record validation — all in one dashboard.
            </Text>
          </Stack>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" className="landing-monitor-grid">
            {monitorTypes.map(({ icon: Icon, title, description }) => (
              <Box key={title} className="landing-monitor-type-card">
                <Group gap="sm" mb="sm" wrap="nowrap">
                  <Icon size={20} color={BRAND.primary} stroke={1.75} />
                  <Text fw={600} c="var(--text-primary)" size="sm">{title}</Text>
                </Group>
                <Text size="sm" c="var(--text-secondary)" lh={1.6}>{description}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* How it works */}
      <Box className="landing-section landing-section-alt">
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" align="center">
            <Stack gap="lg">
              <Title order={2} c="var(--text-primary)">Start monitoring in seconds.<br />Seriously.</Title>
              <Text c="var(--text-secondary)" size="lg" lh={1.7}>
                Add monitors in seconds, connect Slack or email alerts, invite teammates,
                and publish a status page — no agents to install.
              </Text>
              <Stack gap="md">
                {steps.map((step, i) => (
                  <Group key={step} gap="md" wrap="nowrap">
                    <Box className="landing-step-num">{i + 1}</Box>
                    <Text c="var(--text-secondary)">{step}</Text>
                  </Group>
                ))}
              </Stack>
              <Button component={Link} to="/auth/signup" color="brand" size="md" radius="md" w="fit-content">
                Start monitoring in 30 seconds
              </Button>
            </Stack>
            <Box className="landing-status-preview">
              <Text fw={600} c="var(--text-primary)" mb="md">status.yourcompany.com</Text>
              <Box className="landing-status-all-clear">
                <IconShieldCheck size={28} color={BRAND.primary} />
                <Text fw={600} c="var(--text-primary)" mt="sm">All systems operational</Text>
              </Box>
              {['Website', 'API', 'Database'].map((s) => (
                <Group key={s} justify="space-between" className="landing-status-row">
                  <Text size="sm" c="var(--text-secondary)">{s}</Text>
                  <Text size="sm" fw={600} className="landing-status-operational">Operational</Text>
                </Group>
              ))}
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Pricing */}
      <Box className="landing-section landing-pricing-section" id="pricing">
        <Container size="xl">
          <PricingPlans variant="landing" />
        </Container>
      </Box>

      {/* CTA banner */}
      <Box className="landing-cta-banner">
        <Container size="lg">
          <Group justify="space-between" align="center" wrap="wrap" gap="lg">
            <Stack gap={4}>
              <Title order={3} c="var(--text-primary)">Start monitoring in 30 seconds.</Title>
              <Text c="var(--text-secondary)">No credit card required. 3 monitors for free.</Text>
            </Stack>
            <Button
              component={Link}
              to="/auth/signup"
              color="brand"
              size="lg"
              radius="md"
              rightSection={<IconChevronRight size={18} />}
            >
              Get started free
            </Button>
          </Group>
        </Container>
      </Box>

      {/* Footer */}
      <Box className="landing-footer">
        <Container size="lg">
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="xl">
            <Stack gap="sm">
              <MarketingLogo size={28} />
              <Text size="sm" c="var(--text-muted)" maw={320}>
                Uptime monitoring with instant alerts, incident tracking, status pages, and team workspaces.
              </Text>
            </Stack>
            <Group gap="xl" align="flex-start">
              <Stack gap="xs">
                <Text size="xs" fw={600} c="var(--text-secondary)" tt="uppercase">Product</Text>
                <Anchor href="#features" className="landing-footer-link">Features</Anchor>
                <Anchor href="#pricing" className="landing-footer-link">Pricing</Anchor>
                <Anchor component={Link} to="/auth/signup" className="landing-footer-link">Sign up</Anchor>
              </Stack>
              <Stack gap="xs">
                <Text size="xs" fw={600} c="var(--text-secondary)" tt="uppercase">Support</Text>
                <Anchor component={Link} to="/help" className="landing-footer-link">Help center</Anchor>
                <Anchor component={Link} to="/contact" className="landing-footer-link">Contact us</Anchor>
              </Stack>
              <Stack gap="xs">
                <Text size="xs" fw={600} c="var(--text-secondary)" tt="uppercase">Legal</Text>
                <Anchor component={Link} to="/legal" className="landing-footer-link">Terms & privacy</Anchor>
                <Anchor component={Link} to="/security" className="landing-footer-link">Security & compliance</Anchor>
              </Stack>
              <Stack gap="xs">
                <Text size="xs" fw={600} c="var(--text-secondary)" tt="uppercase">Account</Text>
                <Anchor component={Link} to="/auth/login" className="landing-footer-link">Log in</Anchor>
                <Anchor component={Link} to="/auth/signup" className="landing-footer-link">Get started</Anchor>
              </Stack>
            </Group>
          </Group>
          <Text size="xs" c="var(--text-muted)" mt="xl" ta="center">
            © {new Date().getFullYear()} WinkWebHealth. Downtime happens — get notified.
          </Text>
        </Container>
      </Box>
    </Box>
  );
};
