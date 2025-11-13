import { Stack } from 'expo-router';

export default function ClientLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="followers" 
        options={{ 
          title: 'Followers',
          headerShown: true,
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="following" 
        options={{ 
          title: 'Following',
          headerShown: true,
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}
