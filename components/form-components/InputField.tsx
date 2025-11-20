import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Input, InputField as UIInputField } from '@/components/ui/input';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { FormControl, FormControlLabel, FormControlLabelText, FormControlError, FormControlErrorText } from '@/components/ui/form-control';
import { Info } from 'lucide-react-native';

interface InputFieldProps {
  inputtype?: 'input' | 'textarea';
  fieldname: string;
  isRequired?: boolean;
  label: string;
  data: any;
  tooltip?: string;
  touched?: boolean;
  validation?: (value: any) => string | null;
  warning?: boolean;
  setFieldTouched: (field: string, touched: boolean, shouldValidate?: boolean) => void;
  setFieldValue?: (field: string, value: any) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
}

export function InputField({
  inputtype = 'input',
  fieldname,
  isRequired = false,
  label,
  data,
  tooltip,
  touched = false,
  validation,
  warning = false,
  setFieldTouched,
  setFieldValue,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 4,
}: InputFieldProps) {
  const value = data[fieldname] || '';
  const error = touched && validation ? validation(value) : null;
  const hasError = !!error;

  const handleChange = (text: string) => {
    if (setFieldValue) {
      setFieldValue(fieldname, text);
    }
  };

  const handleBlur = () => {
    setFieldTouched(fieldname, true, true);
  };

  if (inputtype === 'textarea') {
    return (
      <FormControl isInvalid={hasError} isRequired={isRequired} className="mb-4">
        <FormControlLabel>
          <View className="flex-row items-center gap-2">
            <FormControlLabelText className="text-white">{label}</FormControlLabelText>
            {tooltip && (
              <TouchableOpacity>
                <Info size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
            {isRequired && <Text className="text-red-500">*</Text>}
          </View>
        </FormControlLabel>
        <Textarea className="border-white/20 bg-zinc-800">
          <TextareaInput
            value={value}
            onChangeText={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={numberOfLines}
            editable={true}
            className="text-white"
            style={{ textAlignVertical: 'top', color: '#ffffff' }}
          />
        </Textarea>
        {hasError && (
          <FormControlError>
            <FormControlErrorText className="text-red-400">{error}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>
    );
  }

  return (
    <FormControl isInvalid={hasError} isRequired={isRequired} className="mb-4">
      <FormControlLabel>
        <View className="flex-row items-center gap-2">
          <FormControlLabelText className="text-white">{label}</FormControlLabelText>
          {tooltip && (
            <TouchableOpacity>
              <Info size={16} color="#6b7280" />
            </TouchableOpacity>
          )}
          {isRequired && <Text className="text-red-500">*</Text>}
        </View>
      </FormControlLabel>
      <Input className="border-white/20 bg-zinc-800">
        <UIInputField
          value={value}
          onChangeText={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          placeholderTextColor="#6b7280"
          keyboardType={keyboardType}
          className="text-white"
        />
      </Input>
      {hasError && (
        <FormControlError>
          <FormControlErrorText className="text-red-400">{error}</FormControlErrorText>
        </FormControlError>
      )}
    </FormControl>
  );
}

