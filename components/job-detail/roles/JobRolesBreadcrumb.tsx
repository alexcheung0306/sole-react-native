import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Briefcase, InfoIcon } from 'lucide-react-native';
import CollapseDrawer from '~/components/custom/collapse-drawer';
import { JobRoleDrawerContent } from './JobRoleDrawerContent';

type JobRolesBreadcrumbProps = {
  projectData: any;
  rolesWithSchedules: any[];
  currentRole: number;
  setCurrentRole: (index: number) => void;
  applicationsData?: any[];
  soleUserId?: string | null;
  onApplicationUpdated?: () => void;
};

export function JobRolesBreadcrumb({
  projectData,
  rolesWithSchedules,
  currentRole,
  setCurrentRole,
  applicationsData,
  soleUserId,
  onApplicationUpdated,
}: JobRolesBreadcrumbProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Open drawer via info icon
  const handleInfoPress = (index: number) => {
    setCurrentRole(index);
    setIsDrawerOpen(true);
  };

  if (rolesWithSchedules.length === 0) {
    return (
      <View className="items-center gap-3 rounded-2xl border border-white/10 bg-zinc-800 p-8">
        <Briefcase size={64} color="#4b5563" />
        <Text className="text-lg font-semibold text-white">No roles available</Text>
        <Text className="text-center text-sm text-white/70">
          No roles have been created for this job yet.
        </Text>
      </View>
    );
  }

  // Always use currentRole for the drawer content
  const selectedRole = rolesWithSchedules[currentRole] || null;
  const selectedApplication = applicationsData?.find(
    (app: any) => app.roleId === selectedRole?.role?.id
  );

  return (
    <View className="ml-2 gap-4">
      <Text className="text-sm font-semibold text-white/70">
        Role{rolesWithSchedules.length > 1 ? 's' : ''} for the Job - {projectData?.projectName}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
        {rolesWithSchedules.map((roleWithSchedule, index) => {
          const role = roleWithSchedule?.role || {};
          const isActive = index === currentRole;
          const application = applicationsData?.find((app: any) => app.roleId === role.id);

          return (
            <View
              key={`role-${role.id}-${index}`}
              className={`min-w-[160px] flex-row items-center rounded-2xl border overflow-hidden ${
                isActive ? 'border-blue-500 bg-blue-500/15' : 'border-white/20 bg-zinc-800/60'
              }`}>
              <TouchableOpacity
                className="flex-1 py-3 pl-4 pr-2"
                activeOpacity={0.9}
                onPress={() => setCurrentRole(index)}>
                <View className="flex-row items-center gap-2">
                  <Text
                    className={`flex-1 text-sm font-semibold ${
                      isActive ? 'text-white' : 'text-white/80'
                    }`}
                    numberOfLines={1}>
                    {role.roleTitle || 'Untitled role'}
                  </Text>
                </View>
                <Text className={`mt-1 text-xs ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                  {application ? `Applied: ${application.applicationProcess || application.applicationStatus}` : 'Not applied'} • {role.talentNumbers || 1} position(s)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-3 py-3 flex-shrink-0"
                activeOpacity={0.9}
                onPress={() => handleInfoPress(index)}>
                <InfoIcon size={16} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Role Details Drawer */}
      {selectedRole && (
        <CollapseDrawer
          showDrawer={isDrawerOpen}
          setShowDrawer={setIsDrawerOpen}
          title={`${selectedRole?.role?.roleTitle || 'Role Details'} • Role #${selectedRole?.role?.id ? String(selectedRole.role.id) : ''} • ${currentRole + 1} of ${rolesWithSchedules.length}`}>
          <View className="px-5 pb-6">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}>
              <JobRoleDrawerContent
                projectData={projectData}
                roleWithSchedules={selectedRole}
                application={selectedApplication}
                soleUserId={soleUserId}
                onApplicationSubmitted={onApplicationUpdated}
              />
            </ScrollView>
          </View>
        </CollapseDrawer>
      )}
    </View>
  );
}

