import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, FlatList, Animated, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyContractsContext } from '@/context/MyContractsContext';
import FilterSearch from '~/components/custom/filter-search';
import FlatListEmpty from '~/components/custom/flatlist-empty';
import PaginationControl from '~/components/projects/PaginationControl';
import { MyContractListCard } from '~/components/job/MyContractListCard';

type MyContractsProps = {
  scrollHandler?: (event: any) => void;
};

export default function MyContracts({ scrollHandler }: MyContractsProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const {
    contracts,
    contractsData,
    isLoading,
    contractsError,
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
  } = useMyContractsContext();


  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing contracts:', error);
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

  const handleContractSearch = () => {
    setCurrentPage(0);
    refetch();
  };

  const contractsList = contracts;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <Animated.FlatList
          ref={flatListRef}
          data={contractsList}
          keyExtractor={(item, index) => item?.jobContract?.id?.toString() || item?.id?.toString() || index.toString()}
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
              title="contracts"
              description={searchValue ? 'No contracts found matching your search' : "You don't have any contracts yet"}
              isLoading={isLoading}
              error={contractsError}
            />
          }
          ListHeaderComponent={
            <View className="mb-3 gap-2">
              <View className="mb-5">
                <Text className="mb-1 text-[28px] font-bold text-white">My Contracts</Text>
                <Text className="text-sm text-gray-400">Manage your job contracts</Text>
              </View>

              {/* Search Bar */}
              <FilterSearch
                searchBy={searchBy}
                setSearchBy={setSearchBy}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSearch={handleContractSearch}
                searchOptions={searchOptions}
              />

              {/* Results Count & Pagination */}
              <View className="mb-3 flex-row items-center justify-between">
                {contractsData && (
                  <Text className="text-sm text-gray-400">
                    {contractsData.total ?? 0} {contractsData.total === 1 ? 'contract' : 'contracts'} found
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
            <MyContractListCard
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

