import { Trash2 } from 'lucide-react-native';
import { View, TouchableOpacity, Alert } from 'react-native';
import { AspectRatioWheel } from './AspectRatioWheel';
import { MediaItem, useCreatePostContext } from '~/context/CreatePostContext';
import { router } from 'expo-router';

export default function CropControls({
  selectedAspectRatio,
  setSelectedAspectRatio,
  currentIndex,
  setCurrentIndex,
}: {
  selectedAspectRatio: number;
  setSelectedAspectRatio: (ratio: number) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}) {
  const { selectedMedia, setSelectedMedia, removeMedia } = useCreatePostContext();

  const calculateCenterCrop = (media: MediaItem, targetRatio: number) => {
    const naturalWidth = media.cropData?.naturalWidth ?? media.width;
    const naturalHeight = media.cropData?.naturalHeight ?? media.height;

    // If we don't have dimensions, return null or default
    if (!naturalWidth || !naturalHeight) return null;

    let cropWidth = naturalWidth;
    let cropHeight = cropWidth / targetRatio;

    if (cropHeight > naturalHeight) {
      cropHeight = naturalHeight;
      cropWidth = cropHeight * targetRatio;
    }

    const x = (naturalWidth - cropWidth) / 2;
    const y = (naturalHeight - cropHeight) / 2;

    return {
      x,
      y,
      width: cropWidth,
      height: cropHeight,
      zoom: 1,
      naturalWidth,
      naturalHeight,
    };
  };
  const handleAspectRatioChange = (ratio: number) => {
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
  const handleDelete = () => {
    if (!selectedMedia[currentIndex]) return;

    Alert.alert('Delete Media', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeMedia(selectedMedia[currentIndex].id);

          if (selectedMedia.length === 1) {
            router.back();
          } else if (currentIndex >= selectedMedia.length - 1) {
            setCurrentIndex(selectedMedia.length - 2);
          }
        },
      },
    ]);
  };
  return (
    <View className="border-b border-gray-800 px-4 py-4">
      <View className="flex-row items-center justify-between gap-4">
        {/* Aspect Ratio Wheel - Centered */}
        <View className="flex-1 items-center justify-center">
          <AspectRatioWheel
            selectedRatio={selectedAspectRatio}
            onRatioChange={handleAspectRatioChange}
          />
        </View>

        {/* Delete Button - Icon Only */}
        <TouchableOpacity
          onPress={handleDelete}
          className="aspect-square h-[50px] flex-row items-center justify-center rounded-lg bg-red-500/20 px-4 py-3">
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
