import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { useJobPostsContext } from '@/context/JobPostsContext';
import { useRouter } from 'expo-router';
import FilterSearch from '~/components/custom/filter-search';
import FlatListEmpty from '~/components/custom/flatlist-empty';
import PaginationControl from '~/components/projects/PaginationControl';
import { Calendar, User, Briefcase } from 'lucide-react-native';

export default function JobPosts() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { handleScroll } = useScrollHeader();
  
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleJobPress = (projectId: number) => {
    router.push(`/(protected)/(user)/job/job-detail?id=${projectId}` as any);
  };

  const projectsData = projects;

  const renderJobPost = ({ item }: { item: any }) => {
    const project = item.project || item;
    const userInfoName = item.userInfoName || 'Unknown Client';
    const soleUserName = item.soleUserName;

    return (
      <TouchableOpacity
        onPress={() => handleJobPress(project.id)}
        className="bg-zinc-800/60 rounded-2xl p-4 mb-3 border border-white/10"
        activeOpacity={0.7}
      >
        {/* Project Image */}
        {project.projectImage && (
          <Image
            source={{ uri: project.projectImage }}
            className="w-full h-40 rounded-xl mb-3"
            resizeMode="cover"
          />
        )}

        {/* Project Title */}
        <Text className="text-lg font-bold text-white mb-2" numberOfLines={2}>
          {project.projectName}
        </Text>

        {/* Project ID */}
        <View className="flex-row items-center mb-2 gap-2">
          <Briefcase size={14} color="#9ca3af" />
          <Text className="text-sm text-gray-400">ID: {project.id}</Text>
        </View>

        {/* Client Info */}
        <View className="flex-row items-center mb-2 gap-2">
          <User size={14} color="#9ca3af" />
          <Text className="text-sm text-gray-300">
            {userInfoName} {soleUserName && `(@${soleUserName})`}
          </Text>
        </View>

        {/* Deadline */}
        {project.applicationDeadline && (
          <View className="flex-row items-center mb-2 gap-2">
            <Calendar size={14} color="#9ca3af" />
            <Text className="text-sm text-gray-400">
              Deadline: {formatDate(project.applicationDeadline)}
            </Text>
          </View>
        )}

        {/* Status Badge */}
        <View className="bg-orange-500/20 px-3 py-1 rounded-full self-start mb-2">
          <Text className="text-xs font-semibold text-orange-400">{project.status}</Text>
        </View>

        {/* Description Preview */}
        {project.projectDescription && (
          <Text className="text-sm text-gray-400 mt-2" numberOfLines={3}>
            {project.projectDescription}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <FlatList
          ref={flatListRef}
          data={projectsData}
          keyExtractor={(item) => (item?.project?.id ?? item?.id ?? Math.random()).toString()}
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
          renderItem={renderJobPost}
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
            paddingHorizontal: 12,
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

