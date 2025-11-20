import React from 'react';
import { View, Text } from 'react-native';
import { Checkbox, CheckboxIndicator, CheckboxIcon, CheckboxLabel } from '@/components/ui/checkbox';
import { Check } from 'lucide-react-native';

interface SingleCheckboxProps {
  fieldname: string;
  values: any;
  content: string;
  tooltip?: string;
  setFieldValue?: (field: string, value: boolean) => void;
}

export function SingleCheckbox({ fieldname, values, content, tooltip, setFieldValue }: SingleCheckboxProps) {
  const isChecked = values[fieldname] || false;

  const handleToggle = () => {
    if (setFieldValue) {
      setFieldValue(fieldname, !isChecked);
    }
  };

  return (
    <View className="mb-3 flex-row items-center">
      <Checkbox value={fieldname} isChecked={isChecked} onChange={handleToggle}>
        <CheckboxIndicator>
          <CheckboxIcon as={Check} />
        </CheckboxIndicator>
        <CheckboxLabel className="ml-2 text-white data-[checked=true]:text-white">{content}</CheckboxLabel>
      </Checkbox>
      {tooltip && (
        <View className="ml-2">
          <Text className="text-xs text-white/60">(?)</Text>
        </View>
      )}
    </View>
  );
}

