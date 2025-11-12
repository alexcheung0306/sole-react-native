import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Search, X, ChevronDown, Filter } from 'lucide-react-native';
import { getStatusColor } from '@/utils/get-status-color';

interface ContractSearchBarProps {
  searchBy: string;
  setSearchBy: (value: string) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  selectedStatuses: string[];
  setSelectedStatuses: (value: string[]) => void;
  onSearch: () => void;
}

export default function ContractSearchBar({
  searchBy,
  setSearchBy,
  searchValue,
  setSearchValue,
  selectedStatuses,
  setSelectedStatuses,
  onSearch,
}: ContractSearchBarProps) {
  const [inputValue, setInputValue] = useState(searchValue);
  const [selectedSearchBy, setSelectedSearchBy] = useState(searchBy);
  const [localSelectedStatuses, setLocalSelectedStatuses] = useState<string[]>(selectedStatuses);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const searchOptions = [
    { id: 'contractId', label: 'Contract Id' },
    { id: 'projectId', label: 'Project Id' },
    { id: 'projectName', label: 'Project Name' },
    { id: 'roleId', label: 'Role Id' },
    { id: 'roleTitle', label: 'Role Title' },
    { id: 'username', label: 'Username' },
  ];

  const statusOptions = [
    { id: 'Pending', label: 'Pending', color: '#f59e0b' },
    { id: 'Activated', label: 'Activated', color: '#10b981' },
    { id: 'Cancelled', label: 'Cancelled', color: '#ef4444' },
    { id: 'Completed', label: 'Completed', color: '#10b981' },
    { id: 'Paid', label: 'Paid', color: '#8b5cf6' },
    { id: 'Payment Due', label: 'Payment Due', color: '#f59e0b' },
  ];

  const handleStatusToggle = (status: string) => {
    const newSelection = localSelectedStatuses.includes(status)
      ? localSelectedStatuses.filter((s) => s !== status)
      : [...localSelectedStatuses, status];

    setLocalSelectedStatuses(newSelection);
    // Don't auto-search, just update local state
  };

  const handleAllStatusToggle = () => {
    const allStatusValues = statusOptions.map((option) => option.id);
    const newSelection =
      localSelectedStatuses.length === allStatusValues.length ? [] : allStatusValues;
    setLocalSelectedStatuses(newSelection);
    // Don't auto-search, just update local state
  };

  const handleApplyFilters = () => {
    setSearchValue(inputValue);
    setSearchBy(selectedSearchBy);
    setSelectedStatuses(localSelectedStatuses);
    onSearch();
    setShowFilterModal(false);
  };

  const handleSearch = () => {
    setSearchValue(inputValue);
    setSearchBy(selectedSearchBy);
    setSelectedStatuses(localSelectedStatuses);
    onSearch();
  };

  const handleClear = () => {
    setInputValue('');
    setSearchValue('');
    setSelectedSearchBy('');
    setSearchBy('');
    setLocalSelectedStatuses([]);
    setSelectedStatuses([]);
    onSearch();
  };

  const removeSearchByChip = () => {
    setSelectedSearchBy('');
    setSearchBy('');
    onSearch();
  };

  const getDropdownLabel = () => {
    if (selectedSearchBy && localSelectedStatuses.length > 0) {
      return `${selectedSearchBy} + ${localSelectedStatuses.length} status${
        localSelectedStatuses.length > 1 ? 'es' : ''
      }`;
    } else if (selectedSearchBy) {
      return `${selectedSearchBy} search`;
    } else if (localSelectedStatuses.length > 0) {
      return `${localSelectedStatuses.length} status${
        localSelectedStatuses.length > 1 ? 'es' : ''
      } selected`;
    }
    return 'All Filters';
  };

  return (
    <View className="mb-4">
      {/* Search and Filter Bar */}
      <View className="flex-row items-stretch gap-2 mb-2">
        {/* Filter Button */}
        <TouchableOpacity
          className="bg-gray-800/60 border border-white/10 px-4 py-3 rounded-lg justify-center items-center"
          onPress={() => setShowFilterModal(true)}
        >
          <View className="relative">
            <Filter color="#9ca3af" size={20} />
            {(selectedSearchBy || localSelectedStatuses.length > 0) && (
              <View className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
            )}
          </View>
        </TouchableOpacity>

        {/* Search Input */}
        <View className="flex-1 flex-row items-center bg-gray-800/60 rounded-lg border border-white/10 px-3">
          <Search color="#9ca3af" size={18} />
          <TextInput
            className="flex-1 text-white text-base ml-2"
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={`Search by ${selectedSearchBy || 'contract'}...`}
            placeholderTextColor="#6b7280"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {inputValue !== '' && (
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
          <View className="bg-gray-900 rounded-t-3xl max-h-[80%] border-t border-white/10">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-white/10">
              <Text className="text-xl font-bold text-white">Search & Filter</Text>
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
                    onPress={() => setSelectedSearchBy(option.id)}
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

              {/* Status Filter Section */}
              <Text className="text-gray-400 text-xs font-semibold mb-3">STATUS FILTER</Text>
              
              {/* Select/Deselect All */}
              <TouchableOpacity
                className="flex-row items-center justify-between p-4 rounded-lg bg-gray-800/60 border border-white/10 mb-2"
                onPress={handleAllStatusToggle}
              >
                <Text className="text-white text-sm font-semibold">
                  {localSelectedStatuses.length === 0
                    ? 'Select All Statuses'
                    : localSelectedStatuses.length === statusOptions.length
                      ? 'Deselect All'
                      : 'Select All Statuses'}
                </Text>
                {localSelectedStatuses.length === statusOptions.length && (
                  <Text className="text-green-500 text-lg font-bold">✓</Text>
                )}
              </TouchableOpacity>

              {/* Status Options */}
              <View className="gap-2 mb-6">
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    className={`flex-row items-center justify-between p-4 rounded-lg border ${
                      localSelectedStatuses.includes(option.id)
                        ? 'border-white/20'
                        : 'bg-gray-800/60 border-white/10'
                    }`}
                    style={{
                      backgroundColor: localSelectedStatuses.includes(option.id)
                        ? option.color + '20'
                        : undefined,
                    }}
                    onPress={() => handleStatusToggle(option.id)}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{
                        color: localSelectedStatuses.includes(option.id)
                          ? option.color
                          : '#ffffff',
                      }}
                    >
                      {option.label}
                    </Text>
                    {localSelectedStatuses.includes(option.id) && (
                      <Text className="text-lg font-bold" style={{ color: option.color }}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Clear All Button */}
              {(selectedSearchBy || localSelectedStatuses.length > 0) && (
                <TouchableOpacity
                  className="bg-red-500/20 border border-red-500 p-4 rounded-lg"
                  onPress={handleClear}
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
                onPress={() => {
                  // Reset to parent state on cancel
                  setLocalSelectedStatuses(selectedStatuses);
                  setSelectedSearchBy(searchBy);
                  setShowFilterModal(false);
                }}
              >
                <Text className="text-white text-base font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-lg items-center bg-blue-500"
                onPress={handleApplyFilters}
              >
                <Text className="text-white text-base font-semibold">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Selected Filters Chips */}
      {(selectedSearchBy || localSelectedStatuses.length > 0) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            {selectedSearchBy && (
              <View className="flex-row items-center bg-blue-500/20 border border-blue-500 rounded-full px-3 py-1.5 gap-2">
                <Text className="text-blue-500 text-xs font-semibold">
                  Search: {selectedSearchBy}
                </Text>
                <TouchableOpacity onPress={removeSearchByChip}>
                  <X color="#3b82f6" size={14} />
                </TouchableOpacity>
              </View>
            )}
            {localSelectedStatuses.map((status) => {
              const statusColor =
                statusOptions.find((opt) => opt.id === status)?.color || '#6b7280';
              return (
                <View
                  key={status}
                  className="flex-row items-center rounded-full px-3 py-1.5 gap-2 border"
                  style={{
                    backgroundColor: statusColor + '20',
                    borderColor: statusColor,
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: statusColor }}>
                    {status}
                  </Text>
                  <TouchableOpacity onPress={() => handleStatusToggle(status)}>
                    <X color={statusColor} size={14} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

