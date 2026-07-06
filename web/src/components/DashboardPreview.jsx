import {
  Box, Group, Stack, Text, Title, TextInput, Button, Avatar, Badge, Divider,
} from '@mantine/core';
import {
  IconActivity, IconBell, IconWorld, IconHeartbeat, IconSearch, IconPlus,
} from '@tabler/icons-react';
import { MonitorRow } from './MonitorRow';
import { MonitorsSidebar } from './MonitorsSidebar';
import {
  PREVIEW_USER, PREVIEW_MONITORS, PREVIEW_CHECKS_MAP, PREVIEW_PLAN,
} from '../constants/dashboardPreview';
import './dashboard-preview.css';

const PREVIEW_NAV = [
  { label: 'Monitoring', icon: IconActivity, active: true },
  { label: 'Integrations', icon: IconBell, active: false },
  { label: 'Status pages', icon: IconWorld, active: false },
];

function PreviewSidebar() {
  const initials = `${PREVIEW_USER.firstname[0]}${PREVIEW_USER.lastname[0]}`;

  return (
    <aside className="dashboard-preview-sidebar">
      <Stack justify="space-between" h="100%">
        <Stack gap="lg">
          <Group gap="sm" px={4}>
            <Box className="dashboard-sidebar-brand dashboard-preview-brand">
              <IconHeartbeat size={16} color="#fff" stroke={2.5} />
            </Box>
            <Stack gap={0}>
              <Text fw={700} size="sm" c="var(--text-primary)">WinkWebHealth</Text>
              <Text size="xs" c="var(--text-muted)">Uptime monitoring</Text>
            </Stack>
          </Group>

          <Stack gap={4}>
            {PREVIEW_NAV.map(({ label, icon: Icon, active }) => (
              <Box
                key={label}
                className={`dashboard-preview-nav-item${active ? ' is-active' : ''}`}
              >
                <Icon size={16} stroke={1.5} />
                <span>{label}</span>
              </Box>
            ))}
          </Stack>
        </Stack>

        <Stack gap="sm">
          <Divider color="var(--card-border)" />
          <Group gap="sm" wrap="nowrap" px={4}>
            <Avatar size={32} radius="xl" color="brand">{initials}</Avatar>
            <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
              <Group gap={6} wrap="nowrap">
                <Text size="xs" fw={600} c="var(--text-primary)" lineClamp={1}>
                  {PREVIEW_USER.firstname} {PREVIEW_USER.lastname}
                </Text>
                <Badge size="xs" variant="light" color="teal">{PREVIEW_USER.teamRole}</Badge>
              </Group>
              <Text size="xs" c="var(--text-muted)" lineClamp={1}>{PREVIEW_USER.email}</Text>
            </Stack>
          </Group>
        </Stack>
      </Stack>
    </aside>
  );
}

export function DashboardPreview() {
  return (
    <Box className="landing-dashboard-preview" aria-hidden="true">
      <Box className="landing-dashboard-preview-badge">Live preview</Box>
      <Box className="landing-dashboard-preview-viewport">
        <Box className="landing-dashboard-preview-scaler">
          <Box className="dashboard-preview-shell">
          <PreviewSidebar />

          <main className="dashboard-preview-main">
            <header className="monitors-page-header dashboard-preview-header">
              <Title order={3} c="var(--text-primary)" fw={700} className="monitors-page-title">
                Monitors
              </Title>
              <Group gap="sm" className="monitors-page-toolbar" wrap="nowrap">
                <TextInput
                  placeholder="Search by name or URL"
                  leftSection={<IconSearch size={16} />}
                  size="sm"
                  radius="md"
                  readOnly
                  className="dashboard-preview-search"
                />
                <Box className="dashboard-preview-select">Down first</Box>
                <Button color="brand" size="sm" radius="md" leftSection={<IconPlus size={16} />}>
                  New
                </Button>
              </Group>
            </header>

            <div className="dashboard-content-grid has-aside dashboard-preview-grid">
              <div className="dashboard-primary">
                <Stack gap="sm" className="dashboard-preview-monitor-list">
                  {PREVIEW_MONITORS.map((monitor) => (
                    <MonitorRow
                      key={monitor._id}
                      monitor={monitor}
                      checks={PREVIEW_CHECKS_MAP[monitor._id]}
                      preview
                      readOnly
                    />
                  ))}
                </Stack>
              </div>
              <aside className="dashboard-aside">
                <MonitorsSidebar
                  monitors={PREVIEW_MONITORS}
                  plan={PREVIEW_PLAN.plan}
                  planLimit={PREVIEW_PLAN.planLimit}
                  preview
                />
              </aside>
            </div>
          </main>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
