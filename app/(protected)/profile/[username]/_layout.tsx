import { Stack } from 'expo-router';

export default function UserLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="[username]" 
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
