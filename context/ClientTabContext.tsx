import React, { createContext, useContext, useState, ReactNode } from 'react';

type ClientTab = 'dashboard' | 'bookmark' | 'explore' | 'projects' | 'client';

interface ClientTabContextType {
  activeTab: ClientTab;
  setActiveTab: (tab: ClientTab) => void;
}

const ClientTabContext = createContext<ClientTabContextType | undefined>(undefined);

export const ClientTabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ClientTab>('dashboard');

  return (
    <ClientTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ClientTabContext.Provider>
  );
};

export const useClientTabContext = () => {
  const context = useContext(ClientTabContext);
  if (!context) {
    throw new Error('useClientTabContext must be used within ClientTabProvider');
  }
  return context;
};

