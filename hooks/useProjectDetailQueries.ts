import { useQuery } from '@tanstack/react-query';

import { getJobContractsWithProfileByProjectId } from '@/api/apiservice/jobContracts_api';
import { getProjectByIdAndSoleUserId } from '@/api/apiservice/project_api';
import { getRolesByProjectId } from '@/api/apiservice/role_api';

interface UseProjectDetailQueriesProps {
  projectId: number;
  soleUserId: string;
}

export const useProjectDetailQueries = ({
  projectId,
  soleUserId,
}: UseProjectDetailQueriesProps) => {
  const countWithoutJobActivities = (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) {
      return 0;
    }

    return data.filter(
      (entry) =>
        !Array.isArray(entry?.activities) ||
        !entry.activities.some((activity: any) => activity?.type === 'job')
    ).length;
  };

  const countJobActivities = (roleWithSchedules: any) => {
    if (!roleWithSchedules || !Array.isArray(roleWithSchedules?.activities)) {
      return 0;
    }

    return roleWithSchedules.activities.reduce((count: number, activity: any) => {
      return activity?.type === 'job' ? count + 1 : count;
    }, 0);
  };

  // project-detail query is used to get the project data
  const {
    data: projectData,
    error: projectError,
    isLoading: projectLoading,
    refetch: refetchProject,
  } = useQuery({
    queryKey: ['project-detail', projectId, soleUserId],
    queryFn: () => getProjectByIdAndSoleUserId(projectId, soleUserId),
    enabled: Boolean(projectId && soleUserId),
    staleTime: 1000 * 60 * 5,
  });

  // project-roles query is used to get the roles data
  const {
    data: rolesWithSchedules = [],
    error: rolesError,
    isLoading: rolesLoading,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ['project-roles', projectId],
    queryFn: async () => {
      console.log('=== useProjectDetailQueries: Fetching roles ===');
      const response = await getRolesByProjectId(projectId);
      console.log('=== useProjectDetailQueries: Roles fetched ===', response?.length || 0);
      return response ?? [];
    },
    enabled: Boolean(projectId),
  });

  const roleCount = Array.isArray(rolesWithSchedules) ? rolesWithSchedules.length : 0;
  const jobNotReadyCount = countWithoutJobActivities(rolesWithSchedules);

  // Detailed logging for debugging
  console.log('=== useProjectDetailQueries Debug ===');
  console.log('rolesWithSchedules length:', rolesWithSchedules.length);
  console.log('roleCount:', roleCount);
  console.log('jobNotReadyCount:', jobNotReadyCount);
  console.log('rolesWithSchedules data:', JSON.stringify(rolesWithSchedules, null, 2));
  
  // Log each role's readiness status
  if (Array.isArray(rolesWithSchedules) && rolesWithSchedules.length > 0) {
    rolesWithSchedules.forEach((roleWithSchedule, index) => {
      const role = roleWithSchedule?.role;
      const activities = roleWithSchedule?.activities || [];
      const hasJobActivity = activities.some((activity: any) => activity?.type === 'job');
      console.log(`Role ${index + 1} (ID: ${role?.id}):`, {
        roleTitle: role?.roleTitle,
        activitiesCount: activities.length,
        hasJobActivity,
        isReady: hasJobActivity,
      });
    });
  }
  console.log('=== End Debug ===');

  // project-contracts query is used to get the job contracts data
  const {
    data: jobContractsData = [],
    error: jobContractsError,
    isLoading: jobContractsLoading,
    refetch: refetchContracts,
  } = useQuery({
    queryKey: ['project-contracts', projectId],
    queryFn: () => getJobContractsWithProfileByProjectId(projectId),
    enabled: Boolean(projectId && projectData),
  });

  return {
    projectData,
    rolesWithSchedules,
    jobContractsData,
    projectLoading,
    rolesLoading,
    jobContractsLoading,
    projectError,
    rolesError,
    jobContractsError,
    roleCount,
    jobNotReadyCount,
    countJobActivities,
    refetchProject,
    refetchRoles,
    refetchContracts,
  };
};
