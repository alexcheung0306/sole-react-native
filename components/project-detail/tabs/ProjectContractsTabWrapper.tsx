import React from 'react';
import { RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { ProjectContractsTab } from '../contracts/ProjectContractsTab';

type ProjectContractsTabWrapperProps = {
  projectId: number;
  initialContracts?: any[];
  isLoadingInitial?: boolean;
  refetchContracts: () => void;
  refreshing: boolean;
  onRefresh: () => void;
};

export default React.memo(function ProjectContractsTabWrapper({
  projectId,
  initialContracts,
  isLoadingInitial,
  refetchContracts,
  refreshing,
  onRefresh,
}: ProjectContractsTabWrapperProps) {
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
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={true}>
      <ProjectContractsTab
        projectId={projectId}
        initialContracts={initialContracts}
        isLoadingInitial={isLoadingInitial}
        refetchContracts={refetchContracts}
      />
    </Animated.ScrollView>
  );
});

