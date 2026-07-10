import { Button, TextInput, Text, Stack, Box, Group, Anchor, Alert } from '@mantine/core';
import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import { authPost } from '../services/auth.service';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft } from '@tabler/icons-react';
import { BrandLogo } from '../../../components/BrandLogo';
import { ThemeToggle } from '../../../components/ThemeToggle';

const ForgotPasswordPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Email is required'),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await authPost('FORGOT-PASSWORD', {
          email: values.email.trim().toLowerCase(),
        });
        if (response.status && response.data?.success !== false) {
          setSent(true);
          notifications.show({
            title: 'Check your email',
            message: response.data?.message || 'Reset link sent if account exists',
            color: 'brand',
          });
        } else {
          const msg = response.message || response.data?.message || 'Could not send reset email';
          setError(msg);
          notifications.show({ title: 'Error', message: msg, color: 'red' });
        }
      } catch {
        const msg = 'Could not send reset email. Please try again.';
        setError(msg);
        notifications.show({ title: 'Error', message: msg, color: 'red' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box className="auth-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Box className="auth-card" p={40} maw={420} w="100%" style={{ position: 'relative' }}>
        <Box style={{ position: 'absolute', top: 16, right: 16 }}>
          <ThemeToggle />
        </Box>
        <Group gap="sm" justify="center" mb="xl">
          <BrandLogo size={32} showName nameSize={20} linkTo="/" />
        </Group>
        <Text size="lg" fw={700} c="var(--text-primary)" mb="xs" ta="center">Forgot password</Text>
        <Text size="sm" c="var(--text-secondary)" mb="xl" ta="center" lh={1.6}>
          {sent
            ? 'If an account exists for that email, we sent a link to reset your password. The link expires in 1 hour.'
            : 'Enter your email and we will send you a link to reset your password.'}
        </Text>
        {error && (
          <Alert color="red" variant="light" mb="md" title="Could not send email">
            {error}
          </Alert>
        )}
        {!sent ? (
          <form onSubmit={formik.handleSubmit}>
            <Stack gap="sm">
              <TextInput
                label="Email"
                type="email"
                autoComplete="email"
                error={formik.touched.email && formik.errors.email}
                {...formik.getFieldProps('email')}
              />
              <Button type="submit" fullWidth loading={submitting} color="brand" radius="md" mt="sm">
                Send reset link
              </Button>
            </Stack>
          </form>
        ) : (
          <Stack gap="sm">
            <Alert color="teal" variant="light" title="Email sent">
              Check your inbox (and spam folder) for a message from WinkWebHealth. The link expires in 1 hour.
            </Alert>
            <Button component={Link} to="/auth/login" fullWidth color="brand" radius="md">
              Back to sign in
            </Button>
            <Button
              variant="subtle"
              color="gray"
              fullWidth
              onClick={() => { setSent(false); setError(null); }}
            >
              Try a different email
            </Button>
          </Stack>
        )}
        {!sent && (
          <Anchor component={Link} to="/auth/login" size="sm" c="brand" mt="xl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <IconArrowLeft size={14} /> Back to sign in
          </Anchor>
        )}
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
