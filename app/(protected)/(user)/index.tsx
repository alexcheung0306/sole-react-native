import React from 'react';
import { useUserTabContext } from '@/context/UserTabContext';
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
  const { activeTab } = useUserTabContext();

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

