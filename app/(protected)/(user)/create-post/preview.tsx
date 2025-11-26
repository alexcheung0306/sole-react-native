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
import { Video } from 'expo-av';
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
    router.push('/(protected)/(user)/create-post/caption' as any);
  };

  const getAspectRatioValue = (item: MediaItem) => {
    const mediaWidth = item.cropData?.width ?? item.width;
    const mediaHeight = item.cropData?.height ?? item.height;
    if (mediaWidth && mediaHeight && mediaHeight !== 0) {
      return mediaWidth / mediaHeight;
    }
    return 1;
  };

  const renderMainMedia = () => {
    if (selectedMedia.length === 0 || !selectedMedia[currentIndex]) {
      return null;
    }

    const item = selectedMedia[currentIndex];
    const aspectValue = getAspectRatioValue(item);
    const mediaHeight = width / aspectValue;

    return (
      <View
        style={{ width, height: mediaHeight }}
        className="bg-black items-center justify-center"
      >
        {item.mediaType === 'video' ? (
          <Video
            source={{ uri: item.uri }}
            style={{ width, height: mediaHeight }}
            resizeMode="cover"
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
                      onPress={() => setSelectedAspectRatio(ratio.value)}
                      className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg px-3 py-2 border ${
                        isSelected
                          ? 'bg-blue-500/20 border-blue-500'
                          : 'bg-gray-800 border-gray-700'
                      }`}
                    >
                      <Icon
                        size={18}
                        color={isSelected ? '#3b82f6' : '#9ca3af'}
                      />
                      <Text
                        className={`text-sm font-medium ${
                          isSelected ? 'text-blue-500' : 'text-gray-400'
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
        media={cropTargetIndex !== null ? selectedMedia[cropTargetIndex] : undefined}
        onClose={closeCropper}
        onApply={handleCropApply}
        aspectRatio={selectedAspectRatio}
        lockAspectRatio={true}
      />
    </>
  );
}

