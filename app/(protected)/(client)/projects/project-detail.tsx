import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { ChevronLeft } from 'lucide-react-native';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { useProjectDetailQueries } from '@/hooks/useProjectDetailQueries';
import { CustomTabs } from '@/components/custom/custom-tabs';
import SwipeableContainer from '@/components/common/SwipeableContainer';
import ProjectInformationTab from '@/components/project-detail/tabs/ProjectInformationTab';
import ProjectRolesTab from '@/components/project-detail/tabs/ProjectRolesTab';
import ProjectContractsTabWrapper from '@/components/project-detail/tabs/ProjectContractsTabWrapper';

const STATUS_COLORS: Record<string, string> = {
  Draft: '#6b7280',
  Published: '#f59e0b',
  InProgress: '#10b981',
  Completed: '#3b82f6',
};

export default function ProjectDetail({ scrollHandler }: { scrollHandler: (event: any) => void }) {
  const router = useRouter();
  const { id, tab, roleId } = useLocalSearchParams();
  const { soleUserId } = useSoleUserContext();
  const { animatedHeaderStyle, handleHeightChange } = useScrollHeader();
  const queryClient = useQueryClient();
  // Local state for tab and role selection (not in context)
  // Initialize from params if provided
  const [currentTab, setCurrentTab] = useState((tab as string) || 'project-information');
  const [currentRole, setCurrentRole] = useState(0);

  const projectId = id ? parseInt(id as string, 10) : 0;

  const {
    projectData,
    rolesWithSchedules,
    jobContractsData,
    projectLoading,
    projectError,
    jobContractsLoading,
    roleCount,
    jobNotReadyCount,
    countJobActivities,
    refetchProject,
    refetchRoles,
    refetchContracts,
  } = useProjectDetailQueries({ projectId, soleUserId: soleUserId || '' });

  const [refreshing, setRefreshing] = useState(false);

  // Calculate button disabled state - use useMemo to ensure it recalculates when dependencies change
  // MUST be called before any early returns to follow Rules of Hooks
  const isPublishButtonDisabled = useMemo(() => {
    return roleCount > 0 && jobNotReadyCount === 0 ? false : true;
  }, [roleCount, jobNotReadyCount]);

  // Conditionally show tabs based on project status - MUST be called before any early returns
  const tabs = useMemo(() => {
    const project = projectData?.project || projectData;
    const baseTabs = [
      { id: 'project-information', label: 'Details' },
      { id: 'project-roles', label: 'Roles', count: roleCount ?? 0 },
    ];

    // Only show Contracts tab if project is not Draft
    if (project?.status !== 'Draft') {
      baseTabs.push({
        id: 'project-contracts',
        label: 'Contracts',
        count: jobContractsData?.content?.length ?? jobContractsData?.length ?? 0,
      });
    }

    return baseTabs;
  }, [projectData, roleCount, jobContractsData]);

  // Convert tab ID to index for SwipeableContainer
  const getTabIndex = useCallback(
    (tabId: string) => {
      if (!tabs || tabs.length === 0) return 0;
      const index = tabs.findIndex((tab) => tab.id === tabId);
      return index >= 0 ? index : 0;
    },
    [tabs]
  );

  // Convert index to tab ID
  const getTabId = useCallback(
    (index: number) => {
      if (!tabs || tabs.length === 0) return 'project-information';
      return tabs[index]?.id || 'project-information';
    },
    [tabs]
  );

  const currentTabIndex = useMemo(() => {
    return getTabIndex(currentTab);
  }, [getTabIndex, currentTab]);

  // Handle swipe index change
  const handleIndexChange = useCallback(
    (index: number) => {
      const newTabId = getTabId(index);
      if (newTabId && newTabId !== currentTab) {
        setCurrentTab(newTabId);
      }
    },
    [getTabId, currentTab]
  );

  const isInitialLoading = projectLoading;

  // Handle roleId param - find the role index when roles are loaded
  useEffect(() => {
    if (roleId && rolesWithSchedules.length > 0) {
      const targetRoleId = parseInt(roleId as string, 10);
      const roleIndex = rolesWithSchedules.findIndex(
        (roleWithSchedule) => roleWithSchedule?.role?.id === targetRoleId
      );
      if (roleIndex >= 0) {
        setCurrentRole(roleIndex);
      }
    }
  }, [roleId, rolesWithSchedules]);

  // Ensure currentRole is within bounds when roles data changes
  useEffect(() => {
    if (rolesWithSchedules.length > 0 && currentRole >= rolesWithSchedules.length) {
      setCurrentRole(0);
    }
  }, [rolesWithSchedules.length, currentRole]);

  // Switch to project-information tab if user is on contracts tab when project is Draft
  useEffect(() => {
    const project = projectData?.project || projectData;
    if (project?.status === 'Draft' && currentTab === 'project-contracts') {
      setCurrentTab('project-information');
    }
  }, [projectData, currentTab]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Invalidate cached data for this screen and child components
      queryClient.invalidateQueries({ queryKey: ['project-detail', projectId, soleUserId] });
      queryClient.invalidateQueries({ queryKey: ['projectRoles', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectContracts', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-contracts-search', projectId] });
      queryClient.invalidateQueries({ queryKey: ['manageContracts'] });
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
      queryClient.invalidateQueries({ queryKey: ['project-announcements', projectId] });

      await Promise.all([refetchProject(), refetchRoles(), refetchContracts()]);
    } catch (error) {
      console.error('Error refreshing project data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0a] px-6">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-3 text-sm text-zinc-400">Fetching project workspace…</Text>
      </View>
    );
  }

  if (projectError || !projectData) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0a] px-6">
        <Text className="text-lg font-semibold text-rose-400">We couldn't load this project.</Text>
        <TouchableOpacity
          className="mt-5 rounded-xl bg-blue-500 px-5 py-3"
          activeOpacity={0.85}
          onPress={() => router.back()}>
          <Text className="text-sm font-semibold text-white">Return to projects</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const project = projectData?.project || projectData;
  const statusTint = STATUS_COLORS[project?.status] || STATUS_COLORS.Draft;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-[#0a0a0a]">
        <CollapsibleHeader
          title={project?.projectName || 'Project'}
          headerLeft={
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              className="flex items-center justify-center p-2">
              <ChevronLeft color="#93c5fd" size={24} />
            </TouchableOpacity>
          }
          secondHeader={
            <View className="gap-2">
              {/* Project Chips */}
              <View className={`flex-row flex-wrap items-center gap-3 px-2`}>
                <View
                  className="rounded-full px-3 py-1"
                  style={{ backgroundColor: `${statusTint}33` }}>
                  <Text className="text-xs font-semibold text-white" style={{ color: statusTint }}>
                    {project?.status || ''}
                  </Text>
                </View>
                <View className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1">
                  <Text className="text-xs font-semibold text-white">
                    Project #{project?.id ? String(project.id) : ''}
                  </Text>
                </View>
              </View>

              {/* Tabs */}
              <View className="px-2">
                <CustomTabs
                  tabs={tabs}
                  value={currentTab}
                  onValueChange={setCurrentTab}
                  containerClassName="flex-row rounded-2xl border border-white/10 bg-zinc-700 p-1"
                  showCount={true}
                />
              </View>
            </View>
          }
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
        />

        {/* Swipeable Tab Content */}
        <SwipeableContainer
          activeIndex={currentTabIndex}
          onIndexChange={handleIndexChange}
          shrink={false}>
          {tabs.map((tab) => {
            if (tab.id === 'project-information') {
              return (
                <ProjectInformationTab
                  key={tab.id}
                  project={project}
                  projectId={projectId}
                  soleUserId={soleUserId || ''}
                  projectStatus={project?.status || 'Draft'}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  isPublishButtonDisabled={isPublishButtonDisabled}
                  onPublishSuccess={() => {
                    // Navigate back to projects list after successful publish
                    router.back();
                  }}
                />
              );
            }
            if (tab.id === 'project-roles') {
              return (
                <ProjectRolesTab
                  key={tab.id}
                  project={project}
                  projectId={projectId}
                  rolesWithSchedules={rolesWithSchedules}
                  currentRole={currentRole}
                  setCurrentRole={setCurrentRole}
                  countJobActivities={countJobActivities}
                  refetchRoles={refetchRoles}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              );
            }
            if (tab.id === 'project-contracts') {
              return (
                <ProjectContractsTabWrapper
                  key={tab.id}
                  projectId={projectId}
                  initialContracts={
                    Array.isArray(jobContractsData)
                      ? jobContractsData
                      : (jobContractsData?.content ?? jobContractsData?.data ?? [])
                  }
                  isLoadingInitial={jobContractsLoading}
                  refetchContracts={refetchContracts}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              );
            }
            return <View key={tab.id} />;
          })}
        </SwipeableContainer>
      </View>
    </>
  );
}
