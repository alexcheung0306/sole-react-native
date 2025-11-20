import React from 'react';
import { View, Text, ScrollView } from 'react-native';

interface RoleConfirmProps {
  values: any;
}

export function RoleConfirm({ values }: RoleConfirmProps) {
  // Calculate hours for a single schedule
  const calculateScheduleHours = (fromTime: string, toTime: string) => {
    if (!fromTime || !toTime) return 0;
    try {
      const startTime = new Date(fromTime);
      const endTime = new Date(toTime);
      const durationMs = endTime.getTime() - startTime.getTime();
      return durationMs / (1000 * 60 * 60); // Convert milliseconds to hours
    } catch {
      return 0;
    }
  };

  // Calculate total working hours from job activities
  const calculateTotalWorkingHours = () => {
    if (!values.activityScheduleLists || values.activityScheduleLists.length === 0) {
      return 'undefined';
    }

    let totalHours = 0;
    let jobActivitiesCount = 0;

    if (!values.activityScheduleLists || !Array.isArray(values.activityScheduleLists)) {
      return 'undefined';
    }

    values.activityScheduleLists.forEach((activity: any) => {
      if (activity.type === 'job' && activity.schedules && Array.isArray(activity.schedules)) {
        jobActivitiesCount++;
        activity.schedules.forEach((schedule: any) => {
          const hours = calculateScheduleHours(schedule.fromTime, schedule.toTime);
          totalHours += hours;
        });
      }
    });

    if (totalHours > 0) {
      return `${totalHours.toFixed(1)} hours (${jobActivitiesCount} job activities)`;
    } else if (jobActivitiesCount > 0) {
      return 'undefined (job activities found but no time data)';
    } else {
      return 'undefined (no job activities)';
    }
  };

  const activityTypeStyles: Record<string, string> = {
    casting: 'bg-blue-500',
    fitting: 'bg-green-500',
    job: 'bg-yellow-500',
    others: 'bg-purple-500',
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return 'No time specified';
    try {
      return new Date(dateTime).toLocaleString();
    } catch {
      return dateTime;
    }
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="gap-6">
        {/* Role Information */}
        <View className="rounded-lg border border-white/10 bg-zinc-800/50 p-6">
          <Text className="mb-4 text-lg font-semibold text-white">Role Information</Text>
          <View className="gap-4">
            <View>
              <Text className="text-sm text-white/60">Role Title:</Text>
              <Text className="font-medium text-white">{values.roleTitle || 'Not specified'}</Text>
            </View>
            <View>
              <Text className="text-sm text-white/60">Payment:</Text>
              <Text className="font-medium text-white">
                ${values.budget || 0}(HKD) {values.paymentBasis || 'Not specified'}
              </Text>
            </View>
            <View>
              <Text className="text-sm text-white/60">Total Working Hours:</Text>
              <Text className="font-medium text-white">{calculateTotalWorkingHours()}</Text>
            </View>
            <View>
              <Text className="text-sm text-white/60">Talent Numbers:</Text>
              <Text className="font-medium text-white">{values.talentNumbers || 1}</Text>
            </View>
            <View>
              <Text className="text-sm text-white/60">Role Description:</Text>
              <Text className="font-medium text-white">{values.roleDescription || 'Not specified'}</Text>
            </View>
          </View>
        </View>

        {/* Role Requirements */}
        <View className="rounded-lg border border-white/10 bg-zinc-800/50 p-6">
          <Text className="mb-4 text-lg font-semibold text-white">Requirements</Text>
          <View className="gap-4">
            <View>
              <Text className="text-sm text-white/60">Gender:</Text>
              <Text className="font-medium text-white">{values.requiredGender || 'Not specified'}</Text>
            </View>
            <View>
              <Text className="text-sm text-white/60">Age Range:</Text>
              <Text className="font-medium text-white">
                {values.ageMin || 15} - {values.ageMax || 30} years
              </Text>
            </View>
            <View>
              <Text className="text-sm text-white/60">Height Range:</Text>
              <Text className="font-medium text-white">
                {values.heightMin || 160} - {values.heightMax || 210} cm
              </Text>
            </View>
            <View>
              <Text className="text-sm text-white/60">Ethnic Group:</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {values.requiredEthnicGroup
                  ? values.requiredEthnicGroup
                      .split(',')
                      .filter((item: string) => item.trim() !== '')
                      .map((item: string, index: number) => (
                        <View key={index} className="rounded-full bg-zinc-700 px-3 py-1">
                          <Text className="text-xs text-white">{item.trim()}</Text>
                        </View>
                      ))
                  : null}
              </View>
            </View>
            <View>
              <Text className="text-sm text-white/60">Skills:</Text>
              <Text className="font-medium text-white">{values.skills || 'Not specified'}</Text>
            </View>
          </View>
        </View>

        {/* Schedules */}
        <View className="rounded-lg border border-white/10 bg-zinc-800/50 p-6">
          <Text className="mb-4 text-lg font-semibold text-white">Activity Schedules</Text>
          {values.activityScheduleLists && values.activityScheduleLists.length > 0 ? (
            <View className="gap-4">
              {values.activityScheduleLists.map((activity: any, index: number) => (
                <View key={index} className="rounded-lg border border-white/10 bg-zinc-700/50 p-4">
                  <View className="mb-2 flex-row items-center gap-2">
                    <View className="rounded-full bg-blue-500 px-2 py-1">
                      <Text className="text-xs font-semibold text-white">{index + 1}</Text>
                    </View>
                    {activity.type && (
                      <View className={`rounded-full px-2 py-1 ${activityTypeStyles[activity.type] || 'bg-gray-500'}`}>
                        <Text className="text-xs text-white">{activity.type || 'No type'}</Text>
                      </View>
                    )}
                    <Text className="font-medium text-white">{activity.title || 'Untitled Activity'}</Text>
                  </View>

                  {activity.schedules && activity.schedules.length > 0 && (
                    <View className="ml-6 gap-2">
                      {activity.schedules.map((schedule: any, sIndex: number) => (
                        <View key={sIndex} className="mb-2">
                          <Text className="text-sm text-white/60">Schedule {sIndex + 1}:</Text>
                          <Text className="font-medium text-white">{schedule.location || 'No location'}</Text>
                          <Text className="text-sm text-white/60">
                            {schedule.fromTime && schedule.toTime
                              ? `${formatDateTime(schedule.fromTime)} - ${formatDateTime(schedule.toTime)}`
                              : 'No time specified'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {activity.remarks && (
                    <View className="ml-6 mt-2">
                      <Text className="text-sm text-white/60">Remarks:</Text>
                      <Text className="text-sm text-white">{activity.remarks}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-white/60">No activities scheduled</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

