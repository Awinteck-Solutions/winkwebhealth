import {
  AppShell, NavLink, Group, Text, Button, Stack, Box, Burger, Badge, Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  IconLayoutDashboard, IconUsers, IconBuilding, IconCreditCard,
  IconActivity, IconArrowLeft, IconShieldLock,
} from '@tabler/icons-react';
import { logout, getAuthUser } from '../utils/auth';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';
import { SITE_NAME } from '../constants/site';

const navItems = [
  { label: 'Overview', path: '/admin', icon: IconLayoutDashboard, end: true },
  { label: 'Tenants', path: '/admin/tenants', icon: IconUsers },
  { label: 'Workspaces', path: '/admin/workspaces', icon: IconBuilding },
  { label: 'Billing', path: '/admin/billing', icon: IconCreditCard },
  { label: 'Monitors', path: '/admin/monitors', icon: IconActivity },
];

export function PlatformAdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAuthUser();
  const [opened, { toggle, close }] = useDisclosure();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const isActive = (path, end) => {
    if (end) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <AppShell
      className="dashboard-shell admin-shell"
      header={{ height: { base: 56, sm: 0 } }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding={{ base: 'sm', sm: 'md' }}
    >
      <AppShell.Header hiddenFrom="sm">
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} size="sm" aria-label="Toggle navigation" />
            <Group gap="xs">
              <IconShieldLock size={22} color="var(--brand-primary)" />
              <Text fw={700} size="sm">Admin</Text>
            </Group>
          </Group>
          <ThemeToggle />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" className="dashboard-sidebar">
        <Stack justify="space-between" h="100%">
          <Stack gap="md">
            <Group gap="sm" mb="xs">
              <BrandLogo size={36} />
              <Stack gap={0}>
                <Text fw={700} size="sm" c="var(--text-primary)">Platform Admin</Text>
                <Text size="xs" c="dimmed">{SITE_NAME}</Text>
              </Stack>
            </Group>

            <Badge size="sm" variant="light" color="dark" w="fit-content">Super admin</Badge>

            <Divider />

            <Stack gap={4}>
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  component={Link}
                  to={item.path}
                  label={item.label}
                  leftSection={<item.icon size={18} stroke={1.75} />}
                  active={isActive(item.path, item.end)}
                  onClick={close}
                  className="dashboard-nav-link"
                />
              ))}
            </Stack>
          </Stack>

          <Stack gap="sm">
            <Button
              component={Link}
              to="/dashboard/monitors"
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              fullWidth
              size="sm"
            >
              Back to app
            </Button>
            <Divider />
            <Text size="xs" c="dimmed" truncate>{user?.email}</Text>
            <Button variant="default" size="sm" onClick={handleLogout} fullWidth>
              Sign out
            </Button>
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
