import React from 'react';
import { View } from 'react-native';
import { DisplayJobRoleInformation } from './DisplayJobRoleInformation';
import { JobApplyFormModal } from './JobApplyFormModal';
import { JobApplicationDetail } from './JobApplicationDetail';

type JobRoleDrawerContentProps = {
  projectData: any;
  roleWithSchedules: any;
  application?: any;
  soleUserId?: string | null;
  onApplicationSubmitted?: () => void;
};

export function JobRoleDrawerContent({
  projectData,
  roleWithSchedules,
  application,
  soleUserId,
  onApplicationSubmitted,
}: JobRoleDrawerContentProps) {
  return (
    <View className="gap-5">
      <DisplayJobRoleInformation
        role={roleWithSchedules?.role}
        roleWithSchedules={roleWithSchedules}
        projectData={projectData}
        application={application}
      />
    </View>
  );
}
