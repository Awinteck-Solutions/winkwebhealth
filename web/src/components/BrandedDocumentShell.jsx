import { Box, Stack, Text } from '@mantine/core';
import { BrandLogo } from './BrandLogo';
import { SITE_DOMAIN, SITE_NAME } from '../constants/site';
import { BRAND } from '../constants/colors';

/**
 * Branded document shell — matches transactional email layout (header / body / footer).
 */
export function BrandedDocumentShell({ children, footerNote }) {
  return (
    <Box
      maw={600}
      mx="auto"
      style={{
        border: '1px solid var(--card-border, #E2E8F0)',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <Box
        px={32}
        py={24}
        style={{
          backgroundColor: BRAND.primary,
          borderBottom: `3px solid ${BRAND.primaryDark}`,
        }}
      >
        <BrandLogo size={40} showName showTagline onDark nameSize={20} />
      </Box>

      <Box px={32} py={32} bg="#fff">
        {children}
      </Box>

      <Box px={32} py={22} style={{ backgroundColor: '#F1F5F9', borderTop: '1px solid #E2E8F0' }}>
        {footerNote && (
          <Text size="sm" c="#475569" mb={10} lh={1.6}>
            {footerNote}
          </Text>
        )}
        <Text size="xs" c="#64748B">
          &copy; {new Date().getFullYear()} {SITE_NAME} · {SITE_DOMAIN}
        </Text>
      </Box>
    </Box>
  );
}

export function BrandedDocumentPage({ children, footerNote, py = 'xl' }) {
  return (
    <Box py={py} px="md" style={{ backgroundColor: '#EEF2F6', minHeight: '60vh' }}>
      <BrandedDocumentShell footerNote={footerNote}>{children}</BrandedDocumentShell>
    </Box>
  );
}
