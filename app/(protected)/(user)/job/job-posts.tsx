import { View, TextInput, TouchableOpacity, FlatList, Text, Modal, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { Filter, X, Check, Calendar, User, Briefcase } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { getProject } from '~/api/apiservice/project_api';
import { useRouter } from 'expo-router';

type FilterType = 'projectName' | 'projectId' | 'publisherUsername';

export default function JobPosts() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('projectName');
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const {
    soleUserId,
    jobPageSearchAPI,
    setJobPageSearchAPI,
    jobPageCurrentProjectPage,
    setJobPageCurrentProjectPage,
  } = useSoleUserContext();

  const filterOptions = [
    { id: 'projectName' as FilterType, label: 'Project Name' },
    { id: 'projectId' as FilterType, label: 'Project ID' },
    { id: 'publisherUsername' as FilterType, label: 'Publisher Username' },
  ];

  // Fetch job posts with TanStack Query
  const {
    data: projectResults,
    error: projectsError,
    isLoading: isLoadingProjects,
    refetch: refreshProjects,
    isFetching,
  } = useQuery({
    queryKey: ['jobPosts', soleUserId, jobPageCurrentProjectPage, jobPageSearchAPI],
    queryFn: () => getProject(jobPageSearchAPI),
    enabled: !!soleUserId && !!jobPageSearchAPI,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Dynamic search - triggers when searchQuery or selectedFilter changes
  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Debounce search by 500ms
    debounceTimeout.current = setTimeout(() => {
      handleSearch();
    }, 500);

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery, selectedFilter]);

  // Handle search based on selected filter
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      // Reset to default search - show all published jobs
      setJobPageSearchAPI(
        `&status=Published&pageNo=0&pageSize=10&orderBy=id&orderSeq=dec`
      );
      setJobPageCurrentProjectPage(0);
      return;
    }

    let searchParam = '';
    switch (selectedFilter) {
      case 'projectName':
        searchParam = `&projectName=${encodeURIComponent(searchQuery)}`;
        break;
      case 'projectId':
        searchParam = `&id=${searchQuery}`;
        break;
      case 'publisherUsername':
        searchParam = `&soleUserName=${encodeURIComponent(searchQuery)}`;
        break;
    }

    setJobPageSearchAPI(
      `${searchParam}&status=Published&pageNo=0&pageSize=10&orderBy=id&orderSeq=dec`
    );
    setJobPageCurrentProjectPage(0);
  };

  const getFilterLabel = () => {
    return filterOptions.find(opt => opt.id === selectedFilter)?.label || 'Project Name';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleJobPress = (projectId: number) => {
    router.push(`/job/job-detail?id=${projectId}` as any);
  };

  const loadMore = () => {
    if (projectResults?.data && projectResults.data.length >= 10) {
      setJobPageCurrentProjectPage(prev => prev + 1);
    }
  };

  const renderJobPost = ({ item }: { item: any }) => {
    const project = item.project || item;
    const userInfoName = item.userInfoName || 'Unknown Client';
    const userInfoProfilePic = item.userInfoProfilePic;
    const soleUserName = item.soleUserName;

    return (
      <TouchableOpacity
        onPress={() => handleJobPress(project.id)}
        className="bg-gray-800/20 p-4 mb-3 rounded-2xl border border-gray-700/30"
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
        <View className="flex-row items-center mb-2">
          <Briefcase size={14} color="#9ca3af" />
          <Text className="text-sm text-gray-400 ml-2">ID: {project.id}</Text>
        </View>

        {/* Client Info */}
        <View className="flex-row items-center mb-2">
          <User size={14} color="#9ca3af" />
          <Text className="text-sm text-gray-300 ml-2">
            {userInfoName} {soleUserName && `(@${soleUserName})`}
          </Text>
        </View>

        {/* Deadline */}
        {project.applicationDeadline && (
          <View className="flex-row items-center mb-2">
            <Calendar size={14} color="#9ca3af" />
            <Text className="text-sm text-gray-400 ml-2">
              Deadline: {formatDate(project.applicationDeadline)}
            </Text>
          </View>
        )}

        {/* Status Badge */}
        <View className="mt-2">
          <View className="bg-orange-500/20 px-3 py-1 rounded-full self-start">
            <Text className="text-orange-400 text-xs font-semibold">{project.status}</Text>
          </View>
        </View>

        {/* Description Preview */}
        {project.projectDescription && (
          <Text className="text-gray-400 text-sm mt-3" numberOfLines={3}>
            {project.projectDescription}
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
      {isLoadingProjects && !isFetching && (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-400 mt-4">Loading job posts...</Text>
        </View>
      )}

      {/* Error State */}
      {projectsError && (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-400 text-center mb-4">
            Failed to load job posts
          </Text>
          <TouchableOpacity
            onPress={() => refreshProjects()}
            className="bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Job Posts List */}
      {!isLoadingProjects && !projectsError && (
        <FlatList
          data={projectResults?.data || []}
          renderItem={renderJobPost}
          keyExtractor={(item, index) => item?.project?.id?.toString() || index.toString()}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refreshProjects}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetching && projectResults?.data?.length ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Briefcase size={64} color="#4b5563" />
              <Text className="text-gray-400 mt-4 text-center">
                {searchQuery ? 'No job posts found matching your search' : 'No job posts available'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
