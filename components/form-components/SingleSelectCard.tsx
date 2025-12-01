import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { X } from 'lucide-react-native';

interface SingleSelectCardProps {
  label: string;
  selectedItem: string | null;
  onItemChange: (item: string | null) => void;
  fieldName: string;
  setFieldValue: (field: string, value: string) => void;
  selectorComponent: React.ComponentType<any>;
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
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setShowSelector(true)}
        className="mt-3 flex-row items-center justify-between rounded-2xl border border-white bg-white/10 px-4 py-3">
        <Text className={`flex-1 text-sm font-semibold ${hasItem ? 'text-white' : 'text-gray-400'}`}>
          {displayText}
        </Text>
        {hasItem && (
          <TouchableOpacity
            onPress={handleRemove}
            activeOpacity={0.85}
            className="ml-2">
            <X size={16} color="#ffffff" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
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

