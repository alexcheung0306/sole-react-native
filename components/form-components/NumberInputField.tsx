import React from 'react';
import { View, Text } from 'react-native';
import { Input, InputField } from '@/components/ui/input';
import { FormControl, FormControlLabel, FormControlLabelText, FormControlError, FormControlErrorText } from '@/components/ui/form-control';
import { validateNumberField } from '@/lib/validations/form-field-validations';

interface NumberInputFieldProps {
  fieldname: string;
  label: string;
  setFieldValue: (field: string, value: any) => void;
  setFieldTouched: (field: string, touched: boolean, shouldValidate?: boolean) => void;
  touched?: boolean;
  isRequired?: boolean;
  data: any;
  maximum?: number;
  minimum?: number;
}

export function NumberInputField({
  fieldname,
  label,
  setFieldValue,
  setFieldTouched,
  touched = false,
  isRequired = false,
  data,
  maximum,
  minimum = 1,
}: NumberInputFieldProps) {
  const value = data[fieldname] !== undefined && data[fieldname] !== null ? String(data[fieldname]) : '';
  const error = touched ? validateNumberField(value, label) : null;
  const hasError = !!error;

  const handleChange = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue === '') {
      setFieldValue(fieldname, '');
      return;
    }
    const num = Number(numericValue);
    if (maximum && num > maximum) {
      setFieldValue(fieldname, maximum);
    } else if (minimum && num < minimum) {
      setFieldValue(fieldname, minimum);
    } else {
      setFieldValue(fieldname, num);
    }
  };

  const handleBlur = () => {
    setFieldTouched(fieldname, true, true);
  };

  return (
    <FormControl isInvalid={hasError} isRequired={isRequired} className="mb-4">
      <FormControlLabel>
        <FormControlLabelText className="text-white">{label}</FormControlLabelText>
        {isRequired && <Text className="text-red-500">*</Text>}
      </FormControlLabel>
      <Input className="border-white/20 bg-zinc-800">
        <InputField
          value={value}
          onChangeText={handleChange}
          onBlur={handleBlur}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#6b7280"
          keyboardType="numeric"
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

