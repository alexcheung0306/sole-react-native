import React from 'react';
import { Layers, Trash2 } from 'lucide-react-native';
import { View, TouchableOpacity, Alert, Text } from 'react-native';
import { AspectRatioWheel } from './AspectRatioWheel';
import { MediaItem, useCameraContext } from '~/context/CameraContext';
import { router } from 'expo-router';
import { GlassOverlay } from '../custom/GlassView';
import { calculateCenterCrop } from '~/utils/cameraUtils';

export default function CropControls({
  selectedAspectRatio,
  setSelectedAspectRatio,
  currentIndex,
  setCurrentIndex,
  multipleSelection,
  setIsMultiSelect,
  isMultiSelect,
  isAspectRatioLocked = false,
  onAspectRatioPress,
  showThumbnailStrip,
  setShowThumbnailStrip,
  selectedCount,
}: {
  selectedAspectRatio: number;
  setSelectedAspectRatio: (ratio: number) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  multipleSelection?: string;
  setIsMultiSelect: (isMultiSelect: boolean) => void;
  isMultiSelect: boolean;
  isAspectRatioLocked?: boolean;
  onAspectRatioPress?: () => void;
  showThumbnailStrip?: boolean;
  setShowThumbnailStrip?: (show: boolean) => void;
  selectedCount?: number;
}) {
  const { selectedMedia, setSelectedMedia, removeMedia } = useCameraContext();

  // Optimize multi-select toggle with useCallback
  const handleMultiSelectToggle = React.useCallback(() => {
    const newIsMultiSelect = !isMultiSelect;
    setIsMultiSelect(newIsMultiSelect);

    // If switching to single mode, keep only the current/last selected item
    if (isMultiSelect && selectedMedia.length > 1) {
      // Keep the currently viewed item (currentIndex) or last item if currentIndex is invalid
      const itemToKeep =
        selectedMedia[Math.min(currentIndex, selectedMedia.length - 1)] ||
        selectedMedia[selectedMedia.length - 1];
      setSelectedMedia([itemToKeep]);
      setCurrentIndex(0);
    }
  }, [
    isMultiSelect,
    setIsMultiSelect,
    selectedMedia,
    currentIndex,
    setSelectedMedia,
    setCurrentIndex,
  ]);

  const handleAspectRatioChange = (ratio: number) => {
    // Don't allow changes if locked
    if (isAspectRatioLocked) {
      return;
    }

    // Prevent collapse when aspect ratio is pressed
    onAspectRatioPress?.();

    setSelectedAspectRatio(ratio);

    // Apply center crop to ALL photos
    const updated = selectedMedia.map((item) => {
      if (item.mediaType !== 'photo') return item;

      // If Original (-1), we reset the crop to the full image
      let targetRatio = ratio;
      if (ratio === -1) {
        const w = item.cropData?.naturalWidth ?? item.width ?? 1;
        const h = item.cropData?.naturalHeight ?? item.height ?? 1;
        targetRatio = w / h;
      }

      const newCropData = calculateCenterCrop(item, targetRatio);
      if (!newCropData) return item;

      // Ensure we have originalUri saved if it's not already
      const originalUri = item.originalUri ?? item.uri;

      return {
        ...item,
        cropData: newCropData,
        // Revert to original URI so the preview shows a center crop of the FULL image
        // instead of a crop of a crop.
        uri: originalUri,
        originalUri: originalUri,
        // We should also restore the original dimensions if we have them
        width: newCropData.naturalWidth ?? item.width,
        height: newCropData.naturalHeight ?? item.height,
      };
    });

    setSelectedMedia(updated);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
      <GlassOverlay intensity={80} tint="dark" />
      {/* Aspect Ratio Toggle - Left */}
      <AspectRatioWheel
        selectedRatio={selectedAspectRatio}
        onRatioChange={handleAspectRatioChange}
        isLocked={isAspectRatioLocked}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Thumbnail Strip Toggle - Center */}
        {setShowThumbnailStrip && selectedCount && selectedCount > 0 ? (
          <TouchableOpacity
            onPress={() => setShowThumbnailStrip(!showThumbnailStrip)}
            activeOpacity={0.8}
            style={{
              backgroundColor: showThumbnailStrip ? 'rgb(255, 255, 255)' : 'rgba(113, 113, 113, 0.6)',
              borderRadius: 20,
              paddingHorizontal: 6,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: showThumbnailStrip ? '#000000' : '#ffffff',
                fontSize: 10,
                fontWeight: 'bold',
                minWidth: 16,
                textAlign: 'center',
              }}>
              {selectedCount}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Multi-select toggle button - Right */}
        {multipleSelection === 'true' && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleMultiSelectToggle}
            style={{
              backgroundColor: isMultiSelect ? 'rgb(255, 255, 255)' : 'rgba(113, 113, 113, 0.6)',
              borderRadius: 20,
              padding: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}>
            <Layers size={12} color={isMultiSelect ? '#000000' : '#ffffff'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
