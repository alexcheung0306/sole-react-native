import React, { createContext, useCallback, useContext, useState } from 'react';
import { isServerMaintenanceError } from '~/lib/errors';

interface ServerMaintenanceContextType {
  showMaintenance: (error?: any) => void;
  hideMaintenance: () => void;
  handleError: (error: any, retry?: () => void) => boolean;
  isServerDown: boolean;
  onRetry?: () => void;
}

const ServerMaintenanceContext = createContext<
  ServerMaintenanceContextType | undefined
>(undefined);

export function ServerMaintenanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isServerDown, setIsServerDown] = useState(false);
  const [retryCallback, setRetryCallback] = useState<(() => void) | undefined>(
    undefined
  );

  const showMaintenance = useCallback((error?: any) => {
    console.error('Server maintenance error:', error);
    setIsServerDown(true);
  }, []);

  const hideMaintenance = useCallback(() => {
    setIsServerDown(false);
    setRetryCallback(undefined);
  }, []);

  const handleError = useCallback(
    (error: any, retry?: () => void) => {
      if (isServerMaintenanceError(error)) {
        if (retry) {
          setRetryCallback(() => retry);
        }
        showMaintenance(error);
        return true;
      }
      return false;
    },
    [showMaintenance]
  );

  const handleRetry = useCallback(() => {
    hideMaintenance();
    if (retryCallback) {
      retryCallback();
    }
  }, [hideMaintenance, retryCallback]);

  return (
    <ServerMaintenanceContext.Provider
      value={{
        showMaintenance,
        hideMaintenance,
        handleError,
        isServerDown,
        onRetry: retryCallback ? handleRetry : undefined,
      }}
    >
      {children}
    </ServerMaintenanceContext.Provider>
  );
}

export function useServerMaintenance() {
  const context = useContext(ServerMaintenanceContext);
  if (context === undefined) {
    throw new Error(
      'useServerMaintenance must be used within a ServerMaintenanceProvider'
    );
  }
  return context;
}

