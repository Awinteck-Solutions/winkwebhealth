import { Button, TextInput, PasswordInput, Text, Stack, Box, Group, Anchor } from '@mantine/core';
import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authPost } from '../services/auth.service';
import { capitalizeWords } from '../../../utils/page.helper';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { saveAuthSession } from '../../../utils/auth';
import { BrandLogo } from '../../../components/BrandLogo';
import { ThemeToggle } from '../../../components/ThemeToggle';

const LoginPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectTo = (() => {
    const redirect = searchParams.get('redirect');
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect;
    }
    return '/dashboard/monitors';
  })();

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().required('Email is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        const response = await authPost('LOGIN', values);
        if (response.status) {
          notifications.show({ title: 'Welcome back', message: 'Login successful', color: 'brand' });
          saveAuthSession(response.data.response);
          navigate(redirectTo);
        } else {
          notifications.show({ title: 'Error', message: capitalizeWords(response.message), color: 'red' });
        }
      } catch {
        notifications.show({ title: 'Error', message: 'Invalid credentials', color: 'red' });
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
        <Text size="sm" c="var(--text-secondary)" mb="xl" ta="center">
          Sign in to manage your uptime monitors, alerts, and status pages.
        </Text>
        <form onSubmit={formik.handleSubmit}>
          <Stack gap="sm">
            <TextInput label="Email" {...formik.getFieldProps('email')} />
            <Stack gap={4}>
              <PasswordInput label="Password" {...formik.getFieldProps('password')} />
              <Anchor component={Link} to="/auth/forgot-password" size="xs" c="brand" ta="right">
                Forgot password?
              </Anchor>
            </Stack>
            <Button type="submit" fullWidth loading={submitting} color="brand" radius="md" mt="sm">
              Sign in
            </Button>
            <Text size="sm" ta="center" c="var(--text-secondary)">
              No account?{' '}
              <Text component={Link} to="/auth/signup" c="brand" span inherit fw={600}>Sign up free</Text>
            </Text>
          </Stack>
        </form>
      </Box>
    </Box>
  );
};

export default LoginPage;
