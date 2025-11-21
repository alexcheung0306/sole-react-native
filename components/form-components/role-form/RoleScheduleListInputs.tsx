import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Plus, Trash2, MapPin, Calendar, Clock } from 'lucide-react-native';
import { Input, InputField } from '@/components/ui/input';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicatorWrapper,
  ActionsheetDragIndicator,
  ActionsheetItem,
  ActionsheetItemText,
} from '@/components/ui/actionsheet';
import { ChevronDown } from 'lucide-react-native';
import {
  validateActivityTitle,
  validateActivityType,
  validateScheduleList,
  validateTimeSlot,
  ScheduleObject,
} from '@/lib/validations/role-validation';
import { getFieldError } from '@/lib/validations/form-field-validations';
import { activityTypes } from '@/components/form-components/options-to-use';
import { SingleSelectCard } from '@/components/form-components/SingleSelectCard';
import { ActivityTypeSelector } from '~/components/form-components/role-form/ActivityTypeSelector';
import DatePicker from 'react-native-date-picker';

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
  setActivityTypeSelectCallback?: (
    callback: (activityIndex: number, typeKey: string) => void
  ) => void;
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
  const [internalSelectedActivityIndex, setInternalSelectedActivityIndex] = useState<number | null>(
    null
  );

  const actualShowTypePicker =
    setShowTypePicker !== undefined ? showTypePicker : internalShowTypePicker;
  const actualSelectedActivityIndex =
    setSelectedActivityIndex !== undefined ? selectedActivityIndex : internalSelectedActivityIndex;
  const actualSetShowTypePicker = setShowTypePicker || setInternalShowTypePicker;
  const actualSetSelectedActivityIndex =
    setSelectedActivityIndex || setInternalSelectedActivityIndex;

  // Date/Time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerConfig, setDatePickerConfig] = useState<{
    activityIndex: number;
    scheduleIndex: number;
    field: 'fromTime' | 'toTime';
    currentValue: string;
  } | null>(null);
  const [pickerInitialDate, setPickerInitialDate] = useState<Date>(new Date());

  // Set up callback for activity type selection (if needed for legacy support)
  useEffect(() => {
    if (setActivityTypeSelectCallback && onActivityTypeSelect) {
      setActivityTypeSelectCallback(onActivityTypeSelect);
    }
  }, [setActivityTypeSelectCallback, onActivityTypeSelect]);


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
    const updatedActivities = values.activityScheduleLists.filter(
      (_: any, index: number) => index !== activityIndex
    );
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
    updatedLists[activityIndex].schedules = updatedLists[activityIndex].schedules.filter(
      (_: any, index: number) => index !== scheduleIndex
    );
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

  const openDateTimePicker = (
    activityIndex: number,
    scheduleIndex: number,
    field: 'fromTime' | 'toTime'
  ) => {
    // Get fresh copy from values to ensure we have latest data
    const currentActivities = [...(values.activityScheduleLists || [])];

    // Ensure activity exists
    if (!currentActivities[activityIndex]) {
      console.error('Activity index out of bounds:', activityIndex);
      return;
    }

    // Ensure schedules array exists
    if (
      !currentActivities[activityIndex].schedules ||
      !Array.isArray(currentActivities[activityIndex].schedules)
    ) {
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
    setPickerInitialDate(new Date(dateInstance));
    setShowDatePicker(true);
  };

  const handleDateTimeConfirm = (date: Date) => {
    if (!datePickerConfig) return;

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

    if (
      !currentActivities[datePickerConfig.activityIndex].schedules[datePickerConfig.scheduleIndex]
    ) {
      console.error('Schedule index out of bounds:', datePickerConfig.scheduleIndex);
      setShowDatePicker(false);
      setDatePickerConfig(null);
      return;
    }

    // Update the specific field
    currentActivities[datePickerConfig.activityIndex].schedules[datePickerConfig.scheduleIndex][
      datePickerConfig.field
    ] = formatDateTime(date);

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
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
                        isFieldTouched(
                          `activityScheduleLists.${activityIndex}.schedules.${scheduleIndex}.fromTime`
                        ) ||
                        isFieldTouched(
                          `activityScheduleLists.${activityIndex}.schedules.${scheduleIndex}.toTime`
                        );
                      const isScheduleTouched = isLocationTouched || isTimeTouched;
                      return isScheduleTouched ? validateScheduleList(schedule) : null;
                    })
                  : [];

                const hasErrors =
                  (activityHasErrors || (scheduleHasErrors && scheduleHasErrors.some(Boolean))) &&
                  !isActivityComplete(activity);

                return (
                  <View
                    key={activityIndex}
                    className={`mb-4 rounded-lg border p-4 ${
                      hasErrors ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-zinc-800/50'
                    }`}>
                    <View className="mb-4 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View className="rounded-full bg-blue-500 px-3 py-1">
                          <Text className="text-xs font-semibold text-white">
                            {activityIndex + 1}
                          </Text>
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
                        <Text className="mt-1 text-xs text-red-400">
                          {validateActivityTitle(activity.title)}
                        </Text>
                      ) : null}
                    </View>

                    {/* Activity Type */}
                    <View className="mb-3">
                      <SingleSelectCard
                        label="Activity Type"
                        selectedItem={
                          activity.type
                            ? activityTypes.find((t) => t.key === activity.type)?.label ||
                              activity.type
                            : null
                        }
                        onItemChange={(label) => {
                          const currentActivities = [...getActivities()];
                          if (currentActivities[activityIndex]) {
                            const typeKey =
                              activityTypes.find((t) => t.label === label)?.key || label;
                            currentActivities[activityIndex].type = typeKey;
                            setFieldValue('activityScheduleLists', currentActivities);
                            handleFieldBlur(`activityScheduleLists.${activityIndex}.type`);
                          }
                        }}
                        fieldName={`activityScheduleLists.${activityIndex}.type`}
                        setFieldValue={(field, value) => {
                          // This won't be called directly, but kept for compatibility
                        }}
                        selectorComponent={ActivityTypeSelector}
                        buttonText={activity.type ? 'Change Activity Type' : 'Select Activity Type'}
                        placeholder="Select activity type"
                        selectorProps={{
                          availableTypes: getAvailableActivityTypes(activityIndex),
                          onSaveKey: (typeKey: string | null) => {
                            const currentActivities = [...getActivities()];
                            if (currentActivities[activityIndex]) {
                              currentActivities[activityIndex].type = typeKey || '';
                              setFieldValue('activityScheduleLists', currentActivities);
                              handleFieldBlur(`activityScheduleLists.${activityIndex}.type`);
                            }
                          },
                        }}
                      />
                      {isTypeTouched && validateActivityType(activity.type) ? (
                        <Text className="mt-1 text-xs text-red-400">
                          {validateActivityType(activity.type)}
                        </Text>
                      ) : null}
                    </View>

                    {/* Schedules */}
                    <View className="mb-3">
                      <Text className="mb-2 text-sm text-white">Schedules *</Text>
                      {activity.schedules?.map(
                        (schedule: ScheduleObject, scheduleIndex: number) => {
                          const locationFieldname = `activityScheduleLists.${activityIndex}.schedules.${scheduleIndex}.location`;
                          const fromTimeFieldname = `activityScheduleLists.${activityIndex}.schedules.${scheduleIndex}.fromTime`;
                          const toTimeFieldname = `activityScheduleLists.${activityIndex}.schedules.${scheduleIndex}.toTime`;
                          const isLocationTouched = isFieldTouched(locationFieldname);
                          const scheduleError = isLocationTouched
                            ? validateScheduleList(schedule)
                            : null;

                          return (
                            <View
                              key={schedule.id || scheduleIndex}
                              className="mb-3 rounded-lg border border-white/10 bg-zinc-700/50 p-3">
                              <View className="mb-2 flex-row items-center justify-between">
                                <Text className="text-xs text-white/80">
                                  Schedule {scheduleIndex + 1}
                                </Text>
                                {activity.schedules.length > 1 && (
                                  <TouchableOpacity
                                    onPress={() => removeSchedule(activityIndex, scheduleIndex)}>
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
                                      updated[activityIndex].schedules[scheduleIndex].location =
                                        text;
                                      setFieldValue('activityScheduleLists', updated);
                                    }}
                                    onBlur={() => handleFieldBlur(locationFieldname)}
                                    placeholder="Enter location"
                                    placeholderTextColor="#6b7280"
                                    className="text-white"
                                    editable={true}
                                  />
                                </Input>
                                {scheduleError ? (
                                  <Text className="mt-1 text-xs text-red-400">{scheduleError}</Text>
                                ) : null}
                              </View>

                              {/* From Time */}
                              <View className="mb-3">
                                <Text className="mb-1 text-xs text-white/80">Start Time *</Text>
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  onPress={() =>
                                    openDateTimePicker(activityIndex, scheduleIndex, 'fromTime')
                                  }
                                  className="flex-row items-center justify-between rounded-lg border border-white/20 bg-zinc-600 p-3">
                                  <View className="flex-row items-center gap-2">
                                    <Calendar size={16} color="#ffffff" />
                                    <Text className="text-white">
                                      {formatDisplayDateTime(schedule.fromTime || '')}
                                    </Text>
                                  </View>
                                  <Clock size={16} color="#ffffff" />
                                </TouchableOpacity>
                              </View>

                              {/* To Time */}
                              <View className="mb-3">
                                <Text className="mb-1 text-xs text-white/80">End Time *</Text>
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  onPress={() =>
                                    openDateTimePicker(activityIndex, scheduleIndex, 'toTime')
                                  }
                                  className="flex-row items-center justify-between rounded-lg border border-white/20 bg-zinc-600 p-3">
                                  <View className="flex-row items-center gap-2">
                                    <Calendar size={16} color="#ffffff" />
                                    <Text className="text-white">
                                      {formatDisplayDateTime(schedule.toTime || '')}
                                    </Text>
                                  </View>
                                  <Clock size={16} color="#ffffff" />
                                </TouchableOpacity>
                                {validateTimeSlot(schedule) ? (
                                  <Text className="mt-1 text-xs text-red-400">
                                    {validateTimeSlot(schedule)}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          );
                        }
                      )}

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
                        <Textarea
                          variant="default"
                          size="md"
                          className="border-white/20 bg-zinc-700">
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
                <Button
                  action="secondary"
                  variant="outline"
                  onPress={onFillLater}
                  className="flex-1">
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

      {/* Date/Time Picker */}
      <DatePicker
        modal
        open={showDatePicker}
        date={pickerInitialDate}
        mode="datetime"
        onConfirm={(date) => {
          handleDateTimeConfirm(date);
        }}
        onCancel={() => {
          setShowDatePicker(false);
          setDatePickerConfig(null);
        }}
        minuteInterval={5}
        theme="dark"
      />
    </>
  );
}
