import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
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
import { PublishProjectButton } from '~/components/project-detail/PublishProjectButton';

const STATUS_COLORS: Record<string, string> = {
  Draft: '#6b7280',
  Published: '#f59e0b',
  InProgress: '#10b981',
  Completed: '#3b82f6',
};

export default function ProjectDetailPage({ scrollHandler }: { scrollHandler: (event: any) => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { soleUserId } = useSoleUserContext();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  // Local state for tab and role selection (not in context)
  const [currentTab, setCurrentTab] = useState('project-information');
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
    refetchRoles,
    refetchContracts,
  } = useProjectDetailQueries({ projectId, soleUserId: soleUserId || '' });

  const isInitialLoading = projectLoading;

  // Ensure currentRole is within bounds when roles data changes
  useEffect(() => {
    if (rolesWithSchedules.length > 0 && currentRole >= rolesWithSchedules.length) {
      setCurrentRole(0);
    }
  }, [rolesWithSchedules.length, currentRole, setCurrentRole]);

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
        <Text className="text-lg font-semibold text-rose-400">We couldn’t load this project.</Text>
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

  const tabs = [
    { id: 'project-information', label: 'Details' },
    { id: 'project-roles', label: 'Roles', count: roleCount ?? 0 },
    {
      id: 'project-contracts',
      label: 'Contracts',
      count: jobContractsData?.content?.length ?? jobContractsData?.length ?? 0,
    },
  ];

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
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
        />
        <ScrollView
          className="flex-1"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 28,
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
                <Text className="text-xs font-semibold text-white">Project #{project?.id ? String(project.id) : ''}</Text>
              </View>
            </View>

            {/* Title and Description */}
            <View className={`gap-2 px-2`}>
              <Text className="text-2xl font-bold text-white">{project?.projectName || ''}</Text>
              <Text className="text-sm text-white/80">
                Align your announcement timeline, audition workflow, and contract statuses in one
                place.
              </Text>
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
              <View className="gap-0 px-2">
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
                  <View className="items-center gap-3 rounded-2xl border border-white/10 bg-zinc-800 p-8">
                    <Text className="text-lg font-semibold text-white">No roles yet</Text>
                    <Text className="text-center text-sm text-white/70">
                      {project?.status === 'Draft'
                        ? 'Create your first role to get started.'
                        : 'No roles have been created for this project.'}
                    </Text>
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
              <View className="px-2">
                <PublishProjectButton
                  projectData={project}
                  isDisable={roleCount > 0 && jobNotReadyCount === 0 ? false : true}
                  onSuccess={() => {
                    // Optionally handle success callback
                    router.replace('/(protected)/(client)/projects/manage-projects');
                  }}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}
