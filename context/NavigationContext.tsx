import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router, useSegments } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { AppTabProvider, useAppTabContext } from './AppTabContext';
import { JobTabProvider } from './JobTabContext';
import { ProjectTabProvider } from './ProjectTabContext';
import { HeaderProvider } from './HeaderContext';

type NavigationMode = 'client' | 'user';

interface NavigationContextType {
  currentMode: NavigationMode;
  switchToClient: () => void;
  switchToUser: () => void;
  toggleMode: () => void;
  syncModeFromRoute: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Inner component that has access to tab context
function NavigationProviderInner({ children }: { children: React.ReactNode }) {
  const [currentMode, setCurrentMode] = useState<NavigationMode>('user');
  const segments = useSegments();
  const { user } = useUser();
  const appTabContext = useAppTabContext();

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
    // Set client tab to client profile if user has username
    if (appTabContext && user?.username) {
      appTabContext.setActiveTab('client');
    } else if (appTabContext) {
      appTabContext.setActiveTab('dashboard');
    }

    if (user?.username) {
      router.replace(`/(protected)/(client)` as any);
    }
  };

  const switchToUser = () => {
    console.log('Switching to user mode');
    setCurrentMode('user');
    // Set user tab to user profile if user has username
    if (appTabContext && user?.username) {
      appTabContext.setActiveTab('user');
    } else if (appTabContext) {
      appTabContext.setActiveTab('home');
    }

    if (user?.username) {
      router.replace('/(protected)/(user)' as any);
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

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppTabProvider>
      <JobTabProvider>
        <ProjectTabProvider>
          <HeaderProvider>
            <NavigationProviderInner>{children}</NavigationProviderInner>
          </HeaderProvider>
        </ProjectTabProvider>
      </JobTabProvider>
    </AppTabProvider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
