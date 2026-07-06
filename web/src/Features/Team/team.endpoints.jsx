import { BASEURL } from '../../constants/api.constant';

export const teamEndpoints = {
  LIST: `${BASEURL}/team-members`,
  CREATE: `${BASEURL}/team-members`,
  ONE: (id) => `${BASEURL}/team-members/${id}`,
  RESEND: (id) => `${BASEURL}/team-members/${id}/resend-invite`,
};

export const teamInviteEndpoints = {
  GET: (token) => `${BASEURL}/team-invites/${token}`,
  ACCEPT: (token) => `${BASEURL}/team-invites/${token}/accept`,
};
