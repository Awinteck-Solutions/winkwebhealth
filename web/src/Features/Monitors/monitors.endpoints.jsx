import { BASEURL } from '../../constants/api.constant';

export const monitorEndpoints = {
  LIST: `${BASEURL}/monitors`,
  CREATE: `${BASEURL}/monitors`,
  ONE: (id) => `${BASEURL}/monitors/${id}`,
  CHECKS: (id) => `${BASEURL}/monitors/${id}/checks`,
  STATS: (id) => `${BASEURL}/monitors/${id}/stats`,
  TEST_ALERTS: (id) => `${BASEURL}/monitors/${id}/test-alerts`,
  MAINTENANCE: (id) => `${BASEURL}/monitors/${id}/maintenance`,
};

export const alertEndpoints = {
  LIST: `${BASEURL}/alert-channels`,
  CREATE: `${BASEURL}/alert-channels`,
  ONE: (id) => `${BASEURL}/alert-channels/${id}`,
};

export const statusPageEndpoints = {
  LIST: `${BASEURL}/status-pages`,
  CREATE: `${BASEURL}/status-pages`,
  ONE: (id) => `${BASEURL}/status-pages/${id}`,
  PUBLIC: (slug) => `${BASEURL}/status-pages/public/${slug}`,
};

export const billingEndpoints = {
  PLAN: `${BASEURL}/billing/plan`,
  CHECKOUT: `${BASEURL}/billing/checkout`,
  PORTAL: `${BASEURL}/billing/portal`,
};
