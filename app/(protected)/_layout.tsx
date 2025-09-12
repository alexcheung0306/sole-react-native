import { Stack } from 'expo-router';
import { AuthWrapper } from '~/components/AuthWrapper';

export default function ProtectedLayout() {
  return (
    <AuthWrapper>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="user/[username]" options={{ headerShown: false }} />
      </Stack>
    </AuthWrapper>
  );
}
