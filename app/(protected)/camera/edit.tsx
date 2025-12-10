import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import {
  X,
  Check,
  Trash2,
  Image as ImageIcon,
  Crop,
  Square,
  RectangleVertical,
  RectangleHorizontal,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { useCreatePostContext, MediaItem } from '~/context/CreatePostContext';
import { EditableImage } from '~/components/camera/EditableImage';
import { AspectRatioWheel } from '~/components/camera/AspectRatioWheel';
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
      style={[style, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
};

const { width, height } = Dimensions.get('window');

// define where the camera is used, passed from camera index
type FunctionParam = 'post' | 'profile' | 'project';

export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const { selectedMedia, setSelectedMedia, removeMedia } = useCreatePostContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  // Default to 1:1 as requested
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number>(1);
  const { functionParam } = useLocalSearchParams<{ functionParam: FunctionParam }>();
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

  // Initialize crop data for all photos when component mounts
  useEffect(() => {
    // Only initialize if photos don't have cropData yet
    const needsInitialization = selectedMedia.some(
      (item) => item.mediaType === 'photo' && !item.cropData
    );

    if (needsInitialization) {
      const updated = selectedMedia.map((item) => {
        if (item.mediaType !== 'photo' || item.cropData) return item;

        const newCropData = calculateCenterCrop(item, selectedAspectRatio);
        if (!newCropData) return item;

        const originalUri = item.originalUri ?? item.uri;

        return {
          ...item,
          cropData: newCropData,
          originalUri: originalUri,
        };
      });

      setSelectedMedia(updated);
    }
  }, []); // Only run on mount

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(protected)/(user)/home');
    }
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

    // Fixed container aspect ratio (4:5)
    const FIXED_RATIO = 4 / 5;
    const fixedContainerHeight = width / FIXED_RATIO;

    // Calculate dimensions for the EditableImage based on selected aspect ratio
    // fitting inside the fixed container (contain)
    const targetRatio = getAspectRatioValue(item);

    let renderWidth = width;
    let renderHeight = width / targetRatio;

    if (renderHeight > fixedContainerHeight) {
      renderHeight = fixedContainerHeight;
      renderWidth = renderHeight * targetRatio;
    }

    return (
      <View
        style={{ width, height: fixedContainerHeight }}
        className="relative items-center justify-center overflow-hidden bg-black">
        {item.mediaType === 'video' ? (
          <Video
            source={{ uri: item.uri }}
            style={{ width: renderWidth, height: renderHeight }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            useNativeControls
          />
        ) : (
          <View style={{ width: renderWidth, height: renderHeight, overflow: 'hidden' }}>
            <EditableImage
              uri={item.originalUri ?? item.uri}
              containerWidth={renderWidth}
              containerHeight={renderHeight}
              naturalWidth={item.cropData?.naturalWidth ?? item.width ?? 1000}
              naturalHeight={item.cropData?.naturalHeight ?? item.height ?? 1000}
              cropData={item.cropData}
              onUpdate={handleCropUpdate}
            />
          </View>
        )}
      </View>
    );
  };

  const renderThumbnail = ({ item, index }: { item: MediaItem; index: number }) => (
    <TouchableOpacity
      onPress={() => setCurrentIndex(index)}
      className={`mr-2 ${currentIndex === index ? 'border-2 border-blue-500' : 'border border-gray-600'} overflow-hidden rounded-lg`}
      style={{ width: 60, height: 60 }}>
      <ExpoImage source={{ uri: item.uri }} style={{ width: 60, height: 60 }} contentFit="cover" />
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
        <View className="flex-row items-center justify-between border-b border-gray-800 px-4 py-3">
          <TouchableOpacity onPress={handleClose} className="p-2">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-white">Edit</Text>

          <TouchableOpacity
            onPress={() => {
              if (functionParam === 'post') {
                router.push('/(protected)/camera/caption' as any);
              } else if (functionParam === 'project') {
                // Return to Project Modal
                // We use double back to close Edit (modal) and Camera (screen)
                // This preserves the state of the screen underneath (Project Modal)
                if (router.canGoBack()) router.back(); // Dismiss Edit
                setTimeout(() => {
                  if (router.canGoBack()) router.back(); // Dismiss Camera
                }, 50);
              } else {
                router.push('/(protected)/projects' as any);
              }
            }}
            className="p-2">
            <Text className="font-semibold text-blue-500">Next</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Main Media Display */}
          {renderMainMedia()}

          {/* Controls */}
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

          {/* Thumbnail Strip */}
          {selectedMedia.length > 1 && (
            <View className="px-4 py-3">
              <Text className="mb-2 text-sm text-gray-400">All Media ({selectedMedia.length})</Text>
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
