import React from 'react';
import { View, Text } from 'react-native';
import { JobApplicationDetail } from './JobApplicationDetail';
import { JobApplyFormModal } from './JobApplyFormModal';

type JobRoleApplicationPanelProps = {
  projectData: any;
  roleWithSchedules: any;
  application?: any;
  soleUserId?: string | null;
  onApplicationUpdated?: () => void;
};

export function JobRoleApplicationPanel({
  projectData,
  roleWithSchedules,
  application,
  soleUserId,
  onApplicationUpdated,
}: JobRoleApplicationPanelProps) {
  if (!roleWithSchedules?.role) {
    return null;
  }

  return (
    <View className="gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-white">
          {application ? 'Your Application' : 'Apply for this role'}
        </Text>
        <Text className="text-xs text-white/70">
          Role #{roleWithSchedules.role.id} • {roleWithSchedules.role.roleTitle || 'Untitled role'}
        </Text>
      </View>

      {application ? (
        <JobApplicationDetail
          application={application}
          roleWithSchedules={roleWithSchedules}
          onDeleted={onApplicationUpdated}
        />
      ) : (
        <JobApplyFormModal
          projectData={projectData}
          roleWithSchedules={roleWithSchedules}
          soleUserId={soleUserId}
          onSubmitted={onApplicationUpdated}
        />
      )}
    </View>
  );
}
