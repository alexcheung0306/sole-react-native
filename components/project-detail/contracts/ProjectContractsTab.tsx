import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';

import {
  searchJobContracts,
  updateJobContractsStatusById,
} from '@/api/apiservice/jobContracts_api';
import PaginationControl from '~/components/projects/PaginationControl';
import FilterSearch from '~/components/custom/filter-search';
import CollapseDrawer from ' ~/components/custom/collapse-drawer';
import { FormModal } from '@/components/custom/form-modal';
import { RoleScheduleListInputs } from '@/components/form-components/role-form/RoleScheduleListInputs';
import { DateTimePickerInput } from '@/components/form-components/DateTimePickerInput';
import { SingleWheelPickerInput } from '@/components/form-components/SingleWheelPickerInput';
import { RangeWheelPickerInput } from '@/components/form-components/RangeWheelPickerInput';
import BatchSendConditionFormPortal from '~/components/form-components/batch-send-condition-form/BatchSendConditionFormPortal';
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

  console.log('contractsResponse', contractsResponse);

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
    <View className="">
      <View className="border-white/8 rounded-2xl border bg-zinc-900/90 p-2">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
          <Text className="text-xl font-bold text-white">Contract directory</Text>
          <Text className="mt-1 text-sm text-white/50">
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
        <View className="">
          <TouchableOpacity
            activeOpacity={1}
            className={`rounded-xl border-2 p-4 ${
              viewMode === 'select'
                ? 'border-white bg-blue-500/10'
                : 'border-zinc-400 bg-zinc-800/85'
            }`}
            onPress={() => {
              const newMode = viewMode === 'select' ? 'view' : 'select';
              setViewMode(newMode);
              if (newMode === 'view') {
                setSelectedContracts(new Set());
              }
            }}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-semibold text-white">Batch Update Conditions</Text>
                <Text className="mt-1 text-xs text-white/50">
                  {selectedContractIds.length > 0
                    ? `Proceed (${selectedContractIds.length})`
                    : 'Enable multi-select for batch operations'}
                </Text>
              </View>

              {viewMode === 'select' && selectedContractIds.length > 0 ? (
                // Batch Send Condition Form Modal
                <BatchSendConditionFormPortal
                  projectId={projectId}
                  selectedContractIds={selectedContractIds}
                />
              ) : (
                // Toggle Switch
                <View
                  className={`h-6 w-12 flex-row items-center rounded-xl border-2 px-0.5 ${
                    viewMode === 'select'
                      ? 'border-blue-500 bg-blue-500 justify-end'
                      : 'border-slate-400/40 bg-transparent justify-start'
                  }`}>
                  <View className="h-4 w-4 rounded-full bg-white" />
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
          <View className="mt-3">
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
