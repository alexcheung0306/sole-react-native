import { Stack, useSegments, useLocalSearchParams, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { JobTabProvider } from '@/context/JobTabContext';
import { JobPostsProvider } from '@/context/JobPostsContext';
import { AppliedRolesProvider } from '@/context/AppliedRolesContext';
import { MyContractsProvider } from '@/context/MyContractsContext';
import { HeaderProvider, useHeaderContext } from '@/context/HeaderContext';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import JobsNavTabs from '@/components/job/JobsNavTabs';

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
    
    if (segmentString === 'index' || pathname?.endsWith('/job') || pathname?.endsWith('/job/')) {
      setTitle(<JobsNavTabs />);
    } else if (segmentString === 'job-posts') {
      setTitle(<JobsNavTabs />);
    } else if (segmentString === 'applied-roles') {
      setTitle(<JobsNavTabs />);
    } else if (segmentString === 'my-contracts') {
      setTitle(<JobsNavTabs />);
    } else if (segmentString === 'job-detail') {
      // For job-detail, title will be set by the screen when data loads
      setTitle('Job');
    } else {
      setTitle('Jobs');
    }
  }, [segments, pathname, setTitle, setHeaderLeft, setHeaderRight, setIsDark]);

  return (
    <View style={{ flex: 1 }}>
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

export default function JobLayout() {
  return (
    <JobTabProvider>
      <JobPostsProvider>
        <AppliedRolesProvider>
          <MyContractsProvider>
            <HeaderProvider>
              <HeaderWrapper>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#0a0a0a' },
                  }}
                >
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="job-posts" options={{ headerShown: false }} />
                  <Stack.Screen name="applied-roles" options={{ headerShown: false }} />
                  <Stack.Screen name="my-contracts" options={{ headerShown: false }} />
                  <Stack.Screen name="job-detail" options={{ headerShown: false }} />
                </Stack>
              </HeaderWrapper>
            </HeaderProvider>
          </MyContractsProvider>
        </AppliedRolesProvider>
      </JobPostsProvider>
    </JobTabProvider>
  );
}
