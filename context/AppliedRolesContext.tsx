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
import { getJobApplicantsByUser } from '@/api/apiservice/applicant_api';

interface AppliedRole {
  id: number;
  projectId: number;
  roleId: number;
  roleTitle?: string;
  projectName?: string;
  publisherUsername?: string;
  applicationProcess?: string;
  applicationStatus?: string;
  appliedAt?: string;
  remarks?: string;
  [key: string]: any;
}

interface AppliedRolesResults {
  data?: AppliedRole[];
  content?: AppliedRole[];
  total: number;
  page?: number;
  pageSize?: number;
}

interface AppliedRolesContextType {
  // Applied Roles List State
  appliedRoles: AppliedRole[];
  appliedRolesData: AppliedRolesResults | undefined;
  isLoading: boolean;
  appliedRolesError: any;
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

const AppliedRolesContext = createContext<AppliedRolesContextType | undefined>(undefined);

export const useAppliedRolesContext = () => {
  const context = useContext(AppliedRolesContext);
  if (!context) {
    throw new Error('useAppliedRolesContext must be used within an AppliedRolesProvider');
  }
  return context;
};

interface AppliedRolesProviderProps {
  children: ReactNode;
}

export const AppliedRolesProvider: React.FC<AppliedRolesProviderProps> = ({ children }) => {
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
          searchParam = `&projectName=${encodeURIComponent(searchValue)}`;
          break;
        case 'projectId':
          searchParam = `&projectId=${searchValue}`;
          break;
      }
    }
    return `pageNo=${currentPage}&pageSize=10${searchParam}`;
  }, [searchBy, searchValue, currentPage]);

  // Effect to reset page when search changes
  useEffect(() => {
    if (soleUserId) {
      setCurrentPage(0);
      setIsSearching(!!searchValue.trim());
    }
  }, [searchValue, searchBy, soleUserId]);

  // Fetch applied roles with TanStack Query
  const {
    data: appliedRolesData,
    error: appliedRolesError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['appliedRoles', soleUserId, currentPage, searchValue, searchBy],
    queryFn: () => getJobApplicantsByUser(soleUserId as string, buildSearchAPI()),
    enabled: !!soleUserId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Computed values
  const appliedRoles = appliedRolesData?.data || appliedRolesData?.content || [];
  const totalPages = Math.ceil((appliedRolesData?.total || 0) / 10);

  // Actions
  const resetFilters = useCallback(() => {
    setCurrentPage(0);
    setSearchValue('');
    setIsSearching(false);
    setSearchBy('projectName');
  }, []);

  const contextValue: AppliedRolesContextType = {
    // Applied Roles List State
    appliedRoles,
    appliedRolesData,
    isLoading,
    appliedRolesError,
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
    <AppliedRolesContext.Provider value={contextValue}>
      {children}
    </AppliedRolesContext.Provider>
  );
};

