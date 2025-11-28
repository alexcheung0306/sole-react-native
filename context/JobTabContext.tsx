import { useLocalSearchParams } from 'expo-router';
import React, { createContext, useContext, useState, ReactNode } from 'react';

type JobTab = 'job-posts' | 'applied-roles' | 'my-contracts';

interface JobTabContextType {
  activeTab: JobTab;
  setActiveTab: (tab: JobTab) => void;
}

const JobTabContext = createContext<JobTabContextType | undefined>(undefined);

export const JobTabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<JobTab>('job-posts');
  return (
    <JobTabContext.Provider value={{ activeTab, setActiveTab }}>{children}</JobTabContext.Provider>
  );
};

export const useJobTabContext = () => {
  const context = useContext(JobTabContext);
  if (!context) {
    throw new Error('useJobTabContext must be used within JobTabProvider');
  }
  return context;
};
