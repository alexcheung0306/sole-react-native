import '../global.css';

import { Stack } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text } from 'react-native';
import { AuthWrapper } from '../components/AuthWrapper';
import { AppContextProvider } from '~/context/AppContext';
import { SoleUserProvider } from '~/context/SoleUserContext';
import { QueryProvider } from '~/context/QueryProvider';
import { NavigationProvider } from '~/context/NavigationContext';
import { CreatePostProvider } from '~/context/CreatePostContext';
import { ServerMaintenanceProvider } from '~/context/ServerMaintenanceContext';
import { env } from '~/env.mjs';
import { GluestackUIProvider } from '~/components/ui/gluestack-ui-provider';

// Complete the OAuth flow in the browser (should only be called once at app level)
WebBrowser.maybeCompleteAuthSession();

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

console.log('Clerk PUBLISHABLE_KEY:', PUBLISHABLE_KEY ? 'Loaded' : 'NOT LOADED');

// Show error if Clerk key is missing
if (!PUBLISHABLE_KEY) {
  console.error('❌ EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing!');
  console.error('Please create a .env.local file with your Clerk publishable key.');
}

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

export default function RootLayout() {
  // Show error screen if Clerk key is missing
  if (!PUBLISHABLE_KEY) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GluestackUIProvider mode="light">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#EF4444', marginBottom: 10, textAlign: 'center' }}>
              Clerk Configuration Error
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
              EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing.{'\n\n'}
              Please create a .env.local file in the root directory with:{'\n\n'}
              EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
            </Text>
          </View>
        </GluestackUIProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider mode="light">
        <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY} 
        tokenCache={tokenCache}
        signInFallbackRedirectUrl={env.CLERK_SIGN_IN_FORCE_REDIRECT_URL}
        signUpFallbackRedirectUrl={env.CLERK_SIGN_UP_FORCE_REDIRECT_URL}
        telemetry={false}
      >
        <QueryProvider>
          <ServerMaintenanceProvider>
            <AppContextProvider>
              <SoleUserProvider>
                <NavigationProvider>
                  <CreatePostProvider>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                      }}
                    >
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
          </ServerMaintenanceProvider>
        </QueryProvider>
      </ClerkProvider>
    </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
