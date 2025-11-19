import { Stack } from 'expo-router';
import { AuthWrapper } from '~/components/AuthWrapper';
import { useNavigation } from '~/context/NavigationContext';
import { useServerMaintenance } from '~/context/ServerMaintenanceContext';
import { ServerMaintenanceScreen } from '~/components/ServerMaintenanceScreen';

export default function ProtectedLayout() {
  const { currentMode } = useNavigation();
  const { isServerDown, onRetry } = useServerMaintenance();

  // If server is down, show maintenance screen instead of normal layout
  if (isServerDown) {
    return <ServerMaintenanceScreen onRetry={onRetry} />;
  }

  return (
    <AuthWrapper>
      <Stack>
        {/* <Stack.Screen name="index" options={{ headerShown: false, href: null }} /> */}
        <Stack.Screen name="(client)" options={{ headerShown: false }} />
        <Stack.Screen name="(user)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
      </Stack>
    </AuthWrapper>
  );
}
