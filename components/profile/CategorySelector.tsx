import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { talentCategory } from '@/components/form-components/options-to-use';

interface CategorySelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedCategories: string[];
  onSave: (categories: string[]) => void;
  maxSelections?: number;
}

export function CategorySelector({
  visible,
  onClose,
  selectedCategories,
  onSave,
  maxSelections = 5,
}: CategorySelectorProps) {
  const [tempSelectedCategories, setTempSelectedCategories] =
    useState<string[]>(selectedCategories);

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
      onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-800 px-4 pb-3 pt-12">
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-white">
            Select Categories ({tempSelectedCategories.length}/{maxSelections})
          </Text>
          <TouchableOpacity onPress={handleSave} className="p-2">
            <Text className="font-semibold text-gray-300">Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* Selected Count Warning */}
          {tempSelectedCategories.length >= maxSelections && (
            <View className="mb-4 rounded-lg border border-yellow-500 bg-yellow-500/20 p-3">
              <Text className="text-sm text-yellow-500">
                Maximum {maxSelections} categories allowed. Deselect one to choose another.
              </Text>
            </View>
          )}

          {/* Clear All Button */}
          {tempSelectedCategories.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              className="mb-4 rounded-lg border border-red-500 bg-red-500/20 p-3">
              <Text className="text-center font-medium text-red-400">Clear All</Text>
            </TouchableOpacity>
          )}

          {/* Front Of Camera Personnel Section */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-white">Front Of Camera Personnel</Text>
            <View className="gap-2">
              {talentCategory.frontOfCameraPersonnel.map((category) => {
                const isSelected = tempSelectedCategories.includes(category.label);
                const isDisabled = !isSelected && tempSelectedCategories.length >= maxSelections;

                return (
                  <TouchableOpacity
                    key={category.key}
                    onPress={() => !isDisabled && toggleCategory(category.label)}
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
                      {category.label}
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

          {/* Behind The Scenes Personnel Section */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-white">
              Behind The Scenes Personnel
            </Text>
            <View className="gap-2">
              {talentCategory.behindTheScenesPersonnel.map((category) => {
                const isSelected = tempSelectedCategories.includes(category.label);
                const isDisabled = !isSelected && tempSelectedCategories.length >= maxSelections;

                return (
                  <TouchableOpacity
                    key={category.key}
                    onPress={() => !isDisabled && toggleCategory(category.label)}
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
                      {category.label}
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
        </ScrollView>
      </View>
    </Modal>
  );
}
