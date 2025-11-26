import React, {
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
import { talentSearchJobContracts } from '@/api/apiservice/jobContracts_api';

interface Contract {
  id: number;
  projectId: number;
  roleId: number;
  roleTitle?: string;
  projectName?: string;
  contractStatus: string;
  createdAt?: string;
  remarks?: string;
  conditions?: any[];
  [key: string]: any;
}

interface ContractsResults {
  data?: Contract[];
  content?: Contract[];
  total: number;
  page?: number;
  pageSize?: number;
}

interface MyContractsContextType {
  // Contracts List State
  contracts: Contract[];
  contractsData: ContractsResults | undefined;
  isLoading: boolean;
  contractsError: any;
  totalPages: number;

  // Search and Pagination State
  currentPage: number;
  setCurrentPage: (page: number) => void;
  searchBy: string;
  setSearchBy: (value: string) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  searchOptions: { id: string; label: string }[];
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;

  // Actions
  refetch: () => void;
  resetFilters: () => void;
}

const MyContractsContext = createContext<MyContractsContextType | undefined>(undefined);

export const useMyContractsContext = () => {
  const context = useContext(MyContractsContext);
  if (!context) {
    throw new Error('useMyContractsContext must be used within a MyContractsProvider');
  }
  return context;
};

interface MyContractsProviderProps {
  children: ReactNode;
}

export const MyContractsProvider: React.FC<MyContractsProviderProps> = ({ children }) => {
  const { soleUserId } = useSoleUserContext();

  // Local state
  const [currentPage, setCurrentPage] = useState(0);
  const [searchBy, setSearchBy] = useState<string>('projectName');
  const [searchValue, setSearchValue] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  const searchOptions = useMemo(
    () => [
      { id: 'projectName', label: 'Project Name' },
      { id: 'projectId', label: 'Project ID' },
    ],
    []
  );

  // Build search API string
  const buildSearchAPI = useCallback(() => {
    let searchParam = '';
    if (searchValue.trim()) {
      switch (searchBy) {
        case 'projectName':
          searchParam = `projectName=${encodeURIComponent(searchValue)}&`;
          break;
        case 'projectId':
          searchParam = `projectId=${searchValue}&`;
          break;
      }
    }
    return `${searchParam}pageNo=${currentPage}&pageSize=10&orderBy=createdAt&orderSeq=desc`;
  }, [searchBy, searchValue, currentPage]);

  // Effect to reset page when search changes
  useEffect(() => {
    if (soleUserId) {
      setCurrentPage(0);
      setIsSearching(!!searchValue.trim());
    }
  }, [searchValue, searchBy, soleUserId]);

  // Fetch contracts with TanStack Query
  const {
    data: contractsData,
    error: contractsError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['myContracts', soleUserId, currentPage, searchValue, searchBy],
    queryFn: () => talentSearchJobContracts(soleUserId as string, buildSearchAPI()),
    enabled: !!soleUserId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Computed values
  const contracts = contractsData?.data || contractsData?.content || [];
  const totalPages = Math.ceil((contractsData?.total || 0) / 10);

  // Actions
  const resetFilters = useCallback(() => {
    setCurrentPage(0);
    setSearchValue('');
    setIsSearching(false);
    setSearchBy('projectName');
  }, []);

  const contextValue: MyContractsContextType = {
    // Contracts List State
    contracts,
    contractsData,
    isLoading,
    contractsError,
    totalPages,

    // Search and Pagination State
    currentPage,
    setCurrentPage,
    searchBy,
    setSearchBy,
    searchValue,
    setSearchValue,
    searchOptions,
    isSearching,
    setIsSearching,

    // Actions
    refetch,
    resetFilters,
  };

  return (
    <MyContractsContext.Provider value={contextValue}>
      {children}
    </MyContractsContext.Provider>
  );
};

