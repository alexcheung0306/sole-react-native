import React, { useEffect } from 'react';
import { useAppTabContext, isUserTab } from '@/context/AppTabContext';
import { usePathname } from 'expo-router';
import UserSwipeableContainer from '@/components/user/UserSwipeableContainer';
import UserHome from './home';
import Explore from './explore';
import CameraScreen from './camera/index';
import UserProfileWrapper from './UserProfileWrapper';
import { AppliedRolesProvider } from '~/context/AppliedRolesContext';
import { JobPostsProvider } from '~/context/JobPostsContext';
import { MyContractsProvider } from '~/context/MyContractsContext';
import JobIndex from './job';
import { View } from 'react-native';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import JobsNavTabs from '~/components/job/JobsNavTabs';
import { useScrollHeader } from '~/hooks/useScrollHeader';

// Map tab names to indices
const tabToIndex = {
  home: 0,
  explore: 1,
  camera: 2,
  job: 3,
  user: 4,
} as const;

// Memoize children to prevent re-creation on every render
const MemoizedUserHome = React.memo(UserHome);
const MemoizedExplore = React.memo(Explore);
const MemoizedCameraScreen = React.memo(CameraScreen);
const MemoizedJobRouteWrapper = React.memo(() => (
  <JobPostsProvider>
    <AppliedRolesProvider>
      <MyContractsProvider>
        <HeaderWrapper>
          <JobIndex />
        </HeaderWrapper>
      </MyContractsProvider>
    </AppliedRolesProvider>
  </JobPostsProvider>
));
const MemoizedUserProfileWrapper = React.memo(UserProfileWrapper);

function HeaderWrapper({ children }: { children: React.ReactNode }) {
  // Use shared scroll header hook - this will be shared across all job screens
  const { headerTranslateY } = useScrollHeader();

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <CollapsibleHeader title={<JobsNavTabs />} translateY={headerTranslateY} isDark={true} />
      {children}
    </View>
  );
}

export default function UserIndex() {
  const { activeTab, setActiveTab } = useAppTabContext();

  // Type guard to ensure we're in user mode
  if (!isUserTab(activeTab)) {
    return null; // Don't render if not in user mode
  }
  const pathname = usePathname();

  // Initialize tab based on pathname on mount and when pathname changes
  useEffect(() => {
    if (pathname?.includes('/user/')) {
      if (activeTab !== 'user') {
        setActiveTab('user');
      }
    } else if (
      pathname?.includes('/home') ||
      pathname === '/(protected)/(user)/' ||
      pathname === '/(protected)/(user)'
    ) {
      if (activeTab !== 'home') {
        setActiveTab('home');
      }
    } else if (pathname?.includes('/explore')) {
      if (activeTab !== 'explore') {
        setActiveTab('explore');
      }
    } else if (pathname?.includes('/camera')) {
      if (activeTab !== 'camera') {
        setActiveTab('camera');
      }
    } else if (pathname?.includes('/job')) {
      if (activeTab !== 'job') {
        setActiveTab('job');
      }
    }
  }, [pathname, activeTab, setActiveTab]);

  const activeIndex = tabToIndex[activeTab] ?? 0;

  return (
    <UserSwipeableContainer activeIndex={activeIndex}>
      <MemoizedUserHome />
      <MemoizedExplore />
      <MemoizedCameraScreen />
      <MemoizedJobRouteWrapper />
      <MemoizedUserProfileWrapper />
    </UserSwipeableContainer>
  );
}
