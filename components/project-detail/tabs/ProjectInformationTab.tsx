import React from 'react';
import { View, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { ProjectInformationCard } from '../details/ProjectInformationCard';
import ProjectAnnouncementFormPortal from '~/components/form-components/project-announcement-form/ProjectAnnouncementFormPortal';
import { ProjectAnnouncementsList } from '../details/ProjectAnnouncementsList';
import { PublishProjectButton } from '../PublishProjectButton';
import Animated from 'react-native-reanimated';

type ProjectInformationTabProps = {
  project: any;
  projectId: number;
  soleUserId: string;
  projectStatus: string;
  refreshing: boolean;
  onRefresh: () => void;
  isPublishButtonDisabled: boolean;
  onPublishSuccess: () => void;
};

export default React.memo(function ProjectInformationTab({
  project,
  projectId,
  soleUserId,
  projectStatus,
  refreshing,
  onRefresh,
  isPublishButtonDisabled,
  onPublishSuccess,
}: ProjectInformationTabProps) {
  const insets = useSafeAreaInsets();
  const { onScroll } = useScrollHeader();

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
      <View className="gap-2 px-2">
        {/* Publish Project Button - Only show when project is Draft */}
        {project?.status === 'Draft' && (
          <PublishProjectButton
            projectData={project}
            isDisable={isPublishButtonDisabled}
            onSuccess={onPublishSuccess}
          />
        )}
        <ProjectInformationCard project={project} soleUserId={soleUserId} />
        <ProjectAnnouncementFormPortal
          projectId={projectId}
          soleUserId={soleUserId}
          projectStatus={projectStatus}
        />
        <ProjectAnnouncementsList
          projectId={projectId}
          viewerSoleUserId={soleUserId}
        />
      </View>
    </Animated.ScrollView>
  );
});

