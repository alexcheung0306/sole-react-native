import { View, TextInput, TouchableOpacity, FlatList, Text, Modal } from 'react-native';
import { Filter, X, Check } from 'lucide-react-native';
import { useState } from 'react';

type FilterType = 'projectName' | 'projectId' | 'publisherUsername';

export default function AppliedRoles() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('projectName');

  const filterOptions = [
    { id: 'projectName' as FilterType, label: 'Project Name' },
    { id: 'projectId' as FilterType, label: 'Project ID' },
    { id: 'publisherUsername' as FilterType, label: 'Publisher Username' },
  ];

  // Placeholder data - replace with actual data from API
  const appliedRoles = Array.from({ length: 10 }, (_, i) => ({
    id: i.toString(),
    title: `Applied Role ${i + 1}`,
    projectId: `PRJ-${2000 + i}`,
    company: `Company ${i + 1}`,
    publisher: `Publisher${i + 1}`,
    status: i % 3 === 0 ? 'Pending' : i % 3 === 1 ? 'Under Review' : 'Interviewed',
  }));

  const filteredRoles = appliedRoles.filter(role => {
    const query = searchQuery.toLowerCase();
    switch (selectedFilter) {
      case 'projectName':
        return role.title.toLowerCase().includes(query);
      case 'projectId':
        return role.projectId.toLowerCase().includes(query);
      case 'publisherUsername':
        return role.publisher.toLowerCase().includes(query);
      default:
        return true;
    }
  });

  const getFilterLabel = () => {
    return filterOptions.find(opt => opt.id === selectedFilter)?.label || 'Project Name';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'text-yellow-600';
      case 'Under Review':
        return 'text-blue-600';
      case 'Interviewed':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderAppliedRole = ({ item }: { item: typeof appliedRoles[0] }) => (
    <View className="bg-white p-4 mb-2 rounded-lg border border-gray-200">
      <Text className="text-lg font-semibold mb-1">{item.title}</Text>
      <Text className="text-sm text-gray-500 mb-1">ID: {item.projectId}</Text>
      <Text className="text-gray-600 mb-2">{item.company}</Text>
      <Text className="text-sm text-gray-500 mb-2">By: {item.publisher}</Text>
      <Text className={`font-medium ${getStatusColor(item.status)}`}>
        Status: {item.status}
      </Text>
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

      {/* Applied Roles List */}
      <FlatList
        data={filteredRoles}
        renderItem={renderAppliedRole}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-10">
            <Text className="text-gray-500">No applied roles found</Text>
          </View>
        }
      />
    </View>
  );
}

