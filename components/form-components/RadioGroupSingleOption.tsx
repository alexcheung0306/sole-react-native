import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FormControl, FormControlLabel, FormControlLabelText, FormControlError, FormControlErrorText } from '@/components/ui/form-control';
import { getFieldError } from '@/lib/validations/form-field-validations';
import { paymentBasis, showBudgetTo, gender } from './options-to-use';

interface RadioGroupSingleOptionProps {
  values: any;
  warning?: boolean;
  touched: any;
  fieldname: string;
  label: string;
  options: 'paymentBasis' | 'showBudgetTo' | 'gender';
  tooltipContent?: string;
  isRequired?: boolean;
  validation?: (value: any) => string | null;
  setFieldTouched: (field: string, touched: boolean, shouldValidate?: boolean) => void;
  setFieldValue?: (field: string, value: any) => void;
}

export function RadioGroupSingleOption({
  values,
  warning = false,
  touched,
  fieldname,
  label,
  options,
  tooltipContent,
  isRequired = false,
  validation,
  setFieldTouched,
  setFieldValue,
}: RadioGroupSingleOptionProps) {
  const [localTouched, setLocalTouched] = useState(false);
  const value = values[fieldname] || '';

  const isFieldTouched = typeof touched === 'boolean' ? touched || localTouched : touched?.[fieldname] || localTouched;
  const error = isFieldTouched && validation ? validation(value) : null;
  const hasError = !!error;

  const optionsToUse =
    options === 'showBudgetTo' ? showBudgetTo : options === 'gender' ? gender : options === 'paymentBasis' ? paymentBasis : [];

  const handleSelect = (optionValue: string) => {
    if (setFieldValue) {
      setFieldValue(fieldname, optionValue);
    }
  };

  const handleBlur = () => {
    setLocalTouched(true);
    setFieldTouched(fieldname, true, false);
  };

  return (
    <FormControl isInvalid={hasError} isRequired={isRequired} className="mb-4">
      <View className="rounded-lg border border-white/10 bg-zinc-800/50 p-4">
        <FormControlLabel onPress={handleBlur}>
          <FormControlLabelText className="text-white">{label}</FormControlLabelText>
          {isRequired && <Text className="text-red-500">*</Text>}
        </FormControlLabel>
        <View className="mt-3 gap-2">
          {optionsToUse.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                handleSelect(option.value);
                handleBlur();
              }}
              className={`flex-row items-center rounded-lg border p-3 ${
                value === option.value ? 'border-blue-500 bg-blue-500/20' : 'border-white/10 bg-zinc-700/50'
              }`}>
              <View
                className={`mr-3 h-5 w-5 rounded-full border-2 ${
                  value === option.value ? 'border-blue-500 bg-blue-500' : 'border-white/30'
                }`}>
                {value === option.value && <View className="m-auto h-2 w-2 rounded-full bg-white" />}
              </View>
              <View className="flex-1">
                <Text className="text-white">{option.label}</Text>
                {option.tooltip && <Text className="mt-1 text-xs text-white/60">{option.tooltip}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {hasError && (
          <FormControlError>
            <FormControlErrorText className="text-red-400">{error}</FormControlErrorText>
          </FormControlError>
        )}
      </View>
    </FormControl>
  );
}

