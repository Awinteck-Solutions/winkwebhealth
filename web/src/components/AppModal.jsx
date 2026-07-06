import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Box, Group, Text, ActionIcon, Stack } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

export function AppModal({
  opened,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    if (!opened) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [opened, onClose]);

  if (!opened) return null;

  const sizes = { sm: 400, md: 480, lg: 560, xl: 640 };
  const maxWidth = sizes[size] || sizes.md;

  return createPortal(
    <Box className="app-modal-root" role="dialog" aria-modal="true" aria-labelledby="app-modal-title">
      <Box
        className="app-modal-backdrop"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <Box className="app-modal-panel" style={{ maxWidth }}>
        <Group justify="space-between" align="center" mb="md" wrap="nowrap">
          <Text id="app-modal-title" fw={700} size="lg" c="var(--text-primary)">
            {title}
          </Text>
          <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </ActionIcon>
        </Group>
        <Stack gap="md" className="app-modal-body">{children}</Stack>
        {footer && <Box mt="lg">{footer}</Box>}
      </Box>
    </Box>,
    document.body,
  );
}
