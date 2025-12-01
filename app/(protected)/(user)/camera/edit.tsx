import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { X, Check, Trash2, Image as ImageIcon, Crop, Square, RectangleVertical, RectangleHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { useCreatePostContext, MediaItem } from '~/context/CreatePostContext';
import { ImageCropModal } from '~/components/camera/ImageCropModal';

const { width, height } = Dimensions.get('window');

// Aspect ratio options matching web version
const ASPECT_RATIOS = [
  { key: '1/1', value: 1 / 1, label: '1:1', icon: Square },
  { key: '4/5', value: 4 / 5, label: '4:5', icon: RectangleVertical },
  { key: '16/9', value: 16 / 9, label: '16:9', icon: RectangleHorizontal },
] as const;

export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const {
    selectedMedia,
    setSelectedMedia,
    removeMedia,
  } = useCreatePostContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCropModalVisible, setIsCropModalVisible] = useState(false);
  const [cropTargetIndex, setCropTargetIndex] = useState<number | null>(null);
  // Default to 1:1 aspect ratio as specified
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number>(1 / 1);

  // Calculate center crop for a given aspect ratio
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

      const newCropData = calculateCenterCrop(item, ratio);
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

  const handleClose = () => {
    router.back();
  };

  const handleDelete = () => {
    if (!selectedMedia[currentIndex]) return;

    Alert.alert(
      'Delete Media',
      'Are you sure you want to remove this item?',
      [
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
      ]
    );
  };

  const openCropper = () => {
    const target = selectedMedia[currentIndex];
    if (!target) return;

    if (target.mediaType !== 'photo') {
      Alert.alert('Crop Unavailable', 'Cropping is currently supported for photos only.');
      return;
    }

    setCropTargetIndex(currentIndex);
    setIsCropModalVisible(true);
  };

  const closeCropper = () => {
    setIsCropModalVisible(false);
    setCropTargetIndex(null);
  };

  const handleCropApply = (payload: {
    uri: string;
    width: number;
    height: number;
    cropData: {
      x: number;
      y: number;
      width: number;
      height: number;
      zoom: number;
      naturalWidth?: number;
      naturalHeight?: number;
    };
  }) => {
    if (cropTargetIndex === null) return;

    const updated = selectedMedia.map((item, index) => {
      if (index !== cropTargetIndex) return item;

      const originalName = item.filename ?? `media_${item.id}`;
      const baseName = originalName.includes('.')
        ? originalName.substring(0, originalName.lastIndexOf('.'))
        : originalName;

      return {
        ...item,
        // We are NOT updating the URI here to the cropped version yet, 
        // because we want to be able to re-crop from the original.
        // If the app logic requires the URI to be the cropped one for display, 
        // we might need a separate 'displayUri' or just rely on the Image component 
        // to handle the crop (which isn't standard in RN without a library).
        // 
        // HOWEVER, the existing code was updating URI. 
        // To support non-destructive editing, we should keep the original URI 
        // and maybe store the cropped URI separately if needed for performance,
        // OR just rely on cropData if we had a component that could render it.
        //
        // Given the current architecture seems to rely on `ImageManipulator` creating a new file,
        // we will stick to that for the 'result', BUT we must preserve the ORIGINAL uri 
        // for re-cropping.
        //
        // Let's check if `item` has an `originalUri` field. If not, we should add it.
        // For now, I will assume we can store `originalUri` in the context or it exists.
        // If not, I'll use `uri` as the source of truth for the *current* version, 
        // but this causes quality loss on re-crop.
        //
        // BETTER APPROACH: 
        // The `ImageCropModal` receives `media`. If we pass the *original* media every time,
        // we are good.
        // But `selectedMedia` is updated with the *cropped* URI in the previous code.
        //
        // I will modify this to:
        // 1. Update `cropData`.
        // 2. Update `uri` to the new cropped image (so other components see the crop).
        // 3. BUT ensure we keep `originalUri` if possible. 
        //    If `MediaItem` doesn't have `originalUri`, I might need to add it or 
        //    rely on the fact that `ImageCropModal` might need the original.
        //
        // WAIT: `ImageCropModal` uses `media.uri`. If we overwrite `media.uri` with the cropped version,
        // the next time we open the cropper, we are cropping the *already cropped* image.
        // This is destructive and prevents zooming out.
        //
        // FIX: I will check if `originalUri` exists. If not, I'll set it on the first crop.

        // Ensure we keep the originalUri so we can always re-crop from the source
        originalUri: item.originalUri ?? item.uri,
        uri: payload.uri,
        width: payload.width,
        height: payload.height,
        cropData: payload.cropData,
        filename: `${baseName}_crop.jpg`,
      };
    });

    setSelectedMedia(updated);
    closeCropper();
  };

  const navigateToCaption = () => {
    router.push('/(protected)/(user)/camera/caption' as any);
  };

  const getAspectRatioValue = (item: MediaItem) => {
    // If we have an explicit aspect ratio selected, use that for the container
    // But we also want to respect the image's actual crop if it differs slightly?
    // No, enforce the selected aspect ratio.
    return selectedAspectRatio;
  };

  const renderMainMedia = () => {
    if (selectedMedia.length === 0 || !selectedMedia[currentIndex]) {
      return null;
    }

    const item = selectedMedia[currentIndex];

    // Use the selected aspect ratio for the container
    const aspectValue = selectedAspectRatio;
    const mediaHeight = width / aspectValue;

    return (
      <View
        style={{ width, height: mediaHeight }}
        className="bg-black items-center justify-center overflow-hidden"
      >
        {item.mediaType === 'video' ? (
          <Video
            source={{ uri: item.uri }}
            style={{ width, height: mediaHeight }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            useNativeControls
          />
        ) : (
          <ExpoImage
            source={{ uri: item.uri }}
            style={{ width, height: mediaHeight }}
            contentFit="cover"
          />
        )}
      </View>
    );
  };

  const renderThumbnail = ({ item, index }: { item: MediaItem; index: number }) => (
    <TouchableOpacity
      onPress={() => setCurrentIndex(index)}
      className={`mr-2 ${currentIndex === index ? 'border-2 border-blue-500' : 'border border-gray-600'} rounded-lg overflow-hidden`}
      style={{ width: 60, height: 60 }}
    >
      <ExpoImage
        source={{ uri: item.uri }}
        style={{ width: 60, height: 60 }}
        contentFit="cover"
      />
      {item.mediaType === 'video' && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <ImageIcon size={16} color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <TouchableOpacity onPress={handleClose} className="p-2">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white font-semibold text-lg">Edit</Text>
          <TouchableOpacity onPress={navigateToCaption} className="p-2">
            <Text className="text-blue-500 font-semibold">Next</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Main Media Display */}
          {renderMainMedia()}

          {/* Controls */}
          <View className="px-4 py-4 border-b border-gray-800">
            {/* Aspect Ratio Selector */}
            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Aspect Ratio</Text>
              <View className="flex-row gap-2">
                {ASPECT_RATIOS.map((ratio) => {
                  const Icon = ratio.icon;
                  const isSelected = selectedAspectRatio === ratio.value;
                  return (
                    <TouchableOpacity
                      key={ratio.key}
                      onPress={() => handleAspectRatioChange(ratio.value)}
                      className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg px-3 py-2 border ${isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-gray-800 border-gray-700'
                        }`}
                    >
                      <Icon
                        size={18}
                        color={isSelected ? '#ffffff' : '#9ca3af'}
                      />
                      <Text
                        className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'
                          }`}
                      >
                        {ratio.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              {/* Crop Button */}
              <TouchableOpacity
                onPress={openCropper}
                className="flex-row items-center bg-gray-800 rounded-lg px-4 py-2"
              >
                <Crop size={18} color="#ffffff" />
                <Text className="text-white ml-2 font-medium">Crop</Text>
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-row items-center bg-red-500/20 rounded-lg px-4 py-2"
              >
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Thumbnail Strip */}
          {selectedMedia.length > 1 && (
            <View className="px-4 py-3">
              <Text className="text-gray-400 text-sm mb-2">All Media ({selectedMedia.length})</Text>
              <FlatList
                data={selectedMedia}
                renderItem={renderThumbnail}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </ScrollView>
      </View>

      <ImageCropModal
        visible={isCropModalVisible}
        media={
          cropTargetIndex !== null
            ? {
              ...selectedMedia[cropTargetIndex],
              // CRITICAL: Always pass the ORIGINAL URI and DIMENSIONS to the cropper
              // This ensures we are working with the full source image, not the cropped version.
              uri: selectedMedia[cropTargetIndex].originalUri ?? selectedMedia[cropTargetIndex].uri,
              width: selectedMedia[cropTargetIndex].cropData?.naturalWidth ?? selectedMedia[cropTargetIndex].width,
              height: selectedMedia[cropTargetIndex].cropData?.naturalHeight ?? selectedMedia[cropTargetIndex].height,
            }
            : undefined
        }
        onClose={closeCropper}
        onApply={handleCropApply}
        aspectRatio={selectedAspectRatio}
        lockAspectRatio={false}
      />
    </>
  );
}

