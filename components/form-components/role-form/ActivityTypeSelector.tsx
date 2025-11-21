import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { activityTypes } from '../options-to-use';

interface ActivityTypeSelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedItem: string | null; // This will be the label, but we need to work with keys internally
  onSave: (item: string | null) => void; // This should receive the key
  availableTypes?: typeof activityTypes;
  onSaveKey?: (key: string | null) => void; // Alternative callback that receives the key directly
}

export function ActivityTypeSelector({
  visible,
  onClose,
  selectedItem,
  onSave,
  availableTypes = activityTypes,
  onSaveKey,
}: ActivityTypeSelectorProps) {
  // Convert selectedItem (label) to key for internal state
  const selectedKey = selectedItem ? availableTypes.find((t) => t.label === selectedItem)?.key || null : null;
  const [tempSelectedKey, setTempSelectedKey] = useState<string | null>(selectedKey);

  // Reset temp selection when modal opens
  React.useEffect(() => {
    if (visible) {
      const key = selectedItem ? availableTypes.find((t) => t.label === selectedItem)?.key || null : null;
      setTempSelectedKey(key);
    }
  }, [visible, selectedItem, availableTypes]);

  const handleSelect = (typeKey: string) => {
    // Toggle selection - if already selected, deselect
    setTempSelectedKey(tempSelectedKey === typeKey ? null : typeKey);
  };

  const handleSave = () => {
    if (onSaveKey) {
      // Use the key-based callback if provided
      onSaveKey(tempSelectedKey);
    } else {
      // Otherwise, convert key to label for backward compatibility
      const label = tempSelectedKey ? availableTypes.find((t) => t.key === tempSelectedKey)?.label || null : null;
      onSave(label);
    }
  };

  const handleClear = () => {
    setTempSelectedKey(null);
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
            Select Activity Type
          </Text>
          <TouchableOpacity 
            onPress={handleSave} 
            className="p-2"
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text className="text-gray-300 font-semibold">Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* Clear Button */}
          {tempSelectedKey && (
            <TouchableOpacity
              onPress={handleClear}
              className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4"
            >
              <Text className="text-red-400 text-center font-medium">Clear Selection</Text>
            </TouchableOpacity>
          )}

          {/* Type List */}
          <View className="gap-2">
            {availableTypes.map((type) => {
              const isSelected = tempSelectedKey === type.key;

              return (
                <TouchableOpacity
                  key={type.key}
                  onPress={() => handleSelect(type.key)}
                  className={`flex-row items-center justify-between p-4 rounded-lg border ${
                    isSelected
                      ? 'bg-gray-500/20 border-gray-400'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <View className="flex-1">
                    <Text
                      className={`text-base font-medium ${
                        isSelected ? 'text-gray-300' : 'text-white'
                      }`}
                    >
                      {type.label}
                    </Text>
                    {type.description && (
                      <Text className="text-sm text-gray-400 mt-1">
                        {type.description}
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <View className="bg-gray-500 rounded-full p-1 ml-3">
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

