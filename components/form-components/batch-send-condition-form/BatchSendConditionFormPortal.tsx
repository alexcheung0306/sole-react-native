import React from 'react';
import { ChevronRight } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

interface BatchSendConditionFormPortalProps {
  projectId: number;
  selectedContractIds: string[];
  triggerClassName?: string;
  renderTrigger?: (helpers: {
    open: () => void;
    close: () => void;
    isOpen: boolean;
  }) => React.ReactNode;
}

export default function BatchSendConditionFormPortal({
  projectId,
  selectedContractIds,
  triggerClassName,
  renderTrigger,
}: BatchSendConditionFormPortalProps) {
  const handleOpen = () => {
    const params: Record<string, string> = {
      formType: 'batchSendCondition',
      projectId: String(projectId),
      selectedContractIds: selectedContractIds.join(','),
    };

    router.push({
      pathname: '/(protected)/form/[formType]' as any,
      params,
    });
  };

  if (renderTrigger) {
    return (
      <>
        {renderTrigger({
          open: handleOpen,
          close: () => {},
          isOpen: false,
        })}
      </>
    );
  }

  return (
    <View className={triggerClassName || 'mb-0'}>
      <TouchableOpacity
        className="bg-blue-500 rounded-xl px-3.5 py-1 items-center"
        onPress={handleOpen}>
        <ChevronRight size={16} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
