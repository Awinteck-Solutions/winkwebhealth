import { Box, Group, Select, Text } from '@mantine/core';
import {
  IconWorld,
  IconKey,
  IconNetwork,
  IconCertificate,
  IconWorldWww,
} from '@tabler/icons-react';
import { MONITOR_TYPE_OPTIONS } from './monitorForm.utils';

const TYPE_ICONS = {
  HTTP: IconWorld,
  KEYWORD: IconKey,
  PORT: IconNetwork,
  SSL: IconCertificate,
  DNS: IconWorldWww,
};

function MonitorTypeOptionContent({ typeValue }) {
  const meta = MONITOR_TYPE_OPTIONS.find((o) => o.value === typeValue);
  if (!meta) return null;

  const Icon = TYPE_ICONS[meta.value];

  return (
    <Group gap="sm" wrap="nowrap" align="flex-start">
      <Box className="monitor-type-select-icon">
        <Icon size={20} stroke={1.75} />
      </Box>
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={600} c="var(--text-primary)" lh={1.35}>
          {meta.title}
        </Text>
        <Text size="xs" c="var(--text-secondary)" lh={1.45} mt={2}>
          {meta.description}
        </Text>
      </Box>
    </Group>
  );
}

export function MonitorTypeSelect({ value, onChange, allowedTypes }) {
  const options = allowedTypes?.length
    ? MONITOR_TYPE_OPTIONS.filter((o) => allowedTypes.includes(o.value))
    : MONITOR_TYPE_OPTIONS;
  const selected = options.find((o) => o.value === value) || MONITOR_TYPE_OPTIONS.find((o) => o.value === value);
  const SelectedIcon = selected ? TYPE_ICONS[selected.value] : null;

  return (
    <Select
      label="Monitor type"
      className="monitor-type-select"
      value={value}
      onChange={onChange}
      allowDeselect={false}
      withCheckIcon={false}
      comboboxProps={{ withinPortal: true, dropdownPadding: 6 }}
      leftSection={SelectedIcon ? <SelectedIcon size={18} stroke={1.75} /> : null}
      leftSectionPointerEvents="none"
      data={options.map(({ value: v, title }) => ({ value: v, label: title }))}
      renderOption={({ option }) => (
        <MonitorTypeOptionContent typeValue={option.value} />
      )}
      styles={{
        option: {
          height: 'auto',
          padding: '10px 12px',
        },
      }}
    />
  );
}

export function getMonitorTypeMeta(value) {
  return MONITOR_TYPE_OPTIONS.find((o) => o.value === value);
}
