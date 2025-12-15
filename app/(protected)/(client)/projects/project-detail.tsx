import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { ChevronLeft } from 'lucide-react-native';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { useProjectDetailQueries } from '@/hooks/useProjectDetailQueries';
import { ProjectContractsTab } from '~/components/project-detail/contracts/ProjectContractsTab';
import { ProjectInformationCard } from '~/components/project-detail/details/ProjectInformationCard';
import ProjectAnnouncementFormPortal from '~/components/form-components/project-announcement-form/ProjectAnnouncementFormPortal';
import { ProjectAnnouncementsList } from '~/components/project-detail/details/ProjectAnnouncementsList';
import { CustomTabs } from '@/components/custom/custom-tabs';
import { RoleFormPortal } from '~/components/form-components/role-form/RoleFormPortal';
import { RolesBreadcrumb } from '~/components/project-detail/roles/RolesBreadcrumb';
import { ManageCandidates } from '~/components/project-detail/roles/ManageCandidates';
import { PublishProjectButton } from '~/components/project-detail/PublishProjectButton';
import SwipeableContainer from '@/components/common/SwipeableContainer';

const STATUS_COLORS: Record<string, string> = {
  Draft: '#6b7280',
  Published: '#f59e0b',
  InProgress: '#10b981',
  Completed: '#3b82f6',
};

export default function ProjectDetail({ scrollHandler }: { scrollHandler: (event: any) => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, tab, roleId } = useLocalSearchParams();
  const { soleUserId } = useSoleUserContext();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const queryClient = useQueryClient();
  // Local state for tab and role selection (not in context)
  // Initialize from params if provided
  const [currentTab, setCurrentTab] = useState((tab as string) || 'project-information');
  const [currentRole, setCurrentRole] = useState(0);

  // Animation for ManageCandidates transition
  const manageCandidatesTranslateX = useSharedValue(0);
  const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  // Animate ManageCandidates transition when currentRole changes
  useEffect(() => {
    manageCandidatesTranslateX.value = withTiming(-currentRole * SCREEN_WIDTH, {
      duration: 300,
    });
  }, [currentRole, rolesWithSchedules.length, SCREEN_WIDTH]);

  // Animated style for ManageCandidates container
  const manageCandidatesAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: manageCandidatesTranslateX.value }],
  }));

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

        <ScrollView
          className="flex-1"
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="rgb(255, 255, 255)"
              colors={['rgb(255, 255, 255)']}
            />
          }
          contentContainerStyle={{
            paddingTop: insets.top + 140, 
            paddingBottom: insets.bottom + 80,
            paddingHorizontal: 0,
          }}>
          <View className="gap-6">
            {/* Project Header */}
    

            {/* Publish Project Button - Only show when project is Draft */}
            {project?.status === 'Draft' && (
              <PublishProjectButton
                key={`publish-button-${roleCount}-${jobNotReadyCount}`}
                projectData={project}
                isDisable={isPublishButtonDisabled}
                onSuccess={() => {
                  // Navigate back to projects list after successful publish
                  router.back();
                }}
              />
            )}
            {/* Swipeable Tab Content */}
            <SwipeableContainer
              activeIndex={currentTabIndex}
              onIndexChange={handleIndexChange}
              shrink={false}>
              {tabs.map((tab) => {
                if (tab.id === 'project-information') {
                  return (
                    <View key={tab.id} className="gap-2 px-2">
                      <ProjectInformationCard project={project} soleUserId={soleUserId || ''} />
                      <ProjectAnnouncementFormPortal
                        projectId={projectId}
                        soleUserId={soleUserId || ''}
                        projectStatus={project?.status || 'Draft'}
                      />
                      <ProjectAnnouncementsList
                        projectId={projectId}
                        viewerSoleUserId={soleUserId || ''}
                      />
                    </View>
                  );
                }
                if (tab.id === 'project-roles') {
                  return (
                    <View key={tab.id} className="gap-4">
                      <View className="px-2">
                        {project?.status === 'Draft' && rolesWithSchedules.length < 5 && (
                          <RoleFormPortal
                            projectId={projectId}
                            method="POST"
                            roleId={null}
                            fetchedValues={null}
                            isDisabled={rolesWithSchedules.length >= 5}
                            refetchRoles={refetchRoles}
                          />
                        )}
                      </View>

                      {rolesWithSchedules.length === 0 ? (
                        <View className="px-2">
                          <View className="items-center gap-3 rounded-2xl border border-white/10 bg-zinc-800 p-8">
                            <Text className="text-lg font-semibold text-white">No roles yet</Text>
                            <Text className="text-center text-sm text-white/70">
                              {project?.status === 'Draft'
                                ? 'Create your first role to get started.'
                                : 'No roles have been created for this project.'}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <RolesBreadcrumb
                          projectData={project}
                          rolesWithSchedules={rolesWithSchedules}
                          currentRole={currentRole}
                          setCurrentRole={setCurrentRole}
                          countJobActivities={countJobActivities}
                          projectId={projectId}
                          refetchRoles={refetchRoles}
                        />
                      )}

                      {/* Manage Candidates - Only show for Published projects with roles */}
                      {project?.status === 'Published' && rolesWithSchedules.length > 0 && (
                        <View className="border-t border-white/10" style={{ overflow: 'hidden' }}>
                          <Animated.View
                            style={[
                              {
                                flexDirection: 'row',
                                width: SCREEN_WIDTH * rolesWithSchedules.length,
                              },
                              manageCandidatesAnimatedStyle,
                            ]}>
                            {rolesWithSchedules.map((roleWithSchedule, index) => (
                              <View
                                key={`manage-candidates-${roleWithSchedule?.role?.id || index}`}
                                style={{ width: SCREEN_WIDTH }}
                                className="px-2">
                                <ManageCandidates
                                  projectData={project}
                                  roleWithSchedules={roleWithSchedule}
                                />
                              </View>
                            ))}
                          </Animated.View>
                        </View>
                      )}
                    </View>
                  );
                }
                if (tab.id === 'project-contracts') {
                  return (
                    <ProjectContractsTab
                      key={tab.id}
                      projectId={projectId}
                      initialContracts={
                        Array.isArray(jobContractsData)
                          ? jobContractsData
                          : (jobContractsData?.content ?? jobContractsData?.data ?? [])
                      }
                      isLoadingInitial={jobContractsLoading}
                      refetchContracts={refetchContracts}
                    />
                  );
                }
                return <View key={tab.id} />;
              })}
            </SwipeableContainer>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
