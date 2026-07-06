import { Box, Button, Container, Group, Stack, Text, Title, Anchor } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconHeartbeat } from '@tabler/icons-react';
import { ThemeToggle } from './ThemeToggle';
import { SITE_NAME } from '../constants/site';
import '../Features/Marketing/marketing.css';

export function MarketingLogo({ size = 32, linkTo = '/' }) {
  return (
    <Anchor component={Link} to={linkTo} underline="never" className="marketing-logo-link">
      <Group gap="sm" wrap="nowrap">
        <Box className="landing-logo" style={{ width: size, height: size }}>
          <IconHeartbeat size={size * 0.56} color="#fff" stroke={2.5} />
        </Box>
        <Title order={3} c="var(--text-primary)" fw={700} style={{ fontSize: size * 0.65 }}>
          {SITE_NAME}
        </Title>
      </Group>
    </Anchor>
  );
}

export function MarketingLayout({ children }) {
  return (
    <Box className="marketing-page">
      <Box className="landing-nav-wrap">
        <Container size="lg">
          <Group justify="space-between" py="md">
            <MarketingLogo />
            <Group gap="lg" visibleFrom="sm">
              <Anchor component={Link} to="/#features" className="landing-nav-link">Features</Anchor>
              <Anchor component={Link} to="/#monitoring" className="landing-nav-link">Monitoring</Anchor>
              <Anchor component={Link} to="/#pricing" className="landing-nav-link">Pricing</Anchor>
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

      <Box component="main" className="marketing-main">
        {children}
      </Box>

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
                <Anchor component={Link} to="/#features" className="landing-footer-link">Features</Anchor>
                <Anchor component={Link} to="/#pricing" className="landing-footer-link">Pricing</Anchor>
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
            © {new Date().getFullYear()} {SITE_NAME}. Downtime happens — get notified.
          </Text>
        </Container>
      </Box>
    </Box>
  );
}
