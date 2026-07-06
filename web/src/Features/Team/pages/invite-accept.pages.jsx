import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Button, Text, Loader, Center, Stack, TextInput, PasswordInput, Box, Group, Alert,
} from '@mantine/core';
import { IconBolt, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { BRAND } from '../../../constants/colors';
import { teamInviteApi } from '../team.services';
import { saveAuthSession, getAuthUser, logout } from '../../../utils/auth';
import { ThemeToggle } from '../../../components/ThemeToggle';

const ROLE_LABELS = { ADMIN: 'Admin', MEMBER: 'Member', VIEWER: 'Viewer' };

const ROLE_ACCESS = {
  ADMIN: 'Manage monitors, alerts, team settings, and billing.',
  MEMBER: 'Create and manage monitors, alerts, and status pages.',
  VIEWER: 'View monitors and incident history (read-only).',
};

export default function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const sessionUser = getAuthUser();

  const loadInvite = useCallback(() => {
    setLoading(true);
    setError(null);
    teamInviteApi.get(token)
      .then((res) => setInvite(res.data.data))
      .catch((err) => {
        setError(err.response?.data?.message || 'Invalid or expired invitation');
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { loadInvite(); }, [loadInvite]);

  const finishAccept = (res) => {
    const { token: authToken, user } = res.data.data;
    saveAuthSession({ ...user, token: authToken });
    setDone(true);
    notifications.show({ title: 'Welcome!', message: 'You joined the workspace', color: 'brand' });
    setTimeout(() => navigate('/dashboard/monitors'), 1500);
  };

  const handleAccept = async () => {
    const isExisting = invite?.accountExists;
    const canSkipPassword = invite?.canAcceptWithoutPassword;

    if (!canSkipPassword) {
      if (isExisting) {
        if (!password) {
          notifications.show({ title: 'Password required', message: 'Enter your account password', color: 'yellow' });
          return;
        }
      } else {
        if (password.length < 8) {
          notifications.show({ title: 'Password too short', message: 'Use at least 8 characters', color: 'yellow' });
          return;
        }
        if (password !== confirmPassword) {
          notifications.show({ title: 'Passwords do not match', message: 'Please re-enter your password', color: 'yellow' });
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = canSkipPassword ? {} : { password };
      const res = await teamInviteApi.accept(token, payload);
      finishAccept(res);
    } catch (err) {
      notifications.show({
        title: 'Could not accept invite',
        message: err.response?.data?.message || 'Something went wrong',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const loginRedirect = `/auth/login?redirect=${encodeURIComponent(`/invite/${token}`)}`;
  const wrongAccountLoggedIn = sessionUser
    && invite
    && !invite.emailMatchesSession
    && invite.loggedInEmail;

  return (
    <Box className="auth-page invite-page">
      <Center mih="100vh" p="md" style={{ position: 'relative' }}>
        <Box style={{ position: 'absolute', top: 16, right: 16 }}>
          <ThemeToggle />
        </Box>
        <Box className="auth-card invite-card" p="xl" w="100%" maw={440}>
          <Group gap="sm" mb="xl">
            <Box
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: BRAND.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <IconBolt size={18} color="#fff" stroke={2.5} />
            </Box>
            <Text fw={700} size="lg" c="var(--text-primary)">WinkWebHealth</Text>
          </Group>

          {loading && <Center py="xl"><Loader color="brand" /></Center>}

          {!loading && error && (
            <Stack gap="md">
              <Alert color="red" variant="light" title="Invitation unavailable">{error}</Alert>
              <Button component={Link} to="/auth/login" variant="light" color="brand">Go to login</Button>
            </Stack>
          )}

          {!loading && !error && invite && !done && (
            <Stack gap="md">
              <Text fw={700} size="xl" c="var(--text-primary)">Accept invitation</Text>
              <Text size="sm" c="var(--text-muted)" lh={1.6}>
                <strong>{invite.inviterName}</strong> invited you to join their monitoring workspace as{' '}
                <strong>{ROLE_LABELS[invite.role] || invite.role}</strong>.
              </Text>

              <Box className="invite-details-box">
                <Text size="xs" c="var(--text-muted)" tt="uppercase" fw={600} mb={4}>Access level</Text>
                <Text size="sm" c="var(--text-secondary)">
                  {ROLE_ACCESS[invite.role] || 'Collaborate on uptime monitoring.'}
                </Text>
              </Box>

              <TextInput label="Email" value={invite.email} readOnly />
              <TextInput label="Name" value={invite.name} readOnly />

              {wrongAccountLoggedIn && (
                <Alert color="yellow" variant="light" title="Different account signed in">
                  You're logged in as <strong>{invite.loggedInEmail}</strong>, but this invite is for{' '}
                  <strong>{invite.email}</strong>.
                  <Group gap="xs" mt="sm">
                    <Button size="xs" variant="light" color="brand" onClick={() => { logout(); loadInvite(); }}>
                      Sign out & continue
                    </Button>
                    <Button size="xs" variant="subtle" color="gray" component={Link} to={loginRedirect}>
                      Log in as {invite.email}
                    </Button>
                  </Group>
                </Alert>
              )}

              {invite.canAcceptWithoutPassword && !wrongAccountLoggedIn && (
                <Alert color="brand" variant="light" title="Ready to join">
                  Signed in as <strong>{invite.loggedInEmail}</strong>. Click below to join the workspace.
                </Alert>
              )}

              {!invite.canAcceptWithoutPassword && invite.accountExists && !wrongAccountLoggedIn && (
                <PasswordInput
                  label="Your password"
                  description="Confirm your identity to join this workspace"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              )}

              {!invite.accountExists && (
                <>
                  <PasswordInput
                    label="Create password"
                    description="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <PasswordInput
                    label="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </>
              )}

              <Button
                color="brand"
                fullWidth
                loading={submitting}
                onClick={handleAccept}
                mt="sm"
                disabled={!!wrongAccountLoggedIn}
              >
                {invite.canAcceptWithoutPassword
                  ? 'Accept invitation'
                  : invite.accountExists
                    ? 'Accept & join workspace'
                    : 'Accept & create account'}
              </Button>

              {!invite.accountExists && (
                <Text size="xs" c="var(--text-muted)" ta="center">
                  Already have an account?{' '}
                  <Link to={loginRedirect}>Log in to accept</Link>
                </Text>
              )}

              {invite.accountExists && !sessionUser && (
                <Text size="xs" c="var(--text-muted)" ta="center">
                  Prefer to sign in first?{' '}
                  <Link to={loginRedirect}>Log in</Link>
                </Text>
              )}
            </Stack>
          )}

          {done && (
            <Stack align="center" gap="md" py="lg">
              <Box
                style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--brand-glow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <IconCheck size={28} color="var(--brand)" />
              </Box>
              <Text fw={700} c="var(--text-primary)">You're all set!</Text>
              <Text size="sm" c="var(--text-muted)">Redirecting to the workspace…</Text>
            </Stack>
          )}
        </Box>
      </Center>
    </Box>
  );
}
