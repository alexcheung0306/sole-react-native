import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { Input, InputField } from '@/components/ui/input';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import {
  validateActivityTitle,
  validateActivityType,
  validateScheduleList,
  validateTimeSlot,
  ScheduleObject,
} from '@/lib/validations/role-validation';
import { activityTypes } from '@/components/form-components/options-to-use';
import { SingleWheelPickerInput } from '@/components/form-components/SingleWheelPickerInput';
import { LocationMapPickerInput } from '@/components/form-components/LocationMapPickerInput';
import { DateTimePickerInput } from '@/components/form-components/DateTimePickerInput';
import { parseDateTime, formatDateTime, formatDisplayDateTime } from '@/lib/datetime';

interface RoleScheduleListInputsProps {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  setValues: (values: any, shouldValidate?: boolean) => void;
  touched: any;
  setFieldTouched: (field: string, touched: boolean, shouldValidate?: boolean) => void;
  onFillLater?: () => void;
  fillSchedulesLater: boolean;
  isFinal?: boolean;
  isSendOffer?: boolean; // When true, prevents adding new activities and changing activity types
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
  isSendOffer = false,
  onRegisterScrollClose,
  showTypePicker = false,
  setShowTypePicker,
  selectedActivityIndex = null,
  setSelectedActivityIndex,
  onActivityTypeSelect,
  setActivityTypeSelectCallback,
}: RoleScheduleListInputsProps) {
  const [localTouched, setLocalTouched] = useState<Record<string, boolean>>({});

  // Accordion state - track which single activity is expanded (closed by default)
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);

  // Toggle accordion for a specific activity (only one can be open at a time)
  const toggleActivity = (activityIndex: number) => {
    setExpandedActivity((prev) => {
      // If clicking the same activity, close it. Otherwise, open the new one
      return prev === activityIndex ? null : activityIndex;
    });
  };

  // Legacy props kept for compatibility but no longer used with wheel picker
  // Activity type selection is now handled by SingleWheelPickerInput component


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
    const newActivityIndex = updatedActivities.length;
    updatedActivities.push(newActivity);
    setFieldValue('activityScheduleLists', updatedActivities);
    // Open the newly created activity (and close any other open activity)
    setExpandedActivity(newActivityIndex);
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

  // Helper function to handle date/time changes using DateTimePickerInput
  const handleTimeChange = (
    activityIndex: number,
    scheduleIndex: number,
    field: 'fromTime' | 'toTime',
    value: string
  ) => {
    // Get fresh copy of activities from values
    const currentActivities = [...(values.activityScheduleLists || [])];

    // Ensure the structure exists
    if (!currentActivities[activityIndex]) {
      console.error('Activity index out of bounds:', activityIndex);
      return;
    }

    if (!currentActivities[activityIndex].schedules) {
      currentActivities[activityIndex].schedules = [];
    }

    if (!currentActivities[activityIndex].schedules[scheduleIndex]) {
      console.error('Schedule index out of bounds:', scheduleIndex);
      return;
    }

    // Update the specific field
    currentActivities[activityIndex].schedules[scheduleIndex][field] = value;

    // Update form value
    setFieldValue('activityScheduleLists', currentActivities);

    const fieldname = `activityScheduleLists.${activityIndex}.schedules.${scheduleIndex}.${field}`;
    handleFieldBlur(fieldname);
  };

  // Helper to get minimum date for end time (should be start time if it exists)
  const getMinimumDate = (schedule: ScheduleObject, field: 'fromTime' | 'toTime'): Date | undefined => {
    if (field === 'toTime' && schedule.fromTime) {
      const fromDate = parseDateTime(schedule.fromTime);
      if (fromDate && !isNaN(fromDate.getTime())) {
        return fromDate;
      }
    }
    return undefined;
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

                const isExpanded = expandedActivity === activityIndex;

                return (
                  <View
                    key={`activity-${activityIndex}`}
                    className={`mb-4 rounded-lg border ${hasErrors ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-zinc-800/50'
                      }`}>
                    {/* Accordion Header */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleActivity(activityIndex)}
                      className={`flex-row items-center justify-between rounded-lg px-4 py-3 ${hasErrors ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-zinc-800/50'
                        }`}
                      style={{ backgroundColor: hasErrors ? 'rgba(239, 68, 68, 0.1)' : 'rgba(39, 39, 42, 0.5)' }}>
                      <View className="flex-row items-center gap-2 flex-1">
                        {isExpanded ? (
                          <ChevronUp size={20} color="#ffffff" />
                        ) : (
                          <ChevronDown size={20} color="#ffffff" />
                        )}
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
                        <Text className="text-white flex-1">{activity.title || 'Untitled'}</Text>
                      </View>
                      {!isSendOffer && getActivities().length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeActivity(activityIndex)}
                          className="ml-2">
                          <Trash2 size={20} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>

                    {/* Content - Conditionally Rendered */}
                    {isExpanded && (
                      <View className="p-4">

                        {/* Activity Title */}
                        <View className="mb-3">
                          <Text className="mb-2 text-sm text-white">Activity Title *</Text>
                          <Input className="rounded-2xl border-white/20 bg-zinc-700">
                            <InputField
                              value={activity.title || ''}
                              onChangeText={(text: string) => {
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
                          {isSendOffer ? (
                            // Read-only display when sending offer
                            <View>
                              <Text className="mb-2 text-sm text-white">Activity Type</Text>
                              <View className="mt-3 flex-row items-center justify-between rounded-2xl border border-white/30 bg-white/5 px-4 py-3">
                                <Text className="flex-1 text-sm font-semibold text-white">
                                  {activity.type
                                    ? activityTypes.find((t) => t.key === activity.type)?.label ||
                                    activity.type
                                    : 'Not selected'}
                                </Text>
                              </View>
                            </View>
                          ) : (
                            <SingleWheelPickerInput
                              title="Activity Type"
                              value={activity.type || null}
                              onChange={(typeKey) => {
                                const currentActivities = [...getActivities()];
                                if (currentActivities[activityIndex]) {
                                  currentActivities[activityIndex].type = typeKey;
                                  setFieldValue('activityScheduleLists', currentActivities);
                                  handleFieldBlur(`activityScheduleLists.${activityIndex}.type`);
                                }
                              }}
                              options={getAvailableActivityTypes(activityIndex).map((type) => ({
                                value: type.key,
                                label: type.label,
                              }))}
                              placeholder="Select activity type"
                              error={isTypeTouched ? validateActivityType(activity.type) || undefined : undefined}
                            />
                          )}
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
                                  className="mb-3 rounded-2xl border border-white/10 bg-zinc-700/50 p-3">
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
                                    <LocationMapPickerInput
                                      value={schedule.location || ''}
                                      onChangeText={(text: string) => {
                                        const updated = [...getActivities()];
                                        updated[activityIndex].schedules[scheduleIndex].location = text;
                                        setFieldValue('activityScheduleLists', updated);
                                      }}
                                      onBlur={() => handleFieldBlur(locationFieldname)}
                                      placeholder="Enter or select location"
                                    />
                                    {scheduleError ? (
                                      <Text className="mt-1 text-xs text-red-400 ">{scheduleError}</Text>
                                    ) : null}
                                  </View>

                                  {/* From Time */}
                                  <View className="mb-3">
                                    <DateTimePickerInput
                                      value={schedule.fromTime || ''}
                                      onChange={(value) => handleTimeChange(activityIndex, scheduleIndex, 'fromTime', value)}
                                      label="Start Time"
                                      placeholder="Select start time"
                                      errorMessagePrefix="Start time"
                                      allowPastDates={true}
                                      buttonClassName="rounded-2xl border border-white/20 bg-zinc-600"
                                    />
                                    {validateTimeSlot(schedule) ? (
                                      <Text className="mt-1 text-xs text-red-400">
                                        {validateTimeSlot(schedule)}
                                      </Text>
                                    ) : null}
                                  </View>

                                  {/* To Time */}
                                  <View className="mb-3">
                                    <DateTimePickerInput
                                      value={schedule.toTime || ''}
                                      onChange={(value) => handleTimeChange(activityIndex, scheduleIndex, 'toTime', value)}
                                      label="End Time"
                                      placeholder="Select end time"
                                      errorMessagePrefix="End time"
                                      allowPastDates={true}
                                      minimumDate={getMinimumDate(schedule, 'toTime')}
                                      buttonClassName="rounded-2xl border border-white/20 bg-zinc-600"
                                    />
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
                            action="primary"
                            size="sm"
                            onPress={() => addSchedule(activityIndex)}
                            className="w-full rounded-2xl">
                            <ButtonIcon as={Plus} size={16} color="#ffffff" />
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
                              className="rounded-2xl border-white/20 bg-zinc-700">
                              <TextareaInput
                                value={activity.remarks || ''}
                                onChangeText={(text: string) => {
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
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {!isSendOffer && (
              <View className="flex-row gap-3">
                <Button action="primary" onPress={addActivity} className="flex-1 rounded-2xl">
                  <ButtonIcon as={Plus} size={20} color="#ffffff" />
                  <ButtonText>New Activity</ButtonText>
                </Button>
                {!isFinal && onFillLater && (
                  <Button
                    action="secondary"
                    variant="outline"
                    onPress={onFillLater}
                    className="flex-1 rounded-2xl">
                    <ButtonText>Fill Later</ButtonText>
                  </Button>
                )}
              </View>
            )}
          </>
        )}
      </View>

      {/* Activity Type Picker is now handled by SingleWheelPickerInput - no separate modal needed */}

      {/* Date/Time picker is now handled by DateTimePickerInput component - no custom modal needed */}

    </>
  );
}
