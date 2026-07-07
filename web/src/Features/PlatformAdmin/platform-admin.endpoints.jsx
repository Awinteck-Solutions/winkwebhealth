import { BASEURL } from '../../constants/api.constant';

const base = `${BASEURL}/platform-admin`;

export const platformAdminEndpoints = {
  ME: `${base}/me`,
  OVERVIEW: `${base}/overview`,
  TENANTS: `${base}/tenants`,
  TENANT: (id) => `${base}/tenants/${id}`,
  WORKSPACES: `${base}/workspaces`,
  SUBSCRIPTIONS: `${base}/subscriptions`,
  INVOICES: `${base}/invoices`,
  MONITORS: `${base}/monitors`,
};
