import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createRoleWithSchedules,
  updateRoleAndSchedules,
} from '@/api/apiservice/role_api';
import {
  getApplicationProcessCounts,
  searchApplicants,
} from '@/api/apiservice/applicant_api';
import { useManageProjectContext } from '@/context/ManageProjectContext';
import { CollapseDrawer } from '~/components/custom/collapse-drawer';
import FilterSearch from '~/components/custom/filter-search';
import PaginationControl from '~/components/projects/PaginationControl';

type ProjectRolesTabProps = {
  projectId: number;
  projectStatus: string;
  rolesWithSchedules: any[];
  countJobActivities: (roleWithSchedules: any) => number;
  refetchRoles: () => void;
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

export function ProjectRolesTab({
  projectId,
  projectStatus,
  rolesWithSchedules,
  countJobActivities,
  refetchRoles,
}: ProjectRolesTabProps) {
  const queryClient = useQueryClient();
  const { currentRole, setCurrentRole } = useManageProjectContext();

  const canCreateRole = projectStatus === 'Draft' && rolesWithSchedules.length < 5;

  const [currentProcess, setCurrentProcess] = useState<string>('applied');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [candidateSearchBy, setCandidateSearchBy] = useState('name');
  const [candidateSearchValue, setCandidateSearchValue] = useState('');
  const [candidatePage, setCandidatePage] = useState(0);
  const [candidateSearchTrigger, setCandidateSearchTrigger] = useState(0);

  const [roleTitle, setRoleTitle] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [talentCount, setTalentCount] = useState('1');

  const [draftRoleTitle, setDraftRoleTitle] = useState('');
  const [draftRoleDescription, setDraftRoleDescription] = useState('');
  const [draftTalentCount, setDraftTalentCount] = useState('1');

  const selectedRoleIndex = useMemo(() => {
    if (rolesWithSchedules.length === 0) {
      return -1;
    }
    const index = Math.min(currentRole, rolesWithSchedules.length - 1);
    if (index !== currentRole) {
      setCurrentRole(index);
    }
    return index;
  }, [currentRole, rolesWithSchedules.length, setCurrentRole]);

  const selectedRole = selectedRoleIndex >= 0 ? rolesWithSchedules[selectedRoleIndex] : null;
  const selectedRoleId = selectedRole?.role?.id;
  const canManageCandidates = projectStatus === 'Published' && Boolean(selectedRoleId);

  const createRoleMutation = useMutation({
    mutationFn: ({ title, description, count }: { title: string; description: string; count: number }) => {
      const parsedValues = {
        projectId,
        requiredGender: 'Any',
        roleTitle: title,
        roleDescription: description,
        paymentBasis: 'Fixed',
        budget: 0,
        talentNumbers: count,
        displayBudgetTo: 'talent',
        talentsQuote: false,
        otPayment: '',
        ageMin: null,
        ageMax: null,
        heightMin: null,
        heightMax: null,
        category: [],
        requiredEthnicGroup: '',
        skills: '',
        questions: '',
        isCastingRequired: false,
        isFittingRequired: false,
        isJobScheduleReady: false,
      } as any;

      const scheduleValues = {
        activityScheduleLists: [],
      };

      return createRoleWithSchedules(parsedValues, scheduleValues);
    },
    onSuccess: () => {
      refetchRoles();
      queryClient.invalidateQueries({ queryKey: ['project-roles', projectId] });
      setRoleTitle('');
      setRoleDescription('');
      setTalentCount('1');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      roleId,
      title,
      description,
      count,
    }: {
      roleId: number;
      title: string;
      description: string;
      count: number;
    }) => {
      const parsedValues = {
        projectId,
        requiredGender: selectedRole?.role?.requiredGender ?? 'Any',
        roleTitle: title,
        roleDescription: description,
        paymentBasis: selectedRole?.role?.paymentBasis ?? 'Fixed',
        budget: selectedRole?.role?.budget ?? 0,
        talentNumbers: count,
        displayBudgetTo: selectedRole?.role?.displayBudgetTo ?? 'talent',
        talentsQuote: selectedRole?.role?.talentsQuote ?? false,
        otPayment: selectedRole?.role?.otPayment ?? '',
        ageMin: selectedRole?.role?.ageMin ?? null,
        ageMax: selectedRole?.role?.ageMax ?? null,
        heightMin: selectedRole?.role?.heightMin ?? null,
        heightMax: selectedRole?.role?.heightMax ?? null,
        category: selectedRole?.role?.category ?? [],
        requiredEthnicGroup: selectedRole?.role?.requiredEthnicGroup ?? '',
        skills: selectedRole?.role?.skills ?? '',
        questions: selectedRole?.role?.questions ?? '',
        isCastingRequired: selectedRole?.role?.isCastingRequired ?? false,
        isFittingRequired: selectedRole?.role?.isFittingRequired ?? false,
        isJobScheduleReady: selectedRole?.role?.isJobScheduleReady ?? false,
      } as any;

      const scheduleValues = {
        activityScheduleLists: selectedRole?.activities?.map((activity: any) => ({
          id: activity?.id,
          title: activity?.title,
          type: activity?.type,
          remarks: activity?.remarks ?? '',
          schedules: activity?.schedules ?? [],
        })) ?? [],
      };

      return updateRoleAndSchedules(String(roleId), parsedValues, scheduleValues);
    },
    onSuccess: () => {
      refetchRoles();
      queryClient.invalidateQueries({ queryKey: ['project-roles', projectId] });
    },
  });

  const { data: processCounts } = useQuery({
    queryKey: ['role-process-counts', selectedRoleId],
    queryFn: () => getApplicationProcessCounts(selectedRoleId),
    enabled: Boolean(selectedRoleId),
    staleTime: 1000 * 60 * 5,
  });

  const handleCandidateSearch = () => {
    setCandidatePage(0);
    setCandidateSearchTrigger((prev) => prev + 1);
  };

  const processSegments = useMemo(() => {
    const activityTitles = Array.isArray(selectedRole?.activities)
      ? selectedRole.activities
          .filter((activity: any) => activity?.type !== 'job')
          .map((activity: any) => activity?.title)
          .filter(Boolean)
      : [];
    const unique = Array.from(new Set(['applied', ...activityTitles, ...trailingProcesses]));
    return unique;
  }, [selectedRole?.activities]);

  const candidateQueryString = useMemo(() => {
    if (!selectedRoleId) {
      return '';
    }
    const params = new URLSearchParams();
    params.append('roleId', String(selectedRoleId));
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
  }, [selectedRoleId, currentProcess, candidatePage, candidateSearchValue, candidateSearchBy, selectedStatuses]);

  const {
    data: candidatesResponse,
    isLoading: isLoadingCandidates,
    isFetching: isFetchingCandidates,
  } = useQuery({
    queryKey: [
      'role-candidates',
      selectedRoleId,
      candidateQueryString,
      candidateSearchTrigger,
    ],
    queryFn: () => searchApplicants(candidateQueryString),
    enabled: Boolean(selectedRoleId),
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

  const renderCandidate = ({ item }: { item: any }) => {
    const applicant = item?.jobApplicant ?? {};
    const profile = item?.profile ?? {};
    return (
      <View style={styles.candidateCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.candidateName}>{profile?.fullName || applicant?.candidateName || 'Unnamed candidate'}</Text>
          <Text style={styles.candidateMeta}>@{profile?.username || applicant?.candidateUsername || 'unknown'}</Text>
          <Text style={styles.candidateMeta}>Status: {applicant?.applicationStatus}</Text>
          <Text style={styles.candidateMeta}>Process: {applicant?.applicationProcess}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={styles.candidateMeta}>
            Applied: {applicant?.createdAt ? new Date(applicant.createdAt).toLocaleDateString() : 'N/A'}
          </Text>
          <Text style={styles.candidateMeta}>
            Updated: {applicant?.updatedAt ? new Date(applicant.updatedAt).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Roles</Text>
          {canCreateRole && (
            <CollapseDrawer
              trigger={({ open }) => (
                <TouchableOpacity style={styles.primaryButton} onPress={open}>
                  <Text style={styles.primaryButtonText}>New Role</Text>
                </TouchableOpacity>
              )}
              content={(close) => (
                <View style={styles.drawerContent}>
                  <Text style={styles.drawerTitle}>Create role</Text>
                  <TextInput
                    value={roleTitle}
                    onChangeText={setRoleTitle}
                    placeholder="Role title"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.input}
                  />
                  <TextInput
                    value={roleDescription}
                    onChangeText={setRoleDescription}
                    placeholder="Description"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={[styles.input, styles.multilineInput]}
                    multiline
                  />
                  <TextInput
                    value={talentCount}
                    onChangeText={setTalentCount}
                    placeholder="Number of talents"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.input}
                    keyboardType="numeric"
                  />
                  <View style={styles.drawerActions}>
                    <TouchableOpacity
                      style={[styles.secondaryButton, { flex: 1 }]}
                      onPress={() => {
                        setRoleTitle('');
                        setRoleDescription('');
                        setTalentCount('1');
                        close();
                      }}
                    >
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryButton, { flex: 1 }]}
                      onPress={() => {
                        const count = Number(talentCount) || 1;
                        createRoleMutation.mutate(
                          { title: roleTitle.trim(), description: roleDescription.trim(), count },
                          {
                            onSuccess: () => {
                              close();
                            },
                          }
                        );
                      }}
                      disabled={createRoleMutation.isPending}
                    >
                      <Text style={styles.primaryButtonText}>
                        {createRoleMutation.isPending ? 'Saving...' : 'Save role'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleChipsContainer}>
          {rolesWithSchedules.map((roleWithSchedule, index) => {
            const role = roleWithSchedule?.role || {};
            const isActive = index === selectedRoleIndex;
            return (
              <TouchableOpacity
                key={`role-${role.id}-${index}`}
                style={[styles.roleChip, isActive && styles.roleChipActive]}
                onPress={() => {
                  setCurrentRole(index);
                }}
              >
                <Text style={[styles.roleChipTitle, isActive && styles.roleChipTitleActive]}>
                  {role.roleTitle || 'Untitled role'}
                </Text>
                <Text style={[styles.roleChipSubtitle, isActive && styles.roleChipSubtitleActive]}>
                  {countJobActivities(roleWithSchedule)} activities • {role.talentNumbers || 1} talent(s)
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {selectedRole && (
          <View style={styles.roleOverview}>
            <Text style={styles.roleOverviewTitle}>Role Overview</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Title</Text>
              <Text style={styles.infoValue}>
                {selectedRole.role?.roleTitle || 'Untitled role'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>
                {selectedRole.role?.roleDescription || 'No description provided.'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Talents Needed</Text>
              <Text style={styles.infoValue}>
                {selectedRole.role?.talentNumbers || 1}
              </Text>
            </View>
          </View>
        )}

        {projectStatus === 'Draft' && selectedRoleId && (
          <CollapseDrawer
            trigger={({ open }) => (
              <TouchableOpacity style={styles.secondaryButton} onPress={open}>
                <Text style={styles.secondaryButtonText}>Edit selected role</Text>
              </TouchableOpacity>
            )}
            onOpenChange={(open) => {
              if (open && selectedRole) {
                setDraftRoleTitle(selectedRole.role?.roleTitle || '');
                setDraftRoleDescription(selectedRole.role?.roleDescription || '');
                setDraftTalentCount(String(selectedRole.role?.talentNumbers || 1));
              }
            }}
            content={(close) => (
              <View style={styles.drawerContent}>
                <Text style={styles.drawerTitle}>Update role</Text>
                <TextInput
                  value={draftRoleTitle}
                  onChangeText={setDraftRoleTitle}
                  placeholder="Role title"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.input}
                />
                <TextInput
                  value={draftRoleDescription}
                  onChangeText={setDraftRoleDescription}
                  placeholder="Description"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={[styles.input, styles.multilineInput]}
                  multiline
                />
                <TextInput
                  value={draftTalentCount}
                  onChangeText={setDraftTalentCount}
                  placeholder="Number of talents"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.input}
                  keyboardType="numeric"
                />
                <View style={styles.drawerActions}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { flex: 1 }]}
                    onPress={() => close()}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1 }]}
                    onPress={() => {
                      if (!selectedRoleId) {
                        return;
                      }
                      const count = Number(draftTalentCount) || 1;
                      updateRoleMutation.mutate(
                        {
                          roleId: selectedRoleId,
                          title: draftRoleTitle.trim(),
                          description: draftRoleDescription.trim(),
                          count,
                        },
                        {
                          onSuccess: () => close(),
                        }
                      );
                    }}
                    disabled={updateRoleMutation.isPending}
                  >
                    <Text style={styles.primaryButtonText}>
                      {updateRoleMutation.isPending ? 'Updating...' : 'Save changes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <View style={[styles.sectionCard, { marginTop: 20 }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Candidate pipeline</Text>
            <Text style={styles.sectionSubtitle}>
              Track applicants across custom processes and manage their progression.
            </Text>
          </View>
        </View>

        {!canManageCandidates && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Publishing required</Text>
            <Text style={styles.emptyStateSubtitle}>
              Publish this project to start inviting candidates and managing their progress.
            </Text>
          </View>
        )}

        {canManageCandidates && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.processPillsContainer}>
              {processSegments.map((process) => {
                const count = processCounts?.[process] ?? 0;
                const isActive = currentProcess === process;
                return (
                  <TouchableOpacity
                    key={`process-${process}`}
                    style={[styles.processPill, isActive && styles.processPillActive]}
                    onPress={() => {
                      setCurrentProcess(process);
                      setCandidatePage(0);
                      setSelectedStatuses([]);
                      handleCandidateSearch();
                    }}
                  >
                    <Text style={[styles.processPillText, isActive && styles.processPillTextActive]}>
                      {process} {count ? `(${count})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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

            <FlatList
              data={filteredCandidates}
              keyExtractor={(item) => `candidate-${item?.jobApplicant?.id}`}
              renderItem={renderCandidate}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 12, paddingTop: 8 }}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>No candidates found</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Adjust your filters or select another process stage to view applicants.
                  </Text>
                </View>
              )}
            />

            {candidateTotalPages > 1 && (
              <View style={{ marginTop: 12 }}>
                <PaginationControl
                  currentPage={candidatePage}
                  setCurrentPage={setCandidatePage}
                  totalPages={candidateTotalPages}
                  isLoadingProjects={isLoadingCandidates || isFetchingCandidates}
                />
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 20,
  },
  sectionCard: {
    backgroundColor: 'rgba(17, 17, 17, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f9fafb',
  },
  sectionSubtitle: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  roleChipsContainer: {
    gap: 12,
    paddingVertical: 4,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    minWidth: 160,
  },
  roleChipActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  roleChipTitle: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '600',
  },
  roleChipTitleActive: {
    color: '#bfdbfe',
  },
  roleChipSubtitle: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 12,
    marginTop: 6,
  },
  roleChipSubtitleActive: {
    color: '#93c5fd',
  },
  roleOverview: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: 'rgba(24, 24, 27, 0.6)',
    gap: 12,
  },
  roleOverviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f9fafb',
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    color: 'rgba(229, 231, 235, 0.65)',
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#f9fafb',
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontWeight: '600',
    textAlign: 'center',
  },
  drawerContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f9fafb',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f9fafb',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  drawerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  processPillsContainer: {
    gap: 10,
    paddingVertical: 6,
  },
  processPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  processPillActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3b82f6',
  },
  processPillText: {
    color: '#cbd5f5',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  processPillTextActive: {
    color: '#bfdbfe',
  },
  candidateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  candidateName: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '600',
  },
  candidateMeta: {
    color: 'rgba(148,163,184,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 6,
  },
  emptyStateTitle: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateSubtitle: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
