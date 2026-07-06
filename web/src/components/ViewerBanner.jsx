import { Alert } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { isViewer } from '../utils/permissions';

export function ViewerBanner() {
  if (!isViewer()) return null;

  return (
    <Alert
      className="viewer-banner"
      color="teal"
      variant="light"
      icon={<IconEye size={18} />}
      title="View-only access"
      mb="md"
      radius="md"
    >
      You can view monitors and incidents but cannot create, edit, or delete resources.
    </Alert>
  );
}
