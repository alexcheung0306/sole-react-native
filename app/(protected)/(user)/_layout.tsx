import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function UserTabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="explore" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ headerShown: false }} />
        <Stack.Screen name="job" options={{ headerShown: false }} />
        <Stack.Screen name="user" options={{ headerShown: false }} />
        <Stack.Screen name="post" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
