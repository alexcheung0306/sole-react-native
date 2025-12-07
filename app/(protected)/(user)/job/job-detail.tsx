import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProjectByID } from '~/api/apiservice/project_api';
import { getRolesByProjectId } from '~/api/apiservice/role_api';
import { getJobApplicantsByProjectIdAndSoleUserId } from '~/api/apiservice/applicant_api';
import { getJobContractsWithProfileByProjectIdAndTalentId } from '~/api/apiservice/jobContracts_api';
import { useState, useEffect } from 'react';
import { ProjectInformationCard } from '~/components/project-detail/details/ProjectInformationCard';
import { CustomTabs } from '@/components/custom/custom-tabs';
import { JobContractsTab } from '~/components/job-detail/contracts/JobContractsTab';
import { JobRolesBreadcrumb } from '~/components/job-detail/roles/JobRolesBreadcrumb';
import { JobRoleApplicationPanel } from '~/components/job-detail/roles/JobRoleApplicationPanel';

const STATUS_COLORS: Record<string, string> = {
  Draft: '#6b7280',
  Published: '#f59e0b',
  InProgress: '#10b981',
  Completed: '#3b82f6',
};

export default function JobDetail({ scrollHandler }: { scrollHandler: (event: any) => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { soleUserId } = useSoleUserContext();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  
  const projectId = params.id ? parseInt(params.id as string, 10) : 0;
  const [currentTab, setCurrentTab] = useState('job-information');
  const [currentRole, setCurrentRole] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch project data
  const {
    data: projectData,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ['jobDetail', projectId],
    queryFn: () => getProjectByID(projectId),
    enabled: !!projectId && !isNaN(projectId),
  });

  // Fetch roles
  const {
    data: rolesWithSchedules = [],
    isLoading: rolesLoading,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ['jobRoles', projectId],
    queryFn: () => getRolesByProjectId(projectId),
    enabled: !!projectId && !isNaN(projectId),
  });

  // Fetch user's applications for this project
  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ['userApplications', projectId, soleUserId],
    queryFn: () => getJobApplicantsByProjectIdAndSoleUserId(projectId, soleUserId as string),
    enabled: !!projectId && !!soleUserId,
  });

  // Fetch user's contracts for this project
  const {
    data: contractsData,
    isLoading: contractsLoading,
    refetch: refetchContracts,
  } = useQuery({
    queryKey: ['userContracts', projectId, soleUserId],
    queryFn: () => getJobContractsWithProfileByProjectIdAndTalentId(projectId, soleUserId as string),
    enabled: !!projectId && !!soleUserId,
  });

  const refetchProject = () => refetchRoles(); // reuse roles refetch as project fetch placeholder

  const isInitialLoading = projectLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchRoles?.(),
        refetchContracts?.(),
        refetchApplications?.(),
        refetchProject?.(),
      ].filter(Boolean) as Promise<any>[]);
    } catch (error) {
      console.error('Error refreshing job data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Ensure currentRole is within bounds when roles data changes
  useEffect(() => {
    if (rolesWithSchedules.length > 0 && currentRole >= rolesWithSchedules.length) {
      setCurrentRole(0);
    }
  }, [rolesWithSchedules.length, currentRole]);

  if (isInitialLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0a] px-6">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-3 text-sm text-zinc-400">Fetching job details…</Text>
      </View>
    );
  }

  if (projectError || !projectData) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0a] px-6">
        <Text className="text-lg font-semibold text-rose-400">We couldn't load this job.</Text>
        <TouchableOpacity
          className="mt-5 rounded-xl bg-blue-500 px-5 py-3"
          activeOpacity={0.85}
          onPress={() => router.back()}>
          <Text className="text-sm font-semibold text-white">Return to jobs</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const project = projectData?.project || projectData;
  const statusTint = STATUS_COLORS[project?.status] || STATUS_COLORS.Draft;
  const roleCount = rolesWithSchedules.length;
  const contractsCount = contractsData?.length || 0;

  const tabs = [
    { id: 'job-information', label: 'Details' },
    { id: 'job-roles', label: 'Roles', count: roleCount },
    { id: 'job-contracts', label: 'Contracts', count: contractsCount },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-[#0a0a0a]">
        <CollapsibleHeader
          title={project?.projectName || 'Job'}
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
            paddingBottom: 28,
            paddingHorizontal: 0,
          }}>
          <View className="gap-6">
            {/* Job Chips */}
            <View className={`flex-row flex-wrap items-center gap-3 px-2`}>
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: `${statusTint}33` }}>
                <Text className="text-xs font-semibold text-white" style={{ color: statusTint }}>
                  {project?.status || ''}
                </Text>
              </View>
              <View className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1">
                <Text className="text-xs font-semibold text-white">Job #{project?.id ? String(project.id) : ''}</Text>
              </View>
            </View>

            {/* Title and Description */}
            <View className={`gap-2 px-2`}>
              <Text className="text-2xl font-bold text-white">{project?.projectName || ''}</Text>
              <Text className="text-sm text-white/80">
                Browse job details, roles, and your contracts for this opportunity.
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

            {/* ---------------------------------------Job Information--------------------------------------- */}
            {currentTab === 'job-information' && (
              <View className="gap-0 px-2">
                <ProjectInformationCard project={project} soleUserId={soleUserId || ''} />
              </View>
            )}

            {/* ---------------------------------------Job Roles--------------------------------------- */}
            {currentTab === 'job-roles' && (
              <View className="gap-4">
                {rolesLoading ? (
                  <View className="items-center justify-center py-20">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-gray-400 mt-3 text-sm">Loading roles...</Text>
                  </View>
                ) : rolesWithSchedules.length === 0 ? (
                  <View className="items-center gap-3 rounded-2xl border border-white/10 bg-zinc-800 p-8">
                    <Text className="text-lg font-semibold text-white">No roles yet</Text>
                    <Text className="text-center text-sm text-white/70">
                      No roles have been created for this job.
                    </Text>
                  </View>
                ) : (
                  <>
                    <JobRolesBreadcrumb
                      projectData={project}
                      rolesWithSchedules={rolesWithSchedules}
                      currentRole={currentRole}
                      setCurrentRole={setCurrentRole}
                      applicationsData={applicationsData}
                      soleUserId={soleUserId}
                      onApplicationUpdated={refetchApplications}
                    />

                    {rolesWithSchedules[currentRole] && (
                      <View className="px-2">
                        <JobRoleApplicationPanel
                          projectData={project}
                          roleWithSchedules={rolesWithSchedules[currentRole]}
                          application={applicationsData?.find(
                            (app: any) => app.roleId === rolesWithSchedules[currentRole]?.role?.id
                          )}
                          soleUserId={soleUserId}
                          onApplicationUpdated={refetchApplications}
                        />
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* ---------------------------------------Job Contracts--------------------------------------- */}
            {currentTab === 'job-contracts' && (
              <JobContractsTab
                contracts={contractsData || []}
                isLoading={contractsLoading}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

