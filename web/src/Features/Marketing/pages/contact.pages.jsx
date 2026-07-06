import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Stack, Text, Title, TextInput, Textarea, Button, SimpleGrid, Box, Anchor,
} from '@mantine/core';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { notifications } from '@mantine/notifications';
import { IconMail, IconMessage, IconClock } from '@tabler/icons-react';
import { MarketingLayout } from '../../../components/MarketingLayout';
import { BRAND } from '../../../constants/colors';
import { SUPPORT_EMAIL } from '../../../constants/site';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const formik = useFormik({
    initialValues: { name: '', email: '', subject: '', message: '' },
    validationSchema: Yup.object({
      name: Yup.string().trim().required('Name is required'),
      email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
      subject: Yup.string().trim().required('Subject is required'),
      message: Yup.string().trim().min(20, 'Please provide a bit more detail').required('Message is required'),
    }),
    onSubmit: (values) => {
      const body = encodeURIComponent(
        `From: ${values.name} <${values.email}>\n\n${values.message}`,
      );
      const subject = encodeURIComponent(values.subject);
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
      setSubmitted(true);
      notifications.show({
        title: 'Opening your email client',
        message: 'If nothing opens, email us directly at support@winkwebhealth.com',
        color: 'brand',
      });
    },
  });

  return (
    <MarketingLayout>
      <Container size="md">
        <Stack gap="xl">
          <Stack gap="sm" className="marketing-hero">
            <Title order={1} className="marketing-hero-title">Contact us</Title>
            <Text c="var(--text-secondary)" size="lg" className="marketing-hero-lead">
              Questions about monitoring, billing, or your account? We&apos;re here to help.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" className="marketing-contact-grid">
            <Stack gap="md">
              <Box className="marketing-card">
                <IconMail size={22} color={BRAND.primary} stroke={1.75} />
                <Text fw={600} c="var(--text-primary)" mt="sm">Email support</Text>
                <Text size="sm" c="var(--text-secondary)" mt={4} lh={1.6}>
                  For general help and account questions.
                </Text>
                <Anchor href={`mailto:${SUPPORT_EMAIL}`} c="brand" size="sm" mt="sm" fw={600}>
                  {SUPPORT_EMAIL}
                </Anchor>
              </Box>
              <Box className="marketing-card">
                <IconClock size={22} color={BRAND.primary} stroke={1.75} />
                <Text fw={600} c="var(--text-primary)" mt="sm">Response time</Text>
                <Text size="sm" c="var(--text-secondary)" mt={4} lh={1.6}>
                  We typically reply within one business day. Pro customers receive priority support.
                </Text>
              </Box>
              <Box className="marketing-card">
                <IconMessage size={22} color={BRAND.primary} stroke={1.75} />
                <Text fw={600} c="var(--text-primary)" mt="sm">Help center</Text>
                <Text size="sm" c="var(--text-secondary)" mt={4} lh={1.6}>
                  Browse FAQs for monitors, alerts, status pages, and billing.
                </Text>
                <Anchor component={Link} to="/help" c="brand" size="sm" mt="sm" fw={600}>
                  Visit help center →
                </Anchor>
              </Box>
            </Stack>

            <Box className="marketing-card">
              <Title order={3} size="h4" c="var(--text-primary)" mb="md">Send a message</Title>
              {submitted ? (
                <Stack gap="sm">
                  <Text c="var(--text-secondary)" lh={1.65}>
                    Thanks for reaching out. Your email client should open with your message ready to send.
                    If it didn&apos;t, email us at{' '}
                    <Anchor href={`mailto:${SUPPORT_EMAIL}`} c="brand">{SUPPORT_EMAIL}</Anchor>.
                  </Text>
                  <Button variant="light" color="brand" onClick={() => setSubmitted(false)}>
                    Send another message
                  </Button>
                </Stack>
              ) : (
                <form onSubmit={formik.handleSubmit}>
                  <Stack gap="sm">
                    <TextInput
                      label="Name"
                      placeholder="Your name"
                      {...formik.getFieldProps('name')}
                      error={formik.touched.name && formik.errors.name}
                    />
                    <TextInput
                      label="Email"
                      placeholder="you@company.com"
                      {...formik.getFieldProps('email')}
                      error={formik.touched.email && formik.errors.email}
                    />
                    <TextInput
                      label="Subject"
                      placeholder="How can we help?"
                      {...formik.getFieldProps('subject')}
                      error={formik.touched.subject && formik.errors.subject}
                    />
                    <Textarea
                      label="Message"
                      placeholder="Tell us about your question or issue..."
                      minRows={5}
                      {...formik.getFieldProps('message')}
                      error={formik.touched.message && formik.errors.message}
                    />
                    <Button type="submit" color="brand" loading={formik.isSubmitting} fullWidth>
                      Send message
                    </Button>
                  </Stack>
                </form>
              )}
            </Box>
          </SimpleGrid>
        </Stack>
      </Container>
    </MarketingLayout>
  );
}
