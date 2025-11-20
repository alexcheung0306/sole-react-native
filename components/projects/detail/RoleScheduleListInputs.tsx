import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Modal, Pressable, StyleSheet } from 'react-native';
import { Plus, Trash2, MapPin, Calendar, Clock } from 'lucide-react-native';
import { Input, InputField } from '@/components/ui/input';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicatorWrapper, ActionsheetDragIndicator, ActionsheetItem, ActionsheetItemText } from '@/components/ui/actionsheet';
import { ChevronDown } from 'lucide-react-native';
import { validateActivityTitle, validateActivityType, validateScheduleList, validateTimeSlot, ScheduleObject } from '@/lib/validations/role-validation';
import { getFieldError } from '@/lib/validations/form-field-validations';
import { activityTypes } from '@/components/form-components/options-to-use';

interface RoleScheduleListInputsProps {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  setValues: (values: any, shouldValidate?: boolean) => void;
  touched: any;
  setFieldTouched: (field: string, touched: boolean, shouldValidate?: boolean) => void;
  onFillLater?: () => void;
  fillSchedulesLater: boolean;
  isFinal?: boolean;
  // Ref callback to register close handler with parent
  onRegisterScrollClose?: (closeHandler: () => void) => void;
  // Legacy props - kept for compatibility but not used with inline dropdown
  showTypePicker?: boolean;
  setShowTypePicker?: (show: boolean) => void;
  selectedActivityIndex?: number | null;
  setSelectedActivityIndex?: (index: number | null) => void;
  onActivityTypeSelect?: (activityIndex: number, typeKey: string) => void;
  setActivityTypeSelectCallback?: (callback: (activityIndex: number, typeKey: string) => void) => void;
}

