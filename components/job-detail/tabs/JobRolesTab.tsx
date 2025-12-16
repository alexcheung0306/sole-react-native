import React from 'react';
import { View, RefreshControl, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { JobRolesBreadcrumb } from '../roles/JobRolesBreadcrumb';
import { JobApplicationDetail } from '../roles/JobApplicationDetail';
import JobApplyFormPortal from '~/components/form-components/job-apply-form/JobApplyFormPortal';
import Animated from 'react-native-reanimated';

type JobRolesTabProps = {
  project: any;
  projectId: number;
  rolesWithSchedules: any[];
  currentRole: number;
  setCurrentRole: (index: number) => void;
  applicationsData?: any[];
  soleUserId?: string;
  onApplicationUpdated: () => void;
  rolesLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
};

export default React.memo(function JobRolesTab({
  project,
  projectId,
  rolesWithSchedules,
  currentRole,
  setCurrentRole,
  applicationsData,
  soleUserId,
  onApplicationUpdated,
  rolesLoading,
  refreshing,
  onRefresh,
}: JobRolesTabProps) {
  const insets = useSafeAreaInsets();
  const { onScroll } = useScrollHeader();

  const application = applicationsData?.find(
    (app: any) => app.roleId === rolesWithSchedules[currentRole]?.role?.id
  );

  return (
    <Animated.ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="rgb(255, 255, 255)"
          colors={['rgb(255, 255, 255)']}
        />
      }
      contentContainerStyle={{
        paddingTop: insets.top + 140,
        paddingBottom: insets.bottom + 80,
        paddingHorizontal: 0,
      }}
      showsVerticalScrollIndicator={true}>
      <View className="gap-4">
        {rolesLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-3 text-sm text-gray-400">Loading roles...</Text>
          </View>
        ) : rolesWithSchedules.length === 0 ? (
          <View className="items-center gap-3 rounded-2xl border border-white/10 bg-zinc-800 p-8">
            <Text className="text-lg font-semibold text-white">No roles yet</Text>
            <Text className="text-center text-sm text-white/70">
              No roles have been created for this job.
            </Text>
          </View>
        ) : (
          <>
            <JobRolesBreadcrumb
              projectData={project}
              rolesWithSchedules={rolesWithSchedules}
              currentRole={currentRole}
              setCurrentRole={setCurrentRole}
              applicationsData={applicationsData}
              soleUserId={soleUserId}
              onApplicationUpdated={onApplicationUpdated}
            />

            {rolesWithSchedules[currentRole] && (
              <>
                {application ? (
                  <JobApplicationDetail
                    application={application}
                    roleWithSchedules={rolesWithSchedules[currentRole]}
                    onDeleted={onApplicationUpdated}
                  />
                ) : (
                  <View className="rounded-2xl border bg-zinc-700 p-4 mx-2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-white">Apply for this role</Text>
                        <Text className="text-sm text-white/70">
                          Share your quote and details to submit your application.
                        </Text>
                      </View>
                      {!soleUserId && (
                        <Text className="ml-2 text-xs font-semibold text-amber-300">
                          Sign in to apply
                        </Text>
                      )}
                    </View>
                    <JobApplyFormPortal
                      projectId={projectId}
                      roleId={rolesWithSchedules[currentRole]?.role?.id}
                      soleUserId={soleUserId}
                    />
                  </View>
                )}
              </>
            )}
          </>
        )}
      </View>
    </Animated.ScrollView>
  );
});

