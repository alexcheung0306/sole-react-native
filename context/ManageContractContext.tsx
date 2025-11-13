import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSoleUserContext } from './SoleUserContext';
import { clientSearchJobContracts } from '@/api/apiservice/jobContracts_api';

export type SearchOption = {
  id: string;
  label: string;
};

export type StatusOption = {
  id: string;
  label: string;
  color: string;
};

interface ManageContractContextType {
  contractResults: any | undefined;
  contracts: any[];
  isLoadingContracts: boolean;
  contractsError: any;
  totalContracts: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  searchBy: string;
  setSearchBy: (value: string) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  selectedStatuses: string[];
  setSelectedStatuses: (statuses: string[]) => void;
  searchOptions: SearchOption[];
  statusOptions: StatusOption[];
  refetchContracts: () => void;
  resetFilters: () => void;
}

const ManageContractContext = createContext<ManageContractContextType | undefined>(undefined);

export const useManageContractContext = () => {
  const context = useContext(ManageContractContext);
  if (!context) {
    throw new Error('useManageContractContext must be used within a ManageContractProvider');
  }
  return context;
};

export const ManageContractProvider = ({ children }: { children: ReactNode }) => {
  const { soleUserId } = useSoleUserContext();

  const [searchBy, setSearchBy] = useState<string>('contractId');
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const searchOptions = useMemo<SearchOption[]>(
    () => [
      { id: 'contractId', label: 'Contract ID' },
      { id: 'projectId', label: 'Project ID' },
      { id: 'projectName', label: 'Project Name' },
      { id: 'roleId', label: 'Role ID' },
      { id: 'roleTitle', label: 'Role Title' },
      { id: 'username', label: 'Publisher Username' },
    ],
    []
  );

  const statusOptions = useMemo<StatusOption[]>(
    () => [
      { id: 'Pending', label: 'Pending', color: '#f59e0b' },
      { id: 'Activated', label: 'Activated', color: '#10b981' },
      { id: 'Cancelled', label: 'Cancelled', color: '#ef4444' },
      { id: 'Completed', label: 'Completed', color: '#3b82f6' },
      { id: 'Paid', label: 'Paid', color: '#8b5cf6' },
      { id: 'Payment Due', label: 'Payment Due', color: '#f97316' },
    ],
    []
  );

  const searchUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (searchBy && searchValue) {
      params.append(searchBy, searchValue);
    }

    if (selectedStatuses.length > 0) {
      selectedStatuses.forEach((status) => params.append('contractStatus', status));
    }

    params.append('orderBy', 'createdAt');
    params.append('orderSeq', 'desc');
    params.append('pageNo', currentPage.toString());
    params.append('pageSize', '20');

    return params.toString();
  }, [searchBy, searchValue, selectedStatuses, currentPage]);

  const {
    data: contractResults,
    error: contractsError,
    isLoading: isLoadingContracts,
    refetch: refetchContracts,
  } = useQuery({
    queryKey: ['manageContracts', soleUserId, searchUrl],
    queryFn: () => clientSearchJobContracts(soleUserId || '', searchUrl),
    enabled: !!soleUserId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setCurrentPage(0);
  }, [searchBy, searchValue, selectedStatuses]);

  const contracts = useMemo(
    () => contractResults?.data || contractResults?.content || [],
    [contractResults]
  );

  const totalContracts = contractResults?.total ?? contracts.length;

  const resetFilters = useCallback(() => {
    setSearchBy('contractId');
    setSearchValue('');
    setSelectedStatuses([]);
    setCurrentPage(0);
  }, []);

  const value = useMemo(
    () => ({
      contractResults,
      contracts,
      isLoadingContracts,
      contractsError,
      totalContracts,
      currentPage,
      setCurrentPage,
      searchBy,
      setSearchBy,
      searchValue,
      setSearchValue,
      selectedStatuses,
      setSelectedStatuses,
      searchOptions,
      statusOptions,
      refetchContracts,
      resetFilters,
    }),
    [
      contractResults,
      contracts,
      isLoadingContracts,
      contractsError,
      totalContracts,
      currentPage,
      searchBy,
      searchValue,
      selectedStatuses,
      searchOptions,
      statusOptions,
      refetchContracts,
      resetFilters,
    ]
  );

  return (
    <ManageContractContext.Provider value={value}>{children}</ManageContractContext.Provider>
  );
};

