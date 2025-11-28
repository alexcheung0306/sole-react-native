import { Stack, useSegments } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { AuthWrapper } from '~/components/AuthWrapper';
import { useNavigation } from '~/context/NavigationContext';
import { useServerMaintenance } from '~/context/ServerMaintenanceContext';
import { ServerMaintenanceScreen } from '~/components/ServerMaintenanceScreen';
import AppTabBar from '@/components/AppTabBar';

export default function ProtectedLayout() {
  // Always call all hooks first, before any conditional returns
  const { currentMode } = useNavigation();
  const { isServerDown, onRetry } = useServerMaintenance();
  const segments = useSegments();

  // Determine if we should show the AppTabBar
  // Only show it when in (user) or (client) routes, not in top-level routes like post, chat, modal
  const shouldShowTabBar = () => {
    const path = segments.join('/');
    // Show tab bar only when in (user) or (client) routes
    return path.includes('(user)') || path.includes('(client)');
  };

  const showTabBar = shouldShowTabBar();

  return (
    <View style={styles.container}>
      <AuthWrapper>
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: '#000000' },
            }}>
            {/* <Stack.Screen name="index" options={{ headerShown: false, href: null }} /> */}
            <Stack.Screen name="(client)" options={{ headerShown: false }} />
            <Stack.Screen name="(user)" options={{ headerShown: false }} />
            <Stack.Screen name="post" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="chat" options={{ headerShown: false }} />
          </Stack>
          {showTabBar && <AppTabBar />}
        </View>
      </AuthWrapper>
      {/* Show maintenance screen as overlay when server is down */}
      {isServerDown && (
        <View style={styles.overlay}>
          <ServerMaintenanceScreen onRetry={onRetry} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
});
