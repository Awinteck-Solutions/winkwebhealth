import { useEffect, useMemo, useState } from 'react';
import {
  Button, Text, TextInput, Stack, Group, Box, Switch,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus, IconSearch, IconBrandSlack, IconBrandDiscord, IconMail, IconWebhook,
  IconPencil, IconBell, IconTrash,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { AppModal } from '../../../components/AppModal';
import { useConfirm } from '../../../components/ConfirmProvider';
import { BRAND } from '../../../constants/colors';
import { canWrite } from '../../../utils/permissions';
import { PageHeader, FEATURE_DESCRIPTIONS } from '../../../components/PageHeader';
import { alertsApi } from '../alerts.services';
import { TablePageSkeleton } from '../../../components/PageSkeleton';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'chat', label: 'Chat platforms' },
  { id: 'email', label: 'Email' },
  { id: 'webhook', label: 'Webhooks' },
];

const INTEGRATIONS = [
  {
    type: 'SLACK',
    category: 'chat',
    name: 'Slack',
    description: 'Slack messages are a great way to inform the entire team of a downtime.',
    icon: IconBrandSlack,
    color: '#4A154B',
  },
  {
    type: 'DISCORD',
    category: 'chat',
    name: 'Discord',
    description: 'Discord notifications will deliver instant alerts to your chosen channel.',
    icon: IconBrandDiscord,
    color: '#5865F2',
  },
  {
    type: 'EMAIL',
    category: 'email',
    name: 'Email',
    description: 'Email is the most popular way to alert when something goes wrong.',
    icon: IconMail,
    color: '#339af0',
  },
  {
    type: 'WEBHOOK',
    category: 'webhook',
    name: 'Webhook',
    description: 'Send JSON payloads to any URL when monitors change status.',
    icon: IconWebhook,
    color: '#868e96',
  },
];

const emptyForm = { type: 'EMAIL', name: '', config: {}, isActive: true };

function channelTarget(channel) {
  if (channel.type === 'EMAIL') return channel.config?.email;
  if (channel.type === 'WEBHOOK') return channel.config?.url;
  return channel.config?.webhookUrl;
}

function buildConfig(type, config) {
  if (type === 'EMAIL') return { email: config.email };
  if (type === 'WEBHOOK') return { url: config.url };
  return { webhookUrl: config.webhookUrl };
}

function IntegrationIcon({ integration, size = 40 }) {
  const Icon = integration.icon;
  return (
    <Box
      className="integration-icon"
      style={{ backgroundColor: integration.color }}
    >
      <Icon size={size * 0.55} color="#fff" stroke={1.75} />
    </Box>
  );
}

