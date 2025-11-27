import { Stack } from 'expo-router';
import { View } from 'react-native';
import { UserTabProvider } from '@/context/UserTabContext';
import { JobTabProvider } from '@/context/JobTabContext';
import { HeaderProvider } from '@/context/HeaderContext';
import UserTabBar from '@/components/user/UserTabBar';

export default function UserTabLayout() {
  return (
    <UserTabProvider>
      <JobTabProvider>
        <HeaderProvider>
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
            <UserTabBar />
          </View>
        </HeaderProvider>
      </JobTabProvider>
    </UserTabProvider>
  );
}
