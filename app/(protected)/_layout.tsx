import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { AuthWrapper } from '~/components/AuthWrapper';
import { useNavigation } from '~/context/NavigationContext';
import { useServerMaintenance } from '~/context/ServerMaintenanceContext';
import { ServerMaintenanceScreen } from '~/components/ServerMaintenanceScreen';

export default function ProtectedLayout() {
  // Always call all hooks first, before any conditional returns
  const { currentMode } = useNavigation();
  const { isServerDown, onRetry } = useServerMaintenance();

  return (
    <View style={styles.container}>
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
    backgroundColor: '#000',
    zIndex: 9999,
  },
});
