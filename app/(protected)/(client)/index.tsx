import React, { useEffect } from 'react';
import { useAppTabContext, isClientTab } from '@/context/AppTabContext';
import { usePathname } from 'expo-router';
import ClientSwipeableContainer from '@/components/client/ClientSwipeableContainer';
import ClientDashboard from './dashboard';
import ClientBookmark from './bookmark';
import ClientTalents from './talents';
import ClientProfileWrapper from './ClientProfileWrapper';
import ProjectsIndex from './projects/index';
import { View } from 'react-native';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import ProjectsNavTabs from '@/components/projects/ProjectsNavTabs';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { ManageContractProvider } from '~/context/ManageContractContext';
import { ManageProjectProvider } from '~/context/ManageProjectContext';

// Map tab names to indices
const tabToIndex = {
  dashboard: 0,
  bookmark: 1,
  talents: 2,
  projects: 3,
  client: 4,
} as const;

// Memoize children to prevent re-creation on every render
const MemoizedClientDashboard = React.memo(ClientDashboard);
const MemoizedClientBookmark = React.memo(ClientBookmark);
const MemoizedClientTalents = React.memo(ClientTalents);
const MemoizedProjectRouteWrapper = React.memo(() => (
  <ManageProjectProvider>
    <ManageContractProvider>
      <HeaderWrapper>
        <ProjectsIndex />
      </HeaderWrapper>
    </ManageContractProvider>
  </ManageProjectProvider>
));
const MemoizedClientProfileWrapper = React.memo(ClientProfileWrapper);

function HeaderWrapper({ children }: { children: React.ReactNode }) {
  // Use shared scroll header hook - this will be shared across all job screens
  const { headerTranslateY } = useScrollHeader();

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <CollapsibleHeader title={<ProjectsNavTabs />} translateY={headerTranslateY} isDark={true} />
      {children}
    </View>
  );
}

export default function ClientIndex() {
  const { activeTab, setActiveTab } = useAppTabContext();

  // Type guard to ensure we're in client mode
  if (!isClientTab(activeTab)) {
    return null; // Don't render if not in client mode
  }
  const pathname = usePathname();

  // Initialize tab based on pathname on mount and when pathname changes
  useEffect(() => {
    if (pathname?.includes('/client/')) {
      if (activeTab !== 'client') {
        setActiveTab('client');
      }
    } else if (
      pathname?.includes('/dashboard') ||
      pathname === '/(protected)/(client)/' ||
      pathname === '/(protected)/(client)'
    ) {
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    } else if (pathname?.includes('/bookmark')) {
      if (activeTab !== 'bookmark') {
        setActiveTab('bookmark');
      }
    } else if (pathname?.includes('/talents')) {
      if (activeTab !== 'talents') {
        setActiveTab('talents');
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
      <MemoizedClientTalents />
      <MemoizedProjectRouteWrapper />
      <MemoizedClientProfileWrapper />
    </ClientSwipeableContainer>
  );
}
