import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import DatePicker from 'react-native-date-picker';
import { parseDateTime, formatDateTime, formatDisplayDateTime } from '@/lib/datetime';
import { GlassOverlay } from '@/components/custom/GlassView';

interface DateTimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  errorMessagePrefix?: string; // e.g., "Application deadline" or "Payment date"
  defaultValue?: string; // Default value to use if value is empty (e.g., applicationDeadline)
  defaultDateLabel?: string; // Label to show when using default value
  error?: string;
  onErrorChange?: (error: string) => void;
  minimumDate?: Date;
  allowPastDates?: boolean; // If true, allows dates in the past (default: false)
  buttonClassName?: string; // Custom className for the button (optional)
}

export function DateTimePickerInput({
  value,
  onChange,
  label,
  placeholder = 'Select date and time',
  errorMessagePrefix = 'Date',
  defaultValue,
  defaultDateLabel,
  error: externalError,
  onErrorChange,
  minimumDate,
  allowPastDates = false,
  buttonClassName,
}: DateTimePickerInputProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pickerInitialDate, setPickerInitialDate] = useState<Date>(new Date());
  const [internalError, setInternalError] = useState<string>('');

  const error = externalError || internalError;
  const setError = (err: string) => {
    setInternalError(err);
    if (onErrorChange) {
      onErrorChange(err);
    }
  };

  const openDateTimePicker = () => {
    // Parse existing value or use defaultValue or tomorrow as default
    let initialDate = new Date();
    if (value) {
      const parsed = parseDateTime(value);
      if (parsed && !isNaN(parsed.getTime())) {
        initialDate = parsed;
      } else {
        initialDate.setDate(initialDate.getDate() + 1);
        initialDate.setHours(12, 0, 0, 0);
      }
    } else if (defaultValue) {
      const parsed = parseDateTime(defaultValue);
      if (parsed && !isNaN(parsed.getTime())) {
        initialDate = parsed;
      } else {
        initialDate.setDate(initialDate.getDate() + 1);
        initialDate.setHours(12, 0, 0, 0);
      }
    } else {
      initialDate.setDate(initialDate.getDate() + 1);
      initialDate.setHours(12, 0, 0, 0);
    }
    setPickerInitialDate(initialDate);
    setSelectedDate(null);
    setShowDatePicker(true);
    setError('');
  };

  const handleDateChange = (date: Date) => {
    setPickerInitialDate(date);
  };

  const handleDateConfirm = (selectedDateValue: Date) => {
    if (!allowPastDates) {
      // Validate that the date is not in the past (allow today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateOnly = new Date(selectedDateValue);
      selectedDateOnly.setHours(0, 0, 0, 0);
      
      if (selectedDateOnly < today) {
        setError(`${errorMessagePrefix} date cannot be in the past`);
        setShowDatePicker(false);
        setSelectedDate(null);
        return;
      }
    }

    // Store the selected date and move to time picker
    setSelectedDate(selectedDateValue);
    setPickerInitialDate(selectedDateValue);
    setShowDatePicker(false);
    setShowTimePicker(true);
    setError('');
  };

  const handleTimeConfirm = (selectedTime: Date) => {
    if (!selectedDate) return;

    // Combine the selected date with the selected time
    const finalDate = new Date(selectedDate);
    finalDate.setHours(selectedTime.getHours());
    finalDate.setMinutes(selectedTime.getMinutes());
    finalDate.setSeconds(selectedTime.getSeconds());

    if (!allowPastDates) {
      // Validate that the complete date/time is in the future
      const now = new Date();
      if (finalDate <= now) {
        setError(`${errorMessagePrefix} must be in the future`);
        setShowTimePicker(false);
        setSelectedDate(null);
        return;
      }
    }
    
    const formatted = formatDateTime(finalDate);
    onChange(formatted);
    setError('');
    setShowTimePicker(false);
    setSelectedDate(null);
  };

  const handlePickerCancel = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    setSelectedDate(null);
  };

  const displayValue = value || (defaultValue && defaultDateLabel ? defaultDateLabel : '');
  const displayText = value
    ? formatDisplayDateTime(value, placeholder)
    : defaultValue && defaultDateLabel
    ? defaultDateLabel
    : placeholder;

  const minDate = minimumDate || (allowPastDates ? undefined : (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  })());

  // Determine border radius from buttonClassName or use default
  const borderRadius = buttonClassName?.includes('rounded-2xl') ? 16 : buttonClassName?.includes('rounded-xl') ? 12 : 16;

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-white">{label}</Text>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={openDateTimePicker}
        style={{ overflow: 'hidden' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)',
            backgroundColor: 'transparent',
            padding: 12,
            position: 'relative',
            overflow: 'hidden',
          }}
          className={buttonClassName}>
          <GlassOverlay intensity={80} tint="dark" darkOverlayOpacity={0.4} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 1 }}>
            <Calendar size={16} color="#ffffff" />
            <Text style={{ color: '#ffffff' }}>{displayText}</Text>
          </View>
          <View style={{ zIndex: 1 }}>
            <Clock size={16} color="#ffffff" />
          </View>
        </View>
      </TouchableOpacity>
      {error !== '' && (
        <Text className="text-xs text-red-400">{error}</Text>
      )}
      {!error && value && (
        <Text className="text-xs text-white/60">
          Selected: {formatDisplayDateTime(value)}
        </Text>
      )}
      {!error && !value && defaultValue && defaultDateLabel && (
        <Text className="text-xs text-white/60">
          Default: {defaultDateLabel}
        </Text>
      )}

      {/* Date Picker - Step 1: Select Date */}
      <DatePicker
        modal
        open={showDatePicker}
        date={pickerInitialDate}
        mode="date"
        minimumDate={minDate}
        onConfirm={handleDateConfirm}
        onCancel={handlePickerCancel}
        onDateChange={handleDateChange}
        theme="dark"
        locale="en"
        title={`Select ${label}`}
      />

      {/* Time Picker - Step 2: Select Time */}
      <DatePicker
        modal
        open={showTimePicker}
        date={pickerInitialDate}
        mode="time"
        onConfirm={handleTimeConfirm}
        onCancel={handlePickerCancel}
        onDateChange={handleDateChange}
        minuteInterval={5}
        theme="dark"
        locale="en"
        title={`Select ${label} Time`}
      />
    </View>
  );
}

