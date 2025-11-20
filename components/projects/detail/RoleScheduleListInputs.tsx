import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Modal, Pressable, FlatList, StyleSheet, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
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
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  
  // Screen dimensions for modal sizing
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;
  const modalHeight = screenHeight * 0.7;
  
  // Wheel picker constants - proportional to screen size
  const ITEM_HEIGHT = Math.max(40, screenHeight * 0.055); // ~5.5% of screen height, minimum 40px
  const VISIBLE_ITEMS = 5;
  const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
  
  // Animation values for slide up/down
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // Refs for scrolling
  const hourScrollRef = useRef<FlatList<number>>(null);
  const minuteScrollRef = useRef<FlatList<number>>(null);
  const monthScrollRef = useRef<FlatList<string>>(null);
  const dayScrollRef = useRef<FlatList<number>>(null);
  const yearScrollRef = useRef<FlatList<number>>(null);
  
  // Throttle refs for scroll updates
  const hourScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minuteScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const monthScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dayScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const yearScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper function to update selection based on scroll position
  const updateSelectionFromScroll = (
    offsetY: number,
    dataArray: any[],
    currentValue: any,
    setter: (value: any) => void,
    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
  ) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Calculate which item is in the center (blue selection area)
    const centerOffset = offsetY + (WHEEL_HEIGHT / 2) - (WHEEL_HEIGHT / 2 - ITEM_HEIGHT / 2);
    const index = Math.round(centerOffset / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, dataArray.length - 1));
    const newValue = dataArray[clampedIndex];
    
    // Only update if value changed
    if (newValue !== undefined && newValue !== currentValue) {
      // Throttle updates slightly to avoid excessive re-renders
      timeoutRef.current = setTimeout(() => {
        setter(newValue);
      }, 50);
    }
  };
  
  // Animate modal when showDatePicker changes
  useEffect(() => {
    if (showDatePicker) {
      // Slide up and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showDatePicker]);
  
  // Close modal with slide down animation
  const closeModalWithAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDatePicker(false);
      setDatePickerConfig(null);
    });
  };
  
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
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  };
  
  // Generate data arrays for wheel pickers
  const generateHours = () => Array.from({ length: 24 }, (_, i) => i);
  const generateMinutes = () => Array.from({ length: 60 }, (_, i) => i * 5); // 0, 5, 10, ... 55
  const generateMonths = () => getMonthNames();
  const generateDays = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);
  };
  
  // Wheel picker render item component - proportional font sizes
  const renderWheelItem = (
    item: string | number,
    index: number,
    isSelected: boolean,
    onSelect: () => void
  ) => {
    const selectedFontSize = Math.max(18, screenHeight * 0.024); // ~2.4% of screen height
    const unselectedFontSize = Math.max(14, screenHeight * 0.019); // ~1.9% of screen height
    
    return (
      <TouchableOpacity
        onPress={onSelect}
        style={{
          height: ITEM_HEIGHT,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
        }}>
        <Text
          style={{
            fontSize: isSelected ? selectedFontSize : unselectedFontSize,
            fontWeight: isSelected ? '600' : '400',
            color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
          }}>
          {item}
        </Text>
      </TouchableOpacity>
    );
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
    setSelectedDay(dateInstance.getDate());
    setSelectedTime({
      hours: dateInstance.getHours(),
      minutes: dateInstance.getMinutes(),
    });
    setShowDatePicker(true);
    
    // Scroll to selected values after modal opens
    setTimeout(() => {
      try {
        const hours = dateInstance.getHours();
        const minutes = dateInstance.getMinutes();
        const month = dateInstance.getMonth();
        const day = dateInstance.getDate();
        const year = dateInstance.getFullYear();
        
        hourScrollRef.current?.scrollToIndex({ index: hours, animated: false });
        minuteScrollRef.current?.scrollToIndex({ index: Math.floor(minutes / 5), animated: false });
        monthScrollRef.current?.scrollToIndex({ index: month, animated: false });
        dayScrollRef.current?.scrollToIndex({ index: day - 1, animated: false });
        
        const startYear = year - 50;
        const yearIndex = year - startYear;
        yearScrollRef.current?.scrollToIndex({ index: Math.min(Math.max(yearIndex, 0), 99), animated: false });
      } catch (error) {
        // Ignore scroll errors on initial load
        console.log('Scroll initialization error:', error);
      }
    }, 200);
  };

  const handleDateTimeConfirm = () => {
    if (!datePickerConfig) return;

    // Use selected year, month, day, hour, minute
    const date = new Date(selectedYear, selectedMonth, selectedDay, selectedTime.hours, selectedTime.minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    
    // Get fresh copy of activities from values
    const currentActivities = [...(values.activityScheduleLists || [])];
    
    // Ensure the structure exists
    if (!currentActivities[datePickerConfig.activityIndex]) {
      console.error('Activity index out of bounds:', datePickerConfig.activityIndex);
      closeModalWithAnimation();
      return;
    }
    
    if (!currentActivities[datePickerConfig.activityIndex].schedules) {
      currentActivities[datePickerConfig.activityIndex].schedules = [];
    }
    
    if (!currentActivities[datePickerConfig.activityIndex].schedules[datePickerConfig.scheduleIndex]) {
      console.error('Schedule index out of bounds:', datePickerConfig.scheduleIndex);
      closeModalWithAnimation();
      return;
    }
    
    // Update the specific field
    currentActivities[datePickerConfig.activityIndex].schedules[datePickerConfig.scheduleIndex][datePickerConfig.field] = formatDateTime(date);
    
    // Update form value
    setFieldValue('activityScheduleLists', currentActivities);
    
    const fieldname = `activityScheduleLists.${datePickerConfig.activityIndex}.schedules.${datePickerConfig.scheduleIndex}.${datePickerConfig.field}`;
    handleFieldBlur(fieldname);
    
    // Don't close modal here - let the button handler close it with animation
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

      {/* Date/Time Picker Modal - Wheel Style */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="none"
        onRequestClose={closeModalWithAnimation}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Backdrop with blur and transparency */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: backdropOpacity,
              },
            ]}
            pointerEvents="box-none">
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeModalWithAnimation}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]} />
            </Pressable>
          </Animated.View>
          
          {/* Picker Container with slide animation */}
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: modalHeight,
              transform: [{ translateY: slideAnim }],
            }}
            pointerEvents="auto">
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(39, 39, 42, 0.85)', // zinc-900 with transparency
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
              }}>
              {/* Blur effect inside modal */}
              <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
              
              <View style={{ flex: 1 }} pointerEvents="auto">
                {/* Title */}
                <View className="px-6 pt-4 pb-3 border-b border-white/10" style={{ paddingTop: screenHeight * 0.02 }}>
                  <Text className="text-base font-semibold text-white text-center" style={{ fontSize: screenHeight * 0.022 }}>
                    Pick a date
                  </Text>
                </View>
                
                {/* Wheel Picker Container - Use flex to fit remaining space */}
                <View style={{ flex: 1, marginVertical: screenHeight * 0.01, position: 'relative', justifyContent: 'center' }}>
                {/* Selection Indicators */}
                <View
                  style={{
                    position: 'absolute',
                    top: WHEEL_HEIGHT / 2 - ITEM_HEIGHT / 2,
                    left: 0,
                    right: 0,
                    height: ITEM_HEIGHT,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    zIndex: 1,
                  }}
                  pointerEvents="none"
                />
                <View
                  style={{
                    position: 'absolute',
                    top: WHEEL_HEIGHT + WHEEL_HEIGHT / 2 - ITEM_HEIGHT / 2,
                    left: 0,
                    right: 0,
                    height: ITEM_HEIGHT,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    zIndex: 1,
                  }}
                  pointerEvents="none"
                />

                {/* Time Picker (Hour, Minutes) - On Top */}
                <View className="flex-row px-4" style={{ height: WHEEL_HEIGHT, marginBottom: screenHeight * 0.01 }}>
                  {/* Hours Column */}
                  <View style={{ flex: 1, marginHorizontal: 2, height: WHEEL_HEIGHT }}>
                    <FlatList
                      ref={hourScrollRef}
                      data={generateHours()}
                      keyExtractor={(item) => `hour-${item}`}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      style={{ height: WHEEL_HEIGHT }}
                      contentContainerStyle={{
                        paddingVertical: WHEEL_HEIGHT / 2 - ITEM_HEIGHT / 2,
                      }}
                      onScroll={(e: any) => {
                        const offsetY = e.nativeEvent.contentOffset.y;
                        updateSelectionFromScroll(
                          offsetY,
                          generateHours(),
                          selectedTime.hours,
                          (hours) => setSelectedTime({ ...selectedTime, hours }),
                          hourScrollTimeoutRef
                        );
                      }}
                      scrollEventThrottle={16}
                      onScrollEndDrag={(e: any) => {
                        // Clear timeout on scroll end
                        if (hourScrollTimeoutRef.current) {
                          clearTimeout(hourScrollTimeoutRef.current);
                        }
                        const offsetY = e.nativeEvent.contentOffset.y;
                        const index = Math.round(offsetY / ITEM_HEIGHT);
                        const hours = generateHours()[index];
                        if (hours !== undefined && hours !== selectedTime.hours) {
                          setSelectedTime({ ...selectedTime, hours });
                        }
                      }}
                      onMomentumScrollEnd={(e: any) => {
                        // Clear timeout on momentum end
                        if (hourScrollTimeoutRef.current) {
                          clearTimeout(hourScrollTimeoutRef.current);
                        }
                        const offsetY = e.nativeEvent.contentOffset.y;
                        const index = Math.round(offsetY / ITEM_HEIGHT);
                        const hours = generateHours()[index];
                        if (hours !== undefined && hours !== selectedTime.hours) {
                          setSelectedTime({ ...selectedTime, hours });
                        }
                      }}
                      getItemLayout={(_: any, index: number) => ({
                        length: ITEM_HEIGHT,
                        offset: ITEM_HEIGHT * index,
                        index,
                      })}
                      renderItem={({ item, index }: { item: number; index: number }) => {
                        const isSelected = selectedTime.hours === item;
                        return renderWheelItem(
                          String(item).padStart(2, '0'),
                          index,
                          isSelected,
                          () => {
                            hourScrollRef.current?.scrollToIndex({ index, animated: true });
                            setSelectedTime({ ...selectedTime, hours: item });
                          }
                        );
                      }}
                      initialScrollIndex={selectedTime.hours}
                      onScrollToIndexFailed={(info: any) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                          hourScrollRef.current?.scrollToIndex({ index: info.index, animated: false });
                        });
                      }}
                    />
                  </View>

                  {/* Minutes Column */}
                  <View style={{ flex: 1, marginHorizontal: 2, height: WHEEL_HEIGHT }}>
                    <FlatList
                      ref={minuteScrollRef}
                      data={generateMinutes()}
                      keyExtractor={(item) => `minute-${item}`}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      style={{ height: WHEEL_HEIGHT }}
                      contentContainerStyle={{
                        paddingVertical: WHEEL_HEIGHT / 2 - ITEM_HEIGHT / 2,
                      }}
                      onScroll={(e: any) => {
                        const offsetY = e.nativeEvent.contentOffset.y;
                        updateSelectionFromScroll(
                          offsetY,
                          generateMinutes(),
                          selectedTime.minutes,
                          (minutes) => setSelectedTime({ ...selectedTime, minutes }),
                          minuteScrollTimeoutRef
                        );
                      }}
                      scrollEventThrottle={16}
                      onScrollEndDrag={(e: any) => {
                        // Clear timeout on scroll end
                        if (minuteScrollTimeoutRef.current) {
                          clearTimeout(minuteScrollTimeoutRef.current);
                        }
                        const offsetY = e.nativeEvent.contentOffset.y;
                        const index = Math.round(offsetY / ITEM_HEIGHT);
                        const minutes = generateMinutes()[index];
                        if (minutes !== undefined && minutes !== selectedTime.minutes) {
                          setSelectedTime({ ...selectedTime, minutes });
                        }
                      }}
                      onMomentumScrollEnd={(e: any) => {
                        // Clear timeout on momentum end
                        if (minuteScrollTimeoutRef.current) {
                          clearTimeout(minuteScrollTimeoutRef.current);
                        }
                        const offsetY = e.nativeEvent.contentOffset.y;
                        const index = Math.round(offsetY / ITEM_HEIGHT);
                        const minutes = generateMinutes()[index];
                        if (minutes !== undefined && minutes !== selectedTime.minutes) {
                          setSelectedTime({ ...selectedTime, minutes });
                        }
                      }}
                      getItemLayout={(_: any, index: number) => ({
                        length: ITEM_HEIGHT,
                        offset: ITEM_HEIGHT * index,
                        index,
                      })}
                      renderItem={({ item, index }: { item: number; index: number }) => {
                        const isSelected = selectedTime.minutes === item;
                        return renderWheelItem(
                          String(item).padStart(2, '0'),
                          index,
                          isSelected,
                          () => {
                            minuteScrollRef.current?.scrollToIndex({ index, animated: true });
                            setSelectedTime({ ...selectedTime, minutes: item });
                          }
                        );
                      }}
                      initialScrollIndex={Math.floor(selectedTime.minutes / 5)}
                      onScrollToIndexFailed={(info: any) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                          minuteScrollRef.current?.scrollToIndex({ index: info.index, animated: false });
                        });
                      }}
                    />
                  </View>
                </View>

                {/* Date Picker (Month, Day, Year) - Below Time */}
                <View className="flex-row px-4" style={{ height: WHEEL_HEIGHT, marginTop: screenHeight * 0.01 }}>
                  {/* Month Column */}
                  <View style={{ flex: 1.5, marginHorizontal: 2, height: WHEEL_HEIGHT }}>
                    <FlatList
                      ref={monthScrollRef}
                      data={generateMonths()}
                      keyExtractor={(item, index) => `month-${index}`}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      style={{ height: WHEEL_HEIGHT }}
                      contentContainerStyle={{
                        paddingVertical: WHEEL_HEIGHT / 2 - ITEM_HEIGHT / 2,
                      }}
                      onScroll={(e: any) => {
                        const offsetY = e.nativeEvent.contentOffset.y;
                        // Calculate which month is in the center
                        const centerOffset = offsetY + (WHEEL_HEIGHT / 2) - (WHEEL_HEIGHT / 2 - ITEM_HEIGHT / 2);
                        const index = Math.round(centerOffset / ITEM_HEIGHT);
                        const clampedIndex = Math.max(0, Math.min(index, 11)); // 12 months (0-11)
                        
                        if (clampedIndex !== selectedMonth) {
                          if (monthScrollTimeoutRef.current) {
                            clearTimeout(monthScrollTimeoutRef.current);
                          }
                          monthScrollTimeoutRef.current = setTimeout(() => {
                            setSelectedMonth(clampedIndex);
                            // Update day if current day is invalid for new month
                            const daysInNewMonth = getDaysInMonth(selectedYear, clampedIndex);
                            if (selectedDay > daysInNewMonth) {
                              setSelectedDay(daysInNewMonth);
                            }
                          }, 50);
                        }
                      }}
                      scrollEventThrottle={16}
                      onScrollEndDrag={(e: any) => {
                        // Clear timeout on scroll end
                        if (monthScrollTimeoutRef.current) {
                          clearTimeout(monthScrollTimeoutRef.current);
                        }
                        const offsetY = e.nativeEvent.contentOffset.y;
                        const index = Math.round(offsetY / ITEM_HEIGHT);
                        if (index !== selectedMonth) {
                          setSelectedMonth(index);
                          // Update day if current day is invalid for new month
                          const daysInNewMonth = getDaysInMonth(selectedYear, index);
                          if (selectedDay > daysInNewMonth) {
                            setSelectedDay(daysInNewMonth);
                          }
                        }
                      }}
                      onMomentumScrollEnd={(e: any) => {
                        // Clear timeout on momentum end
                        if (monthScrollTimeoutRef.current) {
                          clearTimeout(monthScrollTimeoutRef.current);
                        }
                        const offsetY = e.nativeEvent.contentOffset.y;
                        const index = Math.round(offsetY / ITEM_HEIGHT);
                        if (index !== selectedMonth) {
                          setSelectedMonth(index);
                          // Update day if current day is invalid for new month
                          const daysInNewMonth = getDaysInMonth(selectedYear, index);
                          if (selectedDay > daysInNewMonth) {
                            setSelectedDay(daysInNewMonth);
                          }
                        }
                      }}
                      getItemLayout={(_: any, index: number) => ({
                        length: ITEM_HEIGHT,
                        offset: ITEM_HEIGHT * index,
                        index,
                      })}
                      renderItem={({ item, index }: { item: string; index: number }) => {
                        const isSelected = selectedMonth === index;
                        return renderWheelItem(
                          item,
                          index,
                          isSelected,
                          () => {
                            monthScrollRef.current?.scrollToIndex({ index, animated: true });
                            setSelectedMonth(index);
                          }
                        );
                      }}
                      initialScrollIndex={selectedMonth}
                      onScrollToIndexFailed={(info: any) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                          monthScrollRef.current?.scrollToIndex({ index: info.index, animated: false });
                        });
                      }}
                    />
                  </View>

                  {/* Day Column */}
                  <View style={{ flex: 1, marginHorizontal: 2, height: WHEEL_HEIGHT }}>
                    <FlatList
                      ref={dayScrollRef}
                      key={`day-${selectedYear}-${selectedMonth}`} // Re-render when month/year changes
                      data={generateDays(selectedYear, selectedMonth)}
                      keyExtractor={(item) => `day-${item}`}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      style={{ height: WHEEL_HEIGHT }}
                      contentContainerStyle={{
                        paddingVertical: WHEEL_HEIGHT / 2 - ITEM_HEIGHT / 2,
                      }}
                      onScroll={(e: any) => {
                        const offsetY = e.nativeEvent.contentOffset.y;
                        const days = generateDays(selectedYear, selectedMonth);
                        updateSelectionFromScroll(
                          offsetY,
                          days,
                          selectedDay,
                          (day) => setSelectedDay(day),
                          dayScrollTimeoutRef
                        );
                      }}
                      scrollEventThrottle={16}
                      onScrollEndDrag={(e: any) => {
                        // Clear timeout on scroll end
                        if (dayScrollTimeoutRef.current) {
                          clearTimeout(dayScrollTimeoutRef.current);
                        }
                        const offsetY = e.nativeEvent.contentOffset.y;
                        const index = Math.round(offsetY / ITEM_HEIGHT);
                        const days = generateDays(selectedYear, selectedMonth);
                        if (days[index] !== undefined && days[index] !== selectedDay) {
                          setSelectedDay(days[index]);
                        }
                      }}
                      onMomentumScrollEnd={(e: any) => {
                        // Clear timeout on momentum end
                        if (dayScrollTimeoutRef.current) {
                          clearTimeout(dayScrollTimeoutRef.current);
                        }
                        const offsetY = e.nativeEvent.contentOffset.y;
                        const index = Math.round(offsetY / ITEM_HEIGHT);
                        const days = generateDays(selectedYear, selectedMonth);
                        if (days[index] !== undefined && days[index] !== selectedDay) {
                          setSelectedDay(days[index]);
                        }
                      }}
                      getItemLayout={(_: any, index: number) => ({
                        length: ITEM_HEIGHT,
                        offset: ITEM_HEIGHT * index,
                        index,
                      })}
                      renderItem={({ item, index }: { item: number; index: number }) => {
                        const isSelected = selectedDay === item;
                        return renderWheelItem(
                          String(item),
                          index,
                          isSelected,
                          () => {
                            dayScrollRef.current?.scrollToIndex({ index, animated: true });
                            setSelectedDay(item);
                          }
                        );
                      }}
                      initialScrollIndex={Math.min(selectedDay - 1, generateDays(selectedYear, selectedMonth).length - 1)}
                      onScrollToIndexFailed={(info: any) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                          dayScrollRef.current?.scrollToIndex({ index: info.index, animated: false });
                        });
                      }}
                    />
                  </View>

                  {/* Year Column */}
                  <View style={{ flex: 1, marginHorizontal: 2, height: WHEEL_HEIGHT }}>
                    <FlatList
                      ref={yearScrollRef}
                      data={generateYears()}
                      keyExtractor={(item) => `year-${item}`}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      style={{ height: WHEEL_HEIGHT }}
                      contentContainerStyle={{
                        paddingVertical: WHEEL_HEIGHT / 2 - ITEM_HEIGHT / 2,
                      }}
                      onScroll={(e: any) => {
                        const offsetY = e.nativeEvent.contentOffset.y;
                        const years = generateYears();
                        // Calculate which year is in the center
                        const centerOffset = offsetY + (WHEEL_HEIGHT / 2) - (WHEEL_HEIGHT / 2 - ITEM_HEIGHT / 2);
                        const index = Math.round(centerOffset / ITEM_HEIGHT);
                        const clampedIndex = Math.max(0, Math.min(index, years.length - 1));
                        const newYear = years[clampedIndex];
                        
                        if (newYear !== undefined && newYear !== selectedYear) {
                          if (yearScrollTimeoutRef.current) {
                            clearTimeout(yearScrollTimeoutRef.current);
                          }
                          yearScrollTimeoutRef.current = setTimeout(() => {
                            setSelectedYear(newYear);
                            // Update day if current day is invalid for new year/month (e.g., Feb 29)
                            const daysInMonth = getDaysInMonth(newYear, selectedMonth);
                            if (selectedDay > daysInMonth) {
                              setSelectedDay(daysInMonth);
                            }
                          }, 50);
                        }
                      }}
                      scrollEventThrottle={16}
                      onScrollEndDrag={(e: any) => {
                        // Clear timeout on scroll end
                        if (yearScrollTimeoutRef.current) {
                          clearTimeout(yearScrollTimeoutRef.current);
                        }
                        const offsetY = e.nativeEvent.contentOffset.y;
                        const index = Math.round(offsetY / ITEM_HEIGHT);
                        const years = generateYears();
                        if (years[index] !== undefined && years[index] !== selectedYear) {
                          setSelectedYear(years[index]);
                          // Update day if current day is invalid for new year/month (e.g., Feb 29)
                          const daysInMonth = getDaysInMonth(years[index], selectedMonth);
                          if (selectedDay > daysInMonth) {
                            setSelectedDay(daysInMonth);
                          }
                        }
                      }}
                      onMomentumScrollEnd={(e: any) => {
                        // Clear timeout on momentum end
                        if (yearScrollTimeoutRef.current) {
                          clearTimeout(yearScrollTimeoutRef.current);
                        }
                        const offsetY = e.nativeEvent.contentOffset.y;
                        const index = Math.round(offsetY / ITEM_HEIGHT);
                        const years = generateYears();
                        if (years[index] !== undefined && years[index] !== selectedYear) {
                          setSelectedYear(years[index]);
                          // Update day if current day is invalid for new year/month (e.g., Feb 29)
                          const daysInMonth = getDaysInMonth(years[index], selectedMonth);
                          if (selectedDay > daysInMonth) {
                            setSelectedDay(daysInMonth);
                          }
                        }
                      }}
                      getItemLayout={(_: any, index: number) => ({
                        length: ITEM_HEIGHT,
                        offset: ITEM_HEIGHT * index,
                        index,
                      })}
                      renderItem={({ item, index }: { item: number; index: number }) => {
                        const isSelected = selectedYear === item;
                        return renderWheelItem(
                          String(item),
                          index,
                          isSelected,
                          () => {
                            yearScrollRef.current?.scrollToIndex({ index, animated: true });
                            setSelectedYear(item);
                          }
                        );
                      }}
                      initialScrollIndex={selectedYear - (new Date().getFullYear() - 50)}
                      onScrollToIndexFailed={(info: any) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                          yearScrollRef.current?.scrollToIndex({ index: info.index, animated: false });
                        });
                      }}
                    />
                  </View>
                </View>
              </View>

                {/* Action Buttons - Always at bottom */}
                <View 
                  className="flex-row gap-3 px-6" 
                  style={{ 
                    paddingTop: screenHeight * 0.015,
                    paddingBottom: screenHeight * 0.02,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255, 255, 255, 0.1)',
                  }}>
                  <Button
                    action="secondary"
                    variant="outline"
                    onPress={closeModalWithAnimation}
                    className="flex-1">
                    <ButtonText>Cancel</ButtonText>
                  </Button>
                  <Button
                    action="primary"
                    onPress={() => {
                      handleDateTimeConfirm();
                      // Close modal after confirming (handleDateTimeConfirm doesn't close it)
                      closeModalWithAnimation();
                    }}
                    className="flex-1">
                    <ButtonText>Confirm</ButtonText>
                  </Button>
                </View>
              </View>
            </View>
          </Animated.View>
    </View>
      </Modal>
    </>
  );
}

