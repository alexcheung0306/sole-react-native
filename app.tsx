import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { Slot } from 'expo-router';
import { QueryProvider } from './context/QueryProvider';
import { AppContextProvider } from './context/AppContext';
import { SoleUserProvider } from './context/SoleUserContext';

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

console.log('Clerk PUBLISHABLE_KEY:', PUBLISHABLE_KEY ? 'Loaded' : 'NOT LOADED');

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

export default function App() {
  return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <QueryProvider>
          <AppContextProvider>
            <SoleUserProvider>
              <Slot />
            </SoleUserProvider>
          </AppContextProvider>
        </QueryProvider>
      </ClerkProvider>
  );
}
