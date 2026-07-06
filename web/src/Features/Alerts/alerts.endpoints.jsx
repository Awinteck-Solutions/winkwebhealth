import { BASEURL } from '../../constants/api.constant';

export const alertChannelEndpoints = {
  LIST: `${BASEURL}/alert-channels`,
  CREATE: `${BASEURL}/alert-channels`,
  ONE: (id) => `${BASEURL}/alert-channels/${id}`,
  TEST: (id) => `${BASEURL}/alert-channels/${id}/test`,
};
