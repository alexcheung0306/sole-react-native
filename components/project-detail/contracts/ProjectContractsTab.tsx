import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';

import {
  searchJobContracts,
  updateJobContractsStatusById,
  createBatchContractConditions,
} from '@/api/apiservice/jobContracts_api';
import PaginationControl from '~/components/projects/PaginationControl';
import FilterSearch from '~/components/custom/filter-search';
import CollapseDrawer from '~/components/custom/collapse-drawer';
import { FormModal } from '@/components/custom/form-modal';
import { RoleScheduleListInputs } from '@/components/form-components/role-form/RoleScheduleListInputs';
import { DateTimePickerInput } from '@/components/form-components/DateTimePickerInput';
import { SingleWheelPickerInput } from '@/components/form-components/SingleWheelPickerInput';
import { RangeWheelPickerInput } from '@/components/form-components/RangeWheelPickerInput';
import BatchSendConditionFormModal from './BatchSendConditionFormModal';
import ContractsTable from './ContractsTable';

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

const paymentBasisOptions = [
  { value: 'Hourly Rate', label: 'Hourly Rate' },
  { value: 'On Project', label: 'Project Rate' },
];

const currencyOptions = [{ value: 'HKD', label: 'HKD' }];

// Helper function to get primary condition (latest condition)
const getPrimaryCondition = (conditions: any[]) => {
  if (!conditions || conditions.length === 0) return null;
  if (conditions.length === 1) return conditions[0];
  const sortedConditions = [...conditions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return sortedConditions[0];
};

const getLatestConditionStatus = (conditions: any[]) => {
  if (!conditions || conditions.length === 0) return 'No Status';
  const latestCondition = getPrimaryCondition(conditions);
  return latestCondition?.conditionStatus || 'No Status';
};

const formatCurrency = (amount: number, currency: string) => {
  const validCurrency = currency && currency.length === 3 ? currency : 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency,
    }).format(amount || 0);
  } catch (error) {
    return `$${(amount || 0).toFixed(2)}`;
  }
};

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
  const [viewMode, setViewMode] = useState<'view' | 'select'>('view');
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [batchStatus, setBatchStatus] = useState('Activated');
  const [batchRemarks, setBatchRemarks] = useState('');
  const [showBatchDrawer, setShowBatchDrawer] = useState(false);
  const [showBatchConditionsModal, setShowBatchConditionsModal] = useState(false);

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

  // Get selectable (non-disabled) contract IDs
  const disabledContractIds = useMemo(() => {
    return contracts
      .filter((contract: any) => {
        const contractData = contract?.jobContract ?? contract;
        return (
          contractData?.contractStatus !== 'Pending' && contractData?.contractStatus !== 'Activated'
        );
      })
      .map((contract: any) => {
        const contractData = contract?.jobContract ?? contract;
        return contractData?.id?.toString();
      });
  }, [contracts]);

  const toggleContractSelection = (contractId: string) => {
    if (disabledContractIds.includes(contractId)) return;

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

  const handleSelectAll = () => {
    const selectableIds = contracts
      .filter((contract: any) => {
        const contractData = contract?.jobContract ?? contract;
        return !disabledContractIds.includes(contractData?.id?.toString());
      })
      .map((contract: any) => {
        const contractData = contract?.jobContract ?? contract;
        return contractData?.id?.toString();
      });

    if (selectedContracts.size === selectableIds.length) {
      setSelectedContracts(new Set());
    } else {
      setSelectedContracts(new Set(selectableIds));
    }
  };

  const batchCreateConditionsMutation = useMutation({
    mutationFn: async (batchRequest: {
      contractIds: number[];
      conditionData: any;
      remarks?: string;
    }) => createBatchContractConditions(batchRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-contracts-search', projectId] });
      queryClient.invalidateQueries({ queryKey: ['manageContracts'] });
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
      refetchContracts();
      setSelectedContracts(new Set());
      setShowBatchConditionsModal(false);
    },
    onError: (error) => {
      console.error('Error batch creating contract conditions:', error);
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (contractId: number) => {
      // Since DELETE endpoint doesn't exist, we'll cancel the contract instead
      return updateJobContractsStatusById({ contractStatus: 'Cancelled' }, contractId);
    },
    onSuccess: (_, contractId) => {
      queryClient.invalidateQueries({ queryKey: ['project-contracts-search', projectId] });
      queryClient.invalidateQueries({ queryKey: ['manageContracts'] });
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
      refetchContracts();
      // Remove from selected contracts if it was selected
      setSelectedContracts((prev) => {
        const next = new Set(prev);
        next.delete(String(contractId));
        return next;
      });
    },
    onError: (error) => {
      console.error('Error cancelling/deleting contract:', error);
    },
  });

  const handleDeleteContract = (contractId: number) => {
    deleteContractMutation.mutate(contractId);
  };

  // Prepare table rows
  const tableRows = useMemo(() => {
    return contracts.map((contractWithProfile: any) => {
      const contract = contractWithProfile?.jobContract ?? contractWithProfile;
      const latestCondition = getPrimaryCondition(contract?.conditions || []);
      const talentName =
        contractWithProfile?.userInfo?.name ||
        contractWithProfile?.talentInfo?.talentName ||
        contractWithProfile?.username ||
        contract?.talentName ||
        'N/A';

      return {
        key: contract?.id?.toString(),
        contract,
        contractWithProfile,
        talentName,
        latestCondition,
        paymentAmount: latestCondition
          ? `${formatCurrency(latestCondition.paymentAmount, latestCondition.paymentCurrency)} (${latestCondition.paymentBasis})`
          : 'No Amount',
        latestConditionStatus: getLatestConditionStatus(contract?.conditions || []),
        lastUpdate:
          contract?.updatedAt || contract?.createdAt
            ? new Date(contract?.updatedAt || contract?.createdAt).toLocaleDateString()
            : 'N/A',
      };
    });
  }, [contracts]);

  const selectedContractIds = Array.from(selectedContracts).filter((id) => !isNaN(Number(id)));

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Contract directory</Text>
            <Text style={styles.sectionSubtitle}>
              {contracts.length} contract{contracts.length !== 1 ? 's' : ''}
            </Text>
          </View>
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

        {/* Batch Update Mode Toggle */}
        <View style={styles.batchModeContainer}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.batchModeToggle, viewMode === 'select' && styles.batchModeToggleActive]}
            onPress={() => {
              const newMode = viewMode === 'select' ? 'view' : 'select';
              setViewMode(newMode);
              if (newMode === 'view') {
                setSelectedContracts(new Set());
              }
            }}>
            <View style={styles.batchModeToggleContent}>
              <View>
                <Text style={styles.batchModeTitle}>Batch Update Conditions</Text>
                <Text style={styles.batchModeSubtitle}>
                  { selectedContractIds.length > 0
                    ? `Proceed (${selectedContractIds.length})`
                    : 'Enable multi-select for batch operations'}
                </Text>
              </View>

              {viewMode === 'select' && selectedContractIds.length > 0 ? (
                // Batch Send Condition Form Modal
                <BatchSendConditionFormModal
                  contracts={contracts}
                  selectedContractIds={selectedContractIds}
                  batchCreateConditionsMutation={batchCreateConditionsMutation}
                  getPrimaryCondition={getPrimaryCondition}
                  formatCurrency={formatCurrency}
                />
              ) : (
                // Toggle Switch
                <View
                  style={[
                    styles.batchModeSwitch,
                    viewMode === 'select' && styles.batchModeSwitchActive,
                  ]}>
                  {viewMode === 'select' && <View style={styles.batchModeSwitchDot} />}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Contracts Table */}
        <ContractsTable
          viewMode={viewMode}
          selectedContracts={selectedContracts}
          disabledContractIds={disabledContractIds}
          tableRows={tableRows}
          handleSelectAll={handleSelectAll}
          setSelectedContracts={setSelectedContracts}
          onDeleteContract={handleDeleteContract}
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
  sectionTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  batchModeContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  batchModeToggle: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    padding: 16,
  },
  batchModeToggleActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  batchModeToggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchModeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
  },
  batchModeSubtitle: {
    fontSize: 12,
    color: 'rgba(148, 163, 184, 0.7)',
    marginTop: 4,
  },
  batchModeSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  batchModeSwitchActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  batchModeSwitchDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-end',
  },
  batchActionsContainer: {
    marginBottom: 16,
  },
  batchSendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  batchSendButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  tableContainer: {
    marginTop: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    minWidth: 800,
  },
  tableHeaderCell: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
  },
  checkboxHeader: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 800,
  },
  tableRowSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  tableRowDisabled: {
    opacity: 0.5,
  },
  tableCell: {
    color: '#e5e7eb',
    fontSize: 13,
    paddingHorizontal: 8,
  },
  checkboxCell: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  checkboxDisabled: {
    opacity: 0.3,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 6,
    minWidth: 800,
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
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  drawerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 16,
    gap: 20,
  },
  selectedContractsSection: {
    marginBottom: 8,
  },
  selectedContractsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedContractsList: {
    maxHeight: 200,
  },
  emptyContractsCard: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    borderRadius: 12,
  },
  emptyContractsText: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyContractsSubtext: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  contractCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 8,
  },
  contractCardContent: {
    flex: 1,
  },
  contractCardTitle: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  contractCardMeta: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 12,
    marginBottom: 8,
  },
  contractCardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    backgroundColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  contractCardPayment: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 11,
  },
  contractCardId: {
    color: 'rgba(148, 163, 184, 0.5)',
    fontSize: 11,
  },
  formSection: {
    gap: 16,
  },
  formCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  formCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 4,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
    marginBottom: 8,
  },
  label: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  calculationCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: 8,
  },
  calculationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calculationLabel: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 13,
  },
  calculationValue: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
  calculationTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.3)',
  },
  calculationTotalLabel: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
  },
  calculationTotalValue: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
