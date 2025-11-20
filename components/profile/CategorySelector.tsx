import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { X, Check } from 'lucide-react-native';

interface CategorySelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedCategories: string[];
  onSave: (categories: string[]) => void;
  maxSelections?: number;
}

const AVAILABLE_CATEGORIES = [
  'Actor',
  'Model',
  'Photographer',
  'Director',
  'Producer',
  'Cinematographer',
  'Editor',
  'Makeup Artist',
  'Stylist',
  'Choreographer',
  'Writer',
  'Production Designer',
  'Costume Designer',
  'Sound Engineer',
  'Composer',
];

export function CategorySelector({
  visible,
  onClose,
  selectedCategories,
  onSave,
  maxSelections = 5,
}: CategorySelectorProps) {
  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>(selectedCategories);

  // Reset temp selection when modal opens
  React.useEffect(() => {
    if (visible) {
      setTempSelectedCategories(selectedCategories);
    }
  }, [visible, selectedCategories]);

  const toggleCategory = (category: string) => {
    if (tempSelectedCategories.includes(category)) {
      // Remove category
      setTempSelectedCategories(tempSelectedCategories.filter((c) => c !== category));
    } else {
      // Add category (if not at max)
      if (tempSelectedCategories.length < maxSelections) {
        setTempSelectedCategories([...tempSelectedCategories, category]);
      }
    }
  };

  const handleSave = () => {
    onSave(tempSelectedCategories);
  };

  const handleClearAll = () => {
    setTempSelectedCategories([]);
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
            Select Categories ({tempSelectedCategories.length}/{maxSelections})
          </Text>
          <TouchableOpacity onPress={handleSave} className="p-2">
            <Text className="text-gray-300 font-semibold">Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* Selected Count Warning */}
          {tempSelectedCategories.length >= maxSelections && (
            <View className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 mb-4">
              <Text className="text-yellow-500 text-sm">
                Maximum {maxSelections} categories allowed. Deselect one to choose another.
              </Text>
            </View>
          )}

          {/* Clear All Button */}
          {tempSelectedCategories.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4"
            >
              <Text className="text-red-400 text-center font-medium">Clear All</Text>
            </TouchableOpacity>
          )}

          {/* Category List */}
          <View className="gap-2">
            {AVAILABLE_CATEGORIES.map((category) => {
              const isSelected = tempSelectedCategories.includes(category);
              const isDisabled = !isSelected && tempSelectedCategories.length >= maxSelections;

              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => !isDisabled && toggleCategory(category)}
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
                    {category}
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

