import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSoleUserContext } from './SoleUserContext';
import { getProjectBySoleUserId } from '@/api/apiservice/project_api';

// Types
interface Project {
  id: number;
  projectName: string;
  projectDescription: string;
  projectStatus: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  // Add other project properties as needed
}

interface ProjectResults {
  data?: Project[]; // API returns 'data'
  content?: Project[]; // Fallback for 'content'
  total: number;
  page: number;
  pageSize: number;
}

interface ManageProjectContextType {
  // Project List State
  projects: Project[];
  projectResults: ProjectResults | undefined;
  isLoadingProjects: boolean;
  projectsError: any;
  totalPages: number;

  // Search and Pagination State
  currentPage: number;
  setCurrentPage: (page: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  projectStatus: string;
  setProjectStatus: (status: string) => void;
  searchBy: string;
  setSearchBy: (value: string) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  searchOptions: { id: string; label: string }[];
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;

  // API State
  searchAPI: string;
  setSearchAPI: (api: string) => void;

  // Selected Project State
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;

  // View State
  currentRole: number;
  setCurrentRole: (role: number) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;

  // Actions
  refreshProjects: () => void;
  refetchProjects: () => void;
  resetFilters: () => void;
}

const ManageProjectContext = createContext<ManageProjectContextType | undefined>(
  undefined
);

export const useManageProjectContext = () => {
  const context = useContext(ManageProjectContext);
  if (!context) {
    throw new Error(
      'useManageProjectContext must be used within a ManageProjectProvider'
    );
  }
  return context;
};

interface ManageProjectProviderProps {
  children: ReactNode;
}

export const ManageProjectProvider: React.FC<ManageProjectProviderProps> = ({
  children,
}) => {
  const { soleUserId } = useSoleUserContext();

  // Local state for manage project page
  const [projectStatus, setProjectStatus] = useState('Draft');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchAPI, setSearchAPI] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [searchBy, setSearchBy] = useState<string>('projectName');
  const [searchValue, setSearchValue] = useState<string>('');
  // Selected state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentRole, setCurrentRole] = useState(0);
  const [currentTab, setCurrentTab] = useState('project-information');

  const projectSearchOptions = React.useMemo(
    () => [
      { id: 'projectName', label: 'Project Name' },
      { id: 'projectId', label: 'Project ID' },
      { id: 'username', label: 'Publisher Username' },
    ],
    []
  );

  // Effect to update search API when dependencies change
  useEffect(() => {
    if (!soleUserId) {
      return;
    }

    const params = new URLSearchParams();
    params.append('status', projectStatus);
    params.append('pageNo', currentPage.toString());
    params.append('pageSize', pageSize.toString());
    params.append('orderBy', 'id');
    params.append('orderSeq', 'desc');

    const trimmedSearch = searchValue.trim();

    if (trimmedSearch && searchBy) {
      params.append(searchBy, trimmedSearch);
    }

    setSearchAPI(`?${params.toString()}`);
    setSearchQuery(trimmedSearch);
    setIsSearching(Boolean(trimmedSearch));
  }, [soleUserId, projectStatus, currentPage, pageSize, searchBy, searchValue]);

  useEffect(() => {
    setCurrentPage(0);
  }, [projectStatus, searchBy, searchValue]);

  // Projects query
  const {
    data: projectResults,
    error: projectsError,
    isLoading: isLoadingProjects,
    refetch: refreshProjects,
  } = useQuery({
    queryKey: ['manageProjects', soleUserId, searchAPI],
    queryFn: () => getProjectBySoleUserId(soleUserId || '', searchAPI),
    enabled: !!searchAPI && !!soleUserId && searchAPI !== '',
    staleTime: 5 * 60 * 1000,
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retrying
  });

  // Computed values - handle both 'data' and 'content' structures
  const projects = projectResults?.data || projectResults?.content || [];
  const totalPages = projectResults
    ? Math.ceil(projectResults.total / projectResults.pageSize)
    : 1;

  // Debug logging
  useEffect(() => {
    if (projectResults) {
      console.log('ProjectResults structure:', {
        hasData: !!projectResults.data,
        hasContent: !!projectResults.content,
        total: projectResults.total,
        dataLength: projectResults.data?.length,
        contentLength: projectResults.content?.length,
      });
    }
  }, [projectResults]);

  // Actions
  const resetFilters = useCallback(() => {
    setCurrentPage(0);
    setSearchQuery('');
    setIsSearching(false);
    setSelectedProject(null);
    setSearchBy('projectName');
    setSearchValue('');
  }, []);

  const contextValue: ManageProjectContextType = {
    // Project List State
    projects,
    projectResults,
    isLoadingProjects,
    projectsError,
    totalPages,

    // Search and Pagination State
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    projectStatus,
    setProjectStatus,
    searchBy,
    setSearchBy,
    searchValue,
    setSearchValue,
    searchOptions: projectSearchOptions,
    isSearching,
    setIsSearching,

    // API State
    searchAPI,
    setSearchAPI,

    // Selected Project State
    selectedProject,
    setSelectedProject,

    // View State
    currentRole,
    setCurrentRole,
    currentTab,
    setCurrentTab,

    // Actions
    refreshProjects,
    refetchProjects: refreshProjects,
    resetFilters,
  };

  return (
    <ManageProjectContext.Provider value={contextValue}>
      {children}
    </ManageProjectContext.Provider>
  );
};

