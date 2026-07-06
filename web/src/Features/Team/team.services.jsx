import apiClient from '../../utils/apiClient';
import { teamEndpoints, teamInviteEndpoints } from './team.endpoints';

export const teamApi = {
  list: () => apiClient.get(teamEndpoints.LIST),
  create: (data) => apiClient.post(teamEndpoints.CREATE, data),
  update: (id, data) => apiClient.patch(teamEndpoints.ONE(id), data),
  remove: (id) => apiClient.delete(teamEndpoints.ONE(id)),
  resendInvite: (id) => apiClient.post(teamEndpoints.RESEND(id)),
};

export const teamInviteApi = {
  get: (token) => apiClient.get(teamInviteEndpoints.GET(token)),
  accept: (token, data) => apiClient.post(teamInviteEndpoints.ACCEPT(token), data),
};
