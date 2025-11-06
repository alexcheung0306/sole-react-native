import '../global.css';

import { Stack } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { AuthWrapper } from '../components/AuthWrapper';
import { AppContextProvider } from '~/context/AppContext';
import { SoleUserProvider } from '~/context/SoleUserContext';
import { QueryProvider } from '~/context/QueryProvider';
import { NavigationProvider } from '~/context/NavigationContext';
import { CreatePostProvider } from '~/context/CreatePostContext';
import { env } from '~/env.mjs';
import { GluestackUIProvider } from '~/components/ui/gluestack-ui-provider';

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
    <GluestackUIProvider mode="light">
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY} 
        tokenCache={tokenCache}
        signInFallbackRedirectUrl={env.CLERK_SIGN_IN_FORCE_REDIRECT_URL}
        signUpFallbackRedirectUrl={env.CLERK_SIGN_UP_FORCE_REDIRECT_URL}
      >
        <QueryProvider>
          <AppContextProvider>
            <SoleUserProvider>
              <NavigationProvider>
                <CreatePostProvider>
                  <Stack>
                {/* Authentication screens - accessible without login */}
                <Stack.Screen
                  name="sign-in"
                  options={{
                    headerShown: false,
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen
                  name="sign-up"
                  options={{
                    headerShown: false,
                    presentation: 'modal',
                  }}
                />

                {/* Protected screens - require authentication */}
                <Stack.Screen name="(protected)" options={{ headerShown: false }} />
                </Stack>
                </CreatePostProvider>
              </NavigationProvider>
            </SoleUserProvider>
          </AppContextProvider>
        </QueryProvider>
      </ClerkProvider>
    </GluestackUIProvider>
  );
}
