import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { CategorySelector } from '@/components/profile/CategorySelector';
import { X } from 'lucide-react-native';

interface CategoriesCardProps {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  selectedCategories: string[];
  setSelecedCategories: (categories: string[]) => void;
}

export function CategoriesCard({ values, setFieldValue, selectedCategories, setSelecedCategories }: CategoriesCardProps) {
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const handleSave = (categories: string[]) => {
    setSelecedCategories(categories);
    setFieldValue('category', categories.join(','));
    setShowCategorySelector(false);
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    const newCategories = selectedCategories.filter((c) => c !== categoryToRemove);
    setSelecedCategories(newCategories);
    setFieldValue('category', newCategories.join(','));
  };

  return (
    <FormControl className="mb-4">
      <FormControlLabel>
        <FormControlLabelText className="text-white">Categories</FormControlLabelText>
      </FormControlLabel>
      <View className="mt-3 rounded-lg border border-white/10 bg-zinc-800/50 p-4">
        {/* Selected Categories */}
        {selectedCategories.length > 0 && (
          <View className="mb-3 flex-row flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <View
                key={category}
                className="mb-2 flex-row items-center rounded-full border border-gray-400 bg-gray-500/20 px-3 py-1">
                <Text className="mr-1 text-xs text-gray-300">{category}</Text>
                <TouchableOpacity onPress={() => handleRemoveCategory(category)}>
                  <X size={14} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
          onPress={() => setShowCategorySelector(true)}
          className="items-center rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
          <Text className="font-medium text-gray-300">
            {selectedCategories.length === 0 ? 'Add Categories' : 'Edit Categories'}
          </Text>
        </TouchableOpacity>
      </View>
      <CategorySelector
        visible={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        selectedCategories={selectedCategories}
        onSave={handleSave}
        maxSelections={10}
      />
    </FormControl>
  );
}

