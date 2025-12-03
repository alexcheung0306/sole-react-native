import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { View, Text, FlatList, TouchableOpacity, Animated } from 'react-native';
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
    router.push(`/(protected)/job-detail/${application.projectId}${application.roleId ? `?roleId=${application.roleId}` : ''}` as any);
  };

  const applicationsData = appliedRoles;

  const renderAppliedRole = ({ item }: { item: any }) => {
    const statusColor = getStatusColorObject(item.applicationProcess || item.applicationStatus);
    
    return (
      <TouchableOpacity
        onPress={() => handleApplicationPress(item)}
        className="bg-zinc-800/60 rounded-2xl p-4 mb-3 border border-white/10"
        activeOpacity={0.7}
      >
        {/* Role Title */}
        <Text className="text-lg font-bold text-white mb-2" numberOfLines={2}>
          {item.roleTitle || 'Unnamed Role'}
        </Text>

        {/* Project Info */}
        <View className="flex-row items-center mb-2 gap-2">
          <Briefcase size={14} color="#9ca3af" />
          <Text className="text-sm text-gray-300 flex-1" numberOfLines={1}>
            {item.projectName || `Project #${item.projectId}`}
          </Text>
        </View>

        {/* Project ID */}
        <View className="flex-row items-center mb-2 gap-2">
          <FileText size={14} color="#9ca3af" />
          <Text className="text-sm text-gray-400">
            Project ID: {item.projectId} | Role ID: {item.roleId}
          </Text>
        </View>

        {/* Publisher */}
        {item.publisherUsername && (
          <Text className="text-sm text-gray-400 mb-3">
            By: {item.publisherUsername}
          </Text>
        )}

        {/* Application Status */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: statusColor.bg }}>
            <Text className="text-xs font-semibold" style={{ color: statusColor.text }}>
              {item.applicationProcess || item.applicationStatus || 'Pending'}
            </Text>
          </View>
          
          {item.appliedAt && (
            <View className="flex-row items-center gap-1">
              <Calendar size={12} color="#9ca3af" />
              <Text className="text-xs text-gray-400">
                {formatDate(item.appliedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Additional Info */}
        {item.remarks && (
          <Text className="text-sm text-gray-400 mt-2 italic" numberOfLines={2}>
            {item.remarks}
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
          keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
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