const AlertsPage = () => {
  const confirm = useConfirm();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);

  const load = () => {
    setLoading(true);
    alertsApi.list()
      .then((res) => setChannels(res.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filteredChannels = useMemo(() => {
    const q = search.trim().toLowerCase();
    return channels.filter((c) => {
      const integration = INTEGRATIONS.find((i) => i.type === c.type);
      const inCategory = category === 'all'
        || integration?.category === category
        || (category === 'chat' && ['DISCORD', 'SLACK'].includes(c.type));
      if (!inCategory) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q)
        || c.type.toLowerCase().includes(q)
        || (channelTarget(c) || '').toLowerCase().includes(q)
      );
    });
  }, [channels, category, search]);

  const filteredIntegrations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return INTEGRATIONS.filter((i) => {
      const inCategory = category === 'all' || i.category === category;
      if (!inCategory) return false;
      if (!q) return true;
      return i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
    });
  }, [category, search]);

  const openCreate = (type) => {
    setEditingId(null);
    setForm({ ...emptyForm, type, config: {} });
    open();
  };

  const openEdit = (channel) => {
    setEditingId(channel._id);
    setForm({
      type: channel.type,
      name: channel.name,
      isActive: channel.isActive,
      config: { ...channel.config },
    });
    open();
  };

  const handleClose = () => {
    close();
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const config = buildConfig(form.type, form.config);

    try {
      if (editingId) {
        await alertsApi.update(editingId, {
          name: form.name,
          config,
          isActive: form.isActive,
        });
        notifications.show({ title: 'Saved', message: 'Integration updated', color: 'brand' });
      } else {
        await alertsApi.create({ type: form.type, name: form.name, config });
        notifications.show({ title: 'Created', message: 'Integration added', color: 'brand' });
      }
      handleClose();
      load();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Failed to save integration',
        color: 'red',
      });
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete integration',
      message: 'Remove this integration? Monitors linked to it will stop using it for alerts.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await alertsApi.remove(id);
    notifications.show({ title: 'Deleted', message: 'Integration removed', color: 'red' });
    load();
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      const res = await alertsApi.test(id);
      notifications.show({
        title: 'Test sent',
        message: res.data.message || 'Test notification sent',
        color: 'brand',
      });
    } catch (err) {
      notifications.show({
        title: 'Test failed',
        message: err.response?.data?.message || 'Could not send test notification',
        color: 'red',
      });
    } finally {
      setTestingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <TablePageSkeleton rows={6} columns={4} />
      </DashboardLayout>
    );
  }

  const writable = canWrite();

  return (
    <DashboardLayout>
      <PageHeader title="Integrations" description={FEATURE_DESCRIPTIONS.alerts} />

      <div className="integrations-layout">
        <nav className="integrations-nav">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`integrations-nav-item${category === cat.id ? ' active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        <div className="integrations-main">
          <TextInput
            className="toolbar-input integrations-search"
            placeholder="Search by integration type..."
            leftSection={<IconSearch size={16} color="var(--text-muted)" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            radius="md"
            mb="lg"
          />

          {filteredChannels.length > 0 && (
            <Stack gap="sm" mb="xl">
              <Text size="sm" fw={600} c="var(--text-secondary)" tt="uppercase" lts={0.5}>
                Your integrations
              </Text>
              {filteredChannels.map((channel) => {
                const integration = INTEGRATIONS.find((i) => i.type === channel.type);
                return (
                  <Box key={channel._id} className="integration-card integration-card-configured">
                    <Group wrap="nowrap" align="flex-start" gap="md" style={{ flex: 1, minWidth: 0 }}>
                      {integration && <IntegrationIcon integration={integration} />}
                      <Box style={{ minWidth: 0 }}>
                        <Group gap="sm" mb={4}>
                          <Text fw={600} c="var(--text-primary)">{channel.name}</Text>
                          {!channel.isActive && (
                            <Text size="xs" c="var(--text-secondary)" fs="italic">Inactive</Text>
                          )}
                        </Group>
                        <Text size="sm" c="var(--text-secondary)" lineClamp={1}>
                          {integration?.name} · {channelTarget(channel) || 'Not configured'}
                        </Text>
                      </Box>
                    </Group>
                    <Group gap="xs" wrap="wrap" className="integration-card-actions">
                      {writable && (
                      <>
                      <Button
                        variant="default"
                        color="gray"
                        size="xs"
                        radius="md"
                        leftSection={<IconPencil size={14} />}
                        onClick={() => openEdit(channel)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        radius="md"
                        px={8}
                        onClick={() => handleDelete(channel._id)}
                      >
                        <IconTrash size={14} />
                      </Button>
                      </>
                      )}
                      <Button
                        variant="default"
                        color="gray"
                        size="xs"
                        radius="md"
                        leftSection={<IconBell size={14} />}
                        loading={testingId === channel._id}
                        onClick={() => handleTest(channel._id)}
                        disabled={!writable}
                      >
                        Test
                      </Button>
                    </Group>
                  </Box>
                );
              })}
            </Stack>
          )}

          <Stack gap="sm">
            <Text size="sm" fw={600} c="var(--text-secondary)" tt="uppercase" lts={0.5}>
              {filteredChannels.length ? 'Add more' : 'Available integrations'}
            </Text>
            {filteredIntegrations.map((integration) => {
              const count = channels.filter((c) => c.type === integration.type).length;
              return (
                <Box key={integration.type} className="integration-card">
                  <Group wrap="nowrap" align="flex-start" gap="md" style={{ flex: 1, minWidth: 0 }}>
                    <IntegrationIcon integration={integration} />
                    <Box style={{ minWidth: 0 }}>
                      <Group gap="sm" mb={4}>
                        <Text fw={600} c="var(--text-primary)">{integration.name}</Text>
                        {count > 0 && (
                          <Text size="xs" c={BRAND.primary}>{count} configured</Text>
                        )}
                      </Group>
                      <Text size="sm" c="var(--text-secondary)">{integration.description}</Text>
                    </Box>
                  </Group>
                  {writable && (
                  <Button
                    variant="light"
                    color="brand"
                    size="sm"
                    radius="md"
                    leftSection={<IconPlus size={14} />}
                    onClick={() => openCreate(integration.type)}
                  >
                    Add
                  </Button>
                  )}
                </Box>
              );
            })}
          </Stack>
        </div>
      </div>

      <AppModal
        opened={opened}
        onClose={handleClose}
        title={editingId ? 'Edit integration' : 'Add integration'}
        footer={(
          <Button color="brand" onClick={handleSave} disabled={!form.name.trim()} fullWidth>
            {editingId ? 'Save changes' : 'Add integration'}
          </Button>
        )}
      >
        <Stack>
          <Text size="sm" c="var(--text-muted)">
            Alerts fire when a monitor goes down or recovers. Link integrations to monitors from the monitor edit page.
          </Text>
          <TextInput
            label="Name"
            placeholder="e.g. Ops team Slack"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {form.type === 'EMAIL' && (
            <TextInput
              label="Email address"
              placeholder="alerts@company.com"
              value={form.config.email || ''}
              onChange={(e) => setForm({ ...form, config: { email: e.target.value } })}
            />
          )}
          {(form.type === 'DISCORD' || form.type === 'SLACK') && (
            <TextInput
              label="Webhook URL"
              placeholder="https://hooks.slack.com/..."
              value={form.config.webhookUrl || ''}
              onChange={(e) => setForm({ ...form, config: { webhookUrl: e.target.value } })}
            />
          )}
          {form.type === 'WEBHOOK' && (
            <TextInput
              label="Webhook URL"
              placeholder="https://your-app.com/webhook"
              value={form.config.url || ''}
              onChange={(e) => setForm({ ...form, config: { url: e.target.value } })}
            />
          )}
          {editingId && (
            <Switch
              label="Active"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.currentTarget.checked })}
            />
          )}
        </Stack>
      </AppModal>
    </DashboardLayout>
  );
};

export default AlertsPage;
