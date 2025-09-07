import '../global.css';

import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { AuthWrapper } from '../components/AuthWrapper';
import { AppContextProvider } from '~/context/AppContext';
import { SoleUserProvider } from '~/context/SoleUserContext';
import { QueryProvider } from '~/context/QueryProvider';
import { EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY } from '@env';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'sign-in',
};

const PUBLISHABLE_KEY = EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

console.log('Clerk PUBLISHABLE_KEY:', PUBLISHABLE_KEY ? 'Loaded' : 'NOT LOADED');

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

function StackNavigator() {
  const { isDark, colors } = useTheme();

  return (
    <GluestackUIProvider mode={isDark ? "dark" : "light"}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <QueryProvider>
          <AppContextProvider>
            <SoleUserProvider>
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
                <Stack.Screen 
                  name="chat" 
                  options={{ 
                    title: 'Messages',
                    headerStyle: {
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    },
                    headerTintColor: colors.headerTint,
                  }} 
                />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                <Stack.Screen name="users" options={{ headerShown: false }} />
                <Stack.Screen name="user/[username]" options={{ headerShown: false }} />
              </Stack>
            </SoleUserProvider>
          </AppContextProvider>
        </QueryProvider>
      </ClerkProvider>
    </GluestackUIProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StackNavigator />
    </ThemeProvider>
  );
}
