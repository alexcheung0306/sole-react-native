import React, { useEffect } from 'react';
import { useClientTabContext } from '@/context/ClientTabContext';
import { usePathname } from 'expo-router';
import ClientSwipeableContainer from '@/components/client/ClientSwipeableContainer';
import ClientDashboard from './dashboard';
import ClientBookmark from './bookmark';
import ClientExplore from './explore';
import ProjectRouteWrapper from './ProjectRouteWrapper';
import ClientProfileWrapper from './ClientProfileWrapper';

// Map tab names to indices
const tabToIndex = {
  dashboard: 0,
  bookmark: 1,
  explore: 2,
  projects: 3,
  client: 4,
} as const;

// Memoize children to prevent re-creation on every render
const MemoizedClientDashboard = React.memo(ClientDashboard);
const MemoizedClientBookmark = React.memo(ClientBookmark);
const MemoizedClientExplore = React.memo(ClientExplore);
const MemoizedProjectRouteWrapper = React.memo(ProjectRouteWrapper);
const MemoizedClientProfileWrapper = React.memo(ClientProfileWrapper);

export default function ClientIndex() {
  const { activeTab, setActiveTab } = useClientTabContext();
  const pathname = usePathname();

  // Initialize tab based on pathname on mount and when pathname changes
  useEffect(() => {
    if (pathname?.includes('/client/')) {
      if (activeTab !== 'client') {
        setActiveTab('client');
      }
    } else if (pathname?.includes('/dashboard') || pathname === '/(protected)/(client)/' || pathname === '/(protected)/(client)') {
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    } else if (pathname?.includes('/bookmark')) {
      if (activeTab !== 'bookmark') {
        setActiveTab('bookmark');
      }
    } else if (pathname?.includes('/explore')) {
      if (activeTab !== 'explore') {
        setActiveTab('explore');
      }
    } else if (pathname?.includes('/projects')) {
      if (activeTab !== 'projects') {
        setActiveTab('projects');
      }
    }
  }, [pathname, activeTab, setActiveTab]);

  const activeIndex = tabToIndex[activeTab] ?? 0;

  return (
    <ClientSwipeableContainer activeIndex={activeIndex}>
      <MemoizedClientDashboard />
      <MemoizedClientBookmark />
      <MemoizedClientExplore />
      <MemoizedProjectRouteWrapper />
      <MemoizedClientProfileWrapper />
    </ClientSwipeableContainer>
  );
}

