import { useEffect, useState } from 'react';
import {
  Button, Text, TextInput, Stack, Group, Box, Badge, ActionIcon, Menu, Table, Radio,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconPencil, IconTrash, IconMailForward } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { PageHeader, FEATURE_DESCRIPTIONS } from '../../../components/PageHeader';
import { AppModal } from '../../../components/AppModal';
import { useConfirm } from '../../../components/ConfirmProvider';
import { teamApi } from '../team.services';
import { canManageTeam } from '../../../utils/permissions';
import { Navigate } from 'react-router-dom';
import { TablePageSkeleton } from '../../../components/PageSkeleton';

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'VIEWER', label: 'Viewer' },
];

const emptyForm = { name: '', email: '', phone: '', role: 'MEMBER' };

function roleLabel(role) {
  return ROLES.find((r) => r.value === role)?.label || role;
}

function StatusBadge({ status }) {
  const config = {
    PENDING: { color: 'yellow', label: 'Pending invite' },
    ACTIVE: { color: 'brand', label: 'Active' },
    INACTIVE: { color: 'gray', label: 'Inactive' },
  };
  const { color, label } = config[status] || config.PENDING;
  return (
    <Badge color={color} variant="light" size="sm" radius="sm">
      {label}
    </Badge>
  );
}

const TeamPage = () => {
  const confirm = useConfirm();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);

  const load = () => {
    setLoading(true);
    teamApi.list()
      .then((res) => setMembers(res.data.data || []))
      .catch(() => {
        notifications.show({ title: 'Error', message: 'Failed to load team members', color: 'red' });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    open();
  };

  const openEdit = (member) => {
    setEditingId(member._id);
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
    });
    open();
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      notifications.show({ title: 'Required', message: 'Name and email are required', color: 'yellow' });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await teamApi.update(editingId, {
          name: form.name,
          phone: form.phone,
          role: form.role,
        });
        notifications.show({ title: 'Updated', message: form.name, color: 'brand' });
      } else {
        const res = await teamApi.create(form);
        notifications.show({
          title: 'Invitation sent',
          message: res.data.message || `Invite emailed to ${form.email}`,
          color: 'brand',
        });
      }
      close();
      load();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Could not save team member',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member) => {
    const ok = await confirm({
      title: 'Remove team member',
      message: `Remove "${member.name}" from the team? They will lose access to this workspace.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    try {
      await teamApi.remove(member._id);
      notifications.show({ title: 'Removed', message: member.name, color: 'red' });
      load();
    } catch {
      notifications.show({ title: 'Error', message: 'Could not remove team member', color: 'red' });
    }
  };

  const handleResend = async (member) => {
    setResendingId(member._id);
    try {
      await teamApi.resendInvite(member._id);
      notifications.show({ title: 'Invitation resent', message: member.email, color: 'brand' });
      load();
    } catch (err) {
      notifications.show({
        title: 'Could not resend',
        message: err.response?.data?.message || 'Failed to send invitation email',
        color: 'red',
      });
    } finally {
      setResendingId(null);
    }
  };

  const toggleStatus = async (member) => {
    if (member.status === 'PENDING') return;
    const next = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await teamApi.update(member._id, { status: next });
      notifications.show({
        title: next === 'ACTIVE' ? 'Activated' : 'Deactivated',
        message: member.name,
        color: 'brand',
      });
      load();
    } catch {
      notifications.show({ title: 'Error', message: 'Could not update status', color: 'red' });
    }
  };

  const memberActions = (m) => (
    <Menu shadow="md" width={180} position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray"><IconDots size={16} /></ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => openEdit(m)}>Edit</Menu.Item>
        {m.status === 'PENDING' && (
          <Menu.Item
            leftSection={<IconMailForward size={14} />}
            onClick={() => handleResend(m)}
            disabled={resendingId === m._id}
          >
            Resend invite
          </Menu.Item>
        )}
        {m.status !== 'PENDING' && (
          <Menu.Item onClick={() => toggleStatus(m)}>
            {m.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Menu.Item>
        )}
        <Menu.Divider />
        <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(m)}>
          Remove
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

  if (!canManageTeam()) {
    return <Navigate to="/dashboard/monitors" replace />;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <TablePageSkeleton rows={5} columns={4} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Team members"
        description={FEATURE_DESCRIPTIONS.team}
        action={(
          <Button color="brand" radius="md" leftSection={<IconPlus size={16} />} onClick={openCreate} fw={600}>
            Invite member
          </Button>
        )}
      />

      {members.length === 0 ? (
        <Box className="stats-card" ta="center" py={48}>
          <Text c="var(--text-secondary)" mb="md">No team members yet. Invite colleagues to collaborate on monitoring.</Text>
          <Button color="brand" leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Invite team member
          </Button>
        </Box>
      ) : (
        <>
          <Box visibleFrom="sm" className="team-table-wrap">
            <Table className="team-table" highlightOnHover verticalSpacing="md" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th w={60} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {members.map((m) => (
                  <Table.Tr key={m._id}>
                    <Table.Td><Text fw={600} size="sm" c="var(--text-primary)">{m.name}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="var(--text-secondary)">{m.email}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="var(--text-secondary)">{m.phone || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="var(--text-primary)">{roleLabel(m.role)}</Text></Table.Td>
                    <Table.Td><StatusBadge status={m.status} /></Table.Td>
                    <Table.Td>{memberActions(m)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>

          <Stack gap="sm" hiddenFrom="sm" className="team-cards">
            {members.map((m) => (
              <Box key={m._id} className="team-card">
                <Group justify="space-between" align="flex-start" mb="xs">
                  <Box style={{ minWidth: 0 }}>
                    <Text fw={600} size="sm" c="var(--text-primary)">{m.name}</Text>
                    <Text size="xs" c="var(--text-secondary)" lineClamp={1}>{m.email}</Text>
                  </Box>
                  {memberActions(m)}
                </Group>
                <Group gap="md" mt="xs">
                  <Text size="xs" c="var(--text-muted)">{m.phone || 'No phone'}</Text>
                  <Text size="xs" c="var(--text-secondary)">{roleLabel(m.role)}</Text>
                  <StatusBadge status={m.status} />
                </Group>
              </Box>
            ))}
          </Stack>
        </>
      )}

      <AppModal
        opened={opened}
        onClose={close}
        title={editingId ? 'Edit team member' : 'Invite team member'}
        size="md"
        footer={(
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" color="gray" onClick={close}>Cancel</Button>
            <Button color="brand" loading={saving} onClick={handleSave}>
              {editingId ? 'Save changes' : 'Send invitation'}
            </Button>
          </Group>
        )}
      >
        <Text size="sm" c="var(--text-secondary)" lh={1.5}>
          {editingId
            ? 'Update member details. Email cannot be changed after invite.'
            : 'An email invitation will be sent. They must accept and set a password to join.'}
        </Text>
        <TextInput label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextInput
          label="Email"
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          disabled={!!editingId}
        />
        <TextInput
          label="Phone number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+1 555 000 0000"
        />
        <Radio.Group
          label="Role"
          value={form.role}
          onChange={(v) => setForm({ ...form, role: v })}
        >
          <Stack gap="xs" mt="xs">
            {ROLES.map((r) => (
              <Radio key={r.value} value={r.value} label={r.label} color="brand" />
            ))}
          </Stack>
        </Radio.Group>
      </AppModal>
    </DashboardLayout>
  );
};

export default TeamPage;
