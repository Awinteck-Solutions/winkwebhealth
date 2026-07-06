export function saveAuthSession(payload) {
  if (!payload?.token) return;
  const id = payload.id || payload._id;
  localStorage.setItem(
    'cfg',
    JSON.stringify({
      token: payload.token,
      id: id ? String(id) : undefined,
      email: payload.email,
      firstname: payload.firstname,
      lastname: payload.lastname,
      workspaceOwnerId: payload.workspaceOwnerId,
      teamRole: payload.teamRole,
    })
  );
}

export function updateAuthUser(partial) {
  const current = getAuthUser();
  if (!current) return;
  localStorage.setItem('cfg', JSON.stringify({ ...current, ...partial }));
}

export function getAuthUser() {
  const cfg = localStorage.getItem('cfg');
  if (!cfg) return null;
  try {
    return JSON.parse(cfg);
  } catch {
    return null;
  }
}

export function getAuthToken() {
  return getAuthUser()?.token ?? null;
}

export function isAuthenticated() {
  return !!getAuthToken();
}

export function logout() {
  localStorage.removeItem('cfg');
}
