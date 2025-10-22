import { View, TextInput, TouchableOpacity, FlatList, Text, Modal, RefreshControl, ActivityIndicator } from 'react-native';
import { Filter, X, Check, FileCheck, DollarSign, Calendar, Briefcase } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { talentSearchJobContracts } from '~/api/apiservice/jobContracts_api';
import { useRouter } from 'expo-router';

type FilterType = 'projectName' | 'projectId' | 'publisherUsername';

export default function MyContracts() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('projectName');
  const [currentPage, setCurrentPage] = useState(0);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const { soleUserId } = useSoleUserContext();

  const filterOptions = [
    { id: 'projectName' as FilterType, label: 'Project Name' },
    { id: 'projectId' as FilterType, label: 'Project ID' },
    { id: 'publisherUsername' as FilterType, label: 'Publisher Username' },
  ];

  // Build search API string
  const buildSearchAPI = () => {
    let searchParam = '';
    if (searchQuery.trim()) {
      switch (selectedFilter) {
        case 'projectName':
          searchParam = `projectName=${encodeURIComponent(searchQuery)}&`;
          break;
        case 'projectId':
          searchParam = `projectId=${searchQuery}&`;
          break;
        case 'publisherUsername':
          // This might not be directly supported, but we'll include it
          searchParam = `clientName=${encodeURIComponent(searchQuery)}&`;
          break;
      }
    }
    return `${searchParam}pageNo=${currentPage}&pageSize=10&orderBy=createdAt&orderSeq=desc`;
  };

  // Fetch contracts with TanStack Query
  const {
    data: contractsData,
    error: contractsError,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['myContracts', soleUserId, currentPage, searchQuery, selectedFilter],
    queryFn: () => talentSearchJobContracts(soleUserId as string, buildSearchAPI()),
    enabled: !!soleUserId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnWindowFocus: false,
  });

  // Dynamic search effect
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setCurrentPage(0);
    }, 500);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery, selectedFilter]);

  const getFilterLabel = () => {
    return filterOptions.find(opt => opt.id === selectedFilter)?.label || 'Project Name';
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'active':
      case 'activated':
        return 'text-green-400 bg-green-500/20';
      case 'completed':
        return 'text-blue-400 bg-blue-500/20';
      case 'pending':
      case 'offered':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'accepted':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'rejected':
      case 'cancelled':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleContractPress = (contract: any) => {
    // Navigate to contract detail page (you might need to create this)
    router.push(`/job/contract-detail?id=${contract.id}` as any);
  };

  const loadMore = () => {
    if (contractsData?.data && contractsData.data.length >= 10) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const renderContract = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.contractStatus);
    const conditionsCount = item.conditions?.length || 0;

    return (
      <TouchableOpacity
        onPress={() => handleContractPress(item)}
        className="bg-gray-800/20 p-4 mb-3 rounded-2xl border border-gray-700/30"
        activeOpacity={0.7}
      >
        {/* Contract ID Badge */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <FileCheck size={16} color="#3b82f6" />
            <Text className="text-sm text-blue-400 ml-2 font-semibold">
              Contract #{item.id}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${statusColor}`}>
            <Text className={`text-xs font-semibold ${statusColor.split(' ')[0]}`}>
              {item.contractStatus}
            </Text>
          </View>
        </View>

        {/* Role Title */}
        <Text className="text-lg font-bold text-white mb-2" numberOfLines={2}>
          {item.roleTitle || 'Unnamed Role'}
        </Text>

        {/* Project Info */}
        <View className="flex-row items-center mb-2">
          <Briefcase size={14} color="#9ca3af" />
          <Text className="text-sm text-gray-300 ml-2" numberOfLines={1}>
            {item.projectName || `Project #${item.projectId}`}
          </Text>
        </View>

        {/* Project & Role IDs */}
        <Text className="text-xs text-gray-400 mb-3">
          Project ID: {item.projectId} | Role ID: {item.roleId}
        </Text>

        {/* Conditions Count */}
        {conditionsCount > 0 && (
          <View className="flex-row items-center mb-2">
            <FileCheck size={14} color="#9ca3af" />
            <Text className="text-sm text-gray-400 ml-2">
              {conditionsCount} {conditionsCount === 1 ? 'Condition' : 'Conditions'}
            </Text>
          </View>
        )}

        {/* Created Date */}
        {item.createdAt && (
          <View className="flex-row items-center">
            <Calendar size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-400 ml-1">
              Created: {formatDate(item.createdAt)}
            </Text>
          </View>
        )}

        {/* Remarks */}
        {item.remarks && (
          <Text className="text-sm text-gray-400 mt-3 italic" numberOfLines={2}>
            "{item.remarks}"
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-black">
      {/* Filter Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/80 justify-center items-center"
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-gray-800 rounded-2xl p-6 mx-8 w-80 border border-gray-700"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-white">Search by</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => {
                  setSelectedFilter(option.id);
                  setFilterModalVisible(false);
                }}
                className="flex-row justify-between items-center py-4 border-b border-gray-700/50"
              >
                <Text className={`text-base ${selectedFilter === option.id ? 'font-semibold text-white' : 'text-gray-400'}`}>
                  {option.label}
                </Text>
                {selectedFilter === option.id && (
                  <Check size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Search Bar with Filter Button */}
      <View className="bg-black p-4 border-b border-gray-700/50">
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity 
            className="p-3 bg-gray-800/50 rounded-lg mr-2 border border-gray-700/30"
            onPress={() => setFilterModalVisible(true)}
          >
            <Filter size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <TextInput
            className="flex-1 bg-gray-800/50 px-4 py-3 rounded-lg text-white border border-gray-700/30"
            placeholder={`Search by ${getFilterLabel().toLowerCase()}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#6b7280"
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Loading State */}
      {isLoading && !isFetching && (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-400 mt-4">Loading your contracts...</Text>
        </View>
      )}

      {/* Error State */}
      {contractsError && (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-400 text-center mb-4">
            Failed to load contracts
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contracts List */}
      {!isLoading && !contractsError && (
        <FlatList
          data={contractsData?.data || []}
          renderItem={renderContract}
          keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetching && contractsData?.data?.length ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <FileCheck size={64} color="#4b5563" />
              <Text className="text-gray-400 mt-4 text-center">
                {searchQuery ? 'No contracts found matching your search' : 'You don\'t have any contracts yet'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
