import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { getProjectByID } from '~/api/apiservice/project_api';
import { getRolesByProjectId } from '~/api/apiservice/role_api';
import { getJobApplicantsByProjectIdAndSoleUserId } from '~/api/apiservice/applicant_api';
import { getJobContractsWithProfileByProjectIdAndTalentId } from '~/api/apiservice/jobContracts_api';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { CustomTabs } from '@/components/custom/custom-tabs';
import SwipeableContainer from '@/components/common/SwipeableContainer';
import JobInformationTab from '@/components/job-detail/tabs/JobInformationTab';
import JobRolesTab from '@/components/job-detail/tabs/JobRolesTab';
import JobContractsTabWrapper from '@/components/job-detail/tabs/JobContractsTabWrapper';

const STATUS_COLORS: Record<string, string> = {
  Draft: '#6b7280',
  Published: '#f59e0b',
  InProgress: '#10b981',
  Completed: '#3b82f6',
};

export default function JobDetail({ scrollHandler }: { scrollHandler: (event: any) => void }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { soleUserId } = useSoleUserContext();
  const { animatedHeaderStyle, handleHeightChange } = useScrollHeader();
  const queryClient = useQueryClient();

  const projectId = params.id ? parseInt(params.id as string, 10) : 0;
  const roleIdParam = params.roleId ? parseInt(params.roleId as string, 10) : null;
  const contractIdParam = params.contractId ? parseInt(params.contractId as string, 10) : null;
  
  // Set initial tab and role based on params (similar to web version)
  const [currentTab, setCurrentTab] = useState(
    contractIdParam ? 'job-contracts' : roleIdParam ? 'job-roles' : 'job-information'
  );
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

  // Set currentRole when roleId param is provided and roles are loaded
  useEffect(() => {
    if (roleIdParam && rolesWithSchedules.length > 0) {
      const roleIndex = rolesWithSchedules.findIndex(
        (r: any) => r?.role?.id === roleIdParam
      );
      if (roleIndex >= 0) {
        setCurrentRole(roleIndex);
        setCurrentTab('job-roles');
      }
    }
  }, [roleIdParam, rolesWithSchedules]);

  // Set tab to contracts when contractId param is provided
  useEffect(() => {
    if (contractIdParam) {
      setCurrentTab('job-contracts');
    }
  }, [contractIdParam]);

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
    queryFn: () =>
      getJobContractsWithProfileByProjectIdAndTalentId(projectId, soleUserId as string),
    enabled: !!projectId && !!soleUserId,
  });

  const refetchProject = () => refetchRoles(); // reuse roles refetch as project fetch placeholder

  const isInitialLoading = projectLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Invalidate cached data for this screen and its child components
      queryClient.invalidateQueries({ queryKey: ['jobDetail', projectId] });
      queryClient.invalidateQueries({ queryKey: ['jobRoles', projectId] });
      queryClient.invalidateQueries({ queryKey: ['userContracts', projectId, soleUserId] });
      queryClient.invalidateQueries({ queryKey: ['userApplications', projectId, soleUserId] });
      queryClient.invalidateQueries({ queryKey: ['project-announcements', projectId] });

      await Promise.all(
        [
          refetchRoles?.(),
          refetchContracts?.(),
          refetchApplications?.(),
          refetchProject?.(),
        ].filter(Boolean) as Promise<any>[]
      );
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

  // Calculate derived values (safe defaults for loading states)
  const project = projectData?.project || projectData;
  const statusTint = project ? (STATUS_COLORS[project?.status] || STATUS_COLORS.Draft) : STATUS_COLORS.Draft;
  const roleCount = rolesWithSchedules.length;
  const contractsCount = contractsData?.length || 0;

  const userRoleLevels = (applicationsData || []).reduce(
    (acc: { roleId: number; level: number }[], app: any) => {
      if (!app?.roleId) return acc;
      const status = (app.applicationProcess || app.applicationStatus || '').toLowerCase();
      const processOrder = ['invited', 'applied', 'shortlisted', 'offered'];
      const levelIndex = processOrder.indexOf(status);
      const level =
        status === 'accepted'
          ? 4
          : status === 'rejected'
            ? 0
            : levelIndex >= 0
              ? levelIndex + 1
              : 1;
      const existing = acc.find((r) => r.roleId === app.roleId);
      if (existing) {
        existing.level = Math.max(existing.level, level);
      } else {
        acc.push({ roleId: app.roleId, level });
      }
      return acc;
    },
    []
  );

  // All hooks must be called before any conditional returns
  const tabs = useMemo(() => [
    { id: 'job-information', label: 'Details' },
    { id: 'job-roles', label: 'Roles', count: roleCount },
    { id: 'job-contracts', label: 'Contracts', count: contractsCount },
  ], [roleCount, contractsCount]);

  // Convert tab ID to index for SwipeableContainer
  const getTabIndex = useCallback((tabId: string) => {
    if (!tabs || tabs.length === 0) return 0;
    const index = tabs.findIndex((tab) => tab.id === tabId);
    return index >= 0 ? index : 0;
  }, [tabs]);

  // Convert index to tab ID
  const getTabId = useCallback((index: number) => {
    if (!tabs || tabs.length === 0) return 'job-information';
    return tabs[index]?.id || 'job-information';
  }, [tabs]);

  const currentTabIndex = useMemo(() => {
    return getTabIndex(currentTab);
  }, [getTabIndex, currentTab]);

  // Handle swipe index change
  const handleIndexChange = useCallback((index: number) => {
    const newTabId = getTabId(index);
    if (newTabId && newTabId !== currentTab) {
      setCurrentTab(newTabId);
    }
  }, [getTabId, currentTab]);

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
          secondHeader={
            <View className="gap-2">
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
                  <Text className="text-xs font-semibold text-white">
                    Job #{project?.id ? String(project.id) : ''}
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
          <JobInformationTab
            project={project}
            projectId={projectId}
            soleUserId={soleUserId || ''}
            applicationsData={applicationsData}
            userRoleLevels={userRoleLevels}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
          <JobRolesTab
            project={project}
            projectId={projectId}
            rolesWithSchedules={rolesWithSchedules}
            currentRole={currentRole}
            setCurrentRole={setCurrentRole}
            applicationsData={applicationsData}
            soleUserId={soleUserId}
            onApplicationUpdated={refetchApplications}
            rolesLoading={rolesLoading}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
          <JobContractsTabWrapper
            contracts={contractsData || []}
            isLoading={contractsLoading}
            highlightedContractId={contractIdParam || undefined}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </SwipeableContainer>
      </View>
    </>
  );
}
