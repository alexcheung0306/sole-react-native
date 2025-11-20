import React from 'react';
import { View, Text } from 'react-native';
import { Input, InputField } from '@/components/ui/input';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Slider } from '@/components/ui/slider';

interface RangeInputProps {
  title: string;
  values: any;
  setFieldValue: (field: string, value: any) => void;
  minDefaultValue?: string;
  maxDefaultValue?: string;
  rangeName: string;
  rangeMinName: string;
  rangeMaxName: string;
  maxDigits?: number;
  sliderLabel: string;
  sliderStep?: number;
  sliderMin?: number;
  sliderMax?: number;
}

export function RangeInput({
  title,
  values,
  setFieldValue,
  minDefaultValue = '15',
  maxDefaultValue = '30',
  rangeMinName,
  rangeMaxName,
  sliderLabel,
  sliderStep = 1,
  sliderMin = 1,
  sliderMax = 99,
}: RangeInputProps) {
  const minValue = values[rangeMinName] !== undefined && values[rangeMinName] !== null ? Number(values[rangeMinName]) : Number(minDefaultValue);
  const maxValue = values[rangeMaxName] !== undefined && values[rangeMaxName] !== null ? Number(values[rangeMaxName]) : Number(maxDefaultValue);

  const handleMinChange = (text: string) => {
    const num = Number(text.replace(/[^0-9]/g, ''));
    if (!isNaN(num) && num >= sliderMin && num <= sliderMax) {
      setFieldValue(rangeMinName, num);
    }
  };

  const handleMaxChange = (text: string) => {
    const num = Number(text.replace(/[^0-9]/g, ''));
    if (!isNaN(num) && num >= sliderMin && num <= sliderMax) {
      setFieldValue(rangeMaxName, num);
    }
  };

  return (
    <FormControl className="mb-4">
      <FormControlLabel>
        <FormControlLabelText className="text-white">{title}</FormControlLabelText>
      </FormControlLabel>
      <View className="mt-3 gap-4 rounded-lg border border-white/10 bg-zinc-800/50 p-4">
        <View className="flex-row items-center gap-4">
          <View className="flex-1">
            <Text className="mb-2 text-sm text-white/80">Min</Text>
            <Input className="border-white/20 bg-zinc-700">
              <InputField
                value={String(minValue)}
                onChangeText={handleMinChange}
                placeholder="Min"
                keyboardType="numeric"
                className="text-white"
              />
            </Input>
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-sm text-white/80">Max</Text>
            <Input className="border-white/20 bg-zinc-700">
              <InputField
                value={String(maxValue)}
                onChangeText={handleMaxChange}
                placeholder="Max"
                keyboardType="numeric"
                className="text-white"
              />
            </Input>
          </View>
        </View>
        <View>
          <Text className="mb-2 text-sm text-white/80">{sliderLabel}</Text>
          <Text className="mb-2 text-xs text-white/60">
            {minValue} - {maxValue}
          </Text>
        </View>
      </View>
    </FormControl>
  );
}

