import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { RoleFormPortal } from '~/components/form-components/role-form/RoleFormPortal';
import { DeleteRoleButton } from './DeleteRoleButton';
import { formatDateTimeLocale } from '@/lib/datetime';

type DisplayRoleInformationProps = {
  projectId: number;
  index: number;
  role: any;
  roleWithSchedules: any;
  jobActivitiesCount: number;
  projectData: any;
  setCurrentRole: (index: number) => void;
  refetchRoles: () => void;
  onClose?: () => void;
};

export function DisplayRoleInformation({
  projectId,
  index,
  role,
  roleWithSchedules,
  jobActivitiesCount,
  projectData,
  setCurrentRole,
  refetchRoles,
  onClose,
}: DisplayRoleInformationProps) {
  if (!role) {
    return (
      <View className="px-4 pb-4">
        <Text className="text-white">Role information not available</Text>
      </View>
    );
  }

  const allJobActivities = roleWithSchedules?.activities?.filter(
    (activity: any) => activity.type === 'job'
  );

  const calculateTotalTime = (allJobActivities: any[]) => {
    let totalTime = 0;
    if (!allJobActivities || !Array.isArray(allJobActivities)) {
      return 0;
    }

    allJobActivities.forEach((activity) => {
      if (activity.schedules && Array.isArray(activity.schedules)) {
        activity.schedules.forEach((schedule: any) => {
          const fromTime = new Date(schedule.fromTime);
          const toTime = new Date(schedule.toTime);
          totalTime += toTime.getTime() - fromTime.getTime();
        });
      }
    });

    return totalTime / (1000 * 60 * 60); // Convert to hours
  };

  const totalWorkingHours = calculateTotalTime(allJobActivities);
  const totalHourlyAmount =
    role.paymentBasis === 'Hourly Rate'
      ? (role.budget || 0) * (totalWorkingHours || 0)
      : undefined;

  return (
    <View className="gap-4">
        {/* Role Information Card */}
        <View className="gap-3 rounded-2xl border border-white/10 bg-zinc-800/50 p-4">
          <Text className="text-sm font-semibold uppercase tracking-wide  text-white">
            Role Information
          </Text>
          <View className="gap-3">
            <View className="gap-1">
              <Text className="text-xs font-medium uppercase tracking-wide  text-white">
                Title
              </Text>
              <Text className="text-base font-semibold text-white">
                {role.roleTitle || 'Not specified'}
              </Text>
            </View>
            <View className="gap-1">
              <Text className="text-xs font-medium uppercase tracking-wide  text-white">
                Description
              </Text>
              <Text className="text-sm leading-5  text-white">
                {role.roleDescription || 'Not specified'}
              </Text>
            </View>
            <View className="flex-row gap-4">
              <View className="flex-1 gap-1">
                <Text className="text-xs font-medium uppercase tracking-wide  text-white">
                  Payment
                </Text>
                <View>
                  <Text className="text-sm font-semibold text-white">
                    ${role.budget || 0} HKD
                  </Text>
                  <Text className="text-xs  text-white">
                    {role.paymentBasis === 'On Project' ? 'On Project' : 'Hourly Rate'}
                  </Text>
                  {role.paymentBasis === 'Hourly Rate' && (
                    <Text className="text-xs text-emerald-400">
                      {totalWorkingHours.toFixed(1)}h total: ${(totalHourlyAmount || 0).toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-xs font-medium uppercase tracking-wide  text-white">
                  Talent Numbers
                </Text>
                <Text className="text-sm font-semibold text-white">
                  {role.talentNumbers || 'Not specified'}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-4">
              <View className="flex-1 gap-1">
                <Text className="text-xs font-medium uppercase tracking-wide  text-white">
                  Overtime Payment
                </Text>
                <Text className="text-sm font-semibold text-white">
                  {role.otPayment ? 'Yes' : 'No'}
                </Text>
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-xs font-medium uppercase tracking-wide  text-white">
                  Talent Quoting
                </Text>
                <Text className="text-sm font-semibold text-white">
                  {role.talentsQuote ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Requirements Card */}
        <View className="gap-3 rounded-2xl border border-white/10 bg-zinc-800/50 p-4">
          <Text className="text-sm font-semibold uppercase tracking-wide  text-white">
            Requirements
          </Text>
          <View className="gap-3">
            <View className="flex-row gap-4">
              <View className="flex-1 gap-1">
                <Text className="text-xs font-medium uppercase tracking-wide  text-white">
                  Gender
                </Text>
                <Text className="text-sm font-semibold text-white">
                  {role.requiredGender || 'Not specified'}
                </Text>
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-xs font-medium uppercase tracking-wide  text-white">
                  Age Range
                </Text>
                <Text className="text-sm font-semibold text-white">
                  {role.ageMin || 0} - {role.ageMax || 0} years
                </Text>
              </View>
            </View>
            <View className="gap-1">
              <Text className="text-xs font-medium uppercase tracking-wide  text-white">
                Height Range
              </Text>
              <Text className="text-sm font-semibold text-white">
                {role.heightMin || 0} - {role.heightMax || 0} cm
              </Text>
            </View>
            {role.skills && (
              <View className="gap-1">
                <Text className="text-xs font-medium uppercase tracking-wide  text-white">
                  Skills
                </Text>
                <Text className="text-sm leading-5  text-white">{role.skills}</Text>
              </View>
            )}
            {role.requiredEthnicGroup && (
              <View className="gap-2">
                <Text className="text-xs font-medium uppercase tracking-wide  text-white">
                  Ethnic Group
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {role.requiredEthnicGroup.split(',').map((item: string, idx: number) => (
                    <View
                      key={idx}
                      className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
                      <Text className="text-xs font-medium text-white">{item.trim()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {role.category && (
              <View className="gap-2">
                <Text className="text-xs font-medium uppercase tracking-wide  text-white">
                  Category
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {role.category.split(',').map((item: string, idx: number) => (
                    <View
                      key={idx}
                      className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
                      <Text className="text-xs font-medium text-white">{item.trim()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Activity Schedules Card */}
        <View className="gap-3 rounded-2xl border border-white/10 bg-zinc-800/50 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold uppercase tracking-wide  text-white">
              Activity Schedules
            </Text>
            {jobActivitiesCount < 1 && (
              <View className="rounded-full border border-rose-500/50 bg-rose-500/20 px-2 py-1">
                <Text className="text-xs font-semibold text-white">Missing Job Schedule</Text>
              </View>
            )}
          </View>
          {roleWithSchedules.activities && roleWithSchedules.activities.length > 0 ? (
            <View className="gap-3">
              {roleWithSchedules.activities.map((activity: any, idx: number) => (
                <View
                  key={idx}
                  className="rounded-xl border border-white/10 bg-zinc-900/50 p-3 gap-2">
                  <View className="flex-row items-center gap-2">
                    <View className="rounded-full bg-blue-500 px-2.5 py-1">
                      <Text className="text-xs font-bold text-white">{idx + 1}</Text>
                    </View>
                    <View
                      className={`rounded-full px-3 py-1 ${
                        activity.type === 'casting'
                          ? 'bg-blue-500/20 border border-blue-500/50'
                          : activity.type === 'fitting'
                            ? 'bg-green-500/20 border border-green-500/50'
                            : activity.type === 'job'
                              ? 'bg-yellow-500/20 border border-yellow-500/50'
                              : 'bg-gray-500/20 border border-gray-500/50'
                      }`}>
                      <Text className="text-xs font-semibold capitalize text-white">
                        {activity.type || 'No type'}
                      </Text>
                    </View>
                    <Text className="flex-1 text-sm font-semibold text-white" numberOfLines={1}>
                      {activity.title || 'Untitled Activity'}
                    </Text>
                  </View>
                  {activity.schedules && activity.schedules.length > 0 && (
                    <View className="ml-2 gap-2 border-l-2 border-white/10 pl-3">
                      {activity.schedules.map((schedule: any, sIdx: number) => (
                        <View key={sIdx} className="gap-1">
                          <Text className="text-xs font-medium text-white/80">
                            Schedule {sIdx + 1}
                          </Text>
                          <Text className="text-sm font-semibold text-white">
                            {schedule.location || 'No location'}
                          </Text>
                          {schedule.fromTime && schedule.toTime && (
                            <Text className="text-xs  text-white">
                              {formatDateTimeLocale(schedule.fromTime, 'TBC')} -{' '}
                              {formatDateTimeLocale(schedule.toTime, 'TBC')}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                  {activity.remarks && (
                    <View className="ml-2 gap-1">
                      <Text className="text-xs font-medium  text-white">Remarks:</Text>
                      <Text className="text-xs text-white/80">{activity.remarks}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className="rounded-xl border border-white/10 bg-zinc-900/30 p-4">
              <Text className="text-center text-sm  text-white">No activities scheduled</Text>
            </View>
          )}
        </View>

        {/* Edit and Delete Role Buttons (only for Draft projects) */}
        {projectData.status === 'Draft' && (
          <View className="gap-3 border-t border-white/10 pt-4">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <RoleFormPortal
                  projectId={projectId}
                  method="PUT"
                  roleId={role.id || 0}
                  fetchedValues={roleWithSchedules}
                  refetchRoles={() => {
                    refetchRoles();
                    onClose?.();
                  }}
                />
              </View>
              <View className="flex-1">
                <DeleteRoleButton
                  projectId={projectId}
                  roleIdToDelete={role.id || 0}
                  setCurrentRole={setCurrentRole}
                  refetchRoles={() => {
                    refetchRoles();
                    onClose?.();
                  }}
                />
              </View>
            </View>
          </View>
        )}
    </View>
  );
}

