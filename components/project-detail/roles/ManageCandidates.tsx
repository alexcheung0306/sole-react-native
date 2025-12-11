import React, { useMemo, useState, useCallback, memo, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { getApplicationProcessCounts, searchApplicants, getRoleApplicantsByRoleId, updateApplicantProcessById } from '@/api/apiservice/applicant_api';
import FilterSearch from '@/components/custom/filter-search';
import PaginationControl from '@/components/projects/PaginationControl';
import { CandidateCard } from './CandidateCard';

type ManageCandidatesProps = {
  projectData: any;
  roleWithSchedules: any;
};

const candidateStatusOptions = [
  { id: 'applied', label: 'Applied', color: '#3b82f6' },
  { id: 'invited', label: 'Invited', color: '#60a5fa' },
  { id: 'shortlisted', label: 'Shortlisted', color: '#facc15' },
  { id: 'offered', label: 'Offered', color: '#f97316' },
  { id: 'accepted', label: 'Accepted', color: '#10b981' },
  { id: 'rejected', label: 'Rejected', color: '#ef4444' },
];

const candidateSearchOptions = [
  { id: 'name', label: 'Candidate Name' },
  { id: 'username', label: 'Username' },
];

const trailingProcesses = ['shortlisted', 'offered', 'accepted', 'rejected'];

// Memoized Process Pills component - only rerenders when process or counts change
const ProcessPills = memo(({ 
  processSegments, 
  currentProcess, 
  processCounts, 
  onProcessChange 
}: {
  processSegments: string[];
  currentProcess: string;
  processCounts: any;
  onProcessChange: (process: string) => void;
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
      {processSegments.map((process) => {
        const count = processCounts?.[process] ?? 0;
        const isActive = currentProcess === process;
        return (
          <TouchableOpacity
          activeOpacity={1}
            key={`process-${process}`}
            className={`rounded-full border px-3.5 py-2 ${
              isActive ? 'border-white bg-zinc-700' : 'border-white/20 bg-zinc-800/60'

            }`}
            onPress={() => onProcessChange(process)}>
            <Text
              className={`text-xs font-semibold capitalize ${
                isActive ? 'text-white' : 'text-white/80'
              }`}>
              {process} {count ? `(${count})` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});
ProcessPills.displayName = 'ProcessPills';

// Memoized Header component - only rerenders when role title changes
const ManageCandidatesHeader = memo(({ 
  roleTitle, 
  onResetAll, 
  isResetting 
}: {
  roleTitle: string;
  onResetAll: () => void;
  isResetting: boolean;
}) => {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-lg font-bold text-white">
            Manage Candidates for {roleTitle}
          </Text>
          <Text className="text-sm text-white/70">
            Track applicants across custom processes and manage their progression.
          </Text>
        </View>
        <TouchableOpacity
          onPress={onResetAll}
          disabled={isResetting}
          className={`px-3 py-2 rounded-lg ${
            isResetting
              ? 'bg-zinc-600/50'
              : 'bg-red-500/20 border border-red-500/50'
          }`}>
          {isResetting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-xs font-semibold text-red-400">Reset All</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});
ManageCandidatesHeader.displayName = 'ManageCandidatesHeader';

// Memoized Candidate List component - only rerenders when candidates or handlers change
const CandidateList = memo(({ 
  candidates, 
  cardWidth, 
  roleId, 
  projectId, 
  onCardPress 
}: {
  candidates: any[];
  cardWidth: number;
  roleId: string | number | undefined;
  projectId: string | number | undefined;
  onCardPress: (index: number) => void;
}) => {
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <CandidateCard
      item={item}
      cardWidth={cardWidth}
      roleId={roleId}
      projectId={projectId}
      onPress={onCardPress}
      index={index}
    />
  ), [cardWidth, roleId, projectId, onCardPress]);

  return (
    <FlatList
      data={candidates}
      keyExtractor={(item) => `candidate-${item?.jobApplicant?.id}`}
      scrollEnabled={false}
      numColumns={3}
      columnWrapperStyle={{ gap: 12, justifyContent: 'flex-start' }}
      contentContainerStyle={{ gap: 12, paddingTop: 8 }}
      ListEmptyComponent={() => (
        <View className="w-full items-center gap-2 py-8">
          <Text className="text-base font-semibold text-white">No candidates found</Text>
          <Text className="text-center text-sm text-white/60">
            Adjust your filters or select another process stage to view applicants.
          </Text>
        </View>
      )}
      renderItem={renderItem}
    />
  );
});
CandidateList.displayName = 'CandidateList';

export function ManageCandidates({ projectData, roleWithSchedules }: ManageCandidatesProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48 - 24) / 3; // screen width - padding (24*2) - gaps (12*2) / 3 columns

  // Local state for process selection (not from context)
  const [currentProcess, setCurrentProcess] = useState('applied');

  // Search state
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [candidateSearchBy, setCandidateSearchBy] = useState('name');
  const [candidateSearchValue, setCandidateSearchValue] = useState('');
  const [candidatePage, setCandidatePage] = useState(0);
  const [candidateSearchTrigger, setCandidateSearchTrigger] = useState(0);

  const activities = roleWithSchedules?.activities || [];

  const processSegments = useMemo(() => {
    const activityTitles = Array.isArray(activities)
      ? activities
          .filter((activity: any) => activity?.type !== 'job')
          .map((activity: any) => activity?.title)
          .filter(Boolean)
      : [];
    const unique = Array.from(new Set(['applied', ...activityTitles, ...trailingProcesses]));
    return unique;
  }, [activities]);

  const candidateQueryString = useMemo(() => {
    if (!roleWithSchedules?.role?.id) {
      return '';
    }
    const params = new URLSearchParams();
    params.append('roleId', String(roleWithSchedules.role.id));
    params.append('applicationProcess', currentProcess);
    params.append('pageNumber', String(candidatePage + 1));
    params.append('pageSize', '20');
    if (candidateSearchValue.trim()) {
      if (candidateSearchBy === 'name' || candidateSearchBy === 'username') {
        params.append('nameSearch', candidateSearchValue.trim());
      }
    }
    selectedStatuses.forEach((status) => params.append('applicationStatus', status));
    return params.toString();
  }, [
    roleWithSchedules?.role?.id,
    currentProcess,
    candidatePage,
    candidateSearchValue,
    candidateSearchBy,
    selectedStatuses,
  ]);

  // Limit available status filters based on current process (PS -> allowed AS)
  const allowedStatusOptions = useMemo(() => {
    if (currentProcess === 'applied') {
      return candidateStatusOptions.filter((s) => s.id === 'applied');
    }
    if (currentProcess === 'shortlisted') {
      return candidateStatusOptions.filter((s) => s.id === 'shortlisted');
    }
    if (currentProcess === 'offered') {
      return candidateStatusOptions.filter((s) => s.id === 'offered');
    }

    const activityTitles = processSegments.filter(
      (segment) => !['applied', ...trailingProcesses].includes(segment)
    );
    const isMappedSession = activityTitles.includes(currentProcess);

    if (isMappedSession) {
      return candidateStatusOptions.filter((s) =>
        ['invited', 'accepted', 'rejected'].includes(s.id)
      );
    }

    // Fallback: no status filtering options
    return [];
  }, [currentProcess, processSegments]);

  // Ensure selected statuses stay within the allowed set for the current process
  useEffect(() => {
    const allowedIds = new Set(allowedStatusOptions.map((s) => s.id));
    setSelectedStatuses((prev) => prev.filter((id) => allowedIds.has(id)));
  }, [allowedStatusOptions]);

  const { data: processCounts } = useQuery({
    queryKey: ['role-process-counts', roleWithSchedules?.role?.id],
    queryFn: () => getApplicationProcessCounts(roleWithSchedules?.role?.id),
    enabled: Boolean(roleWithSchedules?.role?.id),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false, // Don't refetch on mount, only when focused
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const {
    data: candidatesResponse,
    isLoading: isLoadingCandidates,
    isFetching: isFetchingCandidates,
  } = useQuery({
    queryKey: [
      'role-candidates',
      roleWithSchedules?.role?.id,
      candidateQueryString,
      candidateSearchTrigger,
    ],
    queryFn: () => searchApplicants(candidateQueryString),
    enabled: Boolean(roleWithSchedules?.role?.id),
    staleTime: 1000 * 60 * 5, // 5 minutes - cache data for 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data visible while fetching new data
    refetchOnMount: false, // Don't refetch on mount, only when focused
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Refetch queries when ManageCandidates comes into focus
  // This ensures fresh data after returning from swipe screen
  // React Query will only refetch if queries are stale (respects staleTime)
  useFocusEffect(
    useCallback(() => {
      if (roleWithSchedules?.role?.id) {
        queryClient.refetchQueries({ 
          queryKey: ['role-candidates', roleWithSchedules.role.id],
          type: 'active' // Only refetch active queries
        });
        queryClient.refetchQueries({ 
          queryKey: ['role-process-counts', roleWithSchedules.role.id],
          type: 'active' // Only refetch active queries
        });
      }
    }, [queryClient, roleWithSchedules?.role?.id])
  );

  const candidateResults = useMemo(() => {
    if (!candidatesResponse) {
      return [] as any[];
    }
    return candidatesResponse?.data ?? candidatesResponse?.content ?? candidatesResponse ?? [];
  }, [candidatesResponse]);

  const filteredCandidates = useMemo(() => {
    if (!candidateResults) {
      return [] as any[];
    }

    return candidateResults.filter((candidate: any) => {
      const process = candidate?.jobApplicant?.applicationProcess;
      const status = candidate?.jobApplicant?.applicationStatus;

      if (
        process &&
        ['applied', 'shortlisted', 'offered', 'rejected', 'accepted'].includes(currentProcess)
      ) {
        if (
          ['applied', 'shortlisted', 'offered', 'rejected', 'accepted'].includes(currentProcess)
        ) {
          return process === currentProcess || status === currentProcess;
        }
      }

      const activityTitles = processSegments.filter(
        (segment) => !['applied', ...trailingProcesses].includes(segment)
      );

      if (activityTitles.includes(currentProcess)) {
        return process === currentProcess;
      }

      if (trailingProcesses.includes(currentProcess)) {
        return status === currentProcess;
      }

      return true;
    });
  }, [candidateResults, currentProcess, processSegments]);

  const candidateTotalPages = candidatesResponse?.totalPages ?? 1;

  // Prefetch images for all candidates when data is available
  useEffect(() => {
    if (filteredCandidates && filteredCandidates.length > 0) {
      const imageUris = filteredCandidates
        .map((candidate: any) => {
          const imageUri = candidate?.comcardFirstPic || candidate?.userInfo?.profilePic;
          return imageUri || null;
        })
        .filter((uri: string | null): uri is string => Boolean(uri));

      // Prefetch images in the background
      imageUris.forEach((uri: string) => {
        Image.prefetch(uri, {
          cachePolicy: 'memory-disk',
        }).catch(() => {
          // Silently fail if prefetch fails
        });
      });
    }
  }, [filteredCandidates]);

  const handleCandidateSearch = useCallback(() => {
    setCandidatePage(0);
    setCandidateSearchTrigger((prev) => prev + 1);
  }, []);

  const handleCardPress = useCallback(
    (index: number) => {
      if (!roleWithSchedules?.role?.id || !projectData?.id) return;

      const selectedCandidate = filteredCandidates[index];
      const selectedApplicantId = selectedCandidate?.jobApplicant?.id;

      // Invalidate query to ensure fresh data when navigating to swipe screen
      const params = new URLSearchParams();
      params.append('roleId', String(roleWithSchedules.role.id));
      params.append('applicationProcess', currentProcess);
      params.append('pageNumber', '1');
      params.append('pageSize', '100');
      // queryClient.invalidateQueries({ 
      //   queryKey: ['role-candidates', roleWithSchedules.role.id, params.toString()] 
      // });

      router.push({
        pathname: '/(protected)/(client)/projects/swipe',
        params: {
          projectId: String(projectData.id),
          roleId: String(roleWithSchedules.role.id),
          process: currentProcess,
          initialIndex: String(index),
          initialApplicantId: selectedApplicantId ? String(selectedApplicantId) : undefined,
        },
      });
    },
    [router, queryClient, projectData?.id, roleWithSchedules?.role?.id, currentProcess, filteredCandidates],
  );

  const handleProcessChange = useCallback((process: string) => {
    setCurrentProcess(process);
    setCandidatePage(0);
    setSelectedStatuses([]);
    handleCandidateSearch();
  }, [handleCandidateSearch]);

  // Reset all candidates mutation
  const resetAllCandidatesMutation = useMutation({
    mutationFn: async () => {
      if (!roleWithSchedules?.role?.id) return;
      
      // Fetch all candidates for the role
      const allCandidates = await getRoleApplicantsByRoleId(roleWithSchedules.role.id);
      
      // Handle both array format and object format from API
      const candidatesArray: any[] = Array.isArray(allCandidates) 
        ? allCandidates 
        : (allCandidates as any)?.data || (allCandidates as any)?.content || [];
      
      // Update each candidate to set applicationProcess and applicationStatus to "applied"
      const updatePromises = candidatesArray.map((candidate: any) => {
        // Handle different candidate data structures
        const applicant = candidate?.jobApplicant || candidate;
        const applicantId = applicant?.id || candidate?.id;
        
        if (!applicantId) {
          console.warn('Skipping candidate with no ID:', candidate);
          return Promise.resolve();
        }
        
        // Include all required fields like the web version does
        const updateValues: any = {
          id: applicantId,
          soleUserId: applicant?.soleUserId || null,
          roleId: applicant?.roleId || roleWithSchedules?.role?.id || null,
          projectId: applicant?.projectId || projectData?.id || null,
          paymentBasis: applicant?.paymentBasis || null,
          quotePrice: applicant?.quotePrice || null,
          otQuotePrice: applicant?.otQuotePrice || null,
          skills: applicant?.skills || null,
          answer: applicant?.answer || null,
          applicationStatus: 'applied',
          applicationProcess: 'applied',
        };
        
        return updateApplicantProcessById(updateValues, applicantId).catch((error) => {
          console.error(`Failed to update candidate ${applicantId}:`, error);
          // Continue with other candidates even if one fails
          return Promise.resolve();
        });
      });
      
      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['role-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['role-process-counts'] });
      Alert.alert('Success', 'All candidates have been reset to "applied" process.', [{ text: 'OK' }]);
    },
    onError: (error) => {
      console.error('Error resetting candidates:', error);
      Alert.alert('Error', 'Failed to reset candidates. Please try again.', [{ text: 'OK' }]);
    },
  });

  const handleResetAllCandidates = () => {
    Alert.alert(
      'Reset All Candidates',
      'Are you sure you want to reset all candidates for this role to "applied" process? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: () => {
            resetAllCandidatesMutation.mutate();
          },
        },
      ]
    );
  };

  // Early return check AFTER all hooks are declared
  if (!roleWithSchedules) {
    return (
      <View className="rounded-2xl border border-white/10 bg-zinc-800 p-5">
        <Text className="text-center text-white">No role selected or role data not available.</Text>
      </View>
    );
  }

  return (
    <View className="gap-4 rounded-2xl border border-white/10 bg-zinc-800 p-5">
      {/* Header - Memoized, only rerenders when role title or reset state changes */}
      <ManageCandidatesHeader
        roleTitle={roleWithSchedules?.role?.roleTitle || ''}
        onResetAll={handleResetAllCandidates}
        isResetting={resetAllCandidatesMutation.isPending}
      />

      {/* Process Pills - Memoized, only rerenders when process or counts change */}
      <ProcessPills
        processSegments={processSegments}
        currentProcess={currentProcess}
        processCounts={processCounts}
        onProcessChange={handleProcessChange}
      />

      {/* Filter Search */}
      <FilterSearch
        searchBy={candidateSearchBy}
        setSearchBy={setCandidateSearchBy}
        searchValue={candidateSearchValue}
        setSearchValue={setCandidateSearchValue}
        selectedStatuses={selectedStatuses}
        setSelectedStatuses={setSelectedStatuses}
        onSearch={handleCandidateSearch}
        searchOptions={candidateSearchOptions}
        statusOptions={allowedStatusOptions}
      />

      {/* Candidates List - Memoized, only rerenders when candidates change */}
      <CandidateList
        candidates={filteredCandidates}
        cardWidth={cardWidth}
        roleId={roleWithSchedules?.role?.id}
        projectId={projectData?.id}
        onCardPress={handleCardPress}
      />

      {/* Pagination */}
      {candidateTotalPages > 1 && (
        <View className="mt-3">
          <PaginationControl
            currentPage={candidatePage}
            setCurrentPage={setCandidatePage}
            totalPages={candidateTotalPages}
            isLoadingProjects={isLoadingCandidates || isFetchingCandidates}
          />
        </View>
      )}
    </View>
  );
}
