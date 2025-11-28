import React, { useCallback, useRef } from 'react';
import { useAppTabContext, isClientTab } from '~/context/AppTabContext';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import SwipeableContainer from '@/components/common/SwipeableContainer';

type ClientSwipeableContainerProps = {
  children: React.ReactNode[];
  activeIndex: number;
};

export default function ClientSwipeableContainer({
  children,
  activeIndex,
}: ClientSwipeableContainerProps) {
  const { activeTab, setActiveTab } = useAppTabContext();

  // Type guard to ensure we're in client mode
  if (!isClientTab(activeTab)) {
    return null; // Don't render if not in client mode
  }
  const activeTabRef = useRef(activeTab);
  const { user } = useUser();
  const router = useRouter();

  // Keep ref updated with latest activeTab value
  React.useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const indexToTab = ['dashboard', 'bookmark', 'talents', 'projects', 'client'] as const;
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

