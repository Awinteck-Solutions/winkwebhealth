import { Box, Button, Container, Group, Stack, Text, Anchor } from '@mantine/core';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';
import { SITE_NAME } from '../constants/site';
import '../Features/Marketing/marketing.css';

export function MarketingLogo({ size = 32, linkTo = '/' }) {
  return (
    <BrandLogo size={size} showName linkTo={linkTo} nameSize={size * 0.65} />
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
                <Anchor component={Link} to="/#features" size="sm" c="var(--text-muted)">Features</Anchor>
                <Anchor component={Link} to="/#pricing" size="sm" c="var(--text-muted)">Pricing</Anchor>
                <Anchor component={Link} to="/help" size="sm" c="var(--text-muted)">Help center</Anchor>
              </Stack>
              <Stack gap="xs">
                <Text size="xs" fw={600} c="var(--text-secondary)" tt="uppercase">Company</Text>
                <Anchor component={Link} to="/contact" size="sm" c="var(--text-muted)">Contact</Anchor>
                <Anchor component={Link} to="/legal" size="sm" c="var(--text-muted)">Legal</Anchor>
                <Anchor component={Link} to="/security" size="sm" c="var(--text-muted)">Security</Anchor>
              </Stack>
            </Group>
          </Group>
          <Text size="xs" c="var(--text-muted)" mt="xl" ta="center">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </Text>
        </Container>
      </Box>
    </Box>
  );
}
