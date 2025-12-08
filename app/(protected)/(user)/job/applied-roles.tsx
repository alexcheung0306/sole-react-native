import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, FlatList, TouchableOpacity, Animated, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppliedRolesContext } from '@/context/AppliedRolesContext';
import { useRouter } from 'expo-router';
import FilterSearch from '~/components/custom/filter-search';
import FlatListEmpty from '~/components/custom/flatlist-empty';
import PaginationControl from '~/components/projects/PaginationControl';
import { Calendar, Briefcase, FileText } from 'lucide-react-native';
import { getStatusColorObject } from '@/utils/get-status-color';

type AppliedRolesProps = {
  scrollHandler?: (event: any) => void;
};

export default function AppliedRoles({ scrollHandler }: AppliedRolesProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    appliedRoles,
    appliedRolesData,
    isLoading,
    appliedRolesError,
    totalPages,
    currentPage,
    setCurrentPage,
    searchBy,
    setSearchBy,
    searchValue,
    setSearchValue,
    searchOptions,
    isSearching,
    refetch,
  } = useAppliedRolesContext();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing applied roles:', error);
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

  const handleApplicationSearch = () => {
    setCurrentPage(0);
    refetch();
  };


  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleApplicationPress = (application: any) => {
    const projectId = application?.project?.id || application?.jobApplicant?.projectId;
    const roleId = application?.role?.id || application?.jobApplicant?.roleId;
    if (projectId) {
      router.push({
        pathname: `/(protected)/(user)/job/job-detail` as any,
        params: { id: projectId, roleId: roleId },
      });
    }
  };

  const applicationsData = appliedRoles;

  const renderAppliedRole = ({ item }: { item: any }) => {
    // Extract nested data to match the logged structure
    const jobApplicant = item?.jobApplicant || {};
    const project = item?.project || {};
    const role = item?.role || {};
    
    const projectId = project?.id || jobApplicant?.projectId;
    const roleId = role?.id || jobApplicant?.roleId;
    const roleTitle = role?.roleTitle || 'Unnamed Role';
    const projectName = project?.projectName || `Project #${projectId}`;
    const applicationProcess = jobApplicant?.applicationProcess;
    const applicationStatus = jobApplicant?.applicationStatus;
    const appliedAt = jobApplicant?.createdAt;
    const remarks = project?.remarks || role?.roleDescription;
    
    const statusColor = getStatusColorObject(applicationProcess || applicationStatus);
    
    return (
      <TouchableOpacity
        onPress={() => handleApplicationPress(item)}
        className="bg-zinc-800/60 rounded-2xl p-4 mb-3 border border-white/10"
        activeOpacity={0.7}
      >
        {/* Role Title */}
        <Text className="text-lg font-bold text-white mb-2" numberOfLines={2}>
          {roleTitle}
        </Text>

        {/* Project Info */}
        <View className="flex-row items-center mb-2 gap-2">
          <Briefcase size={14} color="#9ca3af" />
          <Text className="text-sm text-gray-300 flex-1" numberOfLines={1}>
            {projectName}
          </Text>
        </View>

        {/* Project ID */}
        <View className="flex-row items-center mb-2 gap-2">
          <FileText size={14} color="#9ca3af" />
          <Text className="text-sm text-gray-400">
            Project ID: {projectId || 'N/A'} | Role ID: {roleId || 'N/A'}
          </Text>
        </View>

        {/* Application Status */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: statusColor.bg }}>
            <Text className="text-xs font-semibold" style={{ color: statusColor.text }}>
              {applicationProcess || applicationStatus || 'Pending'}
            </Text>
          </View>
          
          {appliedAt && (
            <View className="flex-row items-center gap-1">
              <Calendar size={12} color="#9ca3af" />
              <Text className="text-xs text-gray-400">
                {formatDate(appliedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Additional Info */}
        {remarks && (
          <Text className="text-sm text-gray-400 mt-2 italic" numberOfLines={2}>
            {remarks}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <Animated.FlatList
          ref={flatListRef}
          data={applicationsData}
          keyExtractor={(item, index) => item?.jobApplicant?.id?.toString() || item?.id?.toString() || index.toString()}
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
              title="applications"
              description={searchValue ? 'No applications found matching your search' : "You haven't applied to any roles yet"}
              isLoading={isLoading}
              error={appliedRolesError}
            />
          }
          ListHeaderComponent={
            <View className="mb-3 gap-2">
              <View className="mb-5">
                <Text className="mb-1 text-[28px] font-bold text-white">Applied Roles</Text>
                <Text className="text-sm text-gray-400">Track your job applications</Text>
              </View>

              {/* Search Bar */}
              <FilterSearch
                searchBy={searchBy}
                setSearchBy={setSearchBy}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSearch={handleApplicationSearch}
                searchOptions={searchOptions}
              />

              {/* Results Count & Pagination */}
              <View className="mb-3 flex-row items-center justify-between">
                {appliedRolesData && (
                  <Text className="text-sm text-gray-400">
                    {appliedRolesData.total ?? 0} {appliedRolesData.total === 1 ? 'application' : 'applications'} found
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
          renderItem={renderAppliedRole}
          ListFooterComponent={
            <PaginationControl
              totalPages={totalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              isLoadingProjects={isLoading}
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

