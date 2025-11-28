import { Stack } from 'expo-router';
import { JobTabProvider } from '@/context/JobTabContext';

export default function JobLayout() {
  return (
    <JobTabProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="job-posts" options={{ headerShown: false }} />
        <Stack.Screen name="applied-roles" options={{ headerShown: false }} />
        <Stack.Screen name="my-contracts" options={{ headerShown: false }} />
        <Stack.Screen name="job-detail" options={{ headerShown: false }} />
      </Stack>
    </JobTabProvider>
  );
}
