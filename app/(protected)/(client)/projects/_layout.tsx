import { Stack, useSegments, useLocalSearchParams, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { ManageProjectProvider } from '@/context/ManageProjectContext';
import { ManageContractProvider } from '@/context/ManageContractContext';
import { ProjectTabProvider } from '@/context/ProjectTabContext';
import { HeaderProvider, useHeaderContext } from '@/context/HeaderContext';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import ProjectsNavTabs from '@/components/projects/ProjectsNavTabs';

function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const params = useLocalSearchParams();
  const pathname = usePathname();
  const { title, setTitle, headerLeft, headerRight, isDark, setIsDark, headerTranslateY, setHeaderLeft, setHeaderRight } = useHeaderContext();

  useEffect(() => {
    // Reset header state when route changes
    setHeaderLeft(null);
    setHeaderRight(null);
    setIsDark(true);

    // Determine current route and set title based on route params
    const lastSegment = segments[segments.length - 1];
    const segmentString = String(lastSegment);
    
    if (segmentString === 'index' || segmentString === 'manage-projects' || segmentString === 'manage-contracts' || pathname?.endsWith('/projects') || pathname?.endsWith('/projects/')) {
      setTitle(<ProjectsNavTabs />);
    } else if (segmentString === 'project-detail') {
      // For project-detail, title will be set by the screen when data loads
      setTitle('Project');
    } else if (segmentString === 'contract') {
      // For contract, use ID from params if available
      if (params.id) {
        setTitle(`Contract #${String(params.id)}`);
      } else {
        setTitle('Contract');
      }
    } else if (segmentString === 'activate-contract') {
      setTitle('Activate Contract');
    } else {
      setTitle('Projects');
    }
  }, [segments, pathname, params.id, setTitle, setHeaderLeft, setHeaderRight, setIsDark]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <CollapsibleHeader
        title={title}
        translateY={headerTranslateY}
        headerLeft={headerLeft}
        headerRight={headerRight}
        isDark={isDark}
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

