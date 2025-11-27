import React, { useEffect, useState, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { getSoleUserByClerkId } from '~/api/apiservice';
import { createUser } from '~/api/apiservice/soleUser_api';
import { env } from '~/env.mjs';
import { useServerMaintenance } from '~/context/ServerMaintenanceContext';
import { isServerMaintenanceError } from '~/lib/errors';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const [userError, setUserError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { handleError, isServerDown } = useServerMaintenance();
  const hasLoggedReady = useRef(false);
  
  // DEV MODE - bypass backend/database when true
  const DEV_MODE = env.NODE_ENV === 'development';

  useEffect(() => {
    const initializeUser = async () => {
      // Only run once when auth data becomes available
      // Don't run if server is down to prevent infinite loops
      if (
        isSignedIn &&
        userId &&
        clerkUser &&
        !hasInitialized &&
        !isInitializing &&
        !isServerDown
      ) {
        
        // 🟡 DEV MODE: Skip all backend calls
        if (DEV_MODE) {
          setHasInitialized(true);
          setIsInitializing(false);
          return;
        }
        
        setIsInitializing(true);
        setUserError(null);
        
        try {
          const existingUser = await getSoleUserByClerkId(userId);
          if (existingUser && existingUser !== 404) {
            setHasInitialized(true);
            setIsInitializing(false);
            return;
          }
          
          const newUser = await createUser({
            username: clerkUser.username || 'New User',
            email: clerkUser.emailAddresses?.[0]?.emailAddress || 'default@example.com',
            clerkId: userId,
            image: clerkUser.imageUrl || '',
          });
          setHasInitialized(true);
          setIsInitializing(false);
        } catch (error: any) {
          console.error('AuthWrapper - Error initializing user:', error);
          
          // Check if it's a server maintenance error
          if (isServerMaintenanceError(error)) {
            setIsInitializing(false);
            
            // Set up retry callback
            const retry = () => {
              setRetryCount((prev) => prev + 1);
            };
            
            // handleError will set isServerDown state in the context
            handleError(error, retry);
            return; // Don't redirect, let the layout handle the UI
          }
          
          // For other errors, set error state but allow access
          setUserError('Failed to initialize user');
          setIsInitializing(false);
        }
      }
    };

    initializeUser();
  }, [
    isSignedIn,
    userId,
    clerkUser,
    hasInitialized,
    isInitializing,
    isServerDown,
    handleError,
    retryCount,
    DEV_MODE,
  ]);

  if (!isLoaded) {
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
    return <>{children}</>;
  }

  if (userError) {
    // Don't redirect on error, just allow access
    return <>{children}</>;
  }

  if (isInitializing || (isSignedIn && !hasInitialized)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Only log once when user becomes ready
  if (!hasLoggedReady.current) {
    hasLoggedReady.current = true;
  }

  return <>{children}</>;
}
