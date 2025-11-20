import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Plus, Trash2, MapPin } from 'lucide-react-native';
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
}: RoleScheduleListInputsProps) {
  const [localTouched, setLocalTouched] = useState<Record<string, boolean>>({});
  const [selectedActivityIndex, setSelectedActivityIndex] = useState<number | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);

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

  const activities = values.activityScheduleLists || [];

  return (
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
            {activities.map((activity: any, activityIndex: number) => {
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
                    {activities.length > 1 && (
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
                          const updated = [...activities];
                          updated[activityIndex].title = text;
                          setFieldValue('activityScheduleLists', updated);
                        }}
                        onBlur={() => handleFieldBlur(titleFieldname)}
                        placeholder="Enter activity title"
                        placeholderTextColor="#6b7280"
                        className="text-white"
                      />
                    </Input>
                    {isTitleTouched && validateActivityTitle(activity.title) && (
                      <Text className="mt-1 text-xs text-red-400">{validateActivityTitle(activity.title)}</Text>
                    )}
                  </View>

                  {/* Activity Type */}
                  <View className="mb-3">
                    <Text className="mb-2 text-sm text-white">Activity Type *</Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (!isFinal) {
                          setSelectedActivityIndex(activityIndex);
                          setShowTypePicker(true);
                        }
                      }}
                      disabled={isFinal}
                      className="flex-row items-center justify-between rounded-lg border border-white/20 bg-zinc-700 p-3">
                      <Text className="text-white">{activity.type ? activityTypes.find((t) => t.key === activity.type)?.label || activity.type : 'Select activity type'}</Text>
                      {!isFinal && <ChevronDown size={16} color="#ffffff" />}
                    </TouchableOpacity>
                    {isTypeTouched && validateActivityType(activity.type) && (
                      <Text className="mt-1 text-xs text-red-400">{validateActivityType(activity.type)}</Text>
                    )}
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
                                  const updated = [...activities];
                                  updated[activityIndex].schedules[scheduleIndex].location = text;
                                  setFieldValue('activityScheduleLists', updated);
                                }}
                                onBlur={() => handleFieldBlur(locationFieldname)}
                                placeholder="Enter location"
                                placeholderTextColor="#6b7280"
                                className="text-white"
                              />
                            </Input>
                            {scheduleError && <Text className="mt-1 text-xs text-red-400">{scheduleError}</Text>}
                          </View>

                          {/* From Time */}
                          <View className="mb-3">
                            <Text className="mb-1 text-xs text-white/80">Start Time * (YYYY-MM-DD HH:mm)</Text>
                            <Input className="border-white/20 bg-zinc-600">
                              <InputField
                                value={schedule.fromTime || ''}
                                onChangeText={(text) => {
                                  const updated = [...activities];
                                  updated[activityIndex].schedules[scheduleIndex].fromTime = text;
                                  setFieldValue('activityScheduleLists', updated);
                                  handleFieldBlur(fromTimeFieldname);
                                }}
                                onBlur={() => handleFieldBlur(fromTimeFieldname)}
                                placeholder="2024-12-31 09:00"
                                placeholderTextColor="#6b7280"
                                className="text-white"
                              />
                            </Input>
                          </View>

                          {/* To Time */}
                          <View className="mb-3">
                            <Text className="mb-1 text-xs text-white/80">End Time * (YYYY-MM-DD HH:mm)</Text>
                            <Input className="border-white/20 bg-zinc-600">
                              <InputField
                                value={schedule.toTime || ''}
                                onChangeText={(text) => {
                                  const updated = [...activities];
                                  updated[activityIndex].schedules[scheduleIndex].toTime = text;
                                  setFieldValue('activityScheduleLists', updated);
                                  handleFieldBlur(toTimeFieldname);
                                }}
                                onBlur={() => handleFieldBlur(toTimeFieldname)}
                                placeholder="2024-12-31 17:00"
                                placeholderTextColor="#6b7280"
                                className="text-white"
                              />
                            </Input>
                            {validateTimeSlot(schedule) && (
                              <Text className="mt-1 text-xs text-red-400">{validateTimeSlot(schedule)}</Text>
                            )}
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
                            const updated = [...activities];
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

      {/* Activity Type Picker */}
      <Actionsheet isOpen={showTypePicker} onClose={() => setShowTypePicker(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          {selectedActivityIndex !== null &&
            getAvailableActivityTypes(selectedActivityIndex).map((type) => (
              <ActionsheetItem
                key={type.key}
                onPress={() => {
                  const updated = [...activities];
                  updated[selectedActivityIndex].type = type.key;
                  setFieldValue('activityScheduleLists', updated);
                  handleFieldBlur(`activityScheduleLists.${selectedActivityIndex}.type`);
                  setShowTypePicker(false);
                  setSelectedActivityIndex(null);
                }}>
                <ActionsheetItemText>{type.label}</ActionsheetItemText>
              </ActionsheetItem>
            ))}
        </ActionsheetContent>
      </Actionsheet>
    </View>
  );
}

