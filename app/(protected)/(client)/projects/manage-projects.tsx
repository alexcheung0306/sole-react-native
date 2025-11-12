import { Stack } from 'expo-router';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { useManageProjectContext } from '@/context/ManageProjectContext';
import ProjectInfoFormModal from '@/components/projects/ProjectInfoFormModal';
import ProjectStatusTabs from '@/components/projects/ProjectStatusTabs';
import ProjectsNavTabs from '@/components/projects/ProjectsNavTabs';
import ProjectSearchBar from '@/components/projects/ProjectSearchBar';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { formatDateTime } from '@/utils/time-converts';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

export default function ManageProjectsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const {
    projects,
    projectResults,
    isLoadingProjects,
    projectsError,
    refreshProjects,
    currentPage,
    setCurrentPage,
    totalPages,
    isSearching,
  } = useManageProjectContext();

  // Debug logging
  useEffect(() => {
    console.log('ManageProjects - isLoading:', isLoadingProjects);
    console.log('ManageProjects - error:', projectsError);
    console.log('ManageProjects - results:', projectResults);
  }, [isLoadingProjects, projectsError, projectResults]);

  // Scroll to top when page changes
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [currentPage]);

  const getStatusColorValue = (status: string) => {
    const colorMap: { [key: string]: string } = {
      Draft: '#6b7280',
      Published: '#f59e0b',
      InProgress: '#10b981',
      Completed: '#3b82f6',
    };
    return colorMap[status] || '#6b7280';
  };

  const handleProjectPress = (projectId: number) => {
    router.push({
      pathname: '/(protected)/(client)/projects/project-detail',
      params: { id: projectId },
    });
  };

  const renderProject = ({ item }: { item: any }) => {
    const project = item?.project || item;
    
    if (!project) {
      return null;
    }
    
    const statusColor = getStatusColorValue(project.status || 'Draft');

    return (
      <TouchableOpacity
        className="flex-row bg-gray-800/60 rounded-xl mb-3 border border-white/10 overflow-hidden"
        onPress={() => handleProjectPress(project.id)}
      >
        {project.projectImage ? (
          <Image
            source={{ uri: project.projectImage }}
            className="w-[120px] h-[120px]"
          />
        ) : (
          <View className="w-[120px] h-[120px] bg-gray-600/30 justify-center items-center">
            <Text className="text-gray-500 text-xs">No Image</Text>
          </View>
        )}

        <View className="flex-1 p-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-bold text-white">#{project.id}</Text>
            <View
              className="px-2.5 py-1 rounded-xl"
              style={{ backgroundColor: statusColor + '33' }}
            >
              <Text className="text-[11px] font-semibold" style={{ color: statusColor }}>
                {project.status}
              </Text>
            </View>
          </View>

          <Text className="text-base font-semibold text-white mb-1.5" numberOfLines={2}>
            {project.projectName}
          </Text>

          <Text className="text-[13px] text-gray-300 mb-2 leading-[18px]" numberOfLines={2}>
            {project.projectDescription}
          </Text>

          <View className="gap-1">
            <Text className="text-[11px] text-gray-400">
              Updated: {formatDateTime(project.updatedAt)}
            </Text>
            {project.applicationDeadline && (
              <Text className="text-[11px] text-amber-500">
                Deadline: {formatDateTime(project.applicationDeadline)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View className="mb-3">
      {/* Projects Navigation Tabs (Manage Projects / Manage Contracts) */}
      <ProjectsNavTabs />

      {/* Header */}
      <View className="mb-5">
        <Text className="text-[28px] font-bold text-white mb-1">Manage Projects</Text>
        <Text className="text-sm text-gray-400">Create and manage your projects</Text>
      </View>

      {/* Create Project Button */}
      <ProjectInfoFormModal method="POST" />

      {/* Status Tabs */}
      <ProjectStatusTabs />

      {/* Search Bar */}
      <ProjectSearchBar />

      {/* Results Count & Pagination */}
      <View className="flex-row justify-between items-center mb-3">
        {projectResults && (
          <Text className="text-sm text-gray-400">
            {projectResults.total} {projectResults.total === 1 ? 'project' : 'projects'} found
            {isSearching && ' (filtered)'}
          </Text>
        )}
        
        {totalPages > 1 && (
          <Text className="text-sm text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoadingProjects) {
      return (
        <View className="py-15 items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-400 mt-3 text-sm">Loading projects...</Text>
        </View>
      );
    }

    if (projectsError) {
      return (
        <View className="py-15 items-center">
          <Text className="text-red-400 text-base font-semibold mb-2">Error loading projects</Text>
          <Text className="text-gray-400 text-sm text-center mb-2">
            {projectsError?.message || 'Failed to load projects'}
          </Text>
          <Text className="text-gray-500 text-xs text-center italic">
            Please check your network connection and try again
          </Text>
        </View>
      );
    }

    return (
      <View className="py-15 items-center">
        <Text className="text-white text-lg font-semibold mb-2">No projects found</Text>
        <Text className="text-gray-400 text-sm text-center">Create your first project to get started</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (totalPages <= 1 || isLoadingProjects) return null;

    return (
      <View className="py-4 px-6">
        <View className="flex-row justify-between items-center">
          {/* Previous Button */}
          <TouchableOpacity
            className={`flex-row items-center px-4 py-3 rounded-lg ${
              currentPage === 0
                ? 'bg-gray-800/30 opacity-50'
                : 'bg-blue-500/20 border border-blue-500/50'
            }`}
            onPress={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <ChevronLeft 
              color={currentPage === 0 ? '#6b7280' : '#3b82f6'} 
              size={20} 
            />
            <Text className={`ml-2 font-semibold ${
              currentPage === 0 ? 'text-gray-500' : 'text-blue-500'
            }`}>
              Previous
            </Text>
          </TouchableOpacity>

          {/* Page Indicator */}
          <View className="bg-gray-800/60 px-4 py-3 rounded-lg border border-white/10">
            <Text className="text-white font-semibold">
              {currentPage + 1} / {totalPages}
            </Text>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            className={`flex-row items-center px-4 py-3 rounded-lg ${
              currentPage >= totalPages - 1
                ? 'bg-gray-800/30 opacity-50'
                : 'bg-blue-500/20 border border-blue-500/50'
            }`}
            onPress={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            <Text className={`mr-2 font-semibold ${
              currentPage >= totalPages - 1 ? 'text-gray-500' : 'text-blue-500'
            }`}>
              Next
            </Text>
            <ChevronRight 
              color={currentPage >= totalPages - 1 ? '#6b7280' : '#3b82f6'} 
              size={20} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const projectsData = projectResults?.data || projects || [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title="Projects"
          translateY={headerTranslateY}
          isDark={true}
        />
        <FlatList
          ref={flatListRef}
          data={projectsData}
          renderItem={renderProject}
          keyExtractor={(item) => (item?.id || Math.random()).toString()}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 20,
            paddingHorizontal: 24,
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

