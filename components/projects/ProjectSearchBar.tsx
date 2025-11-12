import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Search, X, ChevronDown, Filter } from 'lucide-react-native';
import { useManageProjectContext } from '@/context/ManageProjectContext';
import { useSoleUserContext } from '@/context/SoleUserContext';

export default function ProjectSearchBar() {
  const { soleUserId } = useSoleUserContext();
  const {
    searchQuery,
    setSearchQuery,
    projectStatus,
    setSearchAPI,
    setIsSearching,
    currentPage,
  } = useManageProjectContext();

  const [searchValue, setSearchValue] = useState('');
  const [selectedSearchBy, setSelectedSearchBy] = useState<
    'projectName' | 'projectId' | 'username'
  >('projectName');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const searchOptions = [
    { id: 'projectName', label: 'Project Name' },
    { id: 'projectId', label: 'Project ID' },
    { id: 'username', label: 'Publisher Username' },
  ];

  const handleSearch = () => {
    if (!searchValue || searchValue.trim() === '') {
      // Reset to default search
      setSearchAPI(
        `?status=${projectStatus}&pageNo=${currentPage}&pageSize=10&orderBy=id&orderSeq=desc`
      );
      setIsSearching(false);
      setSearchQuery('');
    } else {
      const encodedStr = encodeURIComponent(searchValue);
      let searchParam = '';

      switch (selectedSearchBy) {
        case 'projectName':
          searchParam = `&projectName=${encodedStr}`;
          break;
        case 'projectId':
          searchParam = `&projectId=${encodedStr}`;
          break;
        case 'username':
          searchParam = `&username=${encodedStr}`;
          break;
      }

      setSearchAPI(
        `?status=${projectStatus}&pageNo=0${searchParam}&pageSize=10&orderBy=id&orderSeq=desc`
      );
      setIsSearching(true);
      setSearchQuery(searchValue);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    setSearchQuery('');
    setSelectedSearchBy('projectName');
    setSearchAPI(
      `?status=${projectStatus}&pageNo=${currentPage}&pageSize=10&orderBy=id&orderSeq=desc`
    );
    setIsSearching(false);
  };

  const handleValueChange = (text: string) => {
    setSearchValue(text);
    if (!text || text.trim() === '') {
      handleClear();
    }
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-stretch gap-2">
        {/* Filter Button */}
        <TouchableOpacity
          className="bg-gray-800/60 border border-white/10 px-4 py-3 rounded-lg justify-center items-center"
          onPress={() => setShowFilterModal(true)}
        >
          <Filter color="#9ca3af" size={20} />
        </TouchableOpacity>

        {/* Search Input */}
        <View className="flex-1 flex-row items-center bg-gray-800/60 rounded-lg border border-white/10 px-3">
          <Search color="#9ca3af" size={18} />
          <TextInput
            className="flex-1 text-white text-base ml-2"
            value={searchValue}
            onChangeText={handleValueChange}
            placeholder={`Search by ${searchOptions.find((opt) => opt.id === selectedSearchBy)?.label}...`}
            placeholderTextColor="#6b7280"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchValue !== '' && (
            <TouchableOpacity onPress={handleClear} className="ml-2">
              <X color="#9ca3af" size={18} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Button */}
        <TouchableOpacity
          className="bg-blue-500 px-4 rounded-lg justify-center items-center"
          onPress={handleSearch}
        >
          <Search color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-gray-900 rounded-t-3xl max-h-[70%] border-t border-white/10">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-white/10">
              <Text className="text-xl font-bold text-white">Search Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} className="p-1">
                <X color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
              {/* Search By Section */}
              <Text className="text-gray-400 text-xs font-semibold mb-3">SEARCH BY</Text>
              <View className="gap-2 mb-6">
                {searchOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    className={`flex-row items-center justify-between p-4 rounded-lg border ${
                      selectedSearchBy === option.id
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-gray-800/60 border-white/10'
                    }`}
                    onPress={() => setSelectedSearchBy(option.id as any)}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selectedSearchBy === option.id ? 'text-blue-500' : 'text-white'
                      }`}
                    >
                      {option.label}
                    </Text>
                    {selectedSearchBy === option.id && (
                      <Text className="text-blue-500 text-lg font-bold">✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Clear All Button */}
              {searchQuery && searchQuery.trim() !== '' && (
                <TouchableOpacity
                  className="bg-red-500/20 border border-red-500 p-4 rounded-lg"
                  onPress={() => {
                    handleClear();
                    setShowFilterModal(false);
                  }}
                >
                  <Text className="text-red-500 text-sm font-semibold text-center">
                    Clear All Filters
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View className="flex-row gap-3 p-5 border-t border-white/10">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-lg items-center bg-gray-800/60 border border-white/10"
                onPress={() => setShowFilterModal(false)}
              >
                <Text className="text-white text-base font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-lg items-center bg-blue-500"
                onPress={() => {
                  handleSearch();
                  setShowFilterModal(false);
                }}
              >
                <Text className="text-white text-base font-semibold">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

