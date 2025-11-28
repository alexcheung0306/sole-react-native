import React, { createContext, useContext, useState, ReactNode } from 'react';

type UserTab = 'home' | 'explore' | 'camera' | 'job' | 'user';
type ClientTab = 'dashboard' | 'bookmark' | 'talents' | 'projects' | 'client';

type AppTab = UserTab | ClientTab;

interface AppTabContextType {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isUserMode: boolean;
  isClientMode: boolean;
}

const AppTabContext = createContext<AppTabContextType | undefined>(undefined);

export const AppTabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  // Determine mode based on active tab
  const isUserMode = ['home', 'explore', 'camera', 'job', 'user'].includes(activeTab as UserTab);
  const isClientMode = ['dashboard', 'bookmark', 'talents', 'projects', 'client'].includes(activeTab as ClientTab);

  return (
    <AppTabContext.Provider value={{ activeTab, setActiveTab, isUserMode, isClientMode }}>
      {children}
    </AppTabContext.Provider>
  );
};

export const useAppTabContext = () => {
  const context = useContext(AppTabContext);
  if (!context) {
    throw new Error('useAppTabContext must be used within AppTabProvider');
  }
  return context;
};

// Type guards for type safety
export const isUserTab = (tab: AppTab): tab is UserTab => {
  return ['home', 'explore', 'camera', 'job', 'user'].includes(tab as UserTab);
};

export const isClientTab = (tab: AppTab): tab is ClientTab => {
  return ['dashboard', 'bookmark', 'talents', 'projects', 'client'].includes(tab as ClientTab);
};

export type { UserTab, ClientTab, AppTab };
