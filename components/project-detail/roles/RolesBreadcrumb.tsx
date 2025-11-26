import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import CollapseDrawer2 from '@/components/custom/collapse-drawer2';
import { DisplayRoleInformation } from './DisplayRoleInformation';
import { ManageCandidates } from './ManageCandidates';

type RolesBreadcrumbProps = {
  projectData: any;
  rolesWithSchedules: any[];
  currentRole: number;
  setCurrentRole: (index: number) => void;
  countJobActivities: (roleWithSchedules: any) => number;
  projectId: number;
  refetchRoles: () => void;
};

export function RolesBreadcrumb({
  projectData,
  rolesWithSchedules,
  currentRole,
  setCurrentRole,
  countJobActivities,
  projectId,
  refetchRoles,
}: RolesBreadcrumbProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Open drawer when a role is selected
  const handleRolePress = (index: number) => {
    setCurrentRole(index);
    setIsDrawerOpen(true);
  };

  if (rolesWithSchedules.length === 0) {
    return null;
  }

  // Always use currentRole for the drawer content
  const selectedRole = rolesWithSchedules[currentRole] || null;

  return (
    <View className="ml-2 gap-4">
      <Text className="text-sm font-semibold text-white/70">
        Role{rolesWithSchedules.length > 1 ? 's' : ''} for the Project - {projectData?.projectName}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
        {rolesWithSchedules.map((roleWithSchedule, index) => {
          const role = roleWithSchedule?.role || {};
          const isActive = index === currentRole;
          const jobActivitiesCount = countJobActivities(roleWithSchedule);

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
                {jobActivitiesCount < 1 && <AlertCircle size={14} color="#ef4444" />}
              </View>
              <Text className={`mt-1 text-xs ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                {jobActivitiesCount} activities • {role.talentNumbers || 1} talent(s)
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
              <DisplayRoleInformation
                projectId={projectId}
                index={currentRole}
                role={selectedRole?.role}
                roleWithSchedules={selectedRole}
                jobActivitiesCount={countJobActivities(selectedRole)}
                projectData={projectData}
                setCurrentRole={(index) => {
                  setCurrentRole(index);
                  // Keep drawer open when switching roles
                }}
                refetchRoles={() => {
                  refetchRoles();
                }}
                onClose={() => setIsDrawerOpen(false)}
              />
              {projectData?.status === 'Published' && selectedRole && (
                <View className="mt-6 border-t border-white/10 pt-6">
                  <ManageCandidates projectData={projectData} roleWithSchedules={selectedRole} />
                </View>
              )}
            </ScrollView>
          </View>
        </CollapseDrawer2>
      )}
    </View>
  );
}
