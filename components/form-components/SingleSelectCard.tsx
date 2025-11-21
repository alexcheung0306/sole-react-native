import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { PrimaryButton } from '@/components/custom/primary-button';
import { X } from 'lucide-react-native';

interface SingleSelectCardProps {
  label: string;
  selectedItem: string | null;
  onItemChange: (item: string | null) => void;
  fieldName: string;
  setFieldValue: (field: string, value: string) => void;
  selectorComponent: React.ComponentType<any>;
  buttonText?: string;
  placeholder?: string;
  selectorProps?: Record<string, any>;
}

export function SingleSelectCard({
  label,
  selectedItem,
  onItemChange,
  fieldName,
  setFieldValue,
  selectorComponent: SelectorComponent,
  buttonText,
  placeholder = 'Select',
  selectorProps = {},
}: SingleSelectCardProps) {
  const [showSelector, setShowSelector] = useState(false);

  // Extract onSaveKey from selectorProps if it exists
  const { onSaveKey: onSaveKeyProp, availableTypes, ...restSelectorProps } = selectorProps;

  const handleSave = (item: string | null) => {
    onItemChange(item);
    setFieldValue(fieldName, item || '');
    setShowSelector(false);
  };

  // Handle onSaveKey callback if provided (for ActivityTypeSelector)
  const handleSaveKey = onSaveKeyProp ? (key: string | null) => {
    onSaveKeyProp(key);
    setShowSelector(false);
    // Also update the displayed item if we have the key
    if (key && availableTypes) {
      const label = availableTypes.find((t: any) => t.key === key)?.label;
      if (label) {
        onItemChange(label);
      }
    } else if (!key) {
      onItemChange(null);
    }
  } : undefined;

  const handleRemove = () => {
    onItemChange(null);
    setFieldValue(fieldName, '');
  };

  const displayText = selectedItem || placeholder;
  const hasItem = !!selectedItem;

  return (
    <FormControl className="mb-4">
      <FormControlLabel>
        <FormControlLabelText className="text-white">{label}</FormControlLabelText>
      </FormControlLabel>
      <View className="mt-3 rounded-lg border border-white/10 bg-zinc-800/50 p-4">
        {/* Selected Item */}
        {hasItem && (
          <View className="mb-3 flex-row items-center justify-between rounded-lg border border-gray-400 bg-gray-500/20 px-3 py-2">
            <Text className="text-sm text-gray-300">{selectedItem}</Text>
            <TouchableOpacity onPress={handleRemove}>
              <X size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        )}
        <PrimaryButton
          variant="primary"
          onPress={() => setShowSelector(true)}
          className="w-full">
          {buttonText || (hasItem ? `Change ${label}` : `Select ${label}`)}
        </PrimaryButton>
      </View>
      <SelectorComponent
        visible={showSelector}
        onClose={() => setShowSelector(false)}
        selectedItem={selectedItem}
        onSave={handleSave}
        {...(handleSaveKey ? { onSaveKey: handleSaveKey } : {})}
        {...(availableTypes ? { availableTypes } : {})}
        {...restSelectorProps}
      />
    </FormControl>
  );
}

