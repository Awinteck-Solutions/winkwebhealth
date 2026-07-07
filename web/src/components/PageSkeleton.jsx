import { Skeleton, Stack, Group, Box, SimpleGrid } from '@mantine/core';

export function PageHeaderSkeleton() {
  return (
    <Stack gap="sm" mb="xl">
      <Skeleton height={28} width="40%" radius="sm" />
      <Skeleton height={16} width="65%" radius="sm" />
    </Stack>
  );
}

export function TablePageSkeleton({ rows = 6, columns = 4 }) {
  return (
    <Stack gap="md">
      <PageHeaderSkeleton />
      <Group justify="space-between">
        <Skeleton height={36} width={220} radius="md" />
        <Skeleton height={36} width={120} radius="md" />
      </Group>
      <Stack gap="xs">
        {Array.from({ length: rows }).map((_, i) => (
          <Group key={i} gap="md" wrap="nowrap">
            {Array.from({ length: columns }).map((__, j) => (
              <Skeleton key={j} height={20} style={{ flex: j === 0 ? 2 : 1 }} radius="sm" />
            ))}
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}

export function CardsPageSkeleton({ cards = 2 }) {
  return (
    <Stack gap="md">
      <PageHeaderSkeleton />
      <SimpleGrid cols={{ base: 1, sm: cards }} spacing="lg">
        {Array.from({ length: cards }).map((_, i) => (
          <Box key={i} p="lg" style={{ border: '1px solid var(--card-border)', borderRadius: 12 }}>
            <Stack gap="md">
              <Skeleton height={22} width="50%" radius="sm" />
              <Skeleton height={36} width="40%" radius="sm" />
              <Skeleton height={14} width="80%" radius="sm" />
              <Skeleton height={40} radius="md" />
              {Array.from({ length: 4 }).map((__, j) => (
                <Group key={j} gap="sm">
                  <Skeleton height={16} width={16} circle />
                  <Skeleton height={14} style={{ flex: 1 }} radius="sm" />
                </Group>
              ))}
            </Stack>
          </Box>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export function DetailPageSkeleton() {
  return (
    <Stack gap="md">
      <PageHeaderSkeleton />
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={88} radius="md" />
        ))}
      </SimpleGrid>
      <Skeleton height={280} radius="md" />
    </Stack>
  );
}

export function FormPageSkeleton() {
  return (
    <Stack gap="md" maw={480}>
      <PageHeaderSkeleton />
      {Array.from({ length: 4 }).map((_, i) => (
        <Stack key={i} gap={6}>
          <Skeleton height={14} width={100} radius="sm" />
          <Skeleton height={40} radius="md" />
        </Stack>
      ))}
      <Skeleton height={40} radius="md" />
    </Stack>
  );
}
