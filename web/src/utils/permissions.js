import { getAuthUser } from './auth';

export function getTeamRole() {
  return getAuthUser()?.teamRole || 'OWNER';
}

export function isViewer() {
  return getTeamRole() === 'VIEWER';
}

export function canWrite() {
  const role = getTeamRole();
  return role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
}

export function isOwner() {
  return getTeamRole() === 'OWNER';
}

export function canManageTeam() {
  return isOwner();
}

export function canManageBilling() {
  return isOwner();
}
