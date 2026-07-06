import { useEffect, useState } from 'react';
import { Button, TextInput, NumberInput, MultiSelect, Stack, Loader, Center } from '@mantine/core';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { notifications } from '@mantine/notifications';
import { AppModal } from '../../components/AppModal';
import { MonitorTypeFields } from './MonitorTypeFields';
import { buildMonitorPayload, defaultMonitorValues, monitorValuesFromApi } from './monitorForm.utils';
import { monitorsApi } from './monitors.services';
import apiClient from '../../utils/apiClient';
import { alertChannelEndpoints } from '../Alerts/alerts.endpoints';
import { billingEndpoints } from './monitors.endpoints';
import { PLAN_LIMITS } from '../../constants/pricing';

export function MonitorFormModal({ opened, onClose, monitorId, onSuccess }) {
  const isEdit = Boolean(monitorId);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [planLimits, setPlanLimits] = useState(PLAN_LIMITS.FREE);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: defaultMonitorValues,
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      type: Yup.string().required(),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          await monitorsApi.update(monitorId, buildMonitorPayload(values));
          notifications.show({ title: 'Saved', message: 'Monitor updated', color: 'brand' });
          onSuccess?.({ _id: monitorId });
        } else {
          const res = await monitorsApi.create(buildMonitorPayload(values));
          notifications.show({ title: 'Created', message: 'Monitor created', color: 'brand' });
          onSuccess?.(res.data.data);
        }
        onClose();
      } catch (err) {
        notifications.show({
          title: 'Error',
          message: err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} monitor`,
          color: 'red',
        });
      }
    },
  });

  useEffect(() => {
    if (!opened) return;

    setLoading(true);
    const requests = [
      apiClient.get(alertChannelEndpoints.LIST),
      apiClient.get(billingEndpoints.PLAN),
    ];
    if (isEdit) requests.push(monitorsApi.get(monitorId));

    Promise.all(requests)
      .then(([channelsRes, planRes, monitorRes]) => {
        const limits = planRes.data.data?.limits
          || PLAN_LIMITS[planRes.data.data?.plan || 'FREE']
          || PLAN_LIMITS.FREE;
        setPlanLimits(limits);

        const allowedTypes = new Set(limits.allowedAlertTypes || []);
        setChannels(
          (channelsRes.data.data || [])
            .filter((c) => allowedTypes.has(c.type))
            .map((c) => ({
              value: c._id,
              label: `${c.name} (${c.type})`,
            })),
        );
        if (monitorRes) {
          formik.resetForm({ values: monitorValuesFromApi(monitorRes.data.data) });
        } else {
          formik.resetForm({ values: defaultMonitorValues });
        }
      })
      .catch(() => {
        notifications.show({
          title: 'Error',
          message: isEdit ? 'Failed to load monitor' : 'Failed to load form',
          color: 'red',
        });
        onClose();
      })
      .finally(() => setLoading(false));
  }, [opened, monitorId, isEdit]);

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit monitor' : 'New monitor'}
      size="lg"
      footer={(
        <Button
          type="submit"
          form="monitor-form"
          color="brand"
          fullWidth
          loading={formik.isSubmitting}
          disabled={loading}
        >
          {isEdit ? 'Save changes' : 'Create monitor'}
        </Button>
      )}
    >
      {loading ? (
        <Center py="xl">
          <Loader color="brand" />
        </Center>
      ) : (
        <form id="monitor-form" onSubmit={formik.handleSubmit}>
          <Stack gap="sm">
            <TextInput label="Name" placeholder="My website" {...formik.getFieldProps('name')} />
            <MonitorTypeFields formik={formik} allowedMonitorTypes={planLimits.allowedMonitorTypes} />
            <NumberInput
              label="Interval (seconds)"
              description={`Minimum on your plan: ${planLimits.minIntervalSeconds}s`}
              min={planLimits.minIntervalSeconds}
              value={formik.values.intervalSeconds}
              onChange={(v) => formik.setFieldValue('intervalSeconds', v ?? planLimits.minIntervalSeconds)}
            />
            <NumberInput
              label="Timeout (seconds)"
              value={formik.values.timeoutSeconds}
              onChange={(v) => formik.setFieldValue('timeoutSeconds', v)}
            />
            {channels.length > 0 && (
              <MultiSelect
                label="Alert channels"
                data={channels}
                value={formik.values.alertChannelIds}
                onChange={(v) => formik.setFieldValue('alertChannelIds', v)}
              />
            )}
          </Stack>
        </form>
      )}
    </AppModal>
  );
}
