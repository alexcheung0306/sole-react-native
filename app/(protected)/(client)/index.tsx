import { useEffect } from 'react';
import { router } from 'expo-router';

export default function ClientIndex() {
  useEffect(() => {
    // Redirect to dashboard when client tab is accessed
    router.replace('/(protected)/(client)/dashboard' as any);
  }, []);

  return null; // This component doesn't render anything
}
