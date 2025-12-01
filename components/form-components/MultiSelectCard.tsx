import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { PrimaryButton } from '@/components/custom/primary-button';
import { X } from 'lucide-react-native';

interface MultiSelectCardProps {
  label: string;
  selectedItems: string[] | Set<string>;
  onItemsChange: (items: string[] | Set<string>) => void;
  fieldName: string;
  setFieldValue: (field: string, value: string) => void;
  selectorComponent: React.ComponentType<any>;
  addButtonText?: string;
  editButtonText?: string;
  maxSelections?: number;
  emptyValue?: string;
  selectorProps?: Record<string, any>;
}

export function MultiSelectCard({
  label,
  selectedItems,
  onItemsChange,
  fieldName,
  setFieldValue,
  selectorComponent: SelectorComponent,
  addButtonText,
  editButtonText,
  maxSelections = 10,
  emptyValue,
  selectorProps = {},
}: MultiSelectCardProps) {
  const [showSelector, setShowSelector] = useState(false);

  // Normalize to array for display
  const itemsArray = Array.isArray(selectedItems) ? selectedItems : Array.from(selectedItems);
  const hasItems = itemsArray.length > 0;

  const handleSave = (items: string[] | Set<string>) => {
    onItemsChange(items);
    const valueString = Array.isArray(items) ? items.join(',') : Array.from(items).join(',') || emptyValue || '';
    setFieldValue(fieldName, valueString);
    setShowSelector(false);
  };

  const handleRemove = (itemToRemove: string) => {
    if (Array.isArray(selectedItems)) {
      const newItems = selectedItems.filter((item) => item !== itemToRemove);
      onItemsChange(newItems);
      setFieldValue(fieldName, newItems.join(','));
    } else {
      const newItems = new Set(selectedItems);
      newItems.delete(itemToRemove);
      onItemsChange(newItems);
      setFieldValue(fieldName, Array.from(newItems).join(',') || emptyValue || '');
    }
  };

  const buttonText = hasItems
    ? editButtonText || `Edit ${label}`
    : addButtonText || `Add ${label}`;

  // Determine which prop names to use based on the type of selectedItems
  // If it's an array, use selectedCategories (for CategorySelector)
  // If it's a Set, use selectedGroups (for EthnicGroupSelector)
  const isArray = Array.isArray(selectedItems);
  const selectorPropsToPass = isArray
    ? { selectedCategories: selectedItems as string[] }
    : { selectedGroups: selectedItems as Set<string> };

  return (
    <FormControl className="mb-4">
      <FormControlLabel>
        <FormControlLabelText className="text-white">{label}</FormControlLabelText>
      </FormControlLabel>
      <View className="mt-3 rounded-lg border border-white/10 bg-zinc-800/50 p-4">
        {/* Selected Items */}
        {hasItems && (
          <View className="mb-3 flex-row flex-wrap gap-2">
            {itemsArray.map((item) => (
              <View
                key={item}
                className="mb-2 flex-row items-center gap-2 rounded-full border border-white bg-white/10 px-3 py-1.5">
                <Text className="text-xs font-semibold text-white">{item}</Text>
                <TouchableOpacity onPress={() => handleRemove(item)} activeOpacity={0.85}>
                  <X size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <PrimaryButton
          variant="primary"
          onPress={() => setShowSelector(true)}
          className="w-full">
          {buttonText}
        </PrimaryButton>
      </View>
      <SelectorComponent
        visible={showSelector}
        onClose={() => setShowSelector(false)}
        {...selectorPropsToPass}
        onSave={handleSave}
        maxSelections={maxSelections}
        {...selectorProps}
      />
    </FormControl>
  );
}

