import { useCallback, useEffect, useState } from 'react';
import {
  Button, Text, TextInput, MultiSelect, Stack, Switch, Group, Badge, ActionIcon, Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link } from 'react-router-dom';
import {
  IconPlus, IconExternalLink, IconDots, IconPencil, IconTrash,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { PageHeader, FEATURE_DESCRIPTIONS } from '../../../components/PageHeader';
import { AppModal } from '../../../components/AppModal';
import { useConfirm } from '../../../components/ConfirmProvider';
import { canWrite } from '../../../utils/permissions';
import apiClient from '../../../utils/apiClient';
import { statusPageEndpoints, monitorEndpoints } from '../../Monitors/monitors.endpoints';
import { TablePageSkeleton } from '../../../components/PageSkeleton';

const emptyForm = { slug: '', title: '', isPublic: true, monitorIds: [] };

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

const StatusPagesPage = () => {
  const confirm = useConfirm();
  const [pages, setPages] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const writable = canWrite();

  const loadPages = useCallback(async () => {
    const res = await apiClient.get(statusPageEndpoints.LIST);
    setPages(res.data.data || []);
  }, []);

  useEffect(() => {
    Promise.all([
      apiClient.get(statusPageEndpoints.LIST),
      apiClient.get(monitorEndpoints.LIST),
    ]).then(([p, m]) => {
      setPages(p.data.data || []);
      setMonitors((m.data.data || []).map((mon) => ({ value: mon._id, label: mon.name })));
    }).finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSlugTouched(false);
    open();
  };

  const openEdit = (page) => {
    setEditingId(page._id);
    setForm({
      slug: page.slug || '',
      title: page.title || '',
      isPublic: page.isPublic !== false,
      monitorIds: (page.monitors || []).map((m) => String(m.monitorId)),
    });
    setSlugTouched(true);
    open();
  };

  const handleClose = () => {
    close();
    setEditingId(null);
    setForm(emptyForm);
    setSlugTouched(false);
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const slug = slugify(form.slug || title);
    if (!title) {
      notifications.show({ title: 'Title required', message: 'Enter a title for this status page', color: 'yellow' });
      return;
    }
    if (!slug) {
      notifications.show({ title: 'Slug required', message: 'Enter a URL slug (letters, numbers, hyphens)', color: 'yellow' });
      return;
    }

    setSaving(true);
    const payload = {
      slug,
      title,
      isPublic: form.isPublic,
      monitors: form.monitorIds.map((id, i) => ({ monitorId: id, displayOrder: i })),
    };

    try {
      if (editingId) {
        await apiClient.patch(statusPageEndpoints.ONE(editingId), payload);
        notifications.show({ title: 'Updated', message: 'Status page saved', color: 'brand' });
      } else {
        await apiClient.post(statusPageEndpoints.CREATE, payload);
        notifications.show({ title: 'Created', message: 'Status page created', color: 'brand' });
      }
      handleClose();
      await loadPages();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Could not save status page',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page) => {
    const ok = await confirm({
      title: 'Delete status page',
      message: `Delete "${page.title}"? The public URL /status/${page.slug} will stop working.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;

    try {
      await apiClient.delete(statusPageEndpoints.ONE(page._id));
      notifications.show({ title: 'Deleted', message: page.title, color: 'red' });
      await loadPages();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Could not delete status page',
        color: 'red',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <TablePageSkeleton rows={4} columns={3} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Status pages"
        description={FEATURE_DESCRIPTIONS.statusPages}
        action={writable ? (
          <Button color="brand" leftSection={<IconPlus size={16} />} onClick={openCreate} radius="md">
            Create page
          </Button>
        ) : null}
      />

      <Stack gap="sm">
        {pages.length === 0 ? (
          <div className="stats-card" style={{ textAlign: 'center', padding: 48 }}>
            <Text c="var(--text-secondary)" mb="md">
              No status pages yet.{writable ? ' Create one to share with your users.' : ''}
            </Text>
            {writable && <Button color="brand" onClick={openCreate}>Create status page</Button>}
          </div>
        ) : (
          pages.map((p) => (
            <div key={p._id} className="monitor-row" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
              <div style={{ minWidth: 0 }}>
                <Text fw={600} size="sm" c="var(--text-primary)" lineClamp={1}>{p.title}</Text>
                <Text size="xs" c="var(--text-muted)">/status/{p.slug}</Text>
              </div>
              <Badge color={p.isPublic ? 'brand' : 'gray'} variant="light">
                {p.isPublic ? 'Public' : 'Private'}
              </Badge>
              <Text size="xs" c="var(--text-secondary)">{p.monitors?.length || 0} monitors</Text>
              <Group gap={4} wrap="nowrap">
                <Button
                  component={Link}
                  to={`/status/${p.slug}`}
                  variant="subtle"
                  color="brand"
                  size="xs"
                  leftSection={<IconExternalLink size={14} />}
                  target="_blank"
                >
                  View
                </Button>
                {writable && (
                  <Menu shadow="md" width={160} position="bottom-end">
                    <Menu.Target>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        aria-label="Status page actions"
                      >
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => openEdit(p)}>
                        Edit
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(p)}>
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                )}
              </Group>
            </div>
          ))
        )}
      </Stack>

      <AppModal
        opened={opened}
        onClose={handleClose}
        title={editingId ? 'Edit status page' : 'Create status page'}
        footer={(
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={handleClose}>Cancel</Button>
            <Button color="brand" loading={saving} onClick={handleSave}>
              {editingId ? 'Save changes' : 'Create'}
            </Button>
          </Group>
        )}
      >
        <Stack>
          <TextInput
            label="Title"
            placeholder="Acme Status"
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((prev) => ({
                ...prev,
                title,
                slug: slugTouched ? prev.slug : slugify(title),
              }));
            }}
          />
          <TextInput
            label="Slug"
            description="Used in the public URL"
            placeholder="acme-status"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm({ ...form, slug: slugify(e.target.value) });
            }}
          />
          <Text size="xs" c="var(--text-muted)">
            Public URL: /status/{form.slug || '…'}
          </Text>
          <Switch
            label="Public"
            description="Anyone with the link can view this page"
            checked={form.isPublic}
            onChange={(e) => setForm({ ...form, isPublic: e.currentTarget.checked })}
          />
          <MultiSelect
            label="Monitors"
            placeholder="Select monitors to display"
            data={monitors}
            value={form.monitorIds}
            onChange={(v) => setForm({ ...form, monitorIds: v })}
            searchable
          />
        </Stack>
      </AppModal>
    </DashboardLayout>
  );
};

export default StatusPagesPage;
