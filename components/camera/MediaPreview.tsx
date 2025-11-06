import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import Carousel from 'react-native-reanimated-carousel';
import { ChevronLeft, ChevronRight, Trash2, Crop } from 'lucide-react-native';
import { SelectedMedia } from './MediaGalleryPicker';

const { width, height } = Dimensions.get('window');

interface MediaPreviewProps {
  media: SelectedMedia[];
  onRemoveMedia: (index: number) => void;
  onCropMedia?: (index: number) => void;
  aspectRatio?: '1:1' | '4:5' | '16:9' | 'original';
}

export function MediaPreview({
  media,
  onRemoveMedia,
  onCropMedia,
  aspectRatio = '1:1',
}: MediaPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const getAspectRatioValue = () => {
    switch (aspectRatio) {
      case '1:1':
        return 1;
      case '4:5':
        return 4 / 5;
      case '16:9':
        return 16 / 9;
      default:
        return 1;
    }
  };

  const aspectValue = getAspectRatioValue();
  const previewHeight = width / aspectValue;

  const renderItem = ({ item, index }: { item: SelectedMedia; index: number }) => {
    if (item.mediaType === 'video') {
      return (
        <View style={{ width, height: previewHeight }} className="bg-black items-center justify-center">
          <Video
            source={{ uri: item.uri }}
            style={{ width, height: previewHeight }}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            isLooping
          />
        </View>
      );
    }

    return (
      <View style={{ width, height: previewHeight }} className="bg-black items-center justify-center">
        <ExpoImage
          source={{ uri: item.uri }}
          style={{ width, height: previewHeight }}
          contentFit="contain"
        />
      </View>
    );
  };

  const renderThumbnail = (item: SelectedMedia, index: number) => {
    const isActive = currentIndex === index;

    return (
      <TouchableOpacity
        key={index}
        onPress={() => setCurrentIndex(index)}
        className={`mr-2 ${isActive ? 'border-2 border-blue-500' : 'border border-gray-600'}`}
        style={{ width: 60, height: 60 }}
      >
        <ExpoImage
          source={{ uri: item.uri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        {item.mediaType === 'video' && (
          <View className="absolute bottom-0 right-0 bg-black/70 px-1 rounded-tl">
            <Text className="text-white text-xs">{Math.floor(item.duration || 0)}s</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-black">
      {/* Carousel */}
      <View style={{ height: previewHeight }}>
        <Carousel
          loop={false}
          width={width}
          height={previewHeight}
          data={media}
          scrollAnimationDuration={300}
          onSnapToItem={(index) => setCurrentIndex(index)}
          renderItem={renderItem}
          defaultIndex={currentIndex}
        />

        {/* Page Indicator */}
        {media.length > 1 && (
          <View className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full">
            <Text className="text-white text-sm font-medium">
              {currentIndex + 1}/{media.length}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center justify-around px-4 py-4 border-t border-gray-800">
        <TouchableOpacity
          onPress={() => onRemoveMedia(currentIndex)}
          className="flex-row items-center bg-red-500/20 border border-red-500 rounded-lg px-4 py-2"
        >
          <Trash2 size={18} color="#ef4444" />
          <Text className="text-red-500 ml-2 font-medium">Delete</Text>
        </TouchableOpacity>

        {media[currentIndex]?.mediaType === 'photo' && onCropMedia && (
          <TouchableOpacity
            onPress={() => onCropMedia(currentIndex)}
            className="flex-row items-center bg-blue-500/20 border border-blue-500 rounded-lg px-4 py-2"
          >
            <Crop size={18} color="#3b82f6" />
            <Text className="text-blue-500 ml-2 font-medium">Crop</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Thumbnail Strip */}
      {media.length > 1 && (
        <View className="px-4 py-3 border-t border-gray-800">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {media.map((item, index) => renderThumbnail(item, index))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

