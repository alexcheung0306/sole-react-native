import { Stack } from 'expo-router';
import { View } from 'react-native';
import { ProjectTabProvider } from '@/context/ProjectTabContext';
import { ManageProjectProvider } from '@/context/ManageProjectContext';
import { ManageContractProvider } from '@/context/ManageContractContext';
import { HeaderProvider, useHeaderContext } from '@/context/HeaderContext';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import ProjectsNavTabs from '@/components/projects/ProjectsNavTabs';

function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const { title } = useHeaderContext();

  // Show ProjectsNavTabs when title is default 'Projects' or when title is a ReactNode that's not ProjectsNavTabs
  // Otherwise show the custom title (for project-detail, contract, etc.)
  const headerTitle = (title === 'Projects' || !title) ? <ProjectsNavTabs /> : title;

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <CollapsibleHeader
        title={headerTitle}
        translateY={0}
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
          </HeaderProvider>
        </ManageContractProvider>
      </ManageProjectProvider>
    </ProjectTabProvider>
  );
}

