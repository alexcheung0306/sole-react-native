import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, FlatList, Animated, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJobPostsContext } from '@/context/JobPostsContext';
import { useRouter } from 'expo-router';
import FilterSearch from '~/components/custom/filter-search';
import FlatListEmpty from '~/components/custom/flatlist-empty';
import PaginationControl from '~/components/projects/PaginationControl';
import JobListCard from '~/components/job/JobListCard';

type JobPostsProps = {
  scrollHandler?: (event: any) => void;
};

export default function JobPosts({ scrollHandler }: JobPostsProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    projects,
    projectResults,
    isLoadingProjects,
    projectsError,
    totalPages,
    currentPage,
    setCurrentPage,
    searchBy,
    setSearchBy,
    searchValue,
    setSearchValue,
    searchOptions,
    isSearching,
    refetchProjects,
  } = useJobPostsContext();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchProjects();
    } catch (error) {
      console.error('Error refreshing job posts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Scroll to top when page changes
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [currentPage]);

  const handleJobSearch = () => {
    setCurrentPage(0);
    refetchProjects();
  };


 

  const projectsData = projects;


  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <FlatList
          ref={flatListRef}
          data={projectsData}
          keyExtractor={(item) => (item?.project?.id ?? item?.id ?? Math.random()).toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
          ListEmptyComponent={
            <FlatListEmpty
              title="job posts"
              description="No job posts available at the moment"
              isLoading={isLoadingProjects}
              error={projectsError}
            />
          }
          ListHeaderComponent={
            <View className="mb-3 gap-2">
              <View className="mb-5">
                <Text className="mb-1 text-[28px] font-bold text-white">Job Posts</Text>
                <Text className="text-sm text-gray-400">Browse available job opportunities</Text>
              </View>

              {/* Search Bar */}
              <FilterSearch
                searchBy={searchBy}
                setSearchBy={setSearchBy}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSearch={handleJobSearch}
                searchOptions={searchOptions}
              />

              {/* Results Count & Pagination */}
              <View className="mb-3 flex-row items-center justify-between">
                {projectResults && (
                  <Text className="text-sm text-gray-400">
                    {projectResults.total ?? 0} {projectResults.total === 1 ? 'job' : 'jobs'} found
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
          renderItem={({ item }) => (
            <View style={{ width: '48%' }}>
              <JobListCard item={item} />
            </View>
          )}
          ListFooterComponent={
            <PaginationControl
              totalPages={totalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              isLoadingProjects={isLoadingProjects}
            />
          }
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: insets.bottom + 80,
            paddingHorizontal: 12,
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

