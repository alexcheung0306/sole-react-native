import { Stack } from 'expo-router';
import { AuthWrapper } from '~/components/AuthWrapper';
import { useNavigation } from '~/context/NavigationContext';
import { useEffect } from 'react';

export default function ProtectedLayout() {
  const { currentMode } = useNavigation();

  return (
    <AuthWrapper>
      <Stack>
        {/* <Stack.Screen name="index" options={{ headerShown: false, href: null }} /> */}
        <Stack.Screen name="(client)" options={{ headerShown: false }} />
        <Stack.Screen name="(user)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="user/[username]" options={{ headerShown: false }} />
        <Stack.Screen name="client/[username]" options={{ headerShown: false }} />
        <Stack.Screen name="post/[postId]" options={{ headerShown: false }} />
      </Stack>
    </AuthWrapper>
  );
}
