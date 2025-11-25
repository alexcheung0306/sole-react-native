import { Stack } from 'expo-router';
import { JobTabProvider } from '@/context/JobTabContext';

export default function JobLayout() {
  return (
    <JobTabProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="job-detail" options={{ headerShown: false }} />
      </Stack>
    </JobTabProvider>
  );
}
