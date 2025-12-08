import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useEffect, useState } from 'react';

export default function Page() {
  // Always call hooks first, before any conditional returns
  const { isSignedIn, isLoaded } = useAuth();
  const [showError, setShowError] = useState(false);

  // Show error if Clerk doesn't load within 5 seconds
  useEffect(() => {
    if (!isLoaded) {
      const timer = setTimeout(() => {
        setShowError(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [isLoaded]);

  // Show loading while checking auth state
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#000000" />
        {showError && (
          <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
            <Text style={{ color: '#EF4444', textAlign: 'center', fontSize: 14 }}>
              Clerk is taking longer than expected to load.{'\n'}
              Please check your EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.local
            </Text>
          </View>
        )}
      </View>
    );
  }

  // If not signed in, redirect to sign-in page
  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  // If signed in, redirect to protected user tabs
  return <Redirect href="/(protected)/(user)" />;
}

