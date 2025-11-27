import React, { useCallback, useRef } from 'react';
import { useUserTabContext } from '~/context/UserTabContext';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import SwipeableContainer from '@/components/common/SwipeableContainer';

type UserSwipeableContainerProps = {
  children: React.ReactNode[];
  activeIndex: number;
};

export default function UserSwipeableContainer({
  children,
  activeIndex,
}: UserSwipeableContainerProps) {
  const { activeTab, setActiveTab } = useUserTabContext();
  const activeTabRef = useRef(activeTab);
  const { user } = useUser();
  const router = useRouter();

  // Keep ref updated with latest activeTab value
  React.useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const indexToTab = ['home', 'explore', 'camera', 'job', 'user'] as const;
  const onIndexChange = useCallback(
    (index: number) => {
      // Get the latest activeTab value from ref to avoid stale closure
      const currentActiveTab = activeTabRef.current;
      // Safety check
      if (index < 0 || index >= indexToTab.length) {
        return;
      }

      const newTab = indexToTab[index];
      if (newTab && newTab !== currentActiveTab) {
        setActiveTab(newTab);
        // Only navigate if we're not already on the index route
        // This prevents unnecessary re-renders during swiping
        // The SwipeableContainer already handles the visual transition
      }
    },
    [setActiveTab]
  );

  return (
    <SwipeableContainer activeIndex={activeIndex} onIndexChange={onIndexChange}>
      {children}
    </SwipeableContainer>
  );
}

