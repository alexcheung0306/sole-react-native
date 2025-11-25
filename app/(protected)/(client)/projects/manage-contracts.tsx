import { Stack } from 'expo-router';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderContext } from '@/context/HeaderContext';
import ContractListCard from '@/components/projects/ContractListCard';
import FilterSearch from '~/components/custom/filter-search';
import { useManageContractContext } from '@/context/ManageContractContext';

export default function ManageContractsPage() {
  const insets = useSafeAreaInsets();
  const { handleScroll } = useHeaderContext();
  const {
    contractResults,
    contracts,
    isLoadingContracts,
    contractsError,
    totalContracts,
    searchBy,
    setSearchBy,
    searchValue,
    setSearchValue,
    selectedStatuses,
    setSelectedStatuses,
    searchOptions,
    statusOptions,
    setCurrentPage,
    refetchContracts,
  } = useManageContractContext();

  const handleSearch = () => {
    setCurrentPage(0);
    refetchContracts();
  };

  const renderHeader = () => (
    <View>
      <View className="mb-5">
        <Text className="text-[28px] font-bold text-white mb-1">Manage Contracts</Text>
        <Text className="text-sm text-gray-400">View and manage all contracts</Text>
      </View>

      <FilterSearch
        searchBy={searchBy}
        setSearchBy={setSearchBy}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        selectedStatuses={selectedStatuses}
        setSelectedStatuses={setSelectedStatuses}
        onSearch={handleSearch}
        searchOptions={searchOptions}
        statusOptions={statusOptions}
      />

      {contractResults && (
        <Text className="text-sm text-gray-400 mb-3">
          {totalContracts} {totalContracts === 1 ? 'contract' : 'contracts'} found
        </Text>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (isLoadingContracts) {
      return (
        <View className="py-15 items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-400 mt-3 text-sm">Loading contracts...</Text>
        </View>
      );
    }

    if (contractsError) {
      return (
        <View className="py-15 items-center">
          <Text className="text-red-400 text-base font-semibold">Error loading contracts</Text>
        </View>
      );
    }

    return (
      <View className="py-15 items-center">
        <Text className="text-gray-400 text-base">No contracts found</Text>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <FlatList
          data={contracts}
          renderItem={({ item }) => <ContractListCard item={item} />}
          keyExtractor={(item) =>
            (item?.jobContract?.id ?? item?.id ?? Math.random()).toString()
          }
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
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

