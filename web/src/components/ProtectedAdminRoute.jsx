import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Center, Loader, Text, Stack } from '@mantine/core';
import { isAuthenticated } from '../utils/auth';
import { platformAdminApi } from '../Features/PlatformAdmin/platform-admin.services';

export const ProtectedAdminRoute = ({ children }) => {
  const [state, setState] = useState('loading');

  useEffect(() => {
    if (!isAuthenticated()) {
      setState('unauth');
      return;
    }
    platformAdminApi.me()
      .then(() => setState('ok'))
      .catch(() => setState('forbidden'));
  }, []);

  if (state === 'loading') {
    return (
      <Center h="100vh">
        <Stack align="center" gap="sm">
          <Loader color="teal" />
          <Text size="sm" c="dimmed">Verifying admin access…</Text>
        </Stack>
      </Center>
    );
  }
  if (state === 'unauth') return <Navigate to="/auth/login" replace />;
  if (state === 'forbidden') return <Navigate to="/dashboard/monitors" replace />;
  return children;
};
