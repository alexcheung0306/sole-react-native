import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { EthnicGroupSelector } from '@/components/form-components/EthnicGroupSelector';
import { X } from 'lucide-react-native';

interface DropDownMultiSelectProps {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  ethnic: Set<string>;
  setEthnic: (ethnic: Set<string>) => void;
}

export function DropDownMultiSelect({ values, setFieldValue, ethnic, setEthnic }: DropDownMultiSelectProps) {
  const [showEthnicSelector, setShowEthnicSelector] = useState(false);

  const handleSave = (groups: Set<string>) => {
    setEthnic(groups);
    setFieldValue('requiredEthnicGroup', Array.from(groups).join(',') || 'No Preference');
    setShowEthnicSelector(false);
  };

  const handleRemoveGroup = (groupToRemove: string) => {
    const newGroups = new Set(ethnic);
    newGroups.delete(groupToRemove);
    setEthnic(newGroups);
    setFieldValue('requiredEthnicGroup', Array.from(newGroups).join(',') || 'No Preference');
  };

  return (
    <FormControl className="mb-4">
      <FormControlLabel>
        <FormControlLabelText className="text-white">Ethnic Groups</FormControlLabelText>
      </FormControlLabel>
      <View className="mt-3 rounded-lg border border-white/10 bg-zinc-800/50 p-4">
        {/* Selected Groups */}
        {ethnic.size > 0 && (
          <View className="mb-3 flex-row flex-wrap gap-2">
            {Array.from(ethnic).map((group) => (
              <View
                key={group}
                className="mb-2 flex-row items-center rounded-full border border-gray-400 bg-gray-500/20 px-3 py-1">
                <Text className="mr-1 text-xs text-gray-300">{group}</Text>
                <TouchableOpacity onPress={() => handleRemoveGroup(group)}>
                  <X size={14} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
          onPress={() => setShowEthnicSelector(true)}
          className="items-center rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
          <Text className="font-medium text-gray-300">
            {ethnic.size === 0 ? 'Add Ethnic Groups' : 'Edit Ethnic Groups'}
          </Text>
        </TouchableOpacity>
      </View>
      <EthnicGroupSelector
        visible={showEthnicSelector}
        onClose={() => setShowEthnicSelector(false)}
        selectedGroups={ethnic}
        onSave={handleSave}
        maxSelections={10}
      />
    </FormControl>
  );
}

