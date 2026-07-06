import { useNavigate, Link } from 'react-router-dom';
import { Button, TextInput, PasswordInput, Text, Stack, Box, Group } from '@mantine/core';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { BASEURL } from '../../../constants/api.constant';
import { saveAuthSession } from '../../../utils/auth';
import { IconBolt } from '@tabler/icons-react';
import { BRAND } from '../../../constants/colors';
import { ThemeToggle } from '../../../components/ThemeToggle';

const SignupPage = () => {
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: { firstname: '', lastname: '', email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email().required(),
      password: Yup.string().min(6).required(),
    }),
    onSubmit: async (values) => {
      try {
        const res = await axios.post(`${BASEURL}/auth/signup`, values);
        if (res.data.status) {
          saveAuthSession(res.data.user);
          notifications.show({ title: 'Welcome', message: 'Account created', color: 'brand' });
          navigate('/dashboard/monitors');
        }
      } catch (err) {
        notifications.show({ title: 'Error', message: err.response?.data?.message || 'Signup failed', color: 'red' });
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
        <Text size="sm" c="var(--text-secondary)" mb="xl" ta="center">
          Start monitoring for free — 3 monitors included, no credit card required.
        </Text>
        <form onSubmit={formik.handleSubmit}>
          <Stack gap="sm">
            <TextInput label="First name" {...formik.getFieldProps('firstname')} />
            <TextInput label="Last name" {...formik.getFieldProps('lastname')} />
            <TextInput label="Email" {...formik.getFieldProps('email')} />
            <PasswordInput label="Password" {...formik.getFieldProps('password')} />
            <Button type="submit" fullWidth color="brand" radius="md" mt="sm">Create account</Button>
            <Text size="sm" ta="center" c="var(--text-secondary)">
              Already have an account?{' '}
              <Text component={Link} to="/auth/login" c="brand" span inherit fw={600}>Sign in</Text>
            </Text>
          </Stack>
        </form>
      </Box>
    </Box>
  );
};

export default SignupPage;
