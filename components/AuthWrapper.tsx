import React from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isSignedIn, isLoaded, userId } = useAuth();

  console.log('AuthWrapper - isLoaded:', isLoaded, 'isSignedIn:', isSignedIn, 'userId:', userId);

  // Show loading spinner while Clerk is initializing
  if (!isLoaded) {
    console.log('AuthWrapper - Showing loading spinner');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // If user is not signed in, redirect to sign-in screen
  if (!isSignedIn || !userId) {
    console.log('AuthWrapper - Redirecting to sign-in (not signed in or no userId)');
    return <Redirect href="/sign-in" />;
  }

  // If user is signed in, render the protected content
  console.log('AuthWrapper - Rendering protected content');
  return <>{children}</>;
}
