import React from 'react';
import { RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { JobContractsTab } from '../contracts/JobContractsTab';

type JobContractsTabWrapperProps = {
  contracts: any[];
  isLoading: boolean;
  highlightedContractId?: number;
  refreshing: boolean;
  onRefresh: () => void;
};

export default React.memo(function JobContractsTabWrapper({
  contracts,
  isLoading,
  highlightedContractId,
  refreshing,
  onRefresh,
}: JobContractsTabWrapperProps) {
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
      <JobContractsTab
        contracts={contracts}
        isLoading={isLoading}
        highlightedContractId={highlightedContractId}
      />
    </Animated.ScrollView>
  );
});

