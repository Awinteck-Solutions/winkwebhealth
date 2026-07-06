import { Container, Stack, Text, Title, SimpleGrid, Box, Anchor, List } from '@mantine/core';
import { Link } from 'react-router-dom';
import {
  IconShieldLock, IconLock, IconServer, IconEye, IconCertificate, IconMail,
} from '@tabler/icons-react';
import { MarketingLayout } from '../../../components/MarketingLayout';
import { BRAND } from '../../../constants/colors';
import { SECURITY_EMAIL, SITE_NAME } from '../../../constants/site';

const PILLARS = [
  {
    icon: IconLock,
    title: 'Encryption in transit',
    description: 'All traffic between your browser and our API uses TLS. Monitor checks use HTTPS where supported.',
  },
  {
    icon: IconShieldLock,
    title: 'Secure authentication',
    description: 'Passwords are hashed with industry-standard algorithms. Sessions use secure tokens with expiration.',
  },
  {
    icon: IconServer,
    title: 'Infrastructure isolation',
    description: 'Customer data is logically separated by workspace. Production systems run on hardened cloud infrastructure.',
  },
  {
    icon: IconEye,
    title: 'Least-privilege access',
    description: 'Internal access to production systems is restricted, logged, and granted only when necessary for support or operations.',
  },
  {
    icon: IconCertificate,
    title: 'Payment security',
    description: 'Billing is handled by Stripe. We never store full credit card numbers on our servers.',
  },
  {
    icon: IconMail,
    title: 'Alert delivery',
    description: 'Email and webhook alerts are sent over encrypted channels. You control which integrations receive incident data.',
  },
];

export default function SecurityPage() {
  return (
    <MarketingLayout>
      <Container size="md">
        <Stack gap="xl">
          <Stack gap="sm" className="marketing-hero">
            <Box className="marketing-security-pill">
              <IconShieldLock size={16} />
              Trust & safety
            </Box>
            <Title order={1} className="marketing-hero-title">Security & compliance</Title>
            <Text c="var(--text-secondary)" size="lg" className="marketing-hero-lead">
              How {SITE_NAME} protects your account, monitoring data, and alert channels.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {PILLARS.map(({ icon: Icon, title, description }) => (
              <Box key={title} className="marketing-card">
                <Icon size={22} color={BRAND.primary} stroke={1.75} />
                <Text fw={600} c="var(--text-primary)" mt="sm">{title}</Text>
                <Text size="sm" c="var(--text-secondary)" mt={4} lh={1.65}>{description}</Text>
              </Box>
            ))}
          </SimpleGrid>

          <Box className="marketing-card">
            <div className="marketing-prose">
              <h2>Data we store</h2>
              <p>
                We store account information, monitor configurations, check results, incidents, alert channel settings,
                and team membership data necessary to operate the Service. We do not sell customer data.
              </p>

              <h2>Monitoring checks</h2>
              <p>
                Checks run from our monitoring infrastructure to the targets you configure. Only configure monitors
                for systems you own or are authorized to test. Response bodies may be stored briefly for keyword checks
                and diagnostics.
              </p>

              <h2>Compliance posture</h2>
              <p>
                {SITE_NAME} is designed with common security frameworks in mind. We are preparing documentation
                for teams that require SOC 2 or GDPR-aligned data processing agreements. Enterprise customers
                may request a DPA or security questionnaire by contacting us.
              </p>

              <h2>Incident response</h2>
              <p>
                We maintain procedures to detect, contain, and notify affected customers of security incidents
                that impact their data, in line with applicable law and contractual obligations.
              </p>

              <h2>Your responsibilities</h2>
              <List size="sm" spacing="xs" c="var(--text-secondary)">
                <List.Item>Use strong, unique passwords and limit team access with appropriate roles</List.Item>
                <List.Item>Review connected alert channels and webhook endpoints regularly</List.Item>
                <List.Item>Report suspected vulnerabilities or unauthorized access promptly</List.Item>
              </List>

              <h2>Report a security issue</h2>
              <p>
                If you discover a vulnerability, please report it responsibly to{' '}
                <Anchor href={`mailto:${SECURITY_EMAIL}`} c="brand">{SECURITY_EMAIL}</Anchor>.
                Include steps to reproduce and avoid public disclosure until we have had a chance to respond.
              </p>
              <p>
                For privacy questions, see our{' '}
                <Anchor component={Link} to="/legal" c="brand">Terms & privacy</Anchor> page.
              </p>
            </div>
          </Box>
        </Stack>
      </Container>
    </MarketingLayout>
  );
}
