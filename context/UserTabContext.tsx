import React, { createContext, useContext, useState, ReactNode } from 'react';

type UserTab = 'home' | 'explore' | 'camera' | 'job' | 'user';

interface UserTabContextType {
  activeTab: UserTab;
  setActiveTab: (tab: UserTab) => void;
}

const UserTabContext = createContext<UserTabContextType | undefined>(undefined);

export const UserTabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<UserTab>('home');

  return (
    <UserTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </UserTabContext.Provider>
  );
};

export const useUserTabContext = () => {
  const context = useContext(UserTabContext);
  if (!context) {
    throw new Error('useUserTabContext must be used within UserTabProvider');
  }
  return context;
};

