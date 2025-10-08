import { useEffect } from 'react';
import { router } from 'expo-router';
import { useNavigation } from '~/context/NavigationContext';

export default function ProtectedIndex() {
  const { currentMode } = useNavigation();

  useEffect(() => {
    // Redirect to the appropriate tab system based on current mode
    if (currentMode === 'client') {
      router.replace('/(protected)/(client)' as any);
    } else {
      router.replace('/(protected)/(user)' as any);
    }
  }, [currentMode]);

  return null; // This component doesn't render anything
}
