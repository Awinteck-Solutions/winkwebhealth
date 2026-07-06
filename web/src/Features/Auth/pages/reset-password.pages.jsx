import { useEffect, useState } from 'react';
import { Button, PasswordInput, Text, Stack, Box, Group, Anchor, Loader, Center, Alert } from '@mantine/core';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authPost } from '../services/auth.service';
import { notifications } from '@mantine/notifications';
import { IconBolt, IconCheck } from '@tabler/icons-react';
import { BRAND } from '../../../constants/colors';
import { ThemeToggle } from '../../../components/ThemeToggle';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    authPost('VALIDATE-RESET', { token })
      .then((res) => {
        if (res.status && res.data?.success) {
          setEmail(res.data.data?.email || '');
        } else {
          setError(res.message || 'Invalid or expired reset link');
        }
      })
      .catch(() => setError('Invalid or expired reset link'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      notifications.show({ title: 'Password too short', message: 'Use at least 8 characters', color: 'yellow' });
      return;
    }
    if (password !== confirmPassword) {
      notifications.show({ title: 'Passwords do not match', message: 'Please re-enter your password', color: 'yellow' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await authPost('RESET-PASSWORD', { token, password });
      if (res.status && res.data?.success !== false) {
        setDone(true);
        notifications.show({ title: 'Password updated', message: 'You can now sign in', color: 'brand' });
        setTimeout(() => navigate('/auth/login'), 2000);
      } else {
        notifications.show({ title: 'Error', message: res.message || res.data?.message || 'Could not reset password', color: 'red' });
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Could not reset password', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="auth-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Box className="auth-card" p={40} maw={420} w="100%" style={{ position: 'relative' }}>
        <Box style={{ position: 'absolute', top: 16, right: 16 }}>
          <ThemeToggle />
        </Box>
        <Group gap="sm" justify="center" mb="xl">
          <Box style={{ width: 32, height: 32, borderRadius: 8, background: BRAND.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBolt size={18} color="#fff" stroke={2.5} />
          </Box>
          <Text size="xl" fw={700} c="var(--text-primary)">WinkWebHealth</Text>
        </Group>

        {loading && <Center py="xl"><Loader color="brand" /></Center>}

        {!loading && error && (
          <Stack gap="md">
            <Alert color="red" variant="light" title="Link unavailable">{error}</Alert>
            <Button component={Link} to="/auth/forgot-password" variant="light" color="brand">Request new link</Button>
          </Stack>
        )}

        {!loading && !error && !done && (
          <>
            <Text size="lg" fw={700} c="var(--text-primary)" mb="xs" ta="center">Set new password</Text>
            <Text size="sm" c="var(--text-secondary)" mb="xl" ta="center">
              {email ? `Resetting password for ${email}` : 'Choose a new password for your account.'}
            </Text>
            <form onSubmit={handleSubmit}>
              <Stack gap="sm">
                <PasswordInput
                  label="New password"
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
                <Button type="submit" fullWidth loading={submitting} color="brand" radius="md" mt="sm">
                  Update password
                </Button>
              </Stack>
            </form>
          </>
        )}

        {done && (
          <Stack align="center" gap="md" py="lg">
            <Box style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--brand-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconCheck size={28} color="var(--brand)" />
            </Box>
            <Text fw={700} c="var(--text-primary)">Password updated</Text>
            <Text size="sm" c="var(--text-secondary)">Redirecting to sign in…</Text>
          </Stack>
        )}

        {!loading && !done && (
          <Anchor component={Link} to="/auth/login" size="sm" c="brand" mt="xl" ta="center" display="block">
            Back to sign in
          </Anchor>
        )}
      </Box>
    </Box>
  );
};

export default ResetPasswordPage;
