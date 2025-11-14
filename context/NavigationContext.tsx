import React, { createContext, useContext, useState, useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';

type NavigationMode = 'client' | 'user';

interface NavigationContextType {
  currentMode: NavigationMode;
  switchToClient: () => void;
  switchToUser: () => void;
  toggleMode: () => void;
  syncModeFromRoute: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentMode, setCurrentMode] = useState<NavigationMode>('user');
  const segments = useSegments();
  const { user } = useUser();

  // Sync mode with current route
  const syncModeFromRoute = () => {
    const path = segments.join('/');
    if (path.includes('(client)')) {
      setCurrentMode('client');
    } else if (path.includes('(user)')) {
      setCurrentMode('user');
    }
  };

  // Auto-sync mode when route changes
  useEffect(() => {
    const path = segments.join('/');
    if (path.includes('(client)')) {
      setCurrentMode('client');
    } else if (path.includes('(user)')) {
      setCurrentMode('user');
    }
  }, [segments]);

  const switchToClient = () => {
    console.log('Switching to client mode');
    setCurrentMode('client');
    router.replace('/(protected)/(client)/client/[username]' as any);
    if (user?.username) {
      router.replace(`/(protected)/(client)/client/${user.username}` as any);
    } else {
      router.replace('/(protected)/(client)/dashboard' as any);
    }
  };

  const switchToUser = () => {
    console.log('Switching to user mode');
    setCurrentMode('user');
    if (user?.username) {
      router.replace(`/(protected)/(user)/user/${user.username}` as any);
    } else {
      router.replace('/(protected)/(user)/home' as any);
    }
  };

  const toggleMode = () => {
    if (currentMode === 'client') {
      switchToUser();
    } else {
      switchToClient();
    }
  };

  return (
    <NavigationContext.Provider
      value={{
        currentMode,
        switchToClient,
        switchToUser,
        toggleMode,
        syncModeFromRoute,
      }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
