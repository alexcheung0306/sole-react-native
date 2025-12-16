import React from 'react';
import { View, RefreshControl, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { ProjectInformationCard } from '~/components/project-detail/details/ProjectInformationCard';
import { ProjectAnnouncementsList } from '~/components/project-detail/details/ProjectAnnouncementsList';
import Animated from 'react-native-reanimated';

type JobInformationTabProps = {
  project: any;
  projectId: number;
  soleUserId: string;
  applicationsData?: any[];
  userRoleLevels: { roleId: number; level: number }[];
  refreshing: boolean;
  onRefresh: () => void;
};

export default React.memo(function JobInformationTab({
  project,
  projectId,
  soleUserId,
  applicationsData,
  userRoleLevels,
  refreshing,
  onRefresh,
}: JobInformationTabProps) {
  const insets = useSafeAreaInsets();
  const { onScroll } = useScrollHeader();

  const showAnnouncements =
    project?.soleUserId === soleUserId || (applicationsData && applicationsData.length > 0);

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
      <View className="gap-0 px-2">
        <ProjectInformationCard project={project} soleUserId={soleUserId} />
        <View className="mt-4">
          {showAnnouncements ? (
            <ProjectAnnouncementsList
              projectId={projectId}
              viewerId={soleUserId}
              viewerSoleUserId={soleUserId}
              viewerRoleLevels={userRoleLevels}
            />
          ) : (
            <View className="mt-2 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              <Text className="text-sm font-semibold text-white">Apply to see announcements</Text>
              <Text className="mt-1 text-xs text-white/70">
                Project announcements become visible once you have an application for a role.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.ScrollView>
  );
});

