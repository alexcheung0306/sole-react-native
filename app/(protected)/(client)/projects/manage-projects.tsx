import { useEffect, useMemo, useRef } from 'react';
import { Stack } from 'expo-router';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { useManageProjectContext } from '@/context/ManageProjectContext';
import ProjectInfoFormModal from '@/components/projects/ProjectInfoFormModal';
import ProjectStatusTabs from '@/components/projects/ProjectStatusTabs';
import ProjectsNavTabs from '@/components/projects/ProjectsNavTabs';
import PaginationControl from '~/components/projects/PaginationControl';
import ProjectListClient from '~/components/projects/ProjectListClient';
import FilterSearch from '~/components/custom/filter-search';

export default function ManageProjectsPage() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const {
    projects,
    projectResults,
    isLoadingProjects,
    projectsError,
    currentPage,
    setCurrentPage,
    totalPages,
    searchBy,
    setSearchBy,
    searchValue,
    setSearchValue,
    searchOptions,
    searchQuery,
    isSearching,
    refetchProjects,
  } = useManageProjectContext();

  // Scroll to top when page changes
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [currentPage]);

  const projectSearchOptions = useMemo(
    () =>
      searchOptions.length
        ? searchOptions
        : [
            { id: 'projectName', label: 'Project Name' },
            { id: 'projectId', label: 'Project ID' },
            { id: 'username', label: 'Publisher Username' },
          ],
    [searchOptions]
  );

  const handleProjectSearch = () => {
    setCurrentPage(0);
    refetchProjects();
  };

  const projectsData = projectResults?.data || projects || [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader title="Projects" translateY={headerTranslateY} isDark={true} />
        <FlatList
          ref={flatListRef}
          data={projectsData}
          keyExtractor={(item) => (item?.project?.id ?? item?.id ?? Math.random()).toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          ListEmptyComponent={() => {
            if (isLoadingProjects) {
              return (
                <View className="py-15 items-center">
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text className="mt-3 text-sm text-gray-400">Loading projects...</Text>
                </View>
              );
            }

            if (projectsError) {
              return (
                <View className="py-15 items-center">
                  <Text className="mb-2 text-base font-semibold text-red-400">
                    Error loading projects
                  </Text>
                  <Text className="mb-2 text-center text-sm text-gray-400">
                    {projectsError?.message || 'Failed to load projects'}
                  </Text>
                  <Text className="text-center text-xs italic text-gray-500">
                    Please check your network connection and try again
                  </Text>
                </View>
              );
            }

            return (
              <View className="py-15 items-center">
                <Text className="mb-2 text-lg font-semibold text-white">No projects found</Text>
                <Text className="text-center text-sm text-gray-400">
                  Create your first project to get started
                </Text>
              </View>
            );
          }}
          ListHeaderComponent={
            <View className="mb-3">
              <ProjectsNavTabs />

              <View className="mb-5">
                <Text className="mb-1 text-[28px] font-bold text-white">Manage Projects</Text>
                <Text className="text-sm text-gray-400">Create and manage your projects</Text>
              </View>

              {/* Create Project Button */}
              <ProjectInfoFormModal method="POST" />

              {/* Status Tabs */}
              <ProjectStatusTabs />

              {/* Search Bar */}
              <FilterSearch
                searchBy={searchBy}
                setSearchBy={setSearchBy}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSearch={handleProjectSearch}
                searchOptions={projectSearchOptions}
              />

              {/* Results Count & Pagination */}
              <View className="mb-3 flex-row items-center justify-between">
                {projectResults && (
                  <Text className="text-sm text-gray-400">
                    {projectResults.total} {projectResults.total === 1 ? 'project' : 'projects'}{' '}
                    found
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
          }
          renderItem={({ item }: { item: any }) => <ProjectListClient item={item} />}
          ListFooterComponent={
            <PaginationControl
              totalPages={totalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              isLoadingProjects={isLoadingProjects}
            />
          }
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
