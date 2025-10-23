import { useEffect } from 'react';
import { router } from 'expo-router';

export default function UserIndex() {
  useEffect(() => {
    // Redirect to home when user tab is accessed
    router.replace('/(protected)/(user)/home' as any);
  }, []);

  return null; // This component doesn't render anything
}
