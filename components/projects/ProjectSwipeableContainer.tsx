import React, { useCallback, useRef } from 'react';
import { useProjectTabContext } from '~/context/ProjectTabContext';
import SwipeableContainer from '@/components/common/SwipeableContainer';

type ProjectSwipeableContainerProps = {
  children: React.ReactNode[];
  activeIndex: number;
};

export default function ProjectSwipeableContainer({
  children,
  activeIndex,
}: ProjectSwipeableContainerProps) {
  const { activeTab, setActiveTab } = useProjectTabContext();
  const activeTabRef = useRef(activeTab);

  // Keep ref updated with latest activeTab value
  React.useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const indexToTab = ['manage-projects', 'manage-contracts'] as const;
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

