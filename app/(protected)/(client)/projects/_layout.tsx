import { Stack } from 'expo-router';

export default function ProjectsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="manage-projects" options={{ headerShown: false }} />
      <Stack.Screen name="project-detail" options={{ headerShown: false }} />
      <Stack.Screen name="manage-contracts" options={{ headerShown: false }} />
      <Stack.Screen name="contract" options={{ headerShown: false }} />
      <Stack.Screen name="activate-contract" options={{ headerShown: false }} />
    </Stack>
  );
}

