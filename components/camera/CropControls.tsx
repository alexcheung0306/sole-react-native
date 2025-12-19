import { Layers, Trash2 } from 'lucide-react-native';
import { View, TouchableOpacity, Alert } from 'react-native';
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
}: {
  selectedAspectRatio: number;
  setSelectedAspectRatio: (ratio: number) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  multipleSelection?: string;
  setIsMultiSelect: (isMultiSelect: boolean) => void;
  isMultiSelect: boolean;
  isAspectRatioLocked?: boolean;
}) {
  const { selectedMedia, setSelectedMedia, removeMedia } = useCameraContext();

  const handleAspectRatioChange = (ratio: number) => {
    // Don't allow changes if locked
    if (isAspectRatioLocked) {
      return;
    }

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
      <View className="flex flex-row items-center justify-between p-4">
        <GlassOverlay intensity={80} tint="dark" />
        {/* Aspect Ratio Toggle - Left */}
        <AspectRatioWheel
          selectedRatio={selectedAspectRatio}
          onRatioChange={handleAspectRatioChange}
          isLocked={isAspectRatioLocked}
        />

        {/* Multi-select toggle button - Right */}
        {multipleSelection === 'true' && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setIsMultiSelect(!isMultiSelect);
              // If switching to single mode, keep only the last selected item
              if (isMultiSelect && selectedMedia.length > 1) {
                const lastItem = selectedMedia[selectedMedia.length - 1];
                setSelectedMedia([lastItem]);
                setCurrentIndex(0);
              }
            }}
            style={{
              backgroundColor: isMultiSelect ? 'rgb(0, 140, 255)' : 'rgba(0,0,0,0.6)',
              borderRadius: 20,
              padding: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}>
            <Layers size={12} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
  );
}
