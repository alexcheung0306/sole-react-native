import React, { useEffect } from 'react';
import { useUserTabContext } from '@/context/UserTabContext';
import { usePathname } from 'expo-router';
import UserSwipeableContainer from '@/components/user/UserSwipeableContainer';
import UserHome from './home';
import Explore from './explore';
import CameraScreen from './camera/index';
import JobRouteWrapper from './JobRouteWrapper';
import UserProfileWrapper from './UserProfileWrapper';

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
const MemoizedJobRouteWrapper = React.memo(JobRouteWrapper);
const MemoizedUserProfileWrapper = React.memo(UserProfileWrapper);

export default function UserIndex() {
  const { activeTab, setActiveTab } = useUserTabContext();
  const pathname = usePathname();

  // Initialize tab based on pathname on mount and when pathname changes
  useEffect(() => {
    if (pathname?.includes('/user/')) {
      if (activeTab !== 'user') {
        setActiveTab('user');
      }
    } else if (pathname?.includes('/home') || pathname === '/(protected)/(user)/' || pathname === '/(protected)/(user)') {
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

