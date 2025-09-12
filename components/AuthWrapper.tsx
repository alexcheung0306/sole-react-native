import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { getSoleUserByClerkId } from '~/api/apiservice';
import { createUser } from '~/api/soleUser_api';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const [userError, setUserError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Debug logging
  console.log('AuthWrapper - State:', {
    isLoaded,
    isSignedIn,
    userId: userId ? 'present' : 'missing',
    clerkUser: clerkUser ? 'present' : 'missing',
    userError,
    isInitializing,
  });

  useEffect(() => {
    const initializeUser = async () => {
      if (isSignedIn && userId && clerkUser) {
        setIsInitializing(true);
        setUserError(null);
        try {
          const existingUser = await getSoleUserByClerkId(userId);
          if (existingUser && existingUser !== 404) {
            console.log('AuthWrapper - User found in Sole DB:', existingUser.id);
            setIsInitializing(false);
            return;
          }
          const newUser = await createUser({
            username: clerkUser.username || 'New User',
            email: clerkUser.emailAddresses?.[0]?.emailAddress || 'default@example.com',
            clerkId: userId,
            image:  clerkUser.imageUrl || '',
          });
          console.log('AuthWrapper - New user created:', newUser.id);
          setIsInitializing(false);
        } catch (error) {
          console.error('AuthWrapper - Error initializing user:', error);
          setUserError('Failed to initialize user');
          setIsInitializing(false);
        }
      }
    };

    initializeUser();
  }, [isSignedIn, userId, clerkUser]);

  if (!isLoaded) {
    console.log('AuthWrapper - Showing loading spinner (auth not loaded)');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!isSignedIn || !userId) {
    console.log('AuthWrapper - Redirecting to sign-in');
    return <Redirect href="/sign-in" />;
  }

  if (userError) {
    console.log('AuthWrapper - User error, redirecting to sign-in');
    return <Redirect href="/sign-in" />;
  }

  if (isInitializing) {
    console.log('AuthWrapper - Showing loading spinner (user not ready or initializing)');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  console.log('AuthWrapper - User ready, rendering children');
  return <>{children}</>;
}
