import { useState } from 'react';
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
  const [roleCount, setRoleCount] = useState<number>(0);
  const [jobNotReadyCount, setJobNotReadyCount] = useState<number>(0);

  const countWithoutJobActivities = (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) {
      return 0;
    }

    const filtered = data.filter(
      (entry) =>
        Array.isArray(entry?.activities) &&
        !entry.activities.some((activity: any) => activity?.type === 'job')
    );

    if (filtered.length === 0) {
      return 0;
    }

    const maxRoleId = Math.max(...data.map((entry) => entry?.role?.id || 0));
    return filtered.filter((entry) => entry?.role?.id === maxRoleId).length;
  };

  const countJobActivities = (roleWithSchedules: any) => {
    if (!roleWithSchedules || !Array.isArray(roleWithSchedules?.activities)) {
      return 0;
    }

    return roleWithSchedules.activities.reduce((count: number, activity: any) => {
      return activity?.type === 'job' ? count + 1 : count;
    }, 0);
  };

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

  const {
    data: rolesWithSchedules = [],
    error: rolesError,
    isLoading: rolesLoading,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ['project-roles', projectId],
    queryFn: async () => {
      const response = await getRolesByProjectId(projectId);
      setRoleCount(Array.isArray(response) ? response.length : 0);
      setJobNotReadyCount(Array.isArray(response) ? countWithoutJobActivities(response) : 0);
      return response ?? [];
    },
    enabled: Boolean(projectId),
  });

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
