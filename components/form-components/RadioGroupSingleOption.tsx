import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from '@/components/ui/form-control';
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

  const isFieldTouched =
    typeof touched === 'boolean' ? touched || localTouched : touched?.[fieldname] || localTouched;
  const error = isFieldTouched && validation ? validation(value) : null;
  const hasError = !!error;

  const optionsToUse =
    options === 'showBudgetTo'
      ? showBudgetTo
      : options === 'gender'
        ? gender
        : options === 'paymentBasis'
          ? paymentBasis
          : [];

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
      <View className="rounded-lg border border-white/10 bg-zinc-800  p-4">
        <TouchableOpacity onPress={handleBlur}>
          <Text className="text-white">{label}</Text>
          {isRequired && <Text className="text-red-500">*</Text>}
        </TouchableOpacity>
        
        <View className="mt-3 gap-2">
          {optionsToUse.map((option, index) => (

             // option container
              <TouchableOpacity
                key={index}
                onPress={() => {
                  handleSelect(option.value);
                  handleBlur();
                }}
                activeOpacity={0.85}
                className={`flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
                  value === option.value
                    ? 'border-white bg-white/10'
                    : 'border-white/10 bg-white/5'
                }`}>
               {/* label and tooltip */}
               <View className="flex-1">
                 <Text className="text-sm font-semibold text-white">{option.label}</Text>
                 {option.tooltip && (
                   <Text className="mt-1 text-xs text-white/60">{option.tooltip}</Text>
                 )}
               </View>
               
               {/* checkmark indicator */}
               {value === option.value && (
                 <View className="rounded-full bg-blue-500/20 p-1">
                   <Text className="text-sm font-bold text-blue-300">✓</Text>
                 </View>
               )}
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
