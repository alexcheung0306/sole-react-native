import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { AlertCircle, InfoIcon } from 'lucide-react-native';
import CollapseDrawer from '~/components/custom/collapse-drawerV1';
import { DisplayRoleInformation } from './DisplayRoleInformation';
import CollapseDrawer2 from '~/components/custom/collapse-drawer';

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
          // Count total activities (all types, not just job)
          const totalActivitiesCount = Array.isArray(roleWithSchedule?.activities)
            ? roleWithSchedule.activities.length
            : 0;

          return (
            <View
              key={`role-${role.id}-${index}`}
              className={`min-w-[160px] flex-row items-center overflow-hidden rounded-2xl border ${
                isActive ? 'border-white bg-zinc-700' : 'border-white/20 bg-zinc-800/60'
              }`}>
              <TouchableOpacity
                className="flex-1 py-4 pl-2 pr-1"
                activeOpacity={1}
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
                <Text className={`mt-1 text-xs ${isActive ? 'text-white' : 'text-white'}`}>
                  ID: {role.id || 'N/A'} • {totalActivitiesCount} activities •{' '}
                  {role.talentNumbers || 1} talent(s) required
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-shrink-0 px-2 py-4"
                onPress={() => handleRolePress(index)}>
                {jobActivitiesCount < 1 ? (
                  <AlertCircle size={16} color="#ef4444" />
                ) : (
                  <InfoIcon size={16} color={isActive ? '#ffffff' : '#a1a1aa'} />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Role Details Drawer */}
      {/* {selectedRole && (
        <CollapseDrawer
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
            </ScrollView>
          </View>
        </CollapseDrawer>
      )} */}

      {/* Role Details Drawer */}
      {selectedRole && (
        <CollapseDrawer
          showDrawer={isDrawerOpen}
          setShowDrawer={setIsDrawerOpen}
          title={`${selectedRole?.role?.roleTitle || 'Role Details'} • Role #${selectedRole?.role?.id ? String(selectedRole.role.id) : ''} • ${currentRole + 1} of ${rolesWithSchedules.length}`}>
          <View className="px-5 pb-6">
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
          </View>
        </CollapseDrawer>
      )}
    </View>
  );
}
