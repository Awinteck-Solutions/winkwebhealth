/** Static demo data for the landing-page dashboard preview — no real client info. */

export const PREVIEW_USER = {
  firstname: 'Alex',
  lastname: 'Morgan',
  email: 'alex@acme.io',
  teamRole: 'MEMBER',
};

function fakeChecks(uptimePercent, count = 48) {
  return Array.from({ length: count }, (_, i) => {
    const dip = uptimePercent < 99 && (i % 11 === 3 || i % 11 === 4);
    const minor = uptimePercent < 100 && i % 23 === 7;
    return { status: dip || minor ? 'DOWN' : 'UP' };
  });
}

export const PREVIEW_MONITORS = [
  {
    _id: 'preview-1',
    name: 'Marketing website',
    url: 'https://www.acme-corp.com',
    type: 'HTTP',
    currentStatus: 'UP',
    intervalSeconds: 300,
    uptimePercent: 100,
    isActive: true,
    lastCheckedAt: new Date(Date.now() - 45_000).toISOString(),
  },
  {
    _id: 'preview-2',
    name: 'API gateway',
    url: 'https://api.acme-corp.com',
    type: 'HTTP',
    currentStatus: 'UP',
    intervalSeconds: 60,
    uptimePercent: 100,
    isActive: true,
    lastCheckedAt: new Date(Date.now() - 30_000).toISOString(),
  },
  {
    _id: 'preview-3',
    name: 'Signup flow keyword',
    url: 'https://www.acme-corp.com/signup',
    type: 'KEYWORD',
    currentStatus: 'UP',
    intervalSeconds: 300,
    uptimePercent: 99.2,
    isActive: true,
    lastCheckedAt: new Date(Date.now() - 120_000).toISOString(),
  },
  {
    _id: 'preview-4',
    name: 'Database port',
    host: '10.24.0.8',
    port: 5432,
    type: 'PORT',
    currentStatus: 'UP',
    intervalSeconds: 60,
    uptimePercent: 98.4,
    isActive: true,
    lastCheckedAt: new Date(Date.now() - 60_000).toISOString(),
  },
  {
    _id: 'preview-5',
    name: 'Primary SSL cert',
    host: 'acme-corp.com',
    port: 443,
    type: 'SSL',
    currentStatus: 'UP',
    intervalSeconds: 300,
    uptimePercent: 100,
    isActive: true,
    lastCheckedAt: new Date(Date.now() - 90_000).toISOString(),
  },
  {
    _id: 'preview-6',
    name: 'App DNS record',
    host: 'app.acme-corp.com',
    dnsRecordType: 'A',
    type: 'DNS',
    currentStatus: 'UP',
    intervalSeconds: 300,
    uptimePercent: 100,
    isActive: true,
    lastCheckedAt: new Date(Date.now() - 75_000).toISOString(),
  },
];

export const PREVIEW_CHECKS_MAP = Object.fromEntries(
  PREVIEW_MONITORS.map((m) => [m._id, fakeChecks(m.uptimePercent ?? 100)]),
);

export const PREVIEW_PLAN = {
  plan: 'PRO',
  planLimit: 50,
};
