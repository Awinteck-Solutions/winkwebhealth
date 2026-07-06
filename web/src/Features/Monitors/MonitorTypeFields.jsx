import { TextInput, Select, NumberInput, Text } from '@mantine/core';
import { DNS_RECORD_TYPES } from './monitorForm.utils';
import { MonitorTypeSelect, getMonitorTypeMeta } from './MonitorTypeSelect';

export function MonitorTypeFields({ formik, allowedMonitorTypes }) {
  const { values, setFieldValue, getFieldProps } = formik;
  const selectedType = getMonitorTypeMeta(values.type);

  return (
    <>
      <MonitorTypeSelect
        value={values.type}
        onChange={(v) => setFieldValue('type', v)}
        allowedTypes={allowedMonitorTypes}
      />
      {selectedType && (
        <Text size="sm" c="var(--text-secondary)" mt={-4}>
          {selectedType.description}
        </Text>
      )}
      {(values.type === 'HTTP' || values.type === 'KEYWORD') && (
        <TextInput label="URL" placeholder="https://example.com" {...getFieldProps('url')} />
      )}

      {values.type === 'PORT' && (
        <>
          <TextInput
            label="Host"
            placeholder="3.215.156.108 or api.example.com"
            description="Hostname or IP only — do not include http://"
            {...getFieldProps('host')}
          />
          <NumberInput label="Port" value={values.port} onChange={(v) => setFieldValue('port', v)} />
        </>
      )}

      {values.type === 'SSL' && (
        <>
          <TextInput label="Host" placeholder="example.com" description="Domain to check the TLS certificate for." {...getFieldProps('host')} />
          <NumberInput label="Port" value={values.port} onChange={(v) => setFieldValue('port', v)} />
          <NumberInput
            label="Alert before expiry (days)"
            description="Monitor goes down when the certificate expires within this many days."
            value={values.sslAlertDaysBefore}
            onChange={(v) => setFieldValue('sslAlertDaysBefore', v)}
            min={1}
            max={365}
          />
        </>
      )}

      {values.type === 'DNS' && (
        <>
          <TextInput label="Host" placeholder="example.com" description="Domain to resolve." {...getFieldProps('host')} />
          <Select
            label="Record type"
            data={DNS_RECORD_TYPES}
            value={values.dnsRecordType}
            onChange={(v) => setFieldValue('dnsRecordType', v)}
          />
          <TextInput
            label="Expected value (optional)"
            placeholder="e.g. 203.0.113.10 or mail.example.com"
            description="Leave empty to only verify the record exists."
            {...getFieldProps('dnsExpectedValue')}
          />
        </>
      )}

      {values.type === 'KEYWORD' && (
        <>
          <TextInput label="Keyword" {...getFieldProps('keyword')} />
          <Select
            label="Keyword check"
            data={[{ value: 'EXISTS', label: 'Must exist' }, { value: 'NOT_EXISTS', label: 'Must not exist' }]}
            value={values.keywordType}
            onChange={(v) => setFieldValue('keywordType', v)}
          />
        </>
      )}
    </>
  );
}
