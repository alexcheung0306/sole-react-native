import { Stack } from 'expo-router';

export default function CreatePostLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="preview" />
      <Stack.Screen name="caption" />
    </Stack>
  );
}

