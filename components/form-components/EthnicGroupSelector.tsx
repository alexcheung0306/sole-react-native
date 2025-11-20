import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { X, Check } from 'lucide-react-native';

interface EthnicGroupSelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedGroups: Set<string>;
  onSave: (groups: Set<string>) => void;
  maxSelections?: number;
}

const AVAILABLE_ETHNIC_GROUPS = [
  'African',
  'Asian',
  'European',
  'Indigenous Peoples',
  'Middle Eastern',
  'Pacific Islanders',
  'Latin American',
  'No Preference',
];

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

  const toggleGroup = (group: string) => {
    const newGroups = new Set(tempSelectedGroups);
    if (newGroups.has(group)) {
      // Remove group
      newGroups.delete(group);
    } else {
      // Add group (if not at max)
      if (newGroups.size < maxSelections) {
        newGroups.add(group);
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
        <View className="flex-row items-center justify-between px-4 pt-12 pb-3 border-b border-gray-800">
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white font-semibold text-lg">
            Select Ethnic Groups ({tempSelectedGroups.size}/{maxSelections})
          </Text>
          <TouchableOpacity onPress={handleSave} className="p-2">
            <Text className="text-gray-300 font-semibold">Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* Selected Count Warning */}
          {tempSelectedGroups.size >= maxSelections && (
            <View className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 mb-4">
              <Text className="text-yellow-500 text-sm">
                Maximum {maxSelections} groups allowed. Deselect one to choose another.
              </Text>
            </View>
          )}

          {/* Clear All Button */}
          {tempSelectedGroups.size > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4"
            >
              <Text className="text-red-400 text-center font-medium">Clear All</Text>
            </TouchableOpacity>
          )}

          {/* Group List */}
          <View className="gap-2">
            {AVAILABLE_ETHNIC_GROUPS.map((group) => {
              const isSelected = tempSelectedGroups.has(group);
              const isDisabled = !isSelected && tempSelectedGroups.size >= maxSelections;

              return (
                <TouchableOpacity
                  key={group}
                  onPress={() => !isDisabled && toggleGroup(group)}
                  disabled={isDisabled}
                  className={`flex-row items-center justify-between p-4 rounded-lg border ${
                    isSelected
                      ? 'bg-gray-500/20 border-gray-400'
                      : isDisabled
                      ? 'bg-zinc-900/50 border-white/10'
                      : 'bg-zinc-900/70 border-white/10'
                  }`}
                >
                  <Text
                    className={`text-base font-medium ${
                      isSelected
                        ? 'text-gray-300'
                        : isDisabled
                        ? 'text-gray-600'
                        : 'text-white'
                    }`}
                  >
                    {group}
                  </Text>
                  {isSelected && (
                    <View className="bg-gray-500 rounded-full p-1">
                      <Check size={16} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

