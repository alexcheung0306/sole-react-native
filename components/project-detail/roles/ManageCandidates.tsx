import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  getApplicationProcessCounts,
  searchApplicants,
} from '@/api/apiservice/applicant_api';
import FilterSearch from '@/components/custom/filter-search';
import PaginationControl from '@/components/projects/PaginationControl';

type ManageCandidatesProps = {
  projectData: any;
  roleWithSchedules: any;
};

const candidateStatusOptions = [
  { id: 'applied', label: 'Applied', color: '#3b82f6' },
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

// Status color mapping
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    applied: '#3b82f6',
    shortlisted: '#facc15',
    offered: '#f97316',
    accepted: '#10b981',
    rejected: '#ef4444',
  };
  return colorMap[status.toLowerCase()] || '#6b7280';
};

export function ManageCandidates({ projectData, roleWithSchedules }: ManageCandidatesProps) {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48 - 12) / 2; // screen width - padding (24*2) - gap (12) / 2 columns

  if (!roleWithSchedules) {
    return (
      <View className="rounded-2xl border border-white/10 bg-zinc-800 p-5">
        <Text className="text-center text-white">No role selected or role data not available.</Text>
      </View>
    );
  }

  const activities = roleWithSchedules?.activities || [];
  
  // Local state for process selection (not from context)
  const [currentProcess, setCurrentProcess] = useState('applied');

  // Search state
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [candidateSearchBy, setCandidateSearchBy] = useState('name');
  const [candidateSearchValue, setCandidateSearchValue] = useState('');
  const [candidatePage, setCandidatePage] = useState(0);
  const [candidateSearchTrigger, setCandidateSearchTrigger] = useState(0);

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

  const { data: processCounts } = useQuery({
    queryKey: ['role-process-counts', roleWithSchedules?.role?.id],
    queryFn: () => getApplicationProcessCounts(roleWithSchedules?.role?.id),
    enabled: Boolean(roleWithSchedules?.role?.id),
    staleTime: 1000 * 60 * 5,
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
  });

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
        if (['applied', 'shortlisted', 'offered', 'rejected', 'accepted'].includes(currentProcess)) {
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

  const handleCandidateSearch = () => {
    setCandidatePage(0);
    setCandidateSearchTrigger((prev) => prev + 1);
  };

  const renderCandidate = ({ item }: { item: any }) => {
    const applicant = item?.jobApplicant ?? {};
    const userInfo = item?.userInfo ?? {};
    const username = item?.username || userInfo?.username || 'unknown';
    const statusColor = getStatusColor(applicant?.applicationStatus || 'applied');
    const imageUri = item?.comcardFirstPic || userInfo?.profilePic || null;

    const handlePress = () => {
      router.push({
        pathname: '/(protected)/candidate-detail/[candidateId]',
        params: {
          candidateId: applicant?.id?.toString() || '',
          roleId: roleWithSchedules?.role?.id?.toString() || '',
          projectId: projectData?.id?.toString() || '',
        },
      });
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        className="rounded-2xl border border-white/20 bg-zinc-800/85 overflow-hidden relative"
        style={{ width: cardWidth, aspectRatio: 3 / 4 }}>
        {/* Status Chip - Top Right */}
        <View
          className="absolute top-2 right-2 z-20 px-2 py-1 rounded-full"
          style={{ backgroundColor: statusColor + '33' }}>
          <Text className="text-[10px] font-semibold" style={{ color: statusColor }}>
            {applicant?.applicationStatus || 'applied'}
          </Text>
        </View>

        {/* Profile Image */}
        <View className="w-full h-48 bg-zinc-700">
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-white/40 text-xs">No Image</Text>
            </View>
          )}
        </View>

        {/* Username Chip - Bottom Left */}
        <View className="absolute bottom-2 left-2 z-20 px-2 py-1 rounded-full bg-zinc-900/80">
          <Text className="text-[10px] font-medium text-white">@{username}</Text>
        </View>

        {/* Profile Loading Indicator */}
        {!userInfo?.name && username !== 'Unknown User' && (
          <View className="absolute top-2 left-2 z-20 px-2 py-1 rounded-full bg-yellow-500/80">
            <Text className="text-[10px] font-medium text-white">Loading...</Text>
          </View>
        )}

        {/* Profile Unavailable Indicator */}
        {username === 'Unknown User' && (
          <View className="absolute top-2 left-2 z-20 px-2 py-1 rounded-full bg-zinc-600/80">
            <Text className="text-[10px] font-medium text-white">Unavailable</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="gap-4 rounded-2xl border border-white/10 bg-zinc-800 p-5">
      <View className="gap-2">
        <Text className="text-lg font-bold text-white">
          Manage Candidates for {roleWithSchedules?.role?.roleTitle}
        </Text>
        <Text className="text-sm text-white/70">
          Track applicants across custom processes and manage their progression.
        </Text>
      </View>

      {/* Process Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
        {processSegments.map((process) => {
          const count = processCounts?.[process] ?? 0;
          const isActive = currentProcess === process;
          return (
            <TouchableOpacity
              key={`process-${process}`}
              className={`rounded-full border px-3.5 py-2 ${
                isActive
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/20 bg-zinc-700/70'
              }`}
              onPress={() => {
                setCurrentProcess(process);
                setCandidatePage(0);
                setSelectedStatuses([]);
                handleCandidateSearch();
              }}>
              <Text
                className={`text-xs font-semibold capitalize ${
                  isActive ? 'text-blue-200' : 'text-white/80'
                }`}>
                {process} {count ? `(${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
        statusOptions={candidateStatusOptions}
      />

      {/* Candidates List - Grid Layout */}
      <FlatList
        data={filteredCandidates}
        keyExtractor={(item) => `candidate-${item?.jobApplicant?.id}`}
        scrollEnabled={false}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, justifyContent: 'space-between' }}
        contentContainerStyle={{ gap: 12, paddingTop: 8 }}
        ListEmptyComponent={() => (
          <View className="items-center gap-2 py-8 w-full">
            <Text className="text-base font-semibold text-white">No candidates found</Text>
            <Text className="text-center text-sm text-white/60">
              Adjust your filters or select another process stage to view applicants.
            </Text>
          </View>
        )}
        renderItem={({ item }) => renderCandidate({ item })}
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

