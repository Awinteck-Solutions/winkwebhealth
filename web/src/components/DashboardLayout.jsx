import {
  AppShell, NavLink, Group, Text, Button, Stack, Avatar, Box, Divider, Burger, Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  IconActivity, IconBell, IconWorld, IconCreditCard, IconLogout, IconHeartbeat, IconUsers,
} from '@tabler/icons-react';
import { STATUS } from '../constants/colors';
import { logout, getAuthUser } from '../utils/auth';
import { canManageBilling, canManageTeam, isViewer } from '../utils/permissions';
import { ThemeToggle } from './ThemeToggle';
import { ViewerBanner } from './ViewerBanner';

const allNavItems = [
  { label: 'Monitoring', path: '/dashboard/monitors', icon: IconActivity, show: () => true },
  { label: 'Integrations', path: '/dashboard/alerts', icon: IconBell, show: () => true },
  { label: 'Status pages', path: '/dashboard/status-pages', icon: IconWorld, show: () => true },
  { label: 'Team members', path: '/dashboard/team', icon: IconUsers, show: () => canManageTeam() },
  { label: 'Billing', path: '/dashboard/billing', icon: IconCreditCard, show: () => canManageBilling() },
];

function BrandMark({ size = 28 }) {
  return (
    <Box className="dashboard-sidebar-brand" style={{ width: size, height: size, borderRadius: size * 0.28 }}>
      <IconHeartbeat size={size * 0.55} color="#fff" stroke={2.5} />
    </Box>
  );
}

export const DashboardLayout = ({ children, aside }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAuthUser();
  const [opened, { toggle, close }] = useDisclosure();
  const navItems = allNavItems.filter((item) => item.show());
  const viewer = isViewer();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const initials = [user?.firstname?.[0], user?.lastname?.[0]].filter(Boolean).join('')
    || user?.email?.[0]?.toUpperCase()
    || '?';

  const roleBadge = viewer ? 'Viewer' : user?.teamRole === 'OWNER' ? null : user?.teamRole;

  return (
    <AppShell
      className="dashboard-shell"
      header={{ height: { base: 56, sm: 0 } }}
      navbar={{ width: 232, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding={{ base: 'sm', sm: 'md' }}
    >
      <AppShell.Header className="dashboard-header" hiddenFrom="sm">
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} size="sm" color="var(--text-primary)" aria-label="Toggle navigation" />
            <Group gap="xs">
              <BrandMark size={24} />
              <Text fw={700} size="sm" c="var(--text-primary)">WinkWebHealth</Text>
            </Group>
          </Group>
          <ThemeToggle />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" className="dashboard-sidebar">
        <Stack justify="space-between" h="100%">
          <Stack gap="lg">
            <Group gap="sm" px={4} visibleFrom="sm">
              <BrandMark />
              <Stack gap={0}>
                <Text fw={700} size="md" c="var(--text-primary)">WinkWebHealth</Text>
                <Text size="xs" c="var(--text-muted)">Uptime monitoring</Text>
              </Stack>
            </Group>

            <Stack gap={4}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    component={Link}
                    to={item.path}
                    label={item.label}
                    leftSection={<Icon size={18} stroke={1.5} />}
                    active={active}
                    variant="filled"
                    onClick={close}
                    styles={{
                      root: {
                        borderRadius: 8,
                        color: active ? 'var(--brand)' : 'var(--text-secondary)',
                        backgroundColor: active ? 'var(--nav-active-bg)' : 'transparent',
                        '&:hover': { backgroundColor: 'var(--nav-hover-bg)' },
                      },
                      label: { fontSize: 14, fontWeight: active ? 600 : 400 },
                    }}
                  />
                );
              })}
            </Stack>
          </Stack>

          <Stack gap="sm">
            {canManageBilling() && (
              <Button
                component={Link}
                to="/dashboard/billing"
                color="brand"
                fullWidth
                radius="md"
                size="sm"
                fw={600}
              >
                Upgrade now
              </Button>
            )}
            <Divider color="var(--card-border)" />
            <Stack gap="xs" className="sidebar-profile">
              <Box
                component={Link}
                to="/dashboard/profile"
                className={`sidebar-profile-link${location.pathname === '/dashboard/profile' ? ' active' : ''}`}
                onClick={close}
              >
                <Group gap="sm" wrap="nowrap" px={4}>
                  <Avatar size={32} radius="xl" color="brand">{initials}</Avatar>
                  <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
                    <Group gap={6} wrap="nowrap">
                      <Text size="xs" fw={600} c="var(--text-primary)" lineClamp={1}>
                        {user?.firstname ? `${user.firstname} ${user.lastname || ''}`.trim() : user?.email}
                      </Text>
                      {roleBadge && (
                        <Badge size="xs" variant="light" color="teal">{roleBadge}</Badge>
                      )}
                    </Group>
                    <Text size="xs" c="var(--text-muted)" lineClamp={1}>{user?.email}</Text>
                  </Stack>
                </Group>
              </Box>
              <Group gap="xs" px={4} className="sidebar-profile-actions">
                <ThemeToggle size="sm" />
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  px={8}
                  className="sidebar-logout-btn"
                  onClick={handleLogout}
                  leftSection={<IconLogout size={15} />}
                >
                  Log out
                </Button>
              </Group>
            </Stack>
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main className="dashboard-main">
        <div className={`dashboard-content-grid${aside ? ' has-aside' : ''}`}>
          <div className="dashboard-primary">
            <ViewerBanner />
            {children}
          </div>
          {aside && <aside className="dashboard-aside">{aside}</aside>}
        </div>
      </AppShell.Main>
    </AppShell>
  );
};

export const StatusBadge = ({ status }) => {
  const config = {
    UP: { color: 'green', label: 'Up' },
    DOWN: { color: 'red', label: 'Down' },
    PAUSED: { color: 'gray', label: 'Paused' },
    PENDING: { color: 'yellow', label: 'Pending' },
  };
  const { color, label } = config[status] || config.PENDING;
  return (
    <Badge
      color={color}
      variant="light"
      size="sm"
      radius="sm"
      styles={status === 'UP' ? { root: { color: STATUS.up, backgroundColor: 'rgba(16, 185, 129, 0.12)' } } : undefined}
    >
      {label}
    </Badge>
  );
};
