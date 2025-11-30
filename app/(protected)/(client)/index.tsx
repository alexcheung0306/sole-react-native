import React from 'react';
import { useAppTabContext, isClientTab } from '@/context/AppTabContext';
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

// Map tab names to indices
const tabToIndex = {
  dashboard: 0,
  bookmark: 1,
  talents: 2,
  projects: 3,
  client: 4,
} as const;

export default function ClientIndex() {
  const { activeTab } = useAppTabContext();

  // Type guard to ensure we're in client mode
  if (!isClientTab(activeTab)) {
    return null; // Don't render if not in client mode
  }

  const activeIndex = tabToIndex[activeTab] ?? 0;

  return (
    <ClientSwipeableContainer activeIndex={activeIndex}>
      <ClientDashboard />
      <ClientBookmark />
      <ClientTalents />
      <ProjectsIndex />
      <ClientProfileWrapper />
    </ClientSwipeableContainer>
  );
}
