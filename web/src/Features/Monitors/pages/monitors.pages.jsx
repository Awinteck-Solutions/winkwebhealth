import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Button, Text, Group, Alert, TextInput, Select, Stack, Box, Title,
} from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { MonitorsSidebar } from '../../../components/MonitorsSidebar';
import { MonitorRow } from '../../../components/MonitorRow';
import { useConfirm } from '../../../components/ConfirmProvider';
import { MonitorFormModal } from '../MonitorFormModal';
import { monitorsApi } from '../monitors.services';
import { canWrite } from '../../../utils/permissions';
import apiClient from '../../../utils/apiClient';
import { billingEndpoints } from '../monitors.endpoints';
import { PLAN_LIMITS } from '../../../constants/pricing';
import { TablePageSkeleton } from '../../../components/PageSkeleton';

const MonitorsListPage = () => {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [monitors, setMonitors] = useState([]);
  const [checksMap, setChecksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('down-first');
  const [formOpen, setFormOpen] = useState(false);
  const [plan, setPlan] = useState('FREE');
  const [planLimit, setPlanLimit] = useState(PLAN_LIMITS.FREE.maxMonitors);

  const applySummaries = useCallback((summaries) => {
    setMonitors((prev) => prev.map((m) => {
      const s = summaries[m._id];
      if (!s) return m;
      return { ...m, uptimePercent: s.uptimePercent, recentChecks: s.recentChecks };
    }));
    setChecksMap((prev) => {
      const next = { ...prev };
      Object.entries(summaries).forEach(([id, s]) => {
        next[id] = s.recentChecks || [];
      });
      return next;
    });
  }, []);

  const loadMonitors = useCallback(() => {
    setLoading(true);
    setSummaryLoading(true);
    setError(null);

    monitorsApi.list()
      .then((res) => {
        const list = res.data.data || [];
        setMonitors(list);
        setChecksMap(Object.fromEntries(list.map((m) => [m._id, []])));
      })
      .catch((err) => {
        setMonitors([]);
        setChecksMap({});
        setError(err.response?.data?.message || 'Failed to load monitors. Try logging in again.');
      })
      .finally(() => setLoading(false));

    monitorsApi.summaries()
      .then((res) => applySummaries(res.data.data || {}))
      .catch(() => {})
      .finally(() => setSummaryLoading(false));
  }, [applySummaries]);

  useEffect(() => { loadMonitors(); }, [loadMonitors]);

  useEffect(() => {
    apiClient.get(billingEndpoints.PLAN)
      .then((res) => {
        const currentPlan = res.data.data?.plan || 'FREE';
        const limits = res.data.data?.limits || PLAN_LIMITS[currentPlan] || PLAN_LIMITS.FREE;
        setPlan(currentPlan);
        setPlanLimit(limits.maxMonitors);
      })
      .catch(() => {
        setPlan('FREE');
        setPlanLimit(PLAN_LIMITS.FREE.maxMonitors);
      });
  }, []);

  useEffect(() => {
    if (searchParams.get('create') === '1' && canWrite()) {
      setFormOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openCreate = () => setFormOpen(true);

  const handleFormClose = () => setFormOpen(false);

  const handleFormSuccess = (monitor) => {
    loadMonitors();
    if (monitor?._id) navigate(`/dashboard/monitors/${monitor._id}`);
  };

  const filtered = useMemo(() => {
    let list = [...monitors];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) => m.name?.toLowerCase().includes(q)
          || m.url?.toLowerCase().includes(q)
          || m.host?.toLowerCase().includes(q)
      );
    }
    const order = { DOWN: 0, PENDING: 1, PAUSED: 2, UP: 3 };
    if (sort === 'down-first') list.sort((a, b) => (order[a.currentStatus] ?? 9) - (order[b.currentStatus] ?? 9));
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [monitors, search, sort]);

  const handlePause = async (monitor) => {
    await monitorsApi.update(monitor._id, { isActive: !monitor.isActive });
    notifications.show({
      title: monitor.isActive ? 'Paused' : 'Resumed',
      message: monitor.name,
      color: 'brand',
    });
    loadMonitors();
  };

  const handleDelete = async (monitor) => {
    const ok = await confirm({
      title: 'Delete monitor',
      message: `Delete "${monitor.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await monitorsApi.remove(monitor._id);
    notifications.show({ title: 'Deleted', message: monitor.name, color: 'red' });
    loadMonitors();
  };

  const allPending = monitors.length > 0 && monitors.every((m) => m.currentStatus === 'PENDING');
  const writable = canWrite();

  const sidebar = <MonitorsSidebar monitors={monitors} plan={plan} planLimit={planLimit} summaryLoading={summaryLoading} />;

  if (loading && monitors.length === 0) {
    return (
      <DashboardLayout aside={sidebar}>
        <TablePageSkeleton rows={5} columns={3} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout aside={sidebar}>
      <div className="monitors-page">
        <header className="monitors-page-header">
          <Title order={2} c="var(--text-primary)" fw={700} className="monitors-page-title">
            Monitors
          </Title>
          <Group gap="sm" className="page-toolbar monitors-page-toolbar">
            <TextInput
              className="toolbar-input toolbar-search"
              placeholder="Search by name or URL"
              leftSection={<IconSearch size={16} color="var(--text-muted)" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, maxWidth: 320 }}
              radius="md"
            />
            <Select
              className="toolbar-input toolbar-sort"
              value={sort}
              onChange={setSort}
              data={[
                { value: 'down-first', label: 'Down first' },
                { value: 'name', label: 'Name A–Z' },
              ]}
              w={140}
              radius="md"
            />
            {writable && (
            <Button
              color="brand"
              radius="md"
              leftSection={<IconPlus size={16} />}
              fw={600}
              className="toolbar-action"
              onClick={openCreate}
            >
              New
            </Button>
            )}
          </Group>
        </header>

      {error && (
        <Alert color="red" mb="md" variant="light" radius="md" title="Could not load monitors">
          {error}
        </Alert>
      )}

      {allPending && (
        <Alert color="yellow" mb="md" variant="light" radius="md" title="Waiting for first check">
          Start the worker to begin monitoring:{' '}
          <Text span ff="monospace" size="sm">cd worker && npm run dev</Text>
        </Alert>
      )}

      {filtered.length === 0 && !error ? (
        <Box className="stats-card" ta="center" py={48}>
          <Text c="var(--text-secondary)" mb="md">
            {writable ? 'No monitors yet. Add your first check to get started.' : 'No monitors in this workspace yet.'}
          </Text>
          {writable && (
          <Button color="brand" leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Create monitor
          </Button>
          )}
        </Box>
      ) : (
        <Stack gap="sm">
          {filtered.map((m) => (
            <MonitorRow
              key={m._id}
              monitor={m}
              checks={checksMap[m._id] || []}
              summaryLoading={summaryLoading}
              onPause={handlePause}
              onDelete={handleDelete}
            />
          ))}
        </Stack>
      )}
      </div>

      <MonitorFormModal
        opened={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </DashboardLayout>
  );
};

export default MonitorsListPage;
