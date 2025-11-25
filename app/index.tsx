import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function Page() {
  // Always call hooks first, before any conditional returns
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading while checking auth state
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // If not signed in, redirect to sign-in page
  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  // If signed in, redirect to protected home
  return <Redirect href="/(protected)/(user)/home" />;
}

