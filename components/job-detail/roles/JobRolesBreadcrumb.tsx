import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import CollapseDrawer2 from '@/components/custom/collapse-drawer2';
import { DisplayJobRoleInformation } from './DisplayJobRoleInformation';

type JobRolesBreadcrumbProps = {
  projectData: any;
  rolesWithSchedules: any[];
  currentRole: number;
  setCurrentRole: (index: number) => void;
  applicationsData?: any[];
};

export function JobRolesBreadcrumb({
  projectData,
  rolesWithSchedules,
  currentRole,
  setCurrentRole,
  applicationsData,
}: JobRolesBreadcrumbProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Open drawer when a role is selected
  const handleRolePress = (index: number) => {
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
            <TouchableOpacity
              key={`role-${role.id}-${index}`}
              className={`min-w-[160px] rounded-2xl border px-4 py-3 ${
                isActive ? 'border-blue-500 bg-blue-500/15' : 'border-white/20 bg-zinc-800/60'
              }`}
              onPress={() => handleRolePress(index)}>
              <View className="flex-row items-center justify-between gap-2">
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
          );
        })}
      </ScrollView>

      {/* Role Details Drawer */}
      {selectedRole && (
        <CollapseDrawer2
          showDrawer={isDrawerOpen}
          setShowDrawer={setIsDrawerOpen}
          title={`${selectedRole?.role?.roleTitle || 'Role Details'} • Role #${selectedRole?.role?.id ? String(selectedRole.role.id) : ''} • ${currentRole + 1} of ${rolesWithSchedules.length}`}>
          <View className="px-5 pb-6">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}>
              <DisplayJobRoleInformation
                role={selectedRole?.role}
                roleWithSchedules={selectedRole}
                projectData={projectData}
                application={applicationsData?.find((app: any) => app.roleId === selectedRole?.role?.id)}
              />
            </ScrollView>
          </View>
        </CollapseDrawer2>
      )}
    </View>
  );
}

