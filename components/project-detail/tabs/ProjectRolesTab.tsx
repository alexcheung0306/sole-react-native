import React, { useEffect } from 'react';
import { View, ScrollView, RefreshControl, Text, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { RoleFormPortal } from '~/components/form-components/role-form/RoleFormPortal';
import { RolesBreadcrumb } from '../roles/RolesBreadcrumb';
import { ManageCandidates } from '../roles/ManageCandidates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ProjectRolesTabProps = {
  project: any;
  projectId: number;
  rolesWithSchedules: any[];
  currentRole: number;
  setCurrentRole: (index: number) => void;
  countJobActivities: any;
  refetchRoles: () => void;
  refreshing: boolean;
  onRefresh: () => void;
};

export default React.memo(function ProjectRolesTab({
  project,
  projectId,
  rolesWithSchedules,
  currentRole,
  setCurrentRole,
  countJobActivities,
  refetchRoles,
  refreshing,
  onRefresh,
}: ProjectRolesTabProps) {
  const insets = useSafeAreaInsets();
  const { onScroll } = useScrollHeader();

  // Animation for ManageCandidates transition
  const manageCandidatesTranslateX = useSharedValue(0);

  // Animate ManageCandidates transition when currentRole changes
  useEffect(() => {
    manageCandidatesTranslateX.value = withTiming(-currentRole * SCREEN_WIDTH, {
      duration: 300,
    });
  }, [currentRole, rolesWithSchedules.length]);

  // Animated style for ManageCandidates container
  const manageCandidatesAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: manageCandidatesTranslateX.value }],
  }));

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
        <View className="px-2">
          {project?.status === 'Draft' && rolesWithSchedules.length < 5 && (
            <RoleFormPortal
              projectId={projectId}
              method="POST"
              roleId={null}
              fetchedValues={null}
              isDisabled={rolesWithSchedules.length >= 5}
              refetchRoles={refetchRoles}
            />
          )}
        </View>

        {rolesWithSchedules.length === 0 ? (
          <View className="px-2">
            <View className="items-center gap-3 rounded-2xl border border-white/10 bg-zinc-800 p-8">
              <Text className="text-lg font-semibold text-white">No roles yet</Text>
              <Text className="text-center text-sm text-white/70">
                {project?.status === 'Draft'
                  ? 'Create your first role to get started.'
                  : 'No roles have been created for this project.'}
              </Text>
            </View>
          </View>
        ) : (
          <RolesBreadcrumb
            projectData={project}
            rolesWithSchedules={rolesWithSchedules}
            currentRole={currentRole}
            setCurrentRole={setCurrentRole}
            countJobActivities={countJobActivities}
            projectId={projectId}
            refetchRoles={refetchRoles}
          />
        )}

        {/* Manage Candidates - Only show for Published projects with roles */}
        {project?.status === 'Published' && rolesWithSchedules.length > 0 && (
          <View className="border-t border-white/10" style={{ overflow: 'hidden' }}>
            <Animated.View
              style={[
                {
                  flexDirection: 'row',
                  width: SCREEN_WIDTH * rolesWithSchedules.length,
                },
                manageCandidatesAnimatedStyle,
              ]}>
              {rolesWithSchedules.map((roleWithSchedule, index) => (
                <View
                  key={`manage-candidates-${roleWithSchedule?.role?.id || index}`}
                  style={{ width: SCREEN_WIDTH }}
                  className="px-2">
                  <ManageCandidates
                    projectData={project}
                    roleWithSchedules={roleWithSchedule}
                  />
                </View>
              ))}
            </Animated.View>
          </View>
        )}
      </View>
    </Animated.ScrollView>
  );
});

