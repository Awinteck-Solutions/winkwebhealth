import { createContext, useCallback, useContext, useState } from 'react';
import { Button, Group, Text } from '@mantine/core';
import { AppModal } from './AppModal';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((options) => new Promise((resolve) => {
    setState({
      title: options.title || 'Confirm',
      message: options.message || 'Are you sure?',
      confirmLabel: options.confirmLabel || 'Confirm',
      cancelLabel: options.cancelLabel || 'Cancel',
      danger: options.danger ?? false,
      resolve,
    });
  }), []);

  const close = (result) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AppModal
        opened={!!state}
        onClose={() => close(false)}
        title={state?.title}
        size="sm"
        footer={(
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" color="gray" onClick={() => close(false)}>
              {state?.cancelLabel}
            </Button>
            <Button
              color={state?.danger ? 'red' : 'brand'}
              onClick={() => close(true)}
            >
              {state?.confirmLabel}
            </Button>
          </Group>
        )}
      >
        <Text size="sm" c="var(--text-muted)" lh={1.6}>
          {state?.message}
        </Text>
      </AppModal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
