import { useEffect, useMemo, useRef } from 'react';
import { Stack } from 'expo-router';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// No scroll header needed - header is static in projects route
import { useManageProjectContext } from '@/context/ManageProjectContext';
import ProjectInfoFormModal from '@/components/projects/ProjectInfoFormModal';
import ProjectStatusTabs from '@/components/projects/ProjectStatusTabs';
import PaginationControl from '~/components/projects/PaginationControl';
import ProjectListClient from '~/components/projects/ProjectListClient';
import FilterSearch from '~/components/custom/filter-search';
import FlatListEmpty from '~/components/custom/flatlist-empty';
import ScreenTransition from '@/components/projects/ScreenTransition';

export default function ManageProjectsPage() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  // No scroll handler - header is static in projects route
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
      <ScreenTransition direction="left">
        <View className="flex-1 bg-black">
          <FlatList
          ref={flatListRef}
          data={projectsData}
          keyExtractor={(item) => (item?.project?.id ?? item?.id ?? Math.random()).toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          ListEmptyComponent={
            <FlatListEmpty
              title="projects"
              description="Create your first project to get started"
              isLoading={isLoadingProjects}
              error={projectsError}
            />
          }
          ListHeaderComponent={
            <View className="mb-3 gap-2">
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
                    {projectResults.total ?? 0} {projectResults.total === 1 ? 'project' : 'projects'}{' '}
                    found
                    {isSearching ? ' (filtered)' : ''}
                  </Text>
                )}

                {totalPages > 1 && (
                  <Text className="text-sm text-gray-400">
                    Page {String(currentPage + 1)} of {String(totalPages)}
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
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 20,
            paddingHorizontal: 12,
          }}
          showsVerticalScrollIndicator={false}
        />
        </View>
      </ScreenTransition>
    </>
  );
}
