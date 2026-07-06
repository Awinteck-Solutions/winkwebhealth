import { Container, Stack, Text, Title, Tabs, Box, Anchor } from '@mantine/core';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '../../../components/MarketingLayout';
import { LEGAL_EMAIL, SITE_NAME } from '../../../constants/site';

const LAST_UPDATED = 'July 3, 2026';

function TermsContent() {
  return (
    <div className="marketing-prose">
      <p><strong>Last updated:</strong> {LAST_UPDATED}</p>

      <h2>1. Agreement</h2>
      <p>
        By accessing or using {SITE_NAME} (&quot;Service&quot;), you agree to these Terms of Service.
        If you use the Service on behalf of an organization, you represent that you have authority to bind that organization.
      </p>

      <h2>2. The service</h2>
      <p>
        {SITE_NAME} provides website and infrastructure uptime monitoring, alerting, incident tracking,
        status pages, and related features. We may update, suspend, or discontinue features with reasonable notice when practical.
      </p>

      <h2>3. Accounts</h2>
      <ul>
        <li>You must provide accurate registration information and keep credentials secure.</li>
        <li>You are responsible for activity under your account and workspace.</li>
        <li>You must not use the Service for unlawful purposes or to monitor systems you do not own or have permission to test.</li>
      </ul>

      <h2>4. Plans & billing</h2>
      <p>
        Free and paid plans are described on our pricing page. Paid subscriptions renew automatically unless cancelled
        through the billing portal. Fees are non-refundable except where required by law.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Abuse check endpoints or attempt to disrupt our infrastructure</li>
        <li>Reverse engineer or scrape the Service beyond normal use</li>
        <li>Upload malware or use the Service to harass others</li>
        <li>Resell the Service without written permission</li>
      </ul>

      <h2>6. Availability & disclaimers</h2>
      <p>
        We strive for high availability but do not guarantee uninterrupted monitoring or alerting.
        The Service is provided &quot;as is&quot; without warranties of merchantability, fitness for a particular purpose,
        or non-infringement to the fullest extent permitted by law.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {SITE_NAME} shall not be liable for indirect, incidental,
        special, or consequential damages, or for loss of profits, data, or business arising from use of the Service.
        Our total liability is limited to the amount you paid us in the twelve months before the claim.
      </p>

      <h2>8. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate accounts that violate these terms.
        Upon termination, your right to use the Service ends; we may delete data after a reasonable retention period.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these terms:{' '}
        <Anchor href={`mailto:${LEGAL_EMAIL}`} c="brand">{LEGAL_EMAIL}</Anchor>
      </p>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="marketing-prose">
      <p><strong>Last updated:</strong> {LAST_UPDATED}</p>

      <h2>1. Overview</h2>
      <p>
        This Privacy Policy explains how {SITE_NAME} collects, uses, and protects information when you use our website and monitoring platform.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email, password (hashed), and workspace settings</li>
        <li><strong>Monitoring data:</strong> URLs, hostnames, ports, and check results you configure</li>
        <li><strong>Usage data:</strong> logs, IP addresses, browser type, and feature usage for security and improvement</li>
        <li><strong>Billing data:</strong> processed by Stripe; we store customer IDs and plan status, not full card numbers</li>
      </ul>

      <h2>3. How we use information</h2>
      <ul>
        <li>Provide monitoring, alerts, status pages, and account features</li>
        <li>Send service notifications and respond to support requests</li>
        <li>Process payments and prevent fraud or abuse</li>
        <li>Improve reliability, security, and product experience</li>
      </ul>

      <h2>4. Sharing</h2>
      <p>
        We do not sell your personal information. We share data with subprocessors needed to operate the Service
        (e.g. hosting, email delivery, payment processing) under appropriate agreements. We may disclose information if required by law.
      </p>

      <h2>5. Retention</h2>
      <p>
        We retain account and monitoring data while your account is active. Check history and incidents are kept according to plan limits.
        You may request deletion by contacting us; some data may be retained where legally required.
      </p>

      <h2>6. Security</h2>
      <p>
        We use industry-standard measures including encryption in transit, access controls, and secure password storage.
        See our <Anchor component={Link} to="/security" c="brand">Security & compliance</Anchor> page for more detail.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, or export personal data,
        or to object to certain processing. Contact us to exercise these rights.
      </p>

      <h2>8. Cookies</h2>
      <p>
        We use essential cookies and local storage for authentication and preferences (such as theme).
        We do not use third-party advertising cookies.
      </p>

      <h2>9. Contact</h2>
      <p>
        Privacy inquiries:{' '}
        <Anchor href={`mailto:${LEGAL_EMAIL}`} c="brand">{LEGAL_EMAIL}</Anchor>
      </p>
    </div>
  );
}

export default function LegalPage() {
  return (
    <MarketingLayout>
      <Container size="sm">
        <Stack gap="lg">
          <Stack gap="sm" className="marketing-hero">
            <Title order={1} className="marketing-hero-title">Terms & privacy</Title>
            <Text c="var(--text-secondary)" className="marketing-hero-lead">
              The policies that govern your use of {SITE_NAME} and how we handle your data.
            </Text>
          </Stack>

          <Box className="marketing-card">
            <Tabs defaultValue="terms" variant="outline" radius="md" color="brand">
              <Tabs.List mb="lg">
                <Tabs.Tab value="terms">Terms of service</Tabs.Tab>
                <Tabs.Tab value="privacy">Privacy policy</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="terms">
                <TermsContent />
              </Tabs.Panel>
              <Tabs.Panel value="privacy">
                <PrivacyContent />
              </Tabs.Panel>
            </Tabs>
          </Box>
        </Stack>
      </Container>
    </MarketingLayout>
  );
}
