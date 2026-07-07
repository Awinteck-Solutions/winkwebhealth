import apiClient from '../../utils/apiClient';
import { monitorEndpoints } from './monitors.endpoints';

export const monitorsApi = {
  list: () => apiClient.get(monitorEndpoints.LIST),
  summaries: () => apiClient.get(monitorEndpoints.SUMMARIES),
  get: (id) => apiClient.get(monitorEndpoints.ONE(id)),
  create: (data) => apiClient.post(monitorEndpoints.CREATE, data),
  update: (id, data) => apiClient.patch(monitorEndpoints.ONE(id), data),
  remove: (id) => apiClient.delete(monitorEndpoints.ONE(id)),
  checks: (id, range = 1, limit) => {
    const params = { ...(limit != null ? { limit } : {}) };
    if (typeof range === 'number') {
      params.days = range;
    } else if (range?.hours != null) {
      params.hours = range.hours;
    } else {
      params.days = range?.days ?? 1;
    }
    return apiClient.get(monitorEndpoints.CHECKS(id), { params });
  },
  stats: (id) => apiClient.get(monitorEndpoints.STATS(id)),
  testAlerts: (id) => apiClient.post(monitorEndpoints.TEST_ALERTS(id)),
  maintenance: {
    list: (id) => apiClient.get(monitorEndpoints.MAINTENANCE(id)),
    create: (id, data) => apiClient.post(monitorEndpoints.MAINTENANCE(id), data),
    remove: (monitorId, windowId) => apiClient.delete(`${monitorEndpoints.MAINTENANCE(monitorId)}/${windowId}`),
  },
};
