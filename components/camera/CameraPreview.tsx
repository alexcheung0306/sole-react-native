import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraCroppingArea } from './CameraCroppingArea';

interface CameraPreviewProps {
  previewItem: any;
  selectedMedia: any[];
  currentIndex: number;
  width: number;
  selectedAspectRatio: number;
  setSelectedAspectRatio: (ratio: number) => void;
  setCurrentIndex: (index: number) => void;
  multipleSelection?: string;
  setIsMultiSelect: (isMultiSelect: boolean) => void;
  isMultiSelect: boolean;
  isAspectRatioLocked: boolean;
  mask?: string | undefined;
  mediaCollapseProgress: any;
  expandMedia: () => void;
  collapseMedia: () => void;
  fixedCropControlsPanGesture: any;
}

const CameraPreview = React.memo(({
  previewItem,
  selectedMedia,
  currentIndex,
  width,
  selectedAspectRatio,
  setSelectedAspectRatio,
  setCurrentIndex,
  multipleSelection,
  setIsMultiSelect,
  isMultiSelect,
  isAspectRatioLocked,
  mask,
  mediaCollapseProgress,
  expandMedia,
  collapseMedia,
  fixedCropControlsPanGesture,
}: CameraPreviewProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top + 50, zIndex: 100 }}>
      <CameraCroppingArea
        insets={insets}
        previewItem={previewItem}
        selectedMedia={selectedMedia}
        currentIndex={currentIndex}
        width={width}
        selectedAspectRatio={selectedAspectRatio}
        setSelectedAspectRatio={setSelectedAspectRatio}
        setCurrentIndex={setCurrentIndex}
        multipleSelection={multipleSelection}
        setIsMultiSelect={setIsMultiSelect}
        isMultiSelect={isMultiSelect}
        isAspectRatioLocked={isAspectRatioLocked}
        mask={mask}
        mediaCollapseProgress={mediaCollapseProgress}
        expandMedia={expandMedia}
        collapseMedia={collapseMedia}
        fixedCropControlsPanGesture={fixedCropControlsPanGesture}
      />
    </View>
  );
});

export default CameraPreview;
