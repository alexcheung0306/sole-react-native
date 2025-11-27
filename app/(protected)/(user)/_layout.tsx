import { Stack, useSegments, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { UserTabProvider, useUserTabContext } from '@/context/UserTabContext';
import { JobTabProvider } from '@/context/JobTabContext';
import { HeaderProvider, useHeaderContext } from '@/context/HeaderContext';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import JobsNavTabs from '@/components/job/JobsNavTabs';
import UserTabBar from '@/components/user/UserTabBar';

function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const pathname = usePathname();
  const { activeTab } = useUserTabContext();
  const { title, setTitle, headerLeft, headerRight, isDark, setIsDark, headerTranslateY, setHeaderLeft, setHeaderRight } = useHeaderContext();

  useEffect(() => {
    // Reset header state when route changes
    setHeaderLeft(null);
    setHeaderRight(null);
    setIsDark(true);

    // Determine current route and set title
    const lastSegment = segments[segments.length - 1];
    const segmentString = String(lastSegment);
    
    // Check if we're in the job route - use activeTab from context (for swipeable container) or check pathname/segments
    const isJobRoute = 
      activeTab === 'job' ||
      pathname?.includes('/job') || 
      segmentString === 'job' || 
      segmentString === 'job-posts' ||
      segmentString === 'applied-roles' ||
      segmentString === 'my-contracts' ||
      segmentString === 'job-detail' ||
      (segments.length > 0 && segments[segments.length - 2] === 'job');
    
    if (isJobRoute) {
      // Only set JobsNavTabs if we're not on job-detail (which should show a different title)
      if (segmentString === 'job-detail') {
        setTitle('Job');
      } else {
        setTitle(<JobsNavTabs />);
      }
    } else {
      setTitle(null);
    }
  }, [segments, pathname, activeTab, setTitle, setHeaderLeft, setHeaderRight, setIsDark]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {title && (
        <CollapsibleHeader
          title={title}
          translateY={headerTranslateY}
          headerLeft={headerLeft}
          headerRight={headerRight}
          isDark={isDark}
        />
      )}
      {children}
    </View>
  );
}

export default function UserTabLayout() {
  return (
    <UserTabProvider>
      <JobTabProvider>
        <HeaderProvider>
          <HeaderWrapper>
            <View style={{ flex: 1, backgroundColor: '#000000' }}>
              <Stack
        screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#000000' },
                }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="home" options={{ headerShown: false }} />
                <Stack.Screen name="explore" options={{ headerShown: false }} />
                <Stack.Screen name="camera" options={{ headerShown: false }} />
                <Stack.Screen name="job" options={{ headerShown: false }} />
                <Stack.Screen name="user" options={{ headerShown: false }} />
                <Stack.Screen name="post" options={{ headerShown: false }} />
              </Stack>
              <UserTabBar />
            </View>
          </HeaderWrapper>
        </HeaderProvider>
      </JobTabProvider>
    </UserTabProvider>
  );
}
