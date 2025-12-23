import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';

interface CameraHeaderProps {
  selectedMedia: any[];
  isMultiSelect: boolean;
  animatedHeaderStyle: any;
  onHeightChange: (height: number) => void;
  handleNext: () => void;
  isNavigating: boolean;
}

const CameraHeader = React.memo(({
  selectedMedia,
  isMultiSelect,
  animatedHeaderStyle,
  onHeightChange,
  handleNext,
  isNavigating,
}: CameraHeaderProps) => {
  return (
    <CollapsibleHeader
      headerLeft={
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          className="flex items-center justify-center p-2">
          <ChevronLeft color="#93c5fd" size={24} />
        </TouchableOpacity>
      }
      title={
        isMultiSelect && selectedMedia.length > 0
          ? `${selectedMedia.length}/${10}`
          : 'Select Media'
      }
      animatedStyle={animatedHeaderStyle}
      onHeightChange={onHeightChange}
      isDark={true}
      headerRight={
        <TouchableOpacity
          onPress={handleNext}
          disabled={selectedMedia.length === 0 || isNavigating}
          className="p-2">
          <Text
            className={`font-semibold ${
              selectedMedia.length > 0 && !isNavigating ? 'text-blue-500' : 'text-gray-600'
            }`}>
            Next
          </Text>
        </TouchableOpacity>
      }
      isScrollCollapsible={false}
    />
  );
});

export default CameraHeader;
