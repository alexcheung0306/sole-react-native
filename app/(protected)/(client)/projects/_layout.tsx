import { Stack } from 'expo-router';
import { ManageProjectProvider } from '@/context/ManageProjectContext';

export default function ProjectsLayout() {
  return (
    <ManageProjectProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="manage-projects" options={{ headerShown: false }} />
        <Stack.Screen name="project-detail" options={{ headerShown: false }} />
        <Stack.Screen name="manage-contracts" options={{ headerShown: false }} />
        <Stack.Screen name="contract" options={{ headerShown: false }} />
        <Stack.Screen name="activate-contract" options={{ headerShown: false }} />
      </Stack>
    </ManageProjectProvider>
  );
}

