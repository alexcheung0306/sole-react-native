import { View, TextInput, TouchableOpacity, FlatList, Text, Modal, RefreshControl, ActivityIndicator } from 'react-native';
import { Filter, X, Check, Calendar, Briefcase, FileText } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { getJobApplicantsByUser } from '~/api/apiservice/applicant_api';
import { useRouter } from 'expo-router';

type FilterType = 'projectName' | 'projectId' | 'publisherUsername';

export default function AppliedRoles() {
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
          searchParam = `&projectName=${encodeURIComponent(searchQuery)}`;
          break;
        case 'projectId':
          searchParam = `&projectId=${searchQuery}`;
          break;
        case 'publisherUsername':
          searchParam = `&soleUserName=${encodeURIComponent(searchQuery)}`;
          break;
      }
    }
    return `pageNo=${currentPage}&pageSize=10${searchParam}`;
  };

  // Fetch applied roles with TanStack Query
  const {
    data: appliedRolesData,
    error: appliedRolesError,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['appliedRoles', soleUserId, currentPage, searchQuery, selectedFilter],
    queryFn: () => getJobApplicantsByUser(soleUserId as string, buildSearchAPI()),
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
      case 'pending':
      case 'applied':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'under review':
      case 'shortlisted':
        return 'text-blue-400 bg-blue-500/20';
      case 'interviewed':
      case 'offered':
        return 'text-green-400 bg-green-500/20';
      case 'rejected':
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

  const handleApplicationPress = (application: any) => {
    // Navigate to job detail with the project ID
    router.push(`/job/job-detail?id=${application.projectId}&roleId=${application.roleId}` as any);
  };

  const loadMore = () => {
    if (appliedRolesData?.data && appliedRolesData.data.length >= 10) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const renderAppliedRole = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.applicationProcess || item.applicationStatus);
    
    return (
      <TouchableOpacity
        onPress={() => handleApplicationPress(item)}
        className="bg-gray-800/20 p-4 mb-3 rounded-2xl border border-gray-700/30"
        activeOpacity={0.7}
      >
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

        {/* Project ID */}
        <View className="flex-row items-center mb-2">
          <FileText size={14} color="#9ca3af" />
          <Text className="text-sm text-gray-400 ml-2">
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
          <View className={`px-3 py-1 rounded-full ${statusColor}`}>
            <Text className={`text-xs font-semibold ${statusColor.split(' ')[0]}`}>
              {item.applicationProcess || item.applicationStatus || 'Pending'}
            </Text>
          </View>
          
          {item.appliedAt && (
            <View className="flex-row items-center">
              <Calendar size={12} color="#9ca3af" />
              <Text className="text-xs text-gray-400 ml-1">
                {formatDate(item.appliedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Additional Info */}
        {item.remarks && (
          <Text className="text-sm text-gray-400 mt-2" numberOfLines={2}>
            {item.remarks}
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
          <Text className="text-gray-400 mt-4">Loading your applications...</Text>
        </View>
      )}

      {/* Error State */}
      {appliedRolesError && (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-400 text-center mb-4">
            Failed to load applied roles
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Applied Roles List */}
      {!isLoading && !appliedRolesError && (
        <FlatList
          data={appliedRolesData?.data || []}
          renderItem={renderAppliedRole}
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
            isFetching && appliedRolesData?.data?.length ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <FileText size={64} color="#4b5563" />
              <Text className="text-gray-400 mt-4 text-center">
                {searchQuery ? 'No applications found matching your search' : 'You haven\'t applied to any roles yet'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
