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
import { EditableImage } from '~/components/camera/EditableImage';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Pressable } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BouncyButton = ({ onPress, children, className, style }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={className}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};

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
  // Default to 1:1 as requested
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number>(1);

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

  const toggleAspectRatio = () => {
    const currentRatio = selectedAspectRatio === -1 ? 1 : selectedAspectRatio;
    // Find current index in ASPECT_RATIOS
    const currentIndex = ASPECT_RATIOS.findIndex(r => Math.abs(r.value - currentRatio) < 0.01);

    // Calculate next index (cycle)
    // If not found (e.g. -1), start at 0 (1:1)
    // If at end, go back to 0
    let nextIndex = 0;
    if (currentIndex !== -1) {
      nextIndex = (currentIndex + 1) % ASPECT_RATIOS.length;
    }

    handleAspectRatioChange(ASPECT_RATIOS[nextIndex].value);
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(protected)/(user)/home');
    }
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

  const handleCropUpdate = (cropData: any) => {
    const updated = selectedMedia.map((item, index) => {
      if (index !== currentIndex) return item;

      return {
        ...item,
        cropData,
        // We don't update URI here because we are just updating the crop metadata
        // The final crop will be applied when saving/posting
      };
    });

    setSelectedMedia(updated);
  };

  const navigateToCaption = () => {
    router.push('/(protected)/(user)/camera/caption' as any);
  };

  const getAspectRatioValue = (item: MediaItem) => {
    if (selectedAspectRatio === -1) {
      // Calculate natural aspect ratio
      const w = item.cropData?.naturalWidth ?? item.width ?? 1;
      const h = item.cropData?.naturalHeight ?? item.height ?? 1;
      return w / h;
    }
    return selectedAspectRatio;
  };

  const renderMainMedia = () => {
    if (selectedMedia.length === 0 || !selectedMedia[currentIndex]) {
      return null;
    }

    const item = selectedMedia[currentIndex];

    // Use the selected aspect ratio for the container
    const aspectValue = getAspectRatioValue(item);
    const mediaHeight = width / aspectValue;

    return (
      <View
        style={{ width, height: mediaHeight }}
        className="bg-black items-center justify-center overflow-hidden relative"
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
          <EditableImage
            uri={item.originalUri ?? item.uri}
            containerWidth={width}
            containerHeight={mediaHeight}
            naturalWidth={item.cropData?.naturalWidth ?? item.width ?? 1000}
            naturalHeight={item.cropData?.naturalHeight ?? item.height ?? 1000}
            cropData={item.cropData}
            onUpdate={handleCropUpdate}
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

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Main Media Display */}
          {renderMainMedia()}

          {/* Controls */}
          <View className="px-4 py-4 border-b border-gray-800">
            <View className="flex-row items-center gap-3">
              {/* Aspect Ratio Toggle Button */}
              <TouchableOpacity
                onPress={toggleAspectRatio}
                className="flex-1 flex-row items-center justify-center bg-blue-800 rounded-lg px-4 py-3 border border-gray-700"
              >
                {(() => {
                  // Find current label/icon
                  const currentRatio = selectedAspectRatio === -1 ? 1 : selectedAspectRatio;
                  const ratioObj = ASPECT_RATIOS.find(r => Math.abs(r.value - currentRatio) < 0.01) || ASPECT_RATIOS[0];
                  const Icon = ratioObj.icon;
                  return (
                    <>
                      <Icon size={18} color="#ffffff" />
                      <Text className="text-white ml-2 font-medium">{ratioObj.label}</Text>
                    </>
                  );
                })()}
              </TouchableOpacity>

              {/* Delete Button - Icon Only */}
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-row items-center justify-center bg-red-500/20 rounded-lg px-4 py-3 aspect-square"
              >
                <Trash2 size={20} color="#ef4444" />
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


    </>
  );
}

