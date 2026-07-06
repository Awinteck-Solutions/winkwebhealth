export const MONITOR_TYPE_OPTIONS = [
  {
    value: 'HTTP',
    title: 'HTTP / website monitoring',
    description: 'Use HTTP(S) to monitor your website, API endpoint, or anything running on HTTP.',
  },
  {
    value: 'KEYWORD',
    title: 'Keyword monitoring',
    description: 'Check for specific text in the response body — useful for HTML pages or JSON payloads.',
  },
  {
    value: 'PORT',
    title: 'Port monitoring',
    description: 'Monitor any service on your server. Useful for SMTP, databases, FTP, and other TCP ports.',
  },
  {
    value: 'SSL',
    title: 'SSL certificate monitoring',
    description: 'Track TLS certificate expiry and get alerted before certificates expire.',
  },
  {
    value: 'DNS',
    title: 'DNS monitoring',
    description: 'Monitor DNS records and verify they resolve to expected values.',
  },
];

/** @deprecated use MONITOR_TYPE_OPTIONS */
export const MONITOR_TYPES = MONITOR_TYPE_OPTIONS.map(({ value, title }) => ({
  value,
  label: title.split(' / ')[0],
}));

export const DNS_RECORD_TYPES = [
  { value: 'A', label: 'A' },
  { value: 'AAAA', label: 'AAAA' },
  { value: 'CNAME', label: 'CNAME' },
  { value: 'MX', label: 'MX' },
  { value: 'TXT', label: 'TXT' },
  { value: 'NS', label: 'NS' },
];

export const defaultMonitorValues = {
  name: '',
  type: 'HTTP',
  url: '',
  host: '',
  port: 443,
  keyword: '',
  keywordType: 'EXISTS',
  dnsRecordType: 'A',
  dnsExpectedValue: '',
  sslAlertDaysBefore: 30,
  intervalSeconds: 300,
  timeoutSeconds: 30,
  alertChannelIds: [],
};

export function monitorTarget(monitor) {
  if (monitor.type === 'PORT') return `${monitor.host}:${monitor.port}`;
  if (monitor.type === 'SSL') return `${monitor.host}:${monitor.port || 443}`;
  if (monitor.type === 'DNS') {
    const expected = monitor.dnsExpectedValue ? ` → ${monitor.dnsExpectedValue}` : '';
    return `${monitor.host} (${monitor.dnsRecordType || 'A'})${expected}`;
  }
  return monitor.url || monitor.host || monitor.name;
}

export function parseHostInput(raw) {
  if (!raw?.trim()) return { host: '' };

  let input = raw.trim().replace(/^https?:\/\//i, '');
  input = input.split('/')[0].split('?')[0].split('#')[0];

  const ipv6Match = input.match(/^\[([^\]]+)\](?::(\d+))?$/);
  if (ipv6Match) {
    return {
      host: ipv6Match[1],
      port: ipv6Match[2] ? parseInt(ipv6Match[2], 10) : undefined,
    };
  }

  const lastColon = input.lastIndexOf(':');
  if (lastColon > 0 && /^\d+$/.test(input.slice(lastColon + 1))) {
    return {
      host: input.slice(0, lastColon),
      port: parseInt(input.slice(lastColon + 1), 10),
    };
  }

  return { host: input };
}

export function buildMonitorPayload(values) {
  const payload = { ...values };

  if (['PORT', 'SSL', 'DNS'].includes(values.type) && payload.host) {
    const parsed = parseHostInput(payload.host);
    payload.host = parsed.host;
    if (values.type === 'PORT' && parsed.port && !payload.port) {
      payload.port = parsed.port;
    }
  }

  if (values.type === 'HTTP') {
    delete payload.host;
    delete payload.port;
    delete payload.keyword;
    delete payload.keywordType;
    delete payload.dnsRecordType;
    delete payload.dnsExpectedValue;
    delete payload.sslAlertDaysBefore;
  } else if (values.type === 'KEYWORD') {
    delete payload.host;
    delete payload.port;
    delete payload.dnsRecordType;
    delete payload.dnsExpectedValue;
    delete payload.sslAlertDaysBefore;
  } else if (values.type === 'PORT') {
    delete payload.url;
    delete payload.keyword;
    delete payload.keywordType;
    delete payload.dnsRecordType;
    delete payload.dnsExpectedValue;
    delete payload.sslAlertDaysBefore;
  } else if (values.type === 'SSL') {
    delete payload.url;
    delete payload.keyword;
    delete payload.keywordType;
    delete payload.dnsRecordType;
    delete payload.dnsExpectedValue;
    if (!payload.port) payload.port = 443;
  } else if (values.type === 'DNS') {
    delete payload.url;
    delete payload.port;
    delete payload.keyword;
    delete payload.keywordType;
    delete payload.sslAlertDaysBefore;
    if (!payload.dnsExpectedValue) payload.dnsExpectedValue = null;
  }

  return payload;
}

export function monitorValuesFromApi(monitor) {
  return {
    name: monitor.name || '',
    type: monitor.type || 'HTTP',
    url: monitor.url || '',
    host: monitor.host || '',
    port: monitor.port ?? 443,
    keyword: monitor.keyword || '',
    keywordType: monitor.keywordType || 'EXISTS',
    dnsRecordType: monitor.dnsRecordType || 'A',
    dnsExpectedValue: monitor.dnsExpectedValue || '',
    sslAlertDaysBefore: monitor.sslAlertDaysBefore ?? 30,
    intervalSeconds: monitor.intervalSeconds ?? 300,
    timeoutSeconds: monitor.timeoutSeconds ?? 30,
    alertChannelIds: (monitor.alertChannelIds || []).map(String),
  };
}