export function RoleScheduleListInputs({
  values,
  setFieldValue,
  setValues,
  touched,
  setFieldTouched,
  onFillLater,
  fillSchedulesLater,
  isFinal = false,
  onRegisterScrollClose,
  showTypePicker = false,
  setShowTypePicker,
  selectedActivityIndex = null,
  setSelectedActivityIndex,
  onActivityTypeSelect,
  setActivityTypeSelectCallback,
}: RoleScheduleListInputsProps) {
  const [localTouched, setLocalTouched] = useState<Record<string, boolean>>({});
  
  // Use internal state if not provided by parent
  const [internalShowTypePicker, setInternalShowTypePicker] = useState(false);
  const [internalSelectedActivityIndex, setInternalSelectedActivityIndex] = useState<number | null>(null);
  
  const actualShowTypePicker = setShowTypePicker !== undefined ? showTypePicker : internalShowTypePicker;
  const actualSelectedActivityIndex = setSelectedActivityIndex !== undefined ? selectedActivityIndex : internalSelectedActivityIndex;
  const actualSetShowTypePicker = setShowTypePicker || setInternalShowTypePicker;
  const actualSetSelectedActivityIndex = setSelectedActivityIndex || setInternalSelectedActivityIndex;
  
  // Date/Time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerConfig, setDatePickerConfig] = useState<{
    activityIndex: number;
    scheduleIndex: number;
    field: 'fromTime' | 'toTime';
    currentValue: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<{ hours: number; minutes: number }>({ hours: 9, minutes: 0 });
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [viewMode, setViewMode] = useState<'calendar' | 'year' | 'month'>('calendar');
  
  // Inline dropdown state for activity type
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const dropdownRefs = useRef<{ [key: number]: View | null }>({});
  const [dropdownLayouts, setDropdownLayouts] = useState<{ [key: number]: { x: number; y: number; width: number; height: number } }>({});
  
  // Set up callback for activity type selection
  useEffect(() => {
    if (setActivityTypeSelectCallback && onActivityTypeSelect) {
      setActivityTypeSelectCallback(onActivityTypeSelect);
    }
  }, [setActivityTypeSelectCallback, onActivityTypeSelect]);
  
  // Register close handler with parent for scroll detection
  useEffect(() => {
    if (onRegisterScrollClose) {
      onRegisterScrollClose(() => {
        if (openDropdownIndex !== null) {
          setOpenDropdownIndex(null);
        }
      });
    }
  }, [onRegisterScrollClose, openDropdownIndex]);
  
  // Measure dropdown field position
  const measureDropdownField = (activityIndex: number, event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setDropdownLayouts((prev) => ({
      ...prev,
      [activityIndex]: { x, y, width, height },
    }));
  };
  
  // Calendar helper functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  };
  
  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };
  
  const getMonthNames = () => {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  };

  const isFieldTouched = (fieldname: string) => {
    return touched[fieldname] || localTouched[fieldname];
  };

  const handleFieldBlur = (fieldname: string) => {
    setLocalTouched((prev) => ({ ...prev, [fieldname]: true }));
    setFieldTouched(fieldname, true, false);
  };

  const isActivityComplete = (activity: any) => {
    return (
      activity.title &&
      activity.title.trim() !== '' &&
      activity.type &&
      activity.type.trim() !== '' &&
      activity.schedules &&
      activity.schedules.every(
        (schedule: ScheduleObject) =>
          schedule.location &&
          schedule.location.trim() !== '' &&
          schedule.fromTime &&
          schedule.toTime
      )
    );
  };

  // Activity Actions
  const addActivity = () => {
    const newActivity = {
      title: '',
      type: '',
      schedules: [
        {
          id: Date.now(),
          location: '',
          fromTime: '',
          toTime: '',
        },
      ],
      remarks: '',
    };
    const updatedActivities = [...(values.activityScheduleLists || [])];
    updatedActivities.push(newActivity);
    setFieldValue('activityScheduleLists', updatedActivities);
  };

  const removeActivity = (activityIndex: number) => {
    const updatedActivities = values.activityScheduleLists.filter((_: any, index: number) => index !== activityIndex);
    setFieldValue('activityScheduleLists', updatedActivities);
  };

  // Schedule Actions
  const addSchedule = (listIndex: number) => {
    const newSchedule = {
      id: Date.now(),
      location: '',
      fromTime: '',
      toTime: '',
    };
    const updatedLists = [...values.activityScheduleLists];
    if (!updatedLists[listIndex].schedules) {
      updatedLists[listIndex].schedules = [];
    }
    updatedLists[listIndex].schedules.push(newSchedule);
    setFieldValue('activityScheduleLists', updatedLists);
  };

  const removeSchedule = (activityIndex: number, scheduleIndex: number) => {
    const updatedLists = [...values.activityScheduleLists];
    updatedLists[activityIndex].schedules = updatedLists[activityIndex].schedules.filter((_: any, index: number) => index !== scheduleIndex);
    setFieldValue('activityScheduleLists', updatedLists);
  };

  const getAvailableActivityTypes = (currentActivityIndex: number) => {
    if (isFinal) {
      const hasJobActivity = values?.activityScheduleLists?.some(
        (activity: any, index: number) => index !== currentActivityIndex && activity.type === 'job'
      );
      if (hasJobActivity) {
        return activityTypes.filter((type) => type.key !== 'job');
      }
    }
    return activityTypes;
  };

  // Date/Time helper functions
  const parseDateTime = (dateTimeStr: string): Date | null => {
    if (!dateTimeStr) return null;
    try {
      const date = new Date(dateTimeStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:00.000 +0000`;
  };

  const formatDisplayDateTime = (dateTimeStr: string): string => {
    if (!dateTimeStr) return 'Select date & time';
    const date = parseDateTime(dateTimeStr);
    if (!date) return 'Select date & time';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const openDateTimePicker = (activityIndex: number, scheduleIndex: number, field: 'fromTime' | 'toTime') => {
    // Get fresh copy from values to ensure we have latest data
    const currentActivities = [...(values.activityScheduleLists || [])];
    
    // Ensure activity exists
    if (!currentActivities[activityIndex]) {
      console.error('Activity index out of bounds:', activityIndex);
      return;
    }
    
    // Ensure schedules array exists
    if (!currentActivities[activityIndex].schedules || !Array.isArray(currentActivities[activityIndex].schedules)) {
      currentActivities[activityIndex].schedules = [];
    }
    
    // Ensure schedule exists
    if (!currentActivities[activityIndex].schedules[scheduleIndex]) {
      console.error('Schedule index out of bounds:', scheduleIndex);
      return;
    }
    
    const schedule = currentActivities[activityIndex].schedules[scheduleIndex];
    const currentValue = schedule?.[field] || '';
    
    // Parse date with proper fallback
    let parsedDate = parseDateTime(currentValue);
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
    }
    
    // Create new date instance to avoid reference issues
    const dateInstance = new Date(parsedDate);
    
    setDatePickerConfig({
      activityIndex,
      scheduleIndex,
      field,
      currentValue,
    });
    setSelectedDate(new Date(dateInstance));
    setSelectedYear(dateInstance.getFullYear());
    setSelectedMonth(dateInstance.getMonth());
    setSelectedTime({
      hours: dateInstance.getHours(),
      minutes: dateInstance.getMinutes(),
    });
    setViewMode('calendar');
    setShowDatePicker(true);
  };

  const handleDateTimeConfirm = () => {
    if (!datePickerConfig) return;

    // Use selected date with default time (9 AM) or keep existing time if available
    const date = new Date(selectedDate);
    if (selectedTime.hours !== undefined && selectedTime.minutes !== undefined) {
      date.setHours(selectedTime.hours);
      date.setMinutes(selectedTime.minutes);
    } else {
      // Default to 9 AM if no time selected
      date.setHours(9);
      date.setMinutes(0);
    }
    date.setSeconds(0);
    date.setMilliseconds(0);
    
    // Get fresh copy of activities from values
    const currentActivities = [...(values.activityScheduleLists || [])];
    
    // Ensure the structure exists
    if (!currentActivities[datePickerConfig.activityIndex]) {
      console.error('Activity index out of bounds:', datePickerConfig.activityIndex);
      setShowDatePicker(false);
      setDatePickerConfig(null);
      return;
    }
    
    if (!currentActivities[datePickerConfig.activityIndex].schedules) {
      currentActivities[datePickerConfig.activityIndex].schedules = [];
    }
    
    if (!currentActivities[datePickerConfig.activityIndex].schedules[datePickerConfig.scheduleIndex]) {
      console.error('Schedule index out of bounds:', datePickerConfig.scheduleIndex);
      setShowDatePicker(false);
      setDatePickerConfig(null);
      return;
    }
    
    // Update the specific field
    currentActivities[datePickerConfig.activityIndex].schedules[datePickerConfig.scheduleIndex][datePickerConfig.field] = formatDateTime(date);
    
    // Update form value
    setFieldValue('activityScheduleLists', currentActivities);
    
    const fieldname = `activityScheduleLists.${datePickerConfig.activityIndex}.schedules.${datePickerConfig.scheduleIndex}.${datePickerConfig.field}`;
    handleFieldBlur(fieldname);
    
    setShowDatePicker(false);
    setDatePickerConfig(null);
  };

  // Always get activities directly from values to ensure fresh data
  const getActivities = () => values.activityScheduleLists || [];

  return (
    <>
    <View className="gap-4">
      {fillSchedulesLater ? (
        <View className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 p-3">
          <Text className="text-sm text-green-400">
            Schedules will be filled later. You can proceed to the next step.
          </Text>
        </View>
      ) : (
        <>
             <ScrollView 
               className="flex-1" 
               showsVerticalScrollIndicator={false}>
            {getActivities().map((activity: any, activityIndex: number) => {
              const titleFieldname = `activityScheduleLists.${activityIndex}.title`;
              const typeFieldname = `activityScheduleLists.${activityIndex}.type`;
              const isTitleTouched = isFieldTouched(titleFieldname);
              const isTypeTouched = isFieldTouched(typeFieldname);
              const activityHasErrors =
                (isTitleTouched && validateActivityTitle(activity.title)) ||
                (isTypeTouched && validateActivityType(activity.type));

              const scheduleHasErrors = activity.schedules
                ? activity.schedules.map((schedule: ScheduleObject, scheduleIndex: number) => {
                    const locationFieldname = `activityScheduleLists.${activityIndex}.schedules.${scheduleIndex}.location`;
                    const isLocationTouched = isFieldTouched(locationFieldname);
                    const isTimeTouched =
                      isFieldTouched(`activityScheduleLists.${activityIndex}.schedules.${scheduleIndex}.fromTime`) ||
                      isFieldTouched(`activityScheduleLists.${activityIndex}.schedules.${scheduleIndex}.toTime`);
                    const isScheduleTouched = isLocationTouched || isTimeTouched;
                    return isScheduleTouched ? validateScheduleList(schedule) : null;
                  })
                : [];

              const hasErrors =
                (activityHasErrors || (scheduleHasErrors && scheduleHasErrors.some(Boolean))) && !isActivityComplete(activity);

              return (
                <View
                  key={activityIndex}
                  className={`mb-4 rounded-lg border p-4 ${
                    hasErrors ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-zinc-800/50'
                  }`}>
                  <View className="mb-4 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className="rounded-full bg-blue-500 px-3 py-1">
                        <Text className="text-xs font-semibold text-white">{activityIndex + 1}</Text>
                      </View>
                      {activity.type && (
                        <View className="rounded-full bg-zinc-700 px-3 py-1">
                          <Text className="text-xs text-white">{activity.type}</Text>
                        </View>
                      )}
                      <Text className="text-white">{activity.title || 'Untitled'}</Text>
                    </View>
                    {getActivities().length > 1 && (
                      <TouchableOpacity onPress={() => removeActivity(activityIndex)}>
                        <Trash2 size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Activity Title */}
                  <View className="mb-3">
                    <Text className="mb-2 text-sm text-white">Activity Title *</Text>
                    <Input className="border-white/20 bg-zinc-700">
                      <InputField
                        value={activity.title || ''}
                        onChangeText={(text) => {
                          const updated = [...getActivities()];
                          updated[activityIndex].title = text;
                          setFieldValue('activityScheduleLists', updated);
                        }}
                        onBlur={() => handleFieldBlur(titleFieldname)}
                        placeholder="Enter activity title"
                        placeholderTextColor="#6b7280"
                        className="text-white"
                        editable={true}
                      />
                    </Input>
                    {isTitleTouched && validateActivityTitle(activity.title) ? (
                      <Text className="mt-1 text-xs text-red-400">{validateActivityTitle(activity.title)}</Text>
                    ) : null}
                  </View>

                  {/* Activity Type */}
                  <View className="mb-3" style={{ position: 'relative', zIndex: openDropdownIndex === activityIndex ? 1000 : 1 }}>
                    <Text className="mb-2 text-sm text-white">Activity Type *</Text>
                    <View
                      onLayout={(e) => measureDropdownField(activityIndex, e)}
                      ref={(ref) => {
                        dropdownRefs.current[activityIndex] = ref;
                      }}>
                    <TouchableOpacity
                      onPress={() => {
                        if (!isFinal) {
                            setOpenDropdownIndex(openDropdownIndex === activityIndex ? null : activityIndex);
                        }
                      }}
                      disabled={isFinal}
                        className={`flex-row items-center justify-between rounded-lg border p-3 ${
                          openDropdownIndex === activityIndex 
                            ? 'border-blue-500/50 bg-zinc-700' 
                            : 'border-white/20 bg-zinc-700'
                        }`}>
                      <Text className="text-white">{activity.type ? activityTypes.find((t) => t.key === activity.type)?.label || activity.type : 'Select activity type'}</Text>
                        {!isFinal && (
                          <ChevronDown 
                            size={16} 
                            color="#ffffff" 
                            style={{ 
                              transform: [{ rotate: openDropdownIndex === activityIndex ? '180deg' : '0deg' }],
                            }} 
                          />
                        )}
                    </TouchableOpacity>
                    </View>
                    
                    {/* Inline Dropdown Menu */}
                    {openDropdownIndex === activityIndex && !isFinal && dropdownLayouts[activityIndex] && (
                      <View
                        pointerEvents="box-none"
                        style={{
                          position: 'absolute',
                          top: dropdownLayouts[activityIndex].height + 4,
                          left: 0,
                          right: 0,
                          backgroundColor: '#27272a',
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          maxHeight: 200,
                          zIndex: 1001,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 10,
                        }}>
                        <ScrollView 
                          nestedScrollEnabled
                          showsVerticalScrollIndicator={false}
                          style={{ maxHeight: 200 }}
                          keyboardShouldPersistTaps="handled"
                          pointerEvents="auto">
                          {getAvailableActivityTypes(activityIndex).map((type, index, array) => (
                            <TouchableOpacity
                              key={type.key}
                              activeOpacity={0.7}
                              onPress={() => {
                                const currentActivities = [...getActivities()];
                                if (currentActivities[activityIndex]) {
                                  currentActivities[activityIndex].type = type.key;
                                  setFieldValue('activityScheduleLists', currentActivities);
                                  handleFieldBlur(`activityScheduleLists.${activityIndex}.type`);
                                  setOpenDropdownIndex(null);
                                }
                              }}
                              className={`px-4 py-3 ${
                                activity.type === type.key ? 'bg-blue-500/20' : ''
                              }`}
                              style={{
                                borderBottomWidth: index === array.length - 1 ? 0 : 1,
                                borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                              }}>
                              <View className="flex-row items-center justify-between">
                                <Text className={`text-base ${activity.type === type.key ? 'text-blue-400 font-semibold' : 'text-white'}`}>
                                  {type.label}
                                </Text>
                                {activity.type === type.key && (
                                  <View className="w-2 h-2 rounded-full bg-blue-500" />
                                )}
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                    
                    {isTypeTouched && validateActivityType(activity.type) ? (
                      <Text className="mt-1 text-xs text-red-400">{validateActivityType(activity.type)}</Text>
                    ) : null}
                  </View>

                  {/* Schedules */}
                  <View className="mb-3">
                    <Text className="mb-2 text-sm text-white">Schedules *</Text>
                    {activity.schedules?.map((schedule: ScheduleObject, scheduleIndex: number) => {
                      const locationFieldname = `activityScheduleLists.${activityIndex}.schedules.${scheduleIndex}.location`;
                      const fromTimeFieldname = `activityScheduleLists.${activityIndex}.schedules.${scheduleIndex}.fromTime`;
                      const toTimeFieldname = `activityScheduleLists.${activityIndex}.schedules.${scheduleIndex}.toTime`;
                      const isLocationTouched = isFieldTouched(locationFieldname);
                      const scheduleError = isLocationTouched ? validateScheduleList(schedule) : null;

                      return (
                        <View
                          key={schedule.id || scheduleIndex}
                          className="mb-3 rounded-lg border border-white/10 bg-zinc-700/50 p-3">
                          <View className="mb-2 flex-row items-center justify-between">
                            <Text className="text-xs text-white/80">Schedule {scheduleIndex + 1}</Text>
                            {activity.schedules.length > 1 && (
                              <TouchableOpacity onPress={() => removeSchedule(activityIndex, scheduleIndex)}>
                                <Trash2 size={16} color="#ef4444" />
                              </TouchableOpacity>
                            )}
                          </View>

                          {/* Location */}
                          <View className="mb-3">
                            <Text className="mb-1 text-xs text-white/80">Location *</Text>
                            <Input className="border-white/20 bg-zinc-600">
                              <InputField
                                value={schedule.location || ''}
                                onChangeText={(text) => {
                                  const updated = [...getActivities()];
                                  updated[activityIndex].schedules[scheduleIndex].location = text;
                                  setFieldValue('activityScheduleLists', updated);
                                }}
                                onBlur={() => handleFieldBlur(locationFieldname)}
                                placeholder="Enter location"
                                placeholderTextColor="#6b7280"
                                className="text-white"
                                editable={true}
                              />
                            </Input>
                            {scheduleError ? <Text className="mt-1 text-xs text-red-400">{scheduleError}</Text> : null}
                          </View>

                          {/* From Time */}
                          <View className="mb-3">
                            <Text className="mb-1 text-xs text-white/80">Start Time *</Text>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => openDateTimePicker(activityIndex, scheduleIndex, 'fromTime')}
                              className="flex-row items-center justify-between rounded-lg border border-white/20 bg-zinc-600 p-3">
                              <View className="flex-row items-center gap-2">
                                <Calendar size={16} color="#ffffff" />
                                <Text className="text-white">{formatDisplayDateTime(schedule.fromTime || '')}</Text>
                              </View>
                              <Clock size={16} color="#ffffff" />
                            </TouchableOpacity>
                          </View>

                          {/* To Time */}
                          <View className="mb-3">
                            <Text className="mb-1 text-xs text-white/80">End Time *</Text>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => openDateTimePicker(activityIndex, scheduleIndex, 'toTime')}
                              className="flex-row items-center justify-between rounded-lg border border-white/20 bg-zinc-600 p-3">
                              <View className="flex-row items-center gap-2">
                                <Calendar size={16} color="#ffffff" />
                                <Text className="text-white">{formatDisplayDateTime(schedule.toTime || '')}</Text>
                              </View>
                              <Clock size={16} color="#ffffff" />
                            </TouchableOpacity>
                            {validateTimeSlot(schedule) ? (
                              <Text className="mt-1 text-xs text-red-400">{validateTimeSlot(schedule)}</Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}

                    <Button
                      action="secondary"
                      variant="outline"
                      size="sm"
                      onPress={() => addSchedule(activityIndex)}
                      className="w-full">
                      <ButtonIcon as={Plus} size={16} />
                      <ButtonText>Add Time Slot</ButtonText>
                    </Button>
                  </View>

                  {/* Remarks */}
                  {!isFinal && (
                    <View className="mb-3">
                      <Text className="mb-2 text-sm text-white">Remarks</Text>
                      <Textarea className="border-white/20 bg-zinc-700">
                        <TextareaInput
                          value={activity.remarks || ''}
                          onChangeText={(text) => {
                            const updated = [...getActivities()];
                            updated[activityIndex].remarks = text;
                            setFieldValue('activityScheduleLists', updated);
                          }}
                          placeholder="Add any additional notes or instructions..."
                          placeholderTextColor="#6b7280"
                          multiline
                          numberOfLines={3}
                          editable={true}
                          className="text-white"
                          style={{ textAlignVertical: 'top', color: '#ffffff' }}
                        />
                      </Textarea>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View className="flex-row gap-3">
            <Button action="primary" onPress={addActivity} className="flex-1">
              <ButtonIcon as={Plus} size={20} />
              <ButtonText>New Activity</ButtonText>
            </Button>
            {!isFinal && onFillLater && (
              <Button action="secondary" variant="outline" onPress={onFillLater} className="flex-1">
                <ButtonText>Fill Later</ButtonText>
              </Button>
            )}
          </View>
        </>
      )}
      </View>

      {/* Activity Type Picker - Only render if managed internally */}
      {setShowTypePicker === undefined && (
        <Actionsheet 
          isOpen={actualShowTypePicker} 
          onClose={() => {
            actualSetShowTypePicker(false);
            actualSetSelectedActivityIndex(null);
          }}>
          <ActionsheetBackdrop 
            onPress={() => {
              actualSetShowTypePicker(false);
              actualSetSelectedActivityIndex(null);
            }}
          />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
            {actualSelectedActivityIndex !== null &&
              getAvailableActivityTypes(actualSelectedActivityIndex).map((type) => (
              <ActionsheetItem
                key={type.key}
                onPress={() => {
                    const updated = [...getActivities()];
                    updated[actualSelectedActivityIndex].type = type.key;
                  setFieldValue('activityScheduleLists', updated);
                    handleFieldBlur(`activityScheduleLists.${actualSelectedActivityIndex}.type`);
                    actualSetShowTypePicker(false);
                    actualSetSelectedActivityIndex(null);
                }}>
                <ActionsheetItemText>{type.label}</ActionsheetItemText>
              </ActionsheetItem>
            ))}
        </ActionsheetContent>
      </Actionsheet>
      )}

      {/* Date/Time Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDatePicker(false);
          setDatePickerConfig(null);
        }}>
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              setShowDatePicker(false);
              setDatePickerConfig(null);
            }}
          />
          <View className="bg-zinc-800 rounded-t-3xl p-6 border-t border-white/10">
            <Text className="text-xl font-bold text-white mb-4">
              Select {datePickerConfig?.field === 'fromTime' ? 'Start' : 'End'} Date
            </Text>
            
            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <>
                {/* Year/Month Selector */}
                <View className="mb-4 flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() => setViewMode('year')}
                    className="bg-zinc-700 rounded-lg px-4 py-2">
                    <Text className="text-white text-base font-semibold">{selectedYear}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setViewMode('month')}
                    className="bg-zinc-700 rounded-lg px-4 py-2">
                    <Text className="text-white text-base font-semibold">{getMonthName(selectedMonth)}</Text>
                  </TouchableOpacity>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => {
                        if (selectedMonth === 0) {
                          setSelectedMonth(11);
                          setSelectedYear(selectedYear - 1);
                        } else {
                          setSelectedMonth(selectedMonth - 1);
                        }
                      }}
                      className="bg-zinc-700 rounded-lg p-2">
                      <Text className="text-white font-bold">‹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (selectedMonth === 11) {
                          setSelectedMonth(0);
                          setSelectedYear(selectedYear + 1);
                        } else {
                          setSelectedMonth(selectedMonth + 1);
                        }
                      }}
                      className="bg-zinc-700 rounded-lg p-2">
                      <Text className="text-white font-bold">›</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Calendar Grid */}
                <View className="mb-4">
                  {/* Day Headers */}
                  <View className="flex-row mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <View key={day} className="flex-1 items-center py-2">
                        <Text className="text-xs text-white/60 font-semibold">{day}</Text>
                      </View>
                    ))}
                  </View>
                  
                  {/* Calendar Days */}
                  <View>
                    {(() => {
                      const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
                      const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
                      const days = [];
                      
                      // Empty cells for days before month starts
                      for (let i = 0; i < firstDay; i++) {
                        days.push(<View key={`empty-${i}`} className="flex-1 aspect-square" />);
                      }
                      
                      // Days of the month
                      for (let day = 1; day <= daysInMonth; day++) {
                        const isSelected = selectedDate.getDate() === day && 
                                          selectedDate.getMonth() === selectedMonth && 
                                          selectedDate.getFullYear() === selectedYear;
                        days.push(
                          <TouchableOpacity
                            key={day}
                            onPress={() => {
                              const newDate = new Date(selectedYear, selectedMonth, day);
                              setSelectedDate(newDate);
                            }}
                            className={`flex-1 aspect-square items-center justify-center rounded-lg mx-0.5 ${
                              isSelected ? 'bg-blue-500' : 'bg-zinc-700'
                            }`}>
                            <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-white'}`}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                      
                      // Render in rows of 7
                      const rows = [];
                      for (let i = 0; i < days.length; i += 7) {
                        rows.push(
                          <View key={`row-${i}`} className="flex-row mb-1">
                            {days.slice(i, i + 7)}
    </View>
                        );
                      }
                      return rows;
                    })()}
                  </View>
                </View>
              </>
            )}

            {/* Year Selector View */}
            {viewMode === 'year' && (
              <ScrollView className="max-h-64 mb-4">
                <View className="flex-row flex-wrap gap-2">
                  {getYearRange().map((year) => (
                    <TouchableOpacity
                      key={year}
                      onPress={() => {
                        setSelectedYear(year);
                        setViewMode('calendar');
                      }}
                      className={`w-[30%] bg-zinc-700 rounded-lg p-3 items-center ${
                        year === selectedYear ? 'bg-blue-500' : ''
                      }`}>
                      <Text className={`text-white font-semibold ${year === selectedYear ? 'text-white' : ''}`}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Month Selector View */}
            {viewMode === 'month' && (
              <View className="mb-4 flex-row flex-wrap gap-2">
                {getMonthNames().map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setSelectedMonth(index);
                      setViewMode('calendar');
                    }}
                    className={`w-[30%] bg-zinc-700 rounded-lg p-3 items-center ${
                      index === selectedMonth ? 'bg-blue-500' : ''
                    }`}>
                    <Text className={`text-white font-semibold ${index === selectedMonth ? 'text-white' : ''}`}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Time Selection */}
            <View className="mb-6">
              <Text className="text-sm text-white/80 mb-2">Time</Text>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-xs text-white/60 mb-1">Hours</Text>
                  <View className="flex-row items-center justify-between bg-zinc-700 rounded-lg p-3">
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedTime({
                          ...selectedTime,
                          hours: selectedTime.hours > 0 ? selectedTime.hours - 1 : 23,
                        });
                      }}
                      className="bg-zinc-600 rounded-lg p-2">
                      <Text className="text-white font-bold">-</Text>
                    </TouchableOpacity>
                    <Text className="text-white text-base font-semibold">
                      {String(selectedTime.hours).padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedTime({
                          ...selectedTime,
                          hours: selectedTime.hours < 23 ? selectedTime.hours + 1 : 0,
                        });
                      }}
                      className="bg-zinc-600 rounded-lg p-2">
                      <Text className="text-white font-bold">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-white/60 mb-1">Minutes</Text>
                  <View className="flex-row items-center justify-between bg-zinc-700 rounded-lg p-3">
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedTime({
                          ...selectedTime,
                          minutes: selectedTime.minutes > 0 ? selectedTime.minutes - 5 : 55,
                        });
                      }}
                      className="bg-zinc-600 rounded-lg p-2">
                      <Text className="text-white font-bold">-</Text>
                    </TouchableOpacity>
                    <Text className="text-white text-base font-semibold">
                      {String(selectedTime.minutes).padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedTime({
                          ...selectedTime,
                          minutes: selectedTime.minutes < 55 ? selectedTime.minutes + 5 : 0,
                        });
                      }}
                      className="bg-zinc-600 rounded-lg p-2">
                      <Text className="text-white font-bold">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <Button
                action="secondary"
                variant="outline"
                onPress={() => {
                  setShowDatePicker(false);
                  setDatePickerConfig(null);
                }}
                className="flex-1">
                <ButtonText>Cancel</ButtonText>
              </Button>
              <Button
                action="primary"
                onPress={handleDateTimeConfirm}
                className="flex-1">
                <ButtonText>Confirm</ButtonText>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

