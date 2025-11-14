import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { ChevronLeft } from 'lucide-react-native';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { useManageProjectContext } from '@/context/ManageProjectContext';
import { useProjectDetailQueries } from '@/hooks/useProjectDetailQueries';
import { ProjectRolesTab } from '@/components/projects/detail/ProjectRolesTab';
import { ProjectContractsTab } from '@/components/projects/detail/ProjectContractsTab';
import { ProjectInformationCard } from '@/components/projects/detail/ProjectInformationCard';
import { CreateProjectAnnouncementDrawer } from '@/components/projects/detail/CreateProjectAnnouncementDrawer';
import { ProjectAnnouncementsList } from '@/components/projects/detail/ProjectAnnouncementsList';
import { CustomTabs } from '@/components/custom/custom-tabs';

const STATUS_COLORS: Record<string, string> = {
  Draft: '#6b7280',
  Published: '#f59e0b',
  InProgress: '#10b981',
  Completed: '#3b82f6',
};

export default function ProjectDetailPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const { id } = useLocalSearchParams();
  const { soleUserId } = useSoleUserContext();
  const { currentTab, setCurrentTab } = useManageProjectContext();

  const projectId = id ? parseInt(id as string, 10) : 0;

  const {
    projectData,
    rolesWithSchedules,
    jobContractsData,
    projectLoading,
    projectError,
    jobContractsLoading,
    roleCount,
    countJobActivities,
    refetchRoles,
    refetchContracts,
  } = useProjectDetailQueries({ projectId, soleUserId: soleUserId || '' });

  const isInitialLoading = projectLoading;

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
          translateY={headerTranslateY}
          isDark
          headerLeft={
            <TouchableOpacity
              onPress={() => router.replace('/(protected)/(client)/projects/manage-projects')}
              activeOpacity={0.85}
              className="flex items-center justify-center p-2">
              <ChevronLeft color="#93c5fd" size={24} />
            </TouchableOpacity>
          }
        />

        <ScrollView
          className="flex-1"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 28,
            paddingHorizontal: 24,
          }}>
          <View className="gap-6">
            {/* Project Chips */}
            <View className="flex-row flex-wrap items-center gap-3">
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: `${statusTint}33` }}>
                <Text className="text-xs font-semibold text-white" style={{ color: statusTint }}>
                  {project?.status}
                </Text>
              </View>
              <View className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1">
                <Text className="text-xs font-semibold text-white">Project #{project?.id}</Text>
              </View>
            </View>

            {/* Title and Description */}
            <View className="gap-2">
              <Text className="text-2xl font-bold text-white">{project?.projectName}</Text>
              <Text className="text-sm text-white/80">
                Align your announcement timeline, audition workflow, and contract statuses in one
                place.
              </Text>
            </View>

            {/* Tabs */}
            <CustomTabs
              tabs={tabs}
              value={currentTab}
              onValueChange={setCurrentTab}
              containerClassName="flex-row rounded-2xl border border-white/10 bg-zinc-700 p-1"
              showCount={true}
            />

            {/* ---------------------------------------Project Information--------------------------------------- */}
            {currentTab === 'project-information' && (
              <View className="gap-0">
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
              <ProjectRolesTab
                projectId={projectId}
                projectStatus={project?.status}
                rolesWithSchedules={rolesWithSchedules}
                countJobActivities={countJobActivities}
                refetchRoles={refetchRoles}
              />
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
          </View>
        </ScrollView>
      </View>
    </>
  );
}
