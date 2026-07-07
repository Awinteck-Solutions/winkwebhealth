import { Box, Group, Image, Text, Title, Anchor } from '@mantine/core';
import { Link } from 'react-router-dom';
import { LOGO_SRC, SITE_NAME, SITE_TAGLINE } from '../constants/site';

/**
 * Project logo mark — same asset as emails/receipts (web/public/logo.png).
 */
export function BrandLogo({
  size = 32,
  showName = false,
  showTagline = false,
  linkTo,
  nameSize,
  onDark = false,
}) {
  const mark = (
    <Image
      src={LOGO_SRC}
      alt={SITE_NAME}
      w={size}
      h={size}
      radius="md"
      fit="contain"
      style={{ display: 'block', flexShrink: 0 }}
    />
  );

  const content = (
    <Group gap="sm" wrap="nowrap" align="center">
      {mark}
      {(showName || showTagline) && (
        <Box style={{ minWidth: 0 }}>
          {showName && (
            <Title
              order={showTagline ? 4 : 3}
              c={onDark ? '#fff' : 'var(--text-primary)'}
              fw={700}
              style={{ fontSize: nameSize ?? size * 0.65, lineHeight: 1.2 }}
            >
              {SITE_NAME}
            </Title>
          )}
          {showTagline && (
            <Text size="xs" c={onDark ? 'rgba(255,255,255,0.92)' : 'var(--text-muted)'} mt={2}>
              {SITE_TAGLINE}
            </Text>
          )}
        </Box>
      )}
    </Group>
  );

  if (linkTo) {
    return (
      <Anchor component={Link} to={linkTo} underline="never" className="marketing-logo-link">
        {content}
      </Anchor>
    );
  }

  return content;
}
