import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Animated,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Check, Image as ImageIcon, Video as VideoIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCreatePostContext, MediaItem } from '~/context/CreatePostContext';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;
const MAX_SELECTION = 10;

export default React.memo(function CameraScreen() {
  const insets = useSafeAreaInsets();
  const { headerTranslateY, animatedScrollHandler, handleHeightChange } = useScrollHeader();
  const { selectedMedia, setSelectedMedia, clearMedia } = useCreatePostContext();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const preserveSelectionRef = useRef(false);

  // Clear previous data when screen mounts
  useEffect(() => {
    clearMedia();
  }, []);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status === 'granted') {
        loadPhotos();
      } else {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to select media',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Suppress AUDIO permission error logging on emulator (expected behavior)
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('AUDIO permission') && errorMessage.includes('AndroidManifest')) {
        if (__DEV__) {
          // Only log as warning in dev, not as error
          console.warn('AUDIO permission error suppressed (expected on emulator)');
        }
        // Try to continue - might still work for photos/videos
        try {
          const { status: retryStatus } = await MediaLibrary.getPermissionsAsync();
          if (retryStatus === 'granted') {
            setHasPermission(true);
            loadPhotos();
          } else {
            setHasPermission(false);
          }
        } catch {
          setHasPermission(false);
        }
      } else {
        // Log other errors normally
        console.error('Error requesting permissions:', error);
        setHasPermission(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      preserveSelectionRef.current = false;
      return () => {
        if (!preserveSelectionRef.current) {
          clearMedia();
        }
      };
    }, [clearMedia])
  );

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      
      // Re-check permissions before accessing media library
      // This helps with emulator permission issues
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        try {
          const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            setHasPermission(false);
            setIsLoading(false);
            Alert.alert('Permission Required', 'Please grant photo library access to select media');
            return;
          }
        } catch (permissionError) {
          // Suppress AUDIO permission error on emulator (expected behavior)
          const errorMessage = (permissionError as Error).message || '';
          if (errorMessage.includes('AUDIO permission') && errorMessage.includes('AndroidManifest')) {
            if (__DEV__) {
              console.warn('AUDIO permission error suppressed (expected on emulator)');
            }
            // Try to continue with existing permissions
            const retryStatus = await MediaLibrary.getPermissionsAsync();
            if (retryStatus.status !== 'granted') {
              setHasPermission(false);
              setIsLoading(false);
              return;
            }
          } else {
            throw permissionError;
          }
        }
      }

      const media = await MediaLibrary.getAssetsAsync({
        first: 100,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      const assets: MediaItem[] = media.assets.map((asset) => ({
        id: asset.id,
        uri: asset.uri,
        mediaType: asset.mediaType === MediaLibrary.MediaType.video ? 'video' : 'photo',
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
        filename: asset.filename,
      }));

      setPhotos(assets);
    } catch (error) {
      // Suppress AUDIO permission error logging on emulator
      const errorMessage = (error as Error).message || 'Unknown error';
      if (errorMessage.includes('AUDIO permission') && errorMessage.includes('AndroidManifest')) {
        if (__DEV__) {
          console.warn('AUDIO permission error suppressed (expected on emulator)');
        }
        setHasPermission(false);
        setIsLoading(false);
        return;
      }
      
      // Log other errors normally
      console.error('Error loading photos:', error);
      if (errorMessage.includes('MEDIA_LIBRARY') || errorMessage.includes('permission')) {
        Alert.alert(
          'Permission Error',
          'Media library permission is required. If using an emulator, try:\n1. Granting permissions in device settings\n2. Adding media files to the emulator\n3. Testing on a physical device'
        );
        setHasPermission(false);
      } else {
        Alert.alert('Error', 'Failed to load media library');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera access');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newMedia: MediaItem = {
          id: `camera_${Date.now()}`,
          uri: asset.uri,
          mediaType: asset.type === 'video' ? 'video' : 'photo',
          duration: asset.duration ?? undefined,
          width: asset.width,
          height: asset.height,
          filename: `capture_${Date.now()}`,
        };

        // Add to selection and navigate to preview
        setSelectedMedia([newMedia]);
        preserveSelectionRef.current = true;
        navigateToPreview();
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const toggleSelection = (media: MediaItem) => {
    const isSelected = selectedMedia.some((m) => m.id === media.id);

    if (isSelected) {
      setSelectedMedia(selectedMedia.filter((m) => m.id !== media.id));
    } else {
      if (selectedMedia.length >= MAX_SELECTION) {
        Alert.alert('Maximum Reached', `You can select up to ${MAX_SELECTION} items`);
        return;
      }
      setSelectedMedia([...selectedMedia, media]);
    }
  };

  const getSelectionNumber = (mediaId: string) => {
    const index = selectedMedia.findIndex((m) => m.id === mediaId);
    return index >= 0 ? index + 1 : null;
  };

  const navigateToPreview = () => {
    if (selectedMedia.length === 0) {
      Alert.alert('No Media Selected', 'Please select at least one photo or video');
      return;
    }

    preserveSelectionRef.current = true;
    router.push('/(protected)/(user)/camera/edit' as any);
  };

  const renderMediaItem = ({ item, index }: { item: MediaItem; index: number }) => {
    // Camera option in first position
    if (index === 0 && item.id === 'camera') {
      return (
        <TouchableOpacity
          style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
          className="bg-gray-800 items-center justify-center border-r border-b border-gray-900"
          onPress={openCamera}
          activeOpacity={0.8}
        >
          <Camera size={40} color="#ffffff" />
          <Text className="text-white text-xs mt-2 font-medium">Camera</Text>
        </TouchableOpacity>
      );
    }

    const isSelected = selectedMedia.some((m) => m.id === item.id);
    const selectionNumber = getSelectionNumber(item.id);

    return (
      <TouchableOpacity
        style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
        className="relative border-r border-b border-gray-900"
        onPress={() => toggleSelection(item)}
        activeOpacity={0.9}
      >
        <ExpoImage
          source={{ uri: item.uri }}
          style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
          contentFit="cover"
        />

        {/* Video indicator */}
        {item.mediaType === 'video' && (
          <View className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1 flex-row items-center">
            <VideoIcon size={12} color="#ffffff" />
            <Text className="text-white text-xs ml-1">
              {item.duration ? `${Math.floor(item.duration)}s` : ''}
            </Text>
          </View>
        )}

        {/* Selection overlay */}
        {isSelected && (
          <View className="absolute inset-0 bg-blue-500/30 border-2 border-blue-500" />
        )}

        {/* Selection number */}
        <View className="absolute top-2 right-2">
          {isSelected && selectionNumber ? (
            <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-bold">{selectionNumber}</Text>
            </View>
          ) : (
            <View className="bg-white/80 rounded-full w-6 h-6 border-2 border-white" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (hasPermission === null) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <ImageIcon size={64} color="#6b7280" />
        <Text className="text-white text-lg mt-4 text-center">
          Photo Library Access Required
        </Text>
        <Text className="text-gray-400 text-sm mt-2 text-center">
          Please enable photo library access in your device settings
        </Text>
        <TouchableOpacity
          className="bg-blue-500 rounded-lg px-6 py-3 mt-6"
          onPress={requestPermissions}
        >
          <Text className="text-white font-semibold">Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Add camera option as first item
  const mediaItems = [{ id: 'camera' } as any, ...photos];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title={selectedMedia.length > 0 ? `${selectedMedia.length}/${MAX_SELECTION}` : 'Select Media'}
          translateY={headerTranslateY}
          onHeightChange={handleHeightChange}
          isDark={true}
          headerLeft={
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          }
          headerRight={
            <TouchableOpacity
              onPress={navigateToPreview}
              disabled={selectedMedia.length === 0}
              className="p-2"
            >
              <Text
                className={`font-semibold ${selectedMedia.length > 0 ? 'text-blue-500' : 'text-gray-600'
                  }`}
              >
                Next
              </Text>
            </TouchableOpacity>
          }
        />

        {/* Gallery Grid */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center" style={{ paddingTop: insets.top + 72 }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-400 mt-2">Loading media...</Text>
          </View>
        ) : (
          <Animated.FlatList
            data={mediaItems}
            renderItem={renderMediaItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            onScroll={animatedScrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingTop: insets.top + 72,
              paddingBottom: 20 
            }}
          />
        )}

        {/* Bottom Selection Info */}
        {selectedMedia.length > 0 && (
          <View className="absolute bottom-0 left-0 right-0 bg-black/90 border-t border-gray-800 p-4">
            <TouchableOpacity
              onPress={navigateToPreview}
              className="bg-blue-500 rounded-lg py-3"
            >
              <Text className="text-white font-semibold text-center">
                Continue with {selectedMedia.length} {selectedMedia.length === 1 ? 'item' : 'items'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
});
