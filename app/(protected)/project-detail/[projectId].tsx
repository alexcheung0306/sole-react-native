import { Stack, useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import React, { useEffect, useLayoutEffect, useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { ChevronLeft } from 'lucide-react-native';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { useProjectDetailQueries } from '@/hooks/useProjectDetailQueries';
import { ProjectContractsTab } from '~/components/project-detail/contracts/ProjectContractsTab';
import { ProjectInformationCard } from '~/components/project-detail/details/ProjectInformationCard';
import { CreateProjectAnnouncementDrawer } from '~/components/project-detail/details/CreateProjectAnnouncementDrawer';
import { ProjectAnnouncementsList } from '~/components/project-detail/details/ProjectAnnouncementsList';
import { CustomTabs } from '@/components/custom/custom-tabs';
import { RoleForm } from '~/components/form-components/role-form/RoleForm';
import { RolesBreadcrumb } from '~/components/project-detail/roles/RolesBreadcrumb';
import { ManageCandidates } from '~/components/project-detail/roles/ManageCandidates';
import { PublishProjectButton } from '~/components/project-detail/PublishProjectButton';
import { getStatusColor } from '@/utils/get-status-color';

export default function ProjectDetailPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { soleUserId } = useSoleUserContext();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  // Local state for tab and role selection (not in context)
  const [currentTab, setCurrentTab] = useState('project-information');
  const [currentRole, setCurrentRole] = useState(0);

 

  // Handle both projectId (from route param) and id (fallback)
  const projectIdParam = (params.projectId || params.id) as string | undefined;
  const projectId = projectIdParam ? parseInt(projectIdParam, 10) : 0;

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

  // Hide header immediately to prevent flash - use useLayoutEffect for synchronous execution
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

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

  const isInitialLoading = projectLoading;

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
      await Promise.all([
        refetchProject(),
        refetchRoles(),
        refetchContracts(),
      ]);
    } catch (error) {
      console.error('Error refreshing project data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (isInitialLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center bg-black px-6">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-3 text-sm text-zinc-400">Fetching project workspace…</Text>
        </View>
      </>
    );
  }

  if (projectError || !projectData) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center bg-black px-6">
          <Text className="text-lg font-semibold text-rose-400">We couldn't load this project.</Text>
          <TouchableOpacity
            className="mt-5 rounded-xl bg-blue-500 px-5 py-3"
            activeOpacity={0.85}
            onPress={() => router.back()}>
            <Text className="text-sm font-semibold text-white">Return to projects</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const project = projectData?.project || projectData;
  const statusTint = getStatusColor(project?.status || 'Draft');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black" style={{ zIndex: 1000 }}>
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
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: insets.bottom + 80,
            paddingHorizontal: 0,
          }}>
          <View className="gap-6">
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

            {/* ---------------------------------------Project Information--------------------------------------- */}
            {currentTab === 'project-information' && (
              <View className="gap-2 px-2">
                <ProjectInformationCard project={project} soleUserId={soleUserId || ''} />
                <CreateProjectAnnouncementDrawer
                  projectId={projectId}
                  soleUserId={soleUserId || ''}
                  projectStatus={project?.status}
                  rolesWithSchedules={rolesWithSchedules}
                />
                <ProjectAnnouncementsList projectId={projectId} />
              </View>
            )}

            {/* ---------------------------------------Project Roles--------------------------------------- */}
            {currentTab === 'project-roles' && (
              <View className="gap-4">
                <View className="px-2">
                  {project?.status === 'Draft' && rolesWithSchedules.length < 5 && (
                    <RoleForm
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
                  <View className="mt-6 border-t border-white/10  px-2">
                    <ManageCandidates 
                      projectData={project} 
                      roleWithSchedules={rolesWithSchedules[currentRole]} 
                    />
                  </View>
                )}
              </View>
            )}

            {/* ---------------------------------------Project Contracts--------------------------------------- */}
            {currentTab === 'project-contracts' && (
              <ProjectContractsTab
                projectId={projectId}
                initialContracts={
                  Array.isArray(jobContractsData)
                    ? jobContractsData
                    : (jobContractsData?.content ?? jobContractsData?.data ?? [])
                }
                isLoadingInitial={jobContractsLoading}
                refetchContracts={refetchContracts}
              />
            )}

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
          </View>
        </ScrollView>
      </View>
    </>
  );
}
