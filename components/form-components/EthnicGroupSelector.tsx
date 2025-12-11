import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { ethnicGroups } from './options-to-use';

interface EthnicGroupSelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedGroups: Set<string>;
  onSave: (groups: Set<string>) => void;
  maxSelections?: number;
}

export function EthnicGroupSelector({
  visible,
  onClose,
  selectedGroups,
  onSave,
  maxSelections = 10,
}: EthnicGroupSelectorProps) {
  const [tempSelectedGroups, setTempSelectedGroups] = useState<Set<string>>(new Set(selectedGroups));

  // Reset temp selection when modal opens
  React.useEffect(() => {
    if (visible) {
      setTempSelectedGroups(new Set(selectedGroups));
    }
  }, [visible, selectedGroups]);

  const toggleGroup = (groupLabel: string) => {
    const newGroups = new Set(tempSelectedGroups);
    if (groupLabel === 'No Preference') {
      // If "No Preference" is selected, clear all and add only "No Preference"
      // If it's already selected, clear it
      if (newGroups.has('No Preference')) {
        newGroups.clear();
      } else {
        newGroups.clear();
        newGroups.add('No Preference');
      }
    } else {
      // If selecting a regular group, remove "No Preference" if it exists
      if (newGroups.has('No Preference')) {
        newGroups.clear();
      }
      
      if (newGroups.has(groupLabel)) {
        // Remove group
        newGroups.delete(groupLabel);
      } else {
        // Add group (if not at max)
        if (newGroups.size < maxSelections) {
          newGroups.add(groupLabel);
        }
      }
    }
    setTempSelectedGroups(newGroups);
  };

  const handleSave = () => {
    onSave(tempSelectedGroups);
  };

  const handleClearAll = () => {
    setTempSelectedGroups(new Set());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-800 px-4 pb-3 pt-12">
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-white">
            Select Ethnic Groups ({tempSelectedGroups.size}/{maxSelections})
          </Text>
          <TouchableOpacity onPress={handleSave} className="p-2">
            <Text className="font-semibold text-gray-300">Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* Selected Count Warning */}
          {tempSelectedGroups.size >= maxSelections && (
            <View className="mb-4 rounded-lg border border-yellow-500 bg-yellow-500/20 p-3">
              <Text className="text-sm text-yellow-500">
                Maximum {maxSelections} groups allowed. Deselect one to choose another.
              </Text>
            </View>
          )}

          {/* Clear All Button */}
          {tempSelectedGroups.size > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              className="mb-4 rounded-lg border border-red-500 bg-red-500/20 p-3">
              <Text className="text-center font-medium text-red-400">Clear All</Text>
            </TouchableOpacity>
          )}

          {/* No Preference Option */}
          <View className="mb-6">
            <View className="gap-2">
              <TouchableOpacity
                onPress={() => toggleGroup('No Preference')}
                activeOpacity={1}
                className="flex-row items-center justify-between rounded-lg border border-white/10 bg-zinc-900/70 p-4">
                <Text className="text-base font-medium text-white">No Preference</Text>
                {tempSelectedGroups.has('No Preference') && (
                  <View className="rounded-full bg-gray-500 p-1">
                    <Check size={16} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Ethnic Groups by Category */}
          {ethnicGroups.map((category) => (
            <View key={category.category} className="mb-6">
              <Text className="mb-3 text-lg font-semibold text-white">{category.category}</Text>
              <View className="gap-2">
                {category.groups.map((group) => {
                  const isSelected = tempSelectedGroups.has(group.label);
                  const hasNoPreference = tempSelectedGroups.has('No Preference');
                  const isDisabled = hasNoPreference || (!isSelected && tempSelectedGroups.size >= maxSelections);

                  return (
                    <TouchableOpacity
                      key={group.key}
                      onPress={() => !isDisabled && toggleGroup(group.label)}
                      disabled={isDisabled}
                      activeOpacity={1}
                      className={`flex-row items-center justify-between rounded-lg border p-4 ${
                        isDisabled
                          ? 'border-white/10 bg-zinc-900/50'
                          : 'border-white/10 bg-zinc-900/70'
                      }`}>
                      <Text
                        className={`text-base font-medium ${
                          isDisabled ? 'text-gray-600' : 'text-white'
                        }`}>
                        {group.label}
                      </Text>
                      {isSelected && (
                        <View className="rounded-full bg-gray-500 p-1">
                          <Check size={16} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

