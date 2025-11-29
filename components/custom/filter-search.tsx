import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Search, X, Filter } from 'lucide-react-native';
import CollapseDrawer2 from './collapse-drawer2';

interface FilterSearchProps {
  searchBy: string;
  setSearchBy: (value: string) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  selectedStatuses?: string[] | null;
  setSelectedStatuses?: (value: string[]) => void;
  onSearch: () => void;
  searchOptions: { id: string; label: string }[];
  statusOptions?: { id: string; label: string; color: string }[] | null;
}

export default function FilterSearch({
  searchBy,
  setSearchBy,
  searchValue,
  setSearchValue,
  selectedStatuses: selectedStatusesProp,
  setSelectedStatuses,
  onSearch,
  searchOptions,
  statusOptions: statusOptionsProp,
}: FilterSearchProps) {
  const [inputValue, setInputValue] = useState(searchValue);
  const [selectedSearchBy, setSelectedSearchBy] = useState(searchBy);
  const [localSelectedStatuses, setLocalSelectedStatuses] = useState<string[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    setInputValue(searchValue);
  }, [searchValue]);

  useEffect(() => {
    setSelectedSearchBy(searchBy);
  }, [searchBy]);

  useEffect(() => {
    if (Array.isArray(selectedStatusesProp)) {
      setLocalSelectedStatuses(selectedStatusesProp);
    } else {
      setLocalSelectedStatuses([]);
    }
  }, [selectedStatusesProp]);

  const hasStatusFilters = Boolean(
    Array.isArray(statusOptionsProp) && statusOptionsProp.length && setSelectedStatuses
  );
  const statusOptionsList = Array.isArray(statusOptionsProp) ? statusOptionsProp : [];

  const handleStatusToggle = (status: string) => {
    if (!statusOptionsList.length || !setSelectedStatuses) {
      return;
    }

    const newSelection = localSelectedStatuses.includes(status)
      ? localSelectedStatuses.filter((s) => s !== status)
      : [...localSelectedStatuses, status];

    setLocalSelectedStatuses(newSelection);
  };

  const handleAllStatusToggle = () => {
    if (!statusOptionsList.length || !setSelectedStatuses) {
      return;
    }

    const allStatusValues = statusOptionsList.map((option) => option.id);
    const newSelection =
      localSelectedStatuses.length === allStatusValues.length ? [] : allStatusValues;
    setLocalSelectedStatuses(newSelection);
  };

  const handleApplyFilters = () => {
    setSearchValue(inputValue);
    setSearchBy(selectedSearchBy);
    if (statusOptionsList.length && setSelectedStatuses) {
      setSelectedStatuses(localSelectedStatuses);
    }
    onSearch();
    setShowDrawer(false);
  };

  const handleSearch = () => {
    setSearchValue(inputValue);
    setSearchBy(selectedSearchBy);
    if (statusOptionsList.length && setSelectedStatuses) {
      setSelectedStatuses(localSelectedStatuses);
    }
    onSearch();
  };

  const handleClear = () => {
    setInputValue('');
    setSearchValue('');
    setSelectedSearchBy('');
    setSearchBy('');
    setLocalSelectedStatuses([]);
    if (statusOptionsList.length && setSelectedStatuses) {
      setSelectedStatuses([]);
    }
    onSearch();
  };

  const removeSearchByChip = () => {
    setSelectedSearchBy('');
    setSearchBy('');
    onSearch();
  };

  

  return (
    <View className="mb-4">
      {/* Search and Filter Bar */}


      <View className="mb-2  flex-row items-stretch gap-1 rounded-2xl border border-white/10 bg-zinc-700  p-0">
        <TouchableOpacity
          className="items-center justify-center rounded-xl border border-white/10 bg-white px-4 py-2"
          onPress={() => setShowDrawer(true)}>
          <Filter color="#9ca3af" size={20} />
        </TouchableOpacity>

        <CollapseDrawer2
          showDrawer={showDrawer}
          setShowDrawer={setShowDrawer}
          title="Search & Filter">
          <View className="p-5">
            <Text className="mb-3 text-xs font-semibold text-gray-400">SEARCH BY</Text>
            <View className="mb-6 gap-2">
              {searchOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  className={`flex-row items-center justify-between rounded-lg border p-4 ${
                    selectedSearchBy === option.id
                      ? 'border-white bg-white/10'
                      : 'border-white/10 bg-gray-800/60'
                  }`}
                  onPress={() => setSelectedSearchBy(option.id)}>
                  <Text
                    className={`text-sm font-semibold ${
                      selectedSearchBy === option.id ? 'text-white' : 'text-white'
                    }`}>
                    {option.label}
                  </Text>
                  {selectedSearchBy === option.id && (
                    <Text className="text-lg font-bold text-white">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {hasStatusFilters && (
              <>
                <Text className="mb-3 text-xs font-semibold text-gray-400">STATUS FILTER</Text>

                <TouchableOpacity
                  className="mb-2 flex-row items-center justify-between rounded-lg border border-white/10 bg-gray-800/60 p-4"
                  onPress={handleAllStatusToggle}>
                  <Text className="text-sm font-semibold text-white">
                    {localSelectedStatuses.length === 0
                      ? 'Select All Statuses'
                      : localSelectedStatuses.length === statusOptionsList.length
                        ? 'Deselect All'
                        : 'Select All Statuses'}
                  </Text>
                  {localSelectedStatuses.length === statusOptionsList.length && (
                    <Text className="text-lg font-bold text-green-500">✓</Text>
                  )}
                </TouchableOpacity>

                <View className="mb-6 gap-2">
                  {statusOptionsList.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      className={`flex-row items-center justify-between rounded-lg border p-4 ${
                        localSelectedStatuses.includes(option.id)
                          ? 'border-white/20'
                          : 'border-white/10 bg-gray-800/60'
                      }`}
                      style={{
                        backgroundColor: localSelectedStatuses.includes(option.id)
                          ? option.color + '20'
                          : undefined,
                      }}
                      onPress={() => handleStatusToggle(option.id)}>
                      <Text
                        className="text-sm font-semibold"
                        style={{
                          color: localSelectedStatuses.includes(option.id)
                            ? option.color
                            : '#ffffff',
                        }}>
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
              </>
            )}

            {(selectedSearchBy || localSelectedStatuses.length > 0) && (
              <TouchableOpacity
                className="mb-4 rounded-lg border border-red-500 bg-red-500/20 p-4"
                onPress={handleClear}>
                <Text className="text-center text-sm font-semibold text-red-500">
                  Clear All Filters
                </Text>
              </TouchableOpacity>
            )}

            <View className="flex-row gap-3 border-t border-white/10 pt-5">
              <TouchableOpacity
                className="flex-1 items-center rounded-lg border border-white/10 bg-gray-800/60 py-3.5"
                onPress={() => {
                  setLocalSelectedStatuses(selectedStatusesProp ?? []);
                  setSelectedSearchBy(searchBy);
                  setInputValue(searchValue);
                  setShowDrawer(false);
                }}>
                <Text className="text-base font-semibold text-white">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 items-center rounded-lg bg-blue-500 py-3.5"
                onPress={handleApplyFilters}>
                <Text className="text-base font-semibold text-white">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CollapseDrawer2>

        {/* Search Input */}
        <View className="flex-1 flex-row items-center rounded-xl border border-white/10 bg-black/30 px-3">
          <Search color="#9ca3af" size={18} />
          <TextInput
            className="ml-2 flex-1 text-base text-white"
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
          className="items-center justify-center rounded-xl bg-blue-500 px-4 py-2"
          onPress={handleSearch}>
          <Search color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>

      {/* Selected Filters Chips */}
      {(selectedSearchBy || (hasStatusFilters && localSelectedStatuses.length > 0)) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            {selectedSearchBy && (
              <View className="flex-row items-center gap-2 rounded-full border border-white bg-white/10 px-3 py-1">
                <Text className="text-xs font-semibold text-white">
                  Search: {selectedSearchBy}
                </Text>
                <TouchableOpacity onPress={removeSearchByChip}>
                  <X color="#ffffff" size={14} />
                </TouchableOpacity>
              </View>
            )}

            {hasStatusFilters &&
              localSelectedStatuses.map((status) => {
                const statusColor =
                  statusOptionsList.find((opt) => opt.id === status)?.color || '#6b7280';
                return (
                  <View
                    key={status}
                    className="flex-row items-center gap-2 rounded-full border px-3 py-1.5"
                    style={{
                      backgroundColor: statusColor + '20',
                      borderColor: statusColor,
                    }}>
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
