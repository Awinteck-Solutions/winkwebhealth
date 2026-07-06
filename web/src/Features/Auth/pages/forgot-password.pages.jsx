import { Button, TextInput, Text, Stack, Box, Group, Anchor } from '@mantine/core';
import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import { authPost } from '../services/auth.service';
import { notifications } from '@mantine/notifications';
import { IconBolt, IconArrowLeft } from '@tabler/icons-react';
import { BRAND } from '../../../constants/colors';
import { ThemeToggle } from '../../../components/ThemeToggle';

const ForgotPasswordPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Email is required'),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const response = await authPost('FORGOT-PASSWORD', values);
        if (response.status) {
          setSent(true);
          notifications.show({
            title: 'Check your email',
            message: response.data?.message || 'Reset link sent if account exists',
            color: 'brand',
          });
        } else {
          notifications.show({ title: 'Error', message: response.message, color: 'red' });
        }
      } catch {
        notifications.show({ title: 'Error', message: 'Could not send reset email', color: 'red' });
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
          <Box style={{ width: 32, height: 32, borderRadius: 8, background: BRAND.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBolt size={18} color="#fff" stroke={2.5} />
          </Box>
          <Text size="xl" fw={700} c="var(--text-primary)">WinkWebHealth</Text>
        </Group>
        <Text size="lg" fw={700} c="var(--text-primary)" mb="xs" ta="center">Forgot password</Text>
        <Text size="sm" c="var(--text-secondary)" mb="xl" ta="center" lh={1.6}>
          {sent
            ? 'If an account exists for that email, we sent a link to reset your password. The link expires in 1 hour.'
            : 'Enter your email and we will send you a link to reset your password.'}
        </Text>
        {!sent ? (
          <form onSubmit={formik.handleSubmit}>
            <Stack gap="sm">
              <TextInput label="Email" type="email" {...formik.getFieldProps('email')} />
              <Button type="submit" fullWidth loading={submitting} color="brand" radius="md" mt="sm">
                Send reset link
              </Button>
            </Stack>
          </form>
        ) : (
          <Button component={Link} to="/auth/login" fullWidth color="brand" radius="md">
            Back to sign in
          </Button>
        )}
        <Anchor component={Link} to="/auth/login" size="sm" c="brand" mt="xl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <IconArrowLeft size={14} /> Back to sign in
        </Anchor>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
