import { Stack } from 'expo-router';
import { createContext, useContext, ReactNode } from 'react';
import { View } from 'react-native';
import { ProjectTabProvider } from '@/context/ProjectTabContext';
import { ManageProjectProvider } from '@/context/ManageProjectContext';
import { ManageContractProvider } from '@/context/ManageContractContext';
import { HeaderProvider, useHeaderContext } from '@/context/HeaderContext';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import ProjectsNavTabs from '@/components/projects/ProjectsNavTabs';
import { useScrollHeader } from '@/hooks/useScrollHeader';

// Create a context to share the scroll handler across project screens
const ProjectScrollContext = createContext<ReturnType<typeof useScrollHeader> | null>(null);

export const useProjectScrollHeader = () => {
  const context = useContext(ProjectScrollContext);
  if (!context) {
    throw new Error('useProjectScrollHeader must be used within ProjectScrollProvider');
  }
  return context;
};

export function ProjectScrollProvider({ children }: { children: ReactNode }) {
  const scrollHeader = useScrollHeader();
  return (
    <ProjectScrollContext.Provider value={scrollHeader}>
      {children}
    </ProjectScrollContext.Provider>
  );
}

function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const { title } = useHeaderContext();
  const { headerTranslateY } = useProjectScrollHeader();

  // Show ProjectsNavTabs when title is default 'Projects' or when title is a ReactNode that's not ProjectsNavTabs
  // Otherwise show the custom title (for project-detail, contract, etc.)
  const headerTitle = (title === 'Projects' || !title) ? <ProjectsNavTabs /> : title;

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <CollapsibleHeader
        title={headerTitle}
        translateY={headerTranslateY}
        isDark={true}
      />
      {children}
    </View>
  );
}

export default function ProjectsLayout() {
  return (
    <ProjectTabProvider>
      <ManageProjectProvider>
        <ManageContractProvider>
          <HeaderProvider>
            <ProjectScrollProvider>
              <HeaderWrapper>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#000000' },
                  }}
                >
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="manage-projects" options={{ headerShown: false }} />
                  <Stack.Screen name="project-detail" options={{ headerShown: false }} />
                  <Stack.Screen name="manage-contracts" options={{ headerShown: false }} />
                  <Stack.Screen name="contract" options={{ headerShown: false }} />
                  <Stack.Screen name="activate-contract" options={{ headerShown: false }} />
                </Stack>
              </HeaderWrapper>
            </ProjectScrollProvider>
          </HeaderProvider>
        </ManageContractProvider>
      </ManageProjectProvider>
    </ProjectTabProvider>
  );
}

