import { Stack } from 'expo-router';
import { View } from 'react-native';
import ClientTabBar from '@/components/client/ClientTabBar';

export default function ClientTabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="bookmark" options={{ headerShown: false }} />
        <Stack.Screen name="explore" options={{ headerShown: false }} />
        <Stack.Screen name="projects" options={{ headerShown: false }} />
        <Stack.Screen name="client" options={{ headerShown: false }} />
      </Stack>
      <ClientTabBar />
    </View>
  );
}
