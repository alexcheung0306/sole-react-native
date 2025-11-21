import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import {
  searchJobContracts,
  updateJobContractsStatusById,
} from '@/api/apiservice/jobContracts_api';
import PaginationControl from '~/components/projects/PaginationControl';
import FilterSearch from '~/components/custom/filter-search';
import { CollapseDrawer } from '~/components/custom/collapse-drawer';

type ProjectContractsTabProps = {
  projectId: number;
  initialContracts?: any[];
  isLoadingInitial?: boolean;
  refetchContracts: () => void;
};

const contractSearchOptions = [
  { id: 'contractId', label: 'Contract ID' },
  { id: 'roleTitle', label: 'Role Title' },
  { id: 'talentName', label: 'Talent Name' },
  { id: 'projectName', label: 'Project Name' },
];

const contractStatusOptions = [
  { id: 'Pending', label: 'Pending', color: '#f59e0b' },
  { id: 'Activated', label: 'Activated', color: '#10b981' },
  { id: 'Completed', label: 'Completed', color: '#3b82f6' },
  { id: 'Paid', label: 'Paid', color: '#8b5cf6' },
  { id: 'Cancelled', label: 'Cancelled', color: '#ef4444' },
];

export function ProjectContractsTab({
  projectId,
  initialContracts = [],
  isLoadingInitial = false,
  refetchContracts,
}: ProjectContractsTabProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchBy, setSearchBy] = useState('contractId');
  const [searchValue, setSearchValue] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [pageSize] = useState(10);
  const [selectedContracts, setSelectedContracts] = useState<Set<number>>(new Set());
  const [batchStatus, setBatchStatus] = useState('Activated');
  const [batchRemarks, setBatchRemarks] = useState('');

  const handleSearch = () => {
    setPage(0);
    setSearchTrigger((prev) => prev + 1);
  };

  const searchQueryString = useMemo(() => {
    const params = new URLSearchParams();
    params.append('projectId', String(projectId));
    params.append('pageNo', String(page));
    params.append('pageSize', String(pageSize));
    params.append('orderBy', 'createdAt');
    params.append('orderSeq', 'desc');

    if (searchValue.trim()) {
      const value = searchValue.trim();
      switch (searchBy) {
        case 'contractId':
          params.append('contractId', value);
          break;
        case 'roleTitle':
          params.append('roleTitle', value);
          break;
        case 'talentName':
          params.append('talentName', value);
          break;
        case 'projectName':
          params.append('projectName', value);
          break;
        default:
          break;
      }
    }

    selectedStatuses.forEach((status) => params.append('contractStatus', status));

    return params.toString();
  }, [projectId, searchBy, searchValue, selectedStatuses, page, pageSize]);

  const {
    data: contractsResponse,
    isLoading: isLoadingContracts,
    isFetching: isFetchingContracts,
  } = useQuery({
    queryKey: ['project-contracts-search', projectId, searchQueryString, searchTrigger],
    queryFn: () => searchJobContracts(searchQueryString),
    enabled: Boolean(projectId),
  });

  const contracts = useMemo(() => {
    if (contractsResponse) {
      return contractsResponse?.content ?? contractsResponse?.data ?? [];
    }
    return initialContracts ?? [];
  }, [contractsResponse, initialContracts]);

  const totalPages = contractsResponse?.totalPages ?? 1;

  const toggleContractSelection = (contractId: number) => {
    setSelectedContracts((prev) => {
      const next = new Set(prev);
      if (next.has(contractId)) {
        next.delete(contractId);
      } else {
        next.add(contractId);
      }
      return next;
    });
  };

  const batchUpdateMutation = useMutation({
    mutationFn: async ({
      contractIds,
      status,
      remarks,
    }: {
      contractIds: number[];
      status: string;
      remarks?: string;
    }) => {
      await Promise.all(
        contractIds.map((id) =>
          updateJobContractsStatusById(
            {
              contractStatus: status,
              remarks,
            },
            id
          )
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-contracts-search', projectId] });
      refetchContracts();
      setSelectedContracts(new Set());
      setBatchRemarks('');
    },
  });

  const renderContract = ({ item }: { item: any }) => {
    const contract = item?.jobContract ?? item;
    const talentName = contract?.talentName || item?.talentProfile?.fullName || 'Unnamed talent';
    const isSelected = selectedContracts.has(contract?.id);

    return (
      <TouchableOpacity
        style={[styles.contractCard, isSelected && styles.contractCardSelected]}
        onPress={() =>
          router.push({
            pathname: '/(protected)/(client)/projects/contract',
            params: { id: contract?.id?.toString() },
          })
        }
        onLongPress={() => toggleContractSelection(contract?.id)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.contractTitle}>Contract #{contract?.id}</Text>
          <Text style={styles.contractMeta}>Talent: {talentName}</Text>
          <Text style={styles.contractMeta}>Role: {contract?.roleTitle || '—'}</Text>
          <Text style={styles.contractMeta}>Status: {contract?.contractStatus}</Text>
          <Text style={styles.contractMeta}>
            Updated: {contract?.updatedAt ? new Date(contract.updatedAt).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.selectionBadge, isSelected && styles.selectionBadgeActive]}
          onPress={() => toggleContractSelection(contract?.id)}
        >
          <Text style={styles.selectionBadgeText}>{isSelected ? 'Selected' : 'Select'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Contract directory</Text>
            <Text style={styles.sectionSubtitle}>
              Search, filter, and review contract statuses before onboarding talents.
            </Text>
          </View>
          <CollapseDrawer
            trigger={({ open }) => (
              <TouchableOpacity
                style={[styles.secondaryButton, { opacity: selectedContracts.size ? 1 : 0.4 }]}
                onPress={() => {
                  if (selectedContracts.size) {
                    open();
                  }
                }}
              >
                <Text style={styles.secondaryButtonText}>
                  Batch update ({selectedContracts.size || 0})
                </Text>
              </TouchableOpacity>
            )}
            content={(close) => (
              <View style={styles.drawerContent}>
                <Text style={styles.drawerTitle}>Batch update contracts</Text>
                <Text style={styles.drawerSubtitle}>
                  Update the status or leave notes for the selected contracts.
                </Text>
                <View style={styles.batchStatusList}>
                  {contractStatusOptions.map((option) => {
                    const isActive = batchStatus === option.id;
                    return (
                      <TouchableOpacity
                        key={`batch-status-${option.id}`}
                        style={[styles.batchStatusChip, isActive && styles.batchStatusChipActive]}
                        onPress={() => setBatchStatus(option.id)}
                      >
                        <Text
                          style={[styles.batchStatusChipText, isActive && styles.batchStatusChipTextActive]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TextInput
                  value={batchRemarks}
                  onChangeText={setBatchRemarks}
                  placeholder="Remarks (optional)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={[styles.input, styles.multilineInput]}
                  multiline
                />
                <View style={styles.drawerActions}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { flex: 1 }]}
                    onPress={() => {
                      setBatchRemarks('');
                      close();
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1 }]}
                    onPress={() => {
                      if (!selectedContracts.size) {
                        return;
                      }
                      batchUpdateMutation.mutate(
                        {
                          contractIds: Array.from(selectedContracts),
                          status: batchStatus,
                          remarks: batchRemarks.trim() || undefined,
                        },
                        {
                          onSuccess: () => close(),
                        }
                      );
                    }}
                    disabled={batchUpdateMutation.isPending}
                  >
                    <Text style={styles.primaryButtonText}>
                      {batchUpdateMutation.isPending ? 'Updating...' : 'Apply changes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>

        <FilterSearch
          searchBy={searchBy}
          setSearchBy={setSearchBy}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          selectedStatuses={selectedStatuses}
          setSelectedStatuses={setSelectedStatuses}
          onSearch={handleSearch}
          searchOptions={contractSearchOptions}
          statusOptions={contractStatusOptions}
        />

        <FlatList
          data={contracts}
          keyExtractor={(item) => `contract-${item?.jobContract?.id ?? item?.id}`}
          renderItem={renderContract}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 12, paddingTop: 8 }}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No contracts found</Text>
              <Text style={styles.emptyStateSubtitle}>
                Adjust your filters or create new contracts to see them listed here.
              </Text>
            </View>
          )}
        />

        {totalPages > 1 && (
          <View style={{ marginTop: 12 }}>
            <PaginationControl
              currentPage={page}
              setCurrentPage={setPage}
              totalPages={totalPages}
              isLoadingProjects={isLoadingContracts || isFetchingContracts || isLoadingInitial}
            />
          </View>
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
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
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
  },
  contractCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  contractCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  contractTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '600',
  },
  contractMeta: {
    color: 'rgba(148,163,184,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  selectionBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
  },
  selectionBadgeActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  selectionBadgeText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '600',
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
  drawerSubtitle: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 14,
  },
  batchStatusList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  batchStatusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
  },
  batchStatusChipActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  batchStatusChipText: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '600',
  },
  batchStatusChipTextActive: {
    color: '#bfdbfe',
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  drawerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
