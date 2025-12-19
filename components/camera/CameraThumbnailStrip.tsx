import React from 'react';
import { View, TouchableOpacity, Text, FlatList } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { X, ImageIcon } from 'lucide-react-native';
import { GlassOverlay } from '~/components/custom/GlassView';
import { MediaItem } from '~/context/CameraContext';

interface CameraThumbnailStripProps {
  selectedMedia: MediaItem[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  removeFromSelection: (mediaId: string) => void;
}

const CameraThumbnailStrip = React.memo(({
  selectedMedia,
  currentIndex,
  setCurrentIndex,
  removeFromSelection,
}: CameraThumbnailStripProps) => {
  if (selectedMedia.length === 0) {
    return null;
  }

  return (
    <View className=" px-4 py-3">
      <GlassOverlay intensity={80} tint="dark" />

      <Text className="mb-2 text-sm text-gray-400">
        Selected ({selectedMedia.length})
      </Text>
      <FlatList
        data={selectedMedia}
        renderItem={({ item, index }: { item: MediaItem; index: number }) => (
          <View className="relative mr-2 overflow-visible">
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setCurrentIndex(index)}
              className={`${currentIndex === index ? 'border-2 border-blue-500' : 'border border-gray-600'} overflow-hidden rounded-lg`}
              style={{ width: 60, height: 60 }}>
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
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                removeFromSelection(item.id);
              }}
              className="absolute -right-1 -top-1 z-10 items-center justify-center rounded-full p-0.5"
              style={{ width: 20, height: 20 }}>
              <X size={12} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
});

export default CameraThumbnailStrip;
