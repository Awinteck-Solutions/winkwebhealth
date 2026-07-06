import { useState } from 'react';
import {
  Avatar, Badge, Box, Button, Group, PasswordInput, SimpleGrid, Stack, Text, TextInput, Title,
} from '@mantine/core';
import { IconLock, IconMail, IconShieldCheck, IconUser } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { PageHeader } from '../../../components/PageHeader';
import { getAuthUser, updateAuthUser } from '../../../utils/auth';
import { getTeamRole } from '../../../utils/permissions';
import { profileApi } from '../profile.services';

const ROLE_LABELS = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

const ProfilePage = () => {
  const user = getAuthUser();
  const role = getTeamRole();

  const [firstname, setFirstname] = useState(user?.firstname || '');
  const [lastname, setLastname] = useState(user?.lastname || '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const displayName = firstname || lastname
    ? `${firstname} ${lastname}`.trim()
    : user?.email?.split('@')[0] || 'Account';

  const initials = [firstname?.[0], lastname?.[0]].filter(Boolean).join('')
    || user?.email?.[0]?.toUpperCase()
    || '?';

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await profileApi.update({ firstname: firstname.trim(), lastname: lastname.trim() });
      updateAuthUser({ firstname: firstname.trim(), lastname: lastname.trim() });
      notifications.show({ title: 'Saved', message: 'Profile updated', color: 'brand' });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Failed to update profile',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      notifications.show({ title: 'Required', message: 'Enter current and new password', color: 'yellow' });
      return;
    }
    if (newPassword.length < 8) {
      notifications.show({ title: 'Too short', message: 'Password must be at least 8 characters', color: 'yellow' });
      return;
    }
    if (newPassword !== confirmPassword) {
      notifications.show({ title: 'Mismatch', message: 'New passwords do not match', color: 'yellow' });
      return;
    }
    if (newPassword === currentPassword) {
      notifications.show({ title: 'Same password', message: 'New password must be different from your current password', color: 'yellow' });
      return;
    }

    setChangingPassword(true);
    try {
      await profileApi.changePassword({ password: currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      notifications.show({ title: 'Updated', message: 'Password changed successfully', color: 'brand' });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Failed to change password',
        color: 'red',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="profile-page">
        <PageHeader
          title="Profile"
          description="Update your personal details and keep your account secure."
        />

        <Box className="stats-card profile-hero">
          <Group gap="lg" wrap="nowrap" align="flex-start">
            <Avatar size={72} radius="xl" color="brand" className="profile-hero-avatar">
              {initials}
            </Avatar>
            <Stack gap={6} style={{ minWidth: 0 }}>
              <Group gap="sm" wrap="wrap">
                <Title order={3} c="var(--text-primary)" fw={700}>
                  {displayName}
                </Title>
                <Badge size="md" variant="light" color="teal" radius="sm">
                  {ROLE_LABELS[role] || role}
                </Badge>
              </Group>
              <Group gap={6} wrap="nowrap">
                <IconMail size={15} color="var(--text-muted)" />
                <Text size="sm" c="var(--text-secondary)" lineClamp={1}>
                  {user?.email}
                </Text>
              </Group>
              <Text size="sm" c="var(--text-muted)">
                Manage how you appear in the workspace and sign in to WinkWebHealth.
              </Text>
            </Stack>
          </Group>
        </Box>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mt="lg">
          <Box className="stats-card profile-section">
            <Group gap="sm" mb="lg" className="profile-section-header">
              <Box className="profile-section-icon">
                <IconUser size={18} stroke={1.75} />
              </Box>
              <Stack gap={2}>
                <Text fw={700} c="var(--text-primary)">Personal information</Text>
                <Text size="sm" c="var(--text-secondary)">Your name and contact email.</Text>
              </Stack>
            </Group>

            <Stack gap="sm">
              <TextInput
                label="Email"
                value={user?.email || ''}
                readOnly
                disabled
                leftSection={<IconMail size={16} />}
              />
              <TextInput
                label="First name"
                placeholder="Jane"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
              />
              <TextInput
                label="Last name"
                placeholder="Smith"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
              />
              <Button color="brand" onClick={handleSaveProfile} loading={saving} radius="md" mt="xs">
                Save changes
              </Button>
            </Stack>
          </Box>

          <Box className="stats-card profile-section">
            <Group gap="sm" mb="lg" className="profile-section-header">
              <Box className="profile-section-icon">
                <IconLock size={18} stroke={1.75} />
              </Box>
              <Stack gap={2}>
                <Text fw={700} c="var(--text-primary)">Password & security</Text>
                <Text size="sm" c="var(--text-secondary)">Use a strong password you don&apos;t use elsewhere.</Text>
              </Stack>
            </Group>

            <Stack gap="sm">
              <PasswordInput
                label="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <PasswordInput
                label="New password"
                description="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <PasswordInput
                label="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                variant="light"
                color="brand"
                onClick={handleChangePassword}
                loading={changingPassword}
                radius="md"
                mt="xs"
                leftSection={<IconShieldCheck size={16} />}
              >
                Update password
              </Button>
            </Stack>
          </Box>
        </SimpleGrid>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
