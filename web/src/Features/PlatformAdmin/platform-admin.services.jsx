import adminApiClient from '../../utils/adminApiClient';
import { platformAdminEndpoints } from './platform-admin.endpoints';

export const platformAdminApi = {
  me: () => adminApiClient.get(platformAdminEndpoints.ME),
  overview: () => adminApiClient.get(platformAdminEndpoints.OVERVIEW),
  tenants: (params) => adminApiClient.get(platformAdminEndpoints.TENANTS, { params }),
  tenant: (id) => adminApiClient.get(platformAdminEndpoints.TENANT(id)),
  updateTenant: (id, body) => adminApiClient.patch(platformAdminEndpoints.TENANT(id), body),
  workspaces: (params) => adminApiClient.get(platformAdminEndpoints.WORKSPACES, { params }),
  subscriptions: (params) => adminApiClient.get(platformAdminEndpoints.SUBSCRIPTIONS, { params }),
  invoices: (params) => adminApiClient.get(platformAdminEndpoints.INVOICES, { params }),
  monitors: (params) => adminApiClient.get(platformAdminEndpoints.MONITORS, { params }),
};
