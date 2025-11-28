import React from 'react';
import { View, Text } from 'react-native';
import { DisplayRoleInformation } from '~/components/project-detail/roles/DisplayRoleInformation';

type DisplayJobRoleInformationProps = {
  role: any;
  roleWithSchedules: any;
  projectData: any;
  application?: any;
};

export function DisplayJobRoleInformation({
  role,
  roleWithSchedules,
  projectData,
  application,
}: DisplayJobRoleInformationProps) {
  // Count job activities
  const countJobActivities = (roleWithSchedules: any) => {
    if (!roleWithSchedules || !Array.isArray(roleWithSchedules?.activities)) {
      return 0;
    }
    return roleWithSchedules.activities.reduce((count: number, activity: any) => {
      return activity?.type === 'job' ? count + 1 : count;
    }, 0);
  };

  const jobActivitiesCount = countJobActivities(roleWithSchedules);

  return (
    <View className="gap-4">
      {/* Use the existing DisplayRoleInformation component but without edit/delete */}
      <DisplayRoleInformation
        projectId={projectData?.id || 0}
        index={0}
        role={role}
        roleWithSchedules={roleWithSchedules}
        jobActivitiesCount={jobActivitiesCount}
        projectData={projectData}
        setCurrentRole={() => {}}
        refetchRoles={() => {}}
      />

      {/* Application Status Card */}
      {application && (
        <View className="gap-3 rounded-2xl border border-green-500/30 bg-green-500/20 p-4">
          <Text className="text-sm font-semibold uppercase tracking-wide text-green-400">
            Your Application Status
          </Text>
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium uppercase tracking-wide text-white/70">
                Status
              </Text>
              <View className="rounded-full border border-green-500/50 bg-green-500/30 px-3 py-1">
                <Text className="text-xs font-semibold text-white">
                  {application.applicationProcess || application.applicationStatus || 'Pending'}
                </Text>
              </View>
            </View>
            {application.appliedAt && (
              <View className="gap-1">
                <Text className="text-xs font-medium uppercase tracking-wide text-white/70">
                  Applied On
                </Text>
                <Text className="text-sm text-white">
                  {new Date(application.appliedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            )}
            {application.remarks && (
              <View className="gap-1">
                <Text className="text-xs font-medium uppercase tracking-wide text-white/70">
                  Remarks
                </Text>
                <Text className="text-sm text-white/80">{application.remarks}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

