import { useEffect, useState } from 'react';
import { Button, Text, TextInput, MultiSelect, Stack, Switch, Group, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link } from 'react-router-dom';
import { IconPlus, IconExternalLink } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { PageHeader, FEATURE_DESCRIPTIONS } from '../../../components/PageHeader';
import { AppModal } from '../../../components/AppModal';
import { canWrite } from '../../../utils/permissions';
import apiClient from '../../../utils/apiClient';
import { statusPageEndpoints, monitorEndpoints } from '../../Monitors/monitors.endpoints';
import { TablePageSkeleton } from '../../../components/PageSkeleton';

const StatusPagesPage = () => {
  const [pages, setPages] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ slug: '', title: '', isPublic: true, monitorIds: [] });

  useEffect(() => {
    Promise.all([
      apiClient.get(statusPageEndpoints.LIST),
      apiClient.get(monitorEndpoints.LIST),
    ]).then(([p, m]) => {
      setPages(p.data.data || []);
      setMonitors((m.data.data || []).map((mon) => ({ value: mon._id, label: mon.name })));
    }).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    await apiClient.post(statusPageEndpoints.CREATE, {
      slug: form.slug,
      title: form.title,
      isPublic: form.isPublic,
      monitors: form.monitorIds.map((id, i) => ({ monitorId: id, displayOrder: i })),
    });
    notifications.show({ title: 'Created', message: 'Status page created', color: 'brand' });
    close();
    const res = await apiClient.get(statusPageEndpoints.LIST);
    setPages(res.data.data || []);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <TablePageSkeleton rows={4} columns={3} />
      </DashboardLayout>
    );
  }

  const writable = canWrite();

  return (
    <DashboardLayout>
      <PageHeader
        title="Status pages"
        description={FEATURE_DESCRIPTIONS.statusPages}
        action={writable ? (
          <Button color="brand" leftSection={<IconPlus size={16} />} onClick={open} radius="md">
            Create page
          </Button>
        ) : null}
      />

      <Stack gap="sm">
        {pages.length === 0 ? (
          <div className="stats-card" style={{ textAlign: 'center', padding: 48 }}>
            <Text c="var(--text-secondary)" mb="md">No status pages yet.{writable ? ' Create one to share with your users.' : ''}</Text>
          {writable && <Button color="brand" onClick={open}>Create status page</Button>}
          </div>
        ) : (
          pages.map((p) => (
            <div key={p._id} className="monitor-row" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
              <div>
                <Text fw={600} size="sm" c="var(--text-primary)">{p.title}</Text>
                <Text size="xs" c="var(--text-muted)">/status/{p.slug}</Text>
              </div>
              <Badge color={p.isPublic ? 'brand' : 'gray'} variant="light">
                {p.isPublic ? 'Public' : 'Private'}
              </Badge>
              <Text size="xs" c="var(--text-secondary)">{p.monitors?.length || 0} monitors</Text>
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
            </div>
          ))
        )}
      </Stack>

      <AppModal
        opened={opened}
        onClose={close}
        title="Create status page"
        footer={<Button color="brand" onClick={handleCreate}>Save</Button>}
      >
        <Stack>
          <TextInput label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextInput label="Slug" description="Used in the public URL" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Switch label="Public" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.currentTarget.checked })} />
          <MultiSelect label="Monitors" data={monitors} value={form.monitorIds} onChange={(v) => setForm({ ...form, monitorIds: v })} />
        </Stack>
      </AppModal>
    </DashboardLayout>
  );
};

export default StatusPagesPage;
