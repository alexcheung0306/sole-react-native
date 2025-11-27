import { useLocalSearchParams } from 'expo-router';
import React, { createContext, useContext, useState, ReactNode } from 'react';

type ProjectTab = 'manage-projects' | 'manage-contracts';

interface ProjectTabContextType {
  activeTab: ProjectTab;
  setActiveTab: (tab: ProjectTab) => void;
}

const ProjectTabContext = createContext<ProjectTabContextType | undefined>(undefined);

export const ProjectTabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { params } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<ProjectTab>('manage-projects');

  return (
    <ProjectTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ProjectTabContext.Provider>
  );
};

export const useProjectTabContext = () => {
  const context = useContext(ProjectTabContext);
  if (!context) {
    throw new Error('useProjectTabContext must be used within ProjectTabProvider');
  }
  return context;
};

