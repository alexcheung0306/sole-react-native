import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { View, Text, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ContractListCard from '@/components/projects/ContractListCard';
import FilterSearch from '~/components/custom/filter-search';
import FlatListEmpty from '~/components/custom/flatlist-empty';
import PaginationControl from '~/components/projects/PaginationControl';
import { useManageContractContext } from '@/context/ManageContractContext';
import ScreenTransition from '@/components/projects/ScreenTransition';
import { useScrollHeader } from '~/hooks/useScrollHeader';

export default function ManageContractsPage() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { handleScroll } = useScrollHeader();
  const {
    contracts,
    contractResults,
    isLoadingContracts,
    contractsError,
    totalPages,
    currentPage,
    setCurrentPage,
    searchBy,
    setSearchBy,
    searchValue,
    setSearchValue,
    selectedStatuses,
    setSelectedStatuses,
    searchOptions,
    statusOptions,
    isSearching,
    refetchContracts,
  } = useManageContractContext();

  // Scroll to top when page changes
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [currentPage]);

  const handleContractSearch = () => {
    setCurrentPage(0);
    refetchContracts();
  };

  const contractsData = contracts;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenTransition direction="right">
        <View className="flex-1 bg-black">
          <FlatList
            ref={flatListRef}
            data={contractsData}
            renderItem={({ item }) => <ContractListCard item={item} />}
            keyExtractor={(item) =>
              (item?.jobContract?.id ?? item?.id ?? Math.random()).toString()
            }
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            ListEmptyComponent={
              <FlatListEmpty
                title="contracts"
                description={searchValue ? 'No contracts found matching your search' : "You don't have any contracts yet"}
                isLoading={isLoadingContracts}
                error={contractsError}
              />
            }
            ListHeaderComponent={
              <View className="mb-3 gap-2">
                <View className="mb-5">
                  <Text className="mb-1 text-[28px] font-bold text-white">Manage Contracts</Text>
                  <Text className="text-sm text-gray-400">View and manage all contracts</Text>
                </View>

                {/* Search Bar */}
                <FilterSearch
                  searchBy={searchBy}
                  setSearchBy={setSearchBy}
                  searchValue={searchValue}
                  setSearchValue={setSearchValue}
                  selectedStatuses={selectedStatuses}
                  setSelectedStatuses={setSelectedStatuses}
                  onSearch={handleContractSearch}
                  searchOptions={searchOptions}
                  statusOptions={statusOptions}
                />

                {/* Results Count & Pagination */}
                <View className="mb-3 flex-row items-center justify-between">
                  {contractResults && (
                    <Text className="text-sm text-gray-400">
                      {contractResults.total ?? 0} {contractResults.total === 1 ? 'contract' : 'contracts'} found
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
            ListFooterComponent={
              <PaginationControl
                totalPages={totalPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                isLoadingProjects={isLoadingContracts}
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
      </ScreenTransition>
    </>
  );
}

