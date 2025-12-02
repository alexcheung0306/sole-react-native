import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { View, Text, FlatList, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyContractsContext } from '@/context/MyContractsContext';
import { useRouter } from 'expo-router';
import FilterSearch from '~/components/custom/filter-search';
import FlatListEmpty from '~/components/custom/flatlist-empty';
import PaginationControl from '~/components/projects/PaginationControl';
import { FileCheck, Calendar, Briefcase } from 'lucide-react-native';

type MyContractsProps = {
  scrollHandler?: (event: any) => void;
};

export default function MyContracts({ scrollHandler }: MyContractsProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  
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

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'active':
      case 'activated':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' };
      case 'completed':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' };
      case 'pending':
      case 'offered':
        return { bg: 'rgba(250, 204, 21, 0.2)', text: '#facc15' };
      case 'accepted':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' };
      case 'rejected':
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af' };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleContractPress = (contract: any) => {
    router.push(`/(protected)/contract-detail/${contract.id}` as any);
  };

  const contractsList = contracts;

  const renderContract = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.contractStatus);
    const conditionsCount = item.conditions?.length || 0;

    return (
      <TouchableOpacity
        onPress={() => handleContractPress(item)}
        className="bg-zinc-800/60 rounded-2xl p-4 mb-3 border border-white/10"
        activeOpacity={0.7}
      >
        {/* Contract ID Badge */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <FileCheck size={16} color="#3b82f6" />
            <Text className="text-sm text-blue-400 font-semibold">
              Contract #{item.id}
            </Text>
          </View>
          <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: statusColor.bg }}>
            <Text className="text-xs font-semibold" style={{ color: statusColor.text }}>
              {item.contractStatus}
            </Text>
          </View>
        </View>

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

        {/* Project & Role IDs */}
        <Text className="text-xs text-gray-400 mb-3">
          Project ID: {item.projectId} | Role ID: {item.roleId}
        </Text>

        {/* Conditions Count */}
        {conditionsCount > 0 && (
          <View className="flex-row items-center mb-2 gap-2">
            <FileCheck size={14} color="#9ca3af" />
            <Text className="text-sm text-gray-400">
              {conditionsCount} {conditionsCount === 1 ? 'Condition' : 'Conditions'}
            </Text>
          </View>
        )}

        {/* Created Date */}
        {item.createdAt && (
          <View className="flex-row items-center gap-1 mb-2">
            <Calendar size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-400">
              Created: {formatDate(item.createdAt)}
            </Text>
          </View>
        )}

        {/* Remarks */}
        {item.remarks && (
          <Text className="text-sm text-gray-400 mt-2 italic" numberOfLines={2}>
            "{item.remarks}"
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
          data={contractsList}
          keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
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
          renderItem={renderContract}
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

