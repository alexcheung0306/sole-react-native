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
import { getProjectBySoleUserId } from '@/api/apiservice/project_api';

// Types
interface Project {
  id: number;
  projectName: string;
  projectDescription: string;
  projectStatus: string;
  status?: string;
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
  projectStatus: string;
  setProjectStatus: (status: string) => void;
  searchBy: string;
  setSearchBy: (value: string) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  searchOptions: { id: string; label: string }[];
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;

  // Selected Project State (for detail page)
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;

  // View State (for detail page)
  currentRole: number;
  setCurrentRole: (role: number) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;

  // Actions
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
  const [isSearching, setIsSearching] = useState(false);
  const [searchBy, setSearchBy] = useState<string>('projectName');
  const [searchValue, setSearchValue] = useState<string>('');
  const pageSize = 10;
  
  // Selected state (for detail page)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentRole, setCurrentRole] = useState(0);
  const [currentTab, setCurrentTab] = useState('project-information');

  const searchOptions = useMemo(
    () => [
      { id: 'projectName', label: 'Project Name' },
      { id: 'projectId', label: 'Project ID' },
      { id: 'username', label: 'Publisher Username' },
    ],
    []
  );

  // Build search API
  const buildSearchAPI = useCallback(() => {
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

    return `?${params.toString()}`;
  }, [projectStatus, currentPage, pageSize, searchBy, searchValue]);

  // Effect to reset page when search changes
  useEffect(() => {
    if (soleUserId) {
      setCurrentPage(0);
      setIsSearching(!!searchValue.trim());
    }
  }, [searchValue, searchBy, projectStatus, soleUserId]);

  // Projects query
  const {
    data: projectResults,
    error: projectsError,
    isLoading: isLoadingProjects,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['manageProjects', soleUserId, projectStatus, currentPage, searchValue, searchBy],
    queryFn: () => getProjectBySoleUserId(soleUserId || '', buildSearchAPI()),
    enabled: !!soleUserId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Computed values - handle both 'data' and 'content' structures
  const projects = projectResults?.data || projectResults?.content || [];
  const totalPages = projectResults?.totalPages || 
    (projectResults ? Math.ceil(projectResults.total / projectResults.pageSize) : 1);

  // Actions
  const resetFilters = useCallback(() => {
    setCurrentPage(0);
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
    projectStatus,
    setProjectStatus,
    searchBy,
    setSearchBy,
    searchValue,
    setSearchValue,
    searchOptions,
    isSearching,
    setIsSearching,

    // Selected Project State
    selectedProject,
    setSelectedProject,

    // View State
    currentRole,
    setCurrentRole,
    currentTab,
    setCurrentTab,

    // Actions
    refetchProjects,
    resetFilters,
  };

  return (
    <ManageProjectContext.Provider value={contextValue}>
      {children}
    </ManageProjectContext.Provider>
  );
};

