import { useAppTabContext, isUserTab } from '@/context/AppTabContext';
import UserSwipeableContainer from '@/components/user/UserSwipeableContainer';
import UserHome from './home';
import Explore from './explore';
import CameraScreen from './camera/index';
import UserProfileWrapper from './UserProfileWrapper';
import JobIndex from './job';

// Map tab names to indices
const tabToIndex = {
  home: 0,
  explore: 1,
  camera: 2,
  job: 3,
  user: 4,
} as const;

export default function UserIndex() {
  const { activeTab } = useAppTabContext();

  // Type guard to ensure we're in user mode
  if (!isUserTab(activeTab)) {
    return null; // Don't render if not in user mode
  }

  const activeIndex = tabToIndex[activeTab] ?? 0;

  return (
    <UserSwipeableContainer activeIndex={activeIndex}>
      <UserHome />
      <Explore />
      <CameraScreen />
      <JobIndex />
      <UserProfileWrapper />
    </UserSwipeableContainer>
  );
}
