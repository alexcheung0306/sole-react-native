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
import { getProject } from '@/api/apiservice/project_api';

// Types
interface Project {
  id: number;
  projectName: string;
  projectDescription: string;
  projectStatus: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  projectImage?: string;
  applicationDeadline?: string;
  [key: string]: any;
}

interface ProjectResults {
  data?: Project[];
  content?: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

interface JobPostsContextType {
  // Project List State
  projects: Project[];
  projectResults: ProjectResults | undefined;
  isLoadingProjects: boolean;
  projectsError: any;
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
  refetchProjects: () => void;
  resetFilters: () => void;
}

const JobPostsContext = createContext<JobPostsContextType | undefined>(undefined);

export const useJobPostsContext = () => {
  const context = useContext(JobPostsContext);
  if (!context) {
    throw new Error('useJobPostsContext must be used within a JobPostsProvider');
  }
  return context;
};

interface JobPostsProviderProps {
  children: ReactNode;
}

export const JobPostsProvider: React.FC<JobPostsProviderProps> = ({ children }) => {
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
      { id: 'publisherUsername', label: 'Publisher Username' },
    ],
    []
  );

  // Build search API
  const buildSearchAPI = useCallback(() => {
    if (!searchValue.trim()) {
      return `&status=Published&pageNo=${currentPage}&pageSize=10&orderBy=id&orderSeq=dec`;
    }

    let searchParam = '';
    switch (searchBy) {
      case 'projectName':
        searchParam = `&projectName=${encodeURIComponent(searchValue)}`;
        break;
      case 'projectId':
        searchParam = `&projectId=${searchValue}`;
        break;
      case 'publisherUsername':
        searchParam = `&username=${encodeURIComponent(searchValue)}`;
        break;
    }

    return `${searchParam}&status=Published&pageNo=${currentPage}&pageSize=10&orderBy=id&orderSeq=dec`;
  }, [searchBy, searchValue, currentPage]);

  // Effect to reset page when search changes
  useEffect(() => {
    if (soleUserId) {
      setCurrentPage(0);
      setIsSearching(!!searchValue.trim());
    }
  }, [searchValue, searchBy, soleUserId]);

  // Fetch job posts with TanStack Query
  const {
    data: projectResults,
    error: projectsError,
    isLoading: isLoadingProjects,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['jobPosts', soleUserId, currentPage, searchValue, searchBy],
    queryFn: () => getProject(buildSearchAPI()),
    enabled: !!soleUserId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Computed values
  const projects = projectResults?.data || projectResults?.content || [];
  const totalPages = projectResults?.totalPages || 
    (projectResults ? Math.ceil(projectResults.total / projectResults.pageSize) : 1);

  // Actions
  const resetFilters = useCallback(() => {
    setCurrentPage(0);
    setSearchValue('');
    setIsSearching(false);
    setSearchBy('projectName');
  }, []);

  const contextValue: JobPostsContextType = {
    // Project List State
    projects,
    projectResults,
    isLoadingProjects,
    projectsError,
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
    refetchProjects,
    resetFilters,
  };

  return (
    <JobPostsContext.Provider value={contextValue}>
      {children}
    </JobPostsContext.Provider>
  );
};

