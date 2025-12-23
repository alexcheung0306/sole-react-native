import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, FlatList, Animated, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppliedRolesContext } from '@/context/AppliedRolesContext';
import { useRouter } from 'expo-router';
import FilterSearch from '~/components/custom/filter-search';
import FlatListEmpty from '~/components/custom/flatlist-empty';
import PaginationControl from '~/components/projects/PaginationControl';
import { AppliedRoleListCard } from '~/components/job/AppliedRoleListCard';

type AppliedRolesProps = {
  scrollHandler?: (event: any) => void;
};

export default function AppliedRoles({ scrollHandler }: AppliedRolesProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
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
  const applicationsData = appliedRoles;

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
              tintColor="rgb(255, 255, 255)"
              colors={['rgb(255, 255, 255)']}
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
          renderItem={({ item }) => (
            <AppliedRoleListCard
              item={item}
              sharedNavigationState={{
                isNavigating,
                setIsNavigating,
              }}
            />
          )}
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

