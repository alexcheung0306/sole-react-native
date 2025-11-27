import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { Camera, Check, Video as VideoIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 4; // 4 columns
const MAX_SELECTIONS = 10;

export interface SelectedMedia {
  uri: string;
  mediaType: 'photo' | 'video';
  duration?: number;
  width?: number;
  height?: number;
  filename?: string;
  id: string;
}

interface MediaGalleryPickerProps {
  onMediaSelected: (media: SelectedMedia[]) => void;
  onCameraPress: () => void;
  selectedMedia: SelectedMedia[];
}

export function MediaGalleryPicker({
  onMediaSelected,
  onCameraPress,
  selectedMedia,
}: MediaGalleryPickerProps) {
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      // Check existing permissions first
      let { status } = await MediaLibrary.getPermissionsAsync();
      
      if (status !== 'granted') {
        try {
          const result = await MediaLibrary.requestPermissionsAsync();
          status = result.status;
        } catch (permissionError) {
          // Suppress AUDIO permission error on emulator (expected behavior)
          const errorMessage = (permissionError as Error).message || '';
          if (errorMessage.includes('AUDIO permission') && errorMessage.includes('AndroidManifest')) {
            // This is expected on emulator - try to continue with photos/videos only
            if (__DEV__) {
              // Only log in dev, not in production
              console.warn('AUDIO permission not available (expected on emulator), continuing with photos/videos only');
            }
            // Try to get permissions again - might work for photos/videos
            const retryResult = await MediaLibrary.getPermissionsAsync();
            status = retryResult.status;
          } else {
            throw permissionError;
          }
        }
      }
      
      if (status !== 'granted') {
        setHasPermission(false);
        setIsLoading(false);
        Alert.alert('Permission Required', 'Please grant media library access to select photos and videos');
        return;
      }

      setHasPermission(true);

      const media = await MediaLibrary.getAssetsAsync({
        first: 100,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      setAssets(media.assets);
      setEndCursor(media.endCursor);
      setHasNextPage(media.hasNextPage);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      const errorMessage = (error as Error).message || 'Unknown error';
      
      // Suppress AUDIO permission error logging on emulator
      if (errorMessage.includes('AUDIO permission') && errorMessage.includes('AndroidManifest')) {
        if (__DEV__) {
          console.warn('AUDIO permission error suppressed (expected on emulator)');
        }
        setHasPermission(false);
        return;
      }
      
      // Log other errors normally
      console.error('Error loading media:', error);
      if (errorMessage.includes('MEDIA_LIBRARY') || errorMessage.includes('permission')) {
        Alert.alert(
          'Permission Error',
          'Media library permission is required. If using an emulator, try:\n1. Granting permissions in device settings\n2. Adding media files to the emulator\n3. Testing on a physical device'
        );
        setHasPermission(false);
      } else {
        Alert.alert('Error', 'Failed to load media library');
      }
    }
  };

  const loadMore = async () => {
    if (!hasNextPage || !endCursor) return;

    try {
      const media = await MediaLibrary.getAssetsAsync({
        first: 100,
        after: endCursor,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      setAssets([...assets, ...media.assets]);
      setEndCursor(media.endCursor);
      setHasNextPage(media.hasNextPage);
    } catch (error) {
      console.error('Error loading more media:', error);
    }
  };

  const handleMediaPress = async (asset: MediaLibrary.Asset) => {
    const isSelected = selectedMedia.some((m) => m.id === asset.id);

    if (isSelected) {
      // Deselect
      onMediaSelected(selectedMedia.filter((m) => m.id !== asset.id));
    } else {
      // Check max limit
      if (selectedMedia.length >= MAX_SELECTIONS) {
        Alert.alert('Maximum Reached', `You can only select up to ${MAX_SELECTIONS} items`);
        return;
      }

      // Select
      const mediaInfo = await MediaLibrary.getAssetInfoAsync(asset);
      
      const newMedia: SelectedMedia = {
        uri: mediaInfo.localUri || mediaInfo.uri,
        mediaType: asset.mediaType === MediaLibrary.MediaType.video ? 'video' : 'photo',
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
        filename: asset.filename,
        id: asset.id,
      };

      onMediaSelected([...selectedMedia, newMedia]);
    }
  };

  const renderCameraItem = () => (
    <TouchableOpacity
      onPress={onCameraPress}
      style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
      className="bg-gray-900 border border-gray-700 items-center justify-center"
    >
      <Camera size={32} color="#ffffff" />
      <Text className="text-white text-xs mt-2">Camera</Text>
    </TouchableOpacity>
  );

  const renderMediaItem = ({ item, index }: { item: MediaLibrary.Asset; index: number }) => {
    const isSelected = selectedMedia.some((m) => m.id === item.id);
    const selectionIndex = selectedMedia.findIndex((m) => m.id === item.id);
    const isVideo = item.mediaType === MediaLibrary.MediaType.video;

    return (
      <TouchableOpacity
        onPress={() => handleMediaPress(item)}
        style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
        className="relative"
      >
        <ExpoImage
          source={{ uri: item.uri }}
          style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
          contentFit="cover"
        />

        {/* Video Indicator */}
        {isVideo && (
          <View className="absolute bottom-1 right-1 flex-row items-center bg-black/70 px-2 py-0.5 rounded">
            <VideoIcon size={12} color="#ffffff" />
            <Text className="text-white text-xs ml-1">
              {Math.floor(item.duration || 0)}s
            </Text>
          </View>
        )}

        {/* Selection Overlay */}
        {isSelected && (
          <View className="absolute inset-0 bg-white/30 border-2 border-blue-500">
            <View className="absolute top-1 right-1 bg-blue-500 rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-bold">{selectionIndex + 1}</Text>
            </View>
          </View>
        )}

        {/* Selection Circle */}
        {!isSelected && (
          <View className="absolute top-1 right-1 bg-white/30 border-2 border-white rounded-full w-6 h-6" />
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-white mt-2">Loading media...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <Camera size={64} color="#6b7280" />
        <Text className="text-white text-lg mt-4">Media Access Required</Text>
        <Text className="text-gray-400 text-center mt-2">
          Please grant permission to access your photos and videos
        </Text>
        <TouchableOpacity
          onPress={loadMedia}
          className="bg-blue-500 rounded-lg px-6 py-3 mt-6"
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Selected Count Header */}
      {selectedMedia.length > 0 && (
        <View className="bg-gray-900/95 px-4 py-3 border-b border-gray-800">
          <Text className="text-white font-medium">
            {selectedMedia.length}/{MAX_SELECTIONS} selected
          </Text>
        </View>
      )}

      {/* Gallery Grid */}
      <FlatList
        data={assets}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        numColumns={4}
        ListHeaderComponent={renderCameraItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

