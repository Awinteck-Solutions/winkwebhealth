import { useState, useEffect } from 'react';
import { Menu, Text, Badge, UnstyledButton, Box } from '@mantine/core';
import { IconChevronDown, IconCheck, IconBuildingCommunity } from '@tabler/icons-react';
import apiClient from '../utils/apiClient';
import { getAuthUser, updateAuthUser } from '../utils/auth';
import { workspaceEndpoints } from '../Features/Workspaces/workspace.endpoints';

export function WorkspaceSwitcher({ variant = 'sidebar' }) {
  const user = getAuthUser();
  const [workspaces, setWorkspaces] = useState(user?.workspaces || []);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (workspaces.length === 0 && user?.token) {
      apiClient.get(workspaceEndpoints.LIST)
        .then((res) => {
          const list = res.data?.data || [];
          setWorkspaces(list);
          updateAuthUser({ workspaces: list });
        })
        .catch(() => {});
    }
  }, [user?.token, workspaces.length]);

  const active = workspaces.find((w) => w.ownerId === user?.workspaceOwnerId) || workspaces[0];
  const canSwitch = workspaces.length > 1;

  const handleSwitch = async (workspaceOwnerId) => {
    if (workspaceOwnerId === user?.workspaceOwnerId || switching) return;
    setSwitching(true);
    try {
      const res = await apiClient.post(workspaceEndpoints.SWITCH, { workspaceOwnerId });
      const profile = res.data?.data;
      if (profile) {
        updateAuthUser({
          workspaceOwnerId: profile.workspaceOwnerId,
          teamRole: profile.teamRole,
          workspaces: profile.workspaces,
        });
        window.location.reload();
      }
    } finally {
      setSwitching(false);
    }
  };

  if (!active?.name) return null;

  const ownerLine = active.isOwn
    ? 'Your workspace'
    : `Owner: ${active.ownerName || 'Team admin'}`;

  const trigger = (
    <UnstyledButton
      className={`workspace-switcher-trigger${canSwitch ? '' : ' is-static'}`}
      disabled={!canSwitch || switching}
      aria-label={canSwitch ? 'Switch workspace' : 'Current workspace'}
    >
      <div className="workspace-switcher-trigger-inner">
        <Box className="workspace-switcher-icon">
          <IconBuildingCommunity size={16} stroke={1.6} />
        </Box>
        <div className="workspace-switcher-text">
          <Text size="sm" fw={600} c="var(--text-primary)" className="workspace-switcher-name">
            {active.name}
          </Text>
          <Text size="xs" c="var(--text-muted)" className="workspace-switcher-owner">
            {ownerLine}
          </Text>
        </div>
        {canSwitch && <IconChevronDown size={15} className="workspace-switcher-chevron" />}
      </div>
    </UnstyledButton>
  );

  if (!canSwitch) {
    return <Box className="workspace-switcher">{trigger}</Box>;
  }

  return (
    <Menu shadow="md" width="target" position="bottom-start" withinPortal>
      <Menu.Target>
        <Box className="workspace-switcher">{trigger}</Box>
      </Menu.Target>
      <Menu.Dropdown className="workspace-switcher-dropdown">
        <Menu.Label>Your workspaces</Menu.Label>
        {workspaces.map((ws) => {
          const selected = ws.ownerId === user?.workspaceOwnerId;
          return (
            <Menu.Item
              key={ws.ownerId}
              onClick={() => handleSwitch(ws.ownerId)}
              className={`workspace-switcher-item${selected ? ' is-selected' : ''}`}
              rightSection={selected ? <IconCheck size={15} color="var(--brand)" stroke={2.5} /> : null}
            >
              <div className="workspace-switcher-menu-text">
                <div className="workspace-switcher-menu-row">
                  <Text size="sm" fw={selected ? 600 : 500} className="workspace-switcher-menu-name">
                    {ws.name}
                  </Text>
                  {ws.isOwn ? (
                    <Badge size="xs" variant="light" color="teal">Yours</Badge>
                  ) : (
                    <Badge size="xs" variant="light" color="gray">{ws.role}</Badge>
                  )}
                </div>
                <Text size="xs" c="dimmed" className="workspace-switcher-menu-owner">
                  {ws.isOwn ? 'You are the owner' : `Owner: ${ws.ownerName}`}
                </Text>
              </div>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
