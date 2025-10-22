import { View, TextInput, TouchableOpacity, FlatList, Text, Modal } from 'react-native';
import { Filter, X, Check } from 'lucide-react-native';
import { useState } from 'react';

type FilterType = 'projectName' | 'projectId' | 'publisherUsername';

export default function JobPosts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('projectName');

  const filterOptions = [
    { id: 'projectName' as FilterType, label: 'Project Name' },
    { id: 'projectId' as FilterType, label: 'Project ID' },
    { id: 'publisherUsername' as FilterType, label: 'Publisher Username' },
  ];

  // Placeholder data - replace with actual data from API
  const jobPosts = Array.from({ length: 10 }, (_, i) => ({
    id: i.toString(),
    title: `Job Post ${i + 1}`,
    projectId: `PRJ-${1000 + i}`,
    description: 'This is a sample job post description',
    publisher: `Publisher${i + 1}`,
  }));

  const filteredPosts = jobPosts.filter(post => {
    const query = searchQuery.toLowerCase();
    switch (selectedFilter) {
      case 'projectName':
        return post.title.toLowerCase().includes(query);
      case 'projectId':
        return post.projectId.toLowerCase().includes(query);
      case 'publisherUsername':
        return post.publisher.toLowerCase().includes(query);
      default:
        return true;
    }
  });

  const getFilterLabel = () => {
    return filterOptions.find(opt => opt.id === selectedFilter)?.label || 'Project Name';
  };

  const renderJobPost = ({ item }: { item: typeof jobPosts[0] }) => (
    <View className="bg-white p-4 mb-2 rounded-lg border border-gray-200">
      <Text className="text-lg font-semibold mb-1">{item.title}</Text>
      <Text className="text-sm text-gray-500 mb-1">ID: {item.projectId}</Text>
      <Text className="text-gray-600 mb-2">{item.description}</Text>
      <Text className="text-sm text-gray-500">By: {item.publisher}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filter Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 mx-8 w-80"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Search by</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <X size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => {
                  setSelectedFilter(option.id);
                  setFilterModalVisible(false);
                }}
                className="flex-row justify-between items-center py-4 border-b border-gray-100"
              >
                <Text className={`text-base ${selectedFilter === option.id ? 'font-semibold' : ''}`}>
                  {option.label}
                </Text>
                {selectedFilter === option.id && (
                  <Check size={20} color="#000000" />
                )}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Search Bar with Filter Button */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity 
            className="p-3 bg-gray-100 rounded-lg mr-2"
            onPress={() => setFilterModalVisible(true)}
          >
            <Filter size={20} color="#000000" />
          </TouchableOpacity>
          
          <TextInput
            className="flex-1 bg-gray-100 px-4 py-3 rounded-lg"
            placeholder={`Search by ${getFilterLabel().toLowerCase()}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Job Posts List */}
      <FlatList
        data={filteredPosts}
        renderItem={renderJobPost}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-10">
            <Text className="text-gray-500">No job posts found</Text>
          </View>
        }
      />
    </View>
  );
}

