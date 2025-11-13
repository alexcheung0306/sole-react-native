import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { getSoleUserByClerkId } from '~/api/apiservice';
import { createUser } from '~/api/apiservice/soleUser_api';
import { env } from '~/env.mjs';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const [userError, setUserError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // DEV MODE - bypass backend/database when true
  const DEV_MODE = env.EXPO_PUBLIC_DEV_MODE === 'true';

  // Debug logging
  console.log('AuthWrapper - State:', {
    isLoaded,
    isSignedIn,
    userId: userId ? 'present' : 'missing',
    clerkUser: clerkUser ? 'present' : 'missing',
    userError,
    isInitializing,
    devMode: DEV_MODE,
  });

  useEffect(() => {
    const initializeUser = async () => {
      // Only run once when auth data becomes available
      if (isSignedIn && userId && clerkUser && !hasInitialized && !isInitializing) {
        
        // 🟡 DEV MODE: Skip all backend calls
        if (DEV_MODE) {
          console.log('🟡 DEV MODE ENABLED - Skipping backend initialization');
          setHasInitialized(true);
          setIsInitializing(false);
          return;
        }
        
        console.log('AuthWrapper - Starting user initialization');
        setIsInitializing(true);
        setUserError(null);
        
        try {
          const existingUser = await getSoleUserByClerkId(userId);
          if (existingUser && existingUser !== 404) {
            console.log('AuthWrapper - User found in Sole DB:', existingUser.id);
            setHasInitialized(true);
            setIsInitializing(false);
            return;
          }
          
          console.log('AuthWrapper - Creating new user in Sole DB');
          const newUser = await createUser({
            username: clerkUser.username || 'New User',
            email: clerkUser.emailAddresses?.[0]?.emailAddress || 'default@example.com',
            clerkId: userId,
            image: clerkUser.imageUrl || '',
          });
          console.log('AuthWrapper - New user created:', newUser.id);
          setHasInitialized(true);
          setIsInitializing(false);
        } catch (error: any) {
          console.error('AuthWrapper - Error initializing user:', error);
          // If it's a network error, allow access anyway (backend might not be running)
          if (error?.message?.includes('Network request failed') || error?.message?.includes('Failed to fetch')) {
            console.log('AuthWrapper - Network error, allowing access without backend initialization');
            setHasInitialized(true); // Allow access even if backend is unavailable
            setIsInitializing(false);
          } else {
            setUserError('Failed to initialize user');
            setIsInitializing(false);
          }
        }
      }
    };

    initializeUser();
  }, [isSignedIn, userId, clerkUser, hasInitialized, isInitializing, DEV_MODE]);

  if (!isLoaded) {
    console.log('AuthWrapper - Showing loading spinner (auth not loaded)');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        {DEV_MODE && (
          <Text style={{ color: '#fbbf24', marginTop: 10, fontSize: 12 }}>
            🟡 DEV MODE
          </Text>
        )}
      </View>
    );
  }

  // Allow access to app even if not signed in (for development/testing)
  // Only initialize user if they are signed in
  if (!isSignedIn || !userId) {
    console.log('AuthWrapper - User not signed in, allowing access anyway');
    return <>{children}</>;
  }

  if (userError) {
    console.log('AuthWrapper - User error, but allowing access');
    // Don't redirect on error, just allow access
    return <>{children}</>;
  }

  if (isInitializing || (isSignedIn && !hasInitialized)) {
    console.log('AuthWrapper - Showing loading spinner (initializing or not initialized)');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  console.log('AuthWrapper - User ready, rendering children');
  return <>{children}</>;
}
