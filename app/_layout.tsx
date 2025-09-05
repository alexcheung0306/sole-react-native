import '../global.css';

import { Stack } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { AuthWrapper } from '../components/AuthWrapper';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'sign-in',
};

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

console.log('Clerk PUBLISHABLE_KEY:', PUBLISHABLE_KEY ? 'Loaded' : 'NOT LOADED');

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <Stack>
        {/* Authentication screens - accessible without login */}
        <Stack.Screen 
          name="sign-in" 
          options={{ 
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="sign-up" 
          options={{ 
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        
        {/* Protected screens - require authentication */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
      </Stack>
    </ClerkProvider>
  );
}
