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
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  X,
  Check,
  Image as ImageIcon,
  Video as VideoIcon,
  ChevronLeft,
  Copy,
  Layers,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCreatePostContext, MediaItem } from '~/context/CreatePostContext';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;
const MAX_SELECTION = 10;

// define where the camera is used
type FunctionParam = 'post' | 'profile' | 'project';
// type MultipleSelection = boolean;

export default React.memo(function CameraScreen() {
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const { selectedMedia, setSelectedMedia, clearMedia } = useCreatePostContext();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMultiSelect, setIsMultiSelect] = useState(true);
  const [manualPreview, setManualPreview] = useState<MediaItem | null>(null);
  const preserveSelectionRef = useRef(false);
  const { functionParam, multipleSelection } = useLocalSearchParams<{
    functionParam: FunctionParam;
    multipleSelection?: string;
  }>();
  // Clear previous data when screen mounts
  useEffect(() => {
    clearMedia();
    setIsMultiSelect(false); // Default to single selection
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
        Alert.alert('Permission Required', 'Please grant photo library access to select media', [
          { text: 'OK' },
        ]);
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

  const loadPhotos = async (retryCount = 0) => {
    try {
      setIsLoading(true);

      // Re-check permissions before accessing media library
      // This helps with emulator permission issues
      let { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        try {
          const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            setHasPermission(false);
            setIsLoading(false);
            Alert.alert('Permission Required', 'Please grant photo library access to select media');
            return;
          }
          status = newStatus;
        } catch (permissionError) {
          // Suppress AUDIO permission error on emulator (expected behavior)
          const errorMessage = (permissionError as Error).message || '';
          if (
            errorMessage.includes('AUDIO permission') &&
            errorMessage.includes('AndroidManifest')
          ) {
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
            status = retryStatus.status;
          } else {
            throw permissionError;
          }
        }
      }

      // Double-check permission status right before API call
      // Sometimes Android reports granted but API still fails
      const finalCheck = await MediaLibrary.getPermissionsAsync();
      if (finalCheck.status !== 'granted') {
        // Permission was revoked or not properly granted
        if (retryCount < 1) {
          // Try requesting again once
          const { status: retryStatus } = await MediaLibrary.requestPermissionsAsync();
          if (retryStatus === 'granted') {
            return loadPhotos(retryCount + 1);
          }
        }
        setHasPermission(false);
        setIsLoading(false);
        Alert.alert('Permission Required', 'Please grant photo library access to select media');
        return;
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

      // Handle MEDIA_LIBRARY permission errors
      if (
        errorMessage.includes('MEDIA_LIBRARY') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('Missing MEDIA_LIBRARY')
      ) {
        // Retry once if we haven't already
        if (retryCount < 1) {
          // Re-request permissions and try again
          try {
            const { status: retryStatus } = await MediaLibrary.requestPermissionsAsync();
            if (retryStatus === 'granted') {
              // Wait a brief moment for permission to propagate
              await new Promise((resolve) => setTimeout(resolve, 100));
              return loadPhotos(retryCount + 1);
            }
          } catch (retryError) {
            // If retry also fails, fall through to error handling
          }
        }

        // If retry failed or we've already retried, show error
        console.error('Error loading photos:', error);
        Alert.alert(
          'Permission Error',
          'Media library permission is required. Please:\n1. Grant permissions in device settings\n2. Restart the app if permissions were just granted\n3. If using an emulator, try adding media files or testing on a physical device'
        );
        setHasPermission(false);
      } else {
        // Log other errors normally
        console.error('Error loading photos:', error);
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

        // Save to library first
        const savedAsset = await MediaLibrary.createAssetAsync(asset.uri);

        const newMedia: MediaItem = {
          id: savedAsset.id,
          uri: savedAsset.uri,
          mediaType: savedAsset.mediaType === MediaLibrary.MediaType.video ? 'video' : 'photo',
          duration: savedAsset.duration,
          width: savedAsset.width,
          height: savedAsset.height,
          filename: savedAsset.filename,
        };

        // Add to selection (append) and refresh list
        setSelectedMedia([...selectedMedia, newMedia]);
        loadPhotos();
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
      // If not in multi-select mode, only allow one selection
      if (!isMultiSelect) {
        setSelectedMedia([media]);
        return;
      }

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

  const renderMediaItem = ({ item, index }: { item: MediaItem; index: number }) => {
    // Camera option in first position
    if (index === 0 && item.id === 'camera') {
      return (
        <TouchableOpacity
          style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
          className="items-center justify-center border-b border-r border-gray-900 bg-gray-800"
          onPress={openCamera}
          activeOpacity={0.8}>
          <Camera size={40} color="#ffffff" />
          <Text className="mt-2 text-xs font-medium text-white">Camera</Text>
        </TouchableOpacity>
      );
    }

    const isSelected = selectedMedia.some((m) => m.id === item.id);
    const selectionNumber = getSelectionNumber(item.id);

    return (
      <View
        style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
        className="relative border-b border-r border-gray-900">
        <TouchableOpacity
          style={{ width: '100%', height: '100%' }}
          onPress={() => {
            if (isMultiSelect) {
              // In multi-select mode:
              // 1. Set preview
              setManualPreview(item);
              // 2. Select (add) if not already selected
              // 3. DO NOT deselect if already selected (let the number tap handle that)
              if (!isSelected) {
                if (selectedMedia.length >= MAX_SELECTION) {
                  Alert.alert('Maximum Reached', `You can select up to ${MAX_SELECTION} items`);
                } else {
                  setSelectedMedia([...selectedMedia, item]);
                }
              }
            } else {
              // In single mode, selecting sets preview automatically via selection
              toggleSelection(item);
            }
          }}
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
          onPress={() => {
            if (isMultiSelect) {
              toggleSelection(item);
            } else {
              // In single mode, pressing number also toggles selection (standard behavior)
              toggleSelection(item);
            }
          }}
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
    );
  };

  if (hasPermission === null) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <ImageIcon size={64} color="#6b7280" />
        <Text className="mt-4 text-center text-lg text-white">Photo Library Access Required</Text>
        <Text className="mt-2 text-center text-sm text-gray-400">
          Please enable photo library access in your device settings
        </Text>
        <TouchableOpacity
          className="mt-6 rounded-lg bg-blue-500 px-6 py-3"
          onPress={requestPermissions}>
          <Text className="font-semibold text-white">Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Add camera option as first item
  const mediaItems = [{ id: 'camera' } as any, ...photos];

  // Determine which image to show in the preview
  // 1. The last selected item (most recently selected)
  // 2. Or the first photo in the library if nothing is selected
  const previewItem =
    manualPreview ||
    (selectedMedia.length > 0
      ? selectedMedia[selectedMedia.length - 1]
      : photos.length > 0
        ? photos[0]
        : null);

  const renderPreview = () => {
    if (!previewItem) return null;

    return (
      <View style={{ width, height: width }} className="relative bg-black">
        <ExpoImage
          source={{ uri: previewItem.uri }}
          style={{ width, height: width }}
          contentFit="cover"
        />
        {previewItem.mediaType === 'video' && (
          <View className="absolute inset-0 items-center justify-center bg-black/30">
            <VideoIcon size={48} color="#ffffff" />
          </View>
        )}

        {/* Multi-select toggle button */}
        {multipleSelection === 'true' && (
          <TouchableOpacity
            onPress={() => {
              setIsMultiSelect(!isMultiSelect);
              // If switching to single mode, keep only the last selected item
              if (isMultiSelect && selectedMedia.length > 1) {
                const lastItem = selectedMedia[selectedMedia.length - 1];
                setSelectedMedia([lastItem]);
              }
            }}
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              backgroundColor: isMultiSelect ? 'rgb(0, 140, 255)' : 'rgba(0,0,0,0.6)',
              borderRadius: 20,
              padding: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}>
            <Layers size={12} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          headerLeft={
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              className="flex items-center justify-center p-2">
              <ChevronLeft color="#93c5fd" size={24} />
            </TouchableOpacity>
          }
          title={
            isMultiSelect && selectedMedia.length > 0
              ? `${selectedMedia.length}/${MAX_SELECTION}`
              : 'Select Media'
          }
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
          headerRight={
            <TouchableOpacity
              onPress={() => {
                if (selectedMedia.length === 0) {
                  Alert.alert('No Media Selected', 'Please select at least one photo or video');
                  return;
                }
                preserveSelectionRef.current = true;
                router.push({
                  pathname: '/(protected)/camera/edit' as any,
                  params: { functionParam },
                });
              }}
              disabled={selectedMedia.length === 0}
              className="p-2">
              <Text
                className={`font-semibold ${
                  selectedMedia.length > 0 ? 'text-blue-500' : 'text-gray-600'
                }`}>
                Next
              </Text>
            </TouchableOpacity>
          }
        />

        {/* Gallery Grid */}
        {isLoading ? (
          <View
            className="flex-1 items-center justify-center"
            style={{ paddingTop: insets.top + 72, paddingBottom: insets.bottom + 80 }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-2 text-gray-400">Loading media...</Text>
          </View>
        ) : (
          <Animated.FlatList
            data={mediaItems}
            keyExtractor={(item) => item.id}
            numColumns={3}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: insets.top + 50,
              paddingBottom: insets.bottom + 72,
            }}
            ListHeaderComponent={renderPreview}
            renderItem={renderMediaItem}
          />
        )}

        {/* Bottom Selection Info */}
      </View>
    </>
  );
});
