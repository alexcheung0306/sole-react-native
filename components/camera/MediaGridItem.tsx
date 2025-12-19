import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { VideoIcon } from 'lucide-react-native';
import { MediaItem } from '~/context/CameraContext';

const { width } = require('react-native').Dimensions.get('window');
const ITEM_SIZE = width / 3;

interface MediaGridItemProps {
  item: MediaItem;
  isSelected: boolean;
  selectionNumber: number | null;
  isMultiSelect: boolean;
  onImagePress: (item: MediaItem, isSelected: boolean) => void;
  onSelectionToggle: (item: MediaItem) => void;
}

const MediaGridItem = React.memo(
  ({
    item,
    isSelected,
    selectionNumber,
    isMultiSelect,
    onImagePress,
    onSelectionToggle,
  }: MediaGridItemProps) => (
    <View style={{ width: ITEM_SIZE, height: ITEM_SIZE }} className="relative border-gray-900">
      <TouchableOpacity
        style={{ width: '100%', height: '100%' }}
        onPress={() => onImagePress(item, isSelected)}
        activeOpacity={0.9}>
        <ExpoImage
          source={{ uri: item.uri }}
          style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
          contentFit="cover"
        />

        {/* Video indicator */}
        {item.mediaType === 'video' && (
          <View className="absolute left-2 top-2 flex-row items-center rounded bg-black/70 px-2 py-1">
            <VideoIcon size={12} color="#ffffff" />
            <Text className="ml-1 text-xs text-white">
              {item.duration ? `${Math.floor(item.duration)}s` : ''}
            </Text>
          </View>
        )}

        {/* Selection overlay */}
        {isSelected && (
          <View className="absolute inset-0 border-2 border-blue-500 bg-blue-500/30" />
        )}
      </TouchableOpacity>

      {/* Selection number / Touch target */}
      <TouchableOpacity
        onPress={() => onSelectionToggle(item)}
        style={{
          position: 'absolute',
          right: 2,
          top: 2,
          width: 40, // Larger hit slop area
          height: 40,
          alignItems: 'flex-end', // Align circle to top-right visually
          justifyContent: 'flex-start',
        }}>
        {isMultiSelect &&
          (isSelected && selectionNumber ? (
            <View className="h-6 w-6 items-center justify-center rounded-full bg-blue-500">
              <Text className="text-xs font-bold text-white">{selectionNumber}</Text>
            </View>
          ) : (
            <View className="h-6 w-6 rounded-full border-2 border-white bg-white/80" />
          ))}
      </TouchableOpacity>
    </View>
  )
);

export default MediaGridItem;
