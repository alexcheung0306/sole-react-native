import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Image as ImageIcon,
  Video as VideoIcon,
  ChevronLeft,
  Layers,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCameraContext, MediaItem } from '~/context/CameraContext';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import MainMedia from '~/components/camera/MainMedia';
import CropControls from '~/components/camera/CropControls';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;
const MAX_SELECTION = 10;

// define where the camera is used
type FunctionParam = 'post' | 'profile' | 'project';
// type MultipleSelection = boolean;

type AspectRatio = '1:1' | '4:5' | '16:9' | 'free';

export default React.memo(function CameraScreen() {
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const { selectedMedia, setSelectedMedia, clearMedia, cropMedia } = useCameraContext();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMultiSelect, setIsMultiSelect] = useState(true);
  const [manualPreview, setManualPreview] = useState<MediaItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number>(1);

  const preserveSelectionRef = useRef(false);
  const { functionParam, multipleSelection, aspectRatio } = useLocalSearchParams<{
    functionParam: FunctionParam;
    multipleSelection?: string;
    aspectRatio?: string;
  }>();

  // Parse aspectRatio param and determine if it's locked
  const parseAspectRatio = (ratio?: string): { value: number; isLocked: boolean } => {
    if (!ratio || ratio === 'free') {
      return { value: 1, isLocked: false }; // Default to 1:1 but allow changes
    }
    
    switch (ratio) {
      case '1:1':
        return { value: 1, isLocked: true };
      case '4:5':
        return { value: 4 / 5, isLocked: true };
      case '16:9':
        return { value: 16 / 9, isLocked: true };
      default:
        return { value: 1, isLocked: false };
    }
  };

  const { value: initialAspectRatio, isLocked: isAspectRatioLocked } = parseAspectRatio(aspectRatio);

  // Initialize aspect ratio from param
  useEffect(() => {
    setSelectedAspectRatio(initialAspectRatio);
  }, [initialAspectRatio]);

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

      // Automatically select the first photo (most recent) if nothing is selected yet
      if (retryCount === 0 && assets.length > 0 && selectedMedia.length === 0) {
        setSelectedMedia([assets[0]]);
      }
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
        // Note: loadPhotos logic above handles selecting first item if empty,
        // but here we explicitly want to select the new camera photo.
        // We do this by ensuring it's in the list and selected.
        const updatedSelected = [...selectedMedia, newMedia];
        setSelectedMedia(updatedSelected);

        // We need to reload photos to show the new asset in the grid
        // but passing a flag or checking inside loadPhotos to avoid over-selecting might be needed.
        // For now, loadPhotos selects [0] only if selectedMedia is empty.
        // Since we just updated selectedMedia, loadPhotos won't override it.
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
      // Prevent deselecting if it's the last remaining photo
      if (selectedMedia.length <= 1) {
        return;
      }
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

  return (
    <CameraContent
      insets={insets}
      animatedHeaderStyle={animatedHeaderStyle}
      onScroll={onScroll}
      handleHeightChange={handleHeightChange}
      selectedMedia={selectedMedia}
      setSelectedMedia={setSelectedMedia}
      isLoading={isLoading}
      isMultiSelect={isMultiSelect}
      setIsMultiSelect={setIsMultiSelect}
      setManualPreview={setManualPreview}
      currentIndex={currentIndex}
      setCurrentIndex={setCurrentIndex}
      selectedAspectRatio={selectedAspectRatio}
      setSelectedAspectRatio={setSelectedAspectRatio}
      mediaItems={mediaItems}
      previewItem={previewItem}
      openCamera={openCamera}
      toggleSelection={toggleSelection}
      getSelectionNumber={getSelectionNumber}
      width={width}
      functionParam={functionParam}
      multipleSelection={multipleSelection}
      router={router}
      calculateCenterCrop={calculateCenterCrop}
      preserveSelectionRef={preserveSelectionRef}
      isAspectRatioLocked={isAspectRatioLocked}
      cropMedia={cropMedia}
    />
  );
});

// Separate component for ListHeader to ensure stability
const CameraCroppingArea = ({
  previewItem,
  selectedMedia,
  currentIndex,
  width,
  selectedAspectRatio,
  setSelectedAspectRatio,
  setCurrentIndex,
  multipleSelection,
  setIsMultiSelect,
  isMultiSelect,
  isAspectRatioLocked,
}: any) => {
  if (!previewItem) return null;

  if (selectedMedia.length > 0) {
    return (
      <View>
        {/* Main Media Display (Editable) */}
        <View>
          <MainMedia
            currentIndex={currentIndex}
            width={width}
            selectedAspectRatio={selectedAspectRatio}
          />

          {/* Controls */}
          <CropControls
            selectedAspectRatio={selectedAspectRatio}
            setSelectedAspectRatio={setSelectedAspectRatio}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            multipleSelection={multipleSelection}
            setIsMultiSelect={setIsMultiSelect}
            isMultiSelect={isMultiSelect}
            isAspectRatioLocked={isAspectRatioLocked}
          />
        </View>

        {/* Thumbnail Strip (only if multiple selected) */}
        {selectedMedia.length > 1 && (
          <View className="bg-black px-4 py-3">
            <Text className="mb-2 text-sm text-gray-400">Selected ({selectedMedia.length})</Text>
            <FlatList
              data={selectedMedia}
              renderItem={({ item, index }: { item: MediaItem; index: number }) => (
                <TouchableOpacity
                  onPress={() => setCurrentIndex(index)}
                  className={`mr-2 ${currentIndex === index ? 'border-2 border-blue-500' : 'border border-gray-600'} overflow-hidden rounded-lg`}
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
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}
      </View>
    );
  }

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
              // setSelectedMedia([lastItem]);
              setCurrentIndex(0);
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

// Extracted component to avoid hooks issue in memoized component
const CameraContent = ({
  insets,
  animatedHeaderStyle,
  onScroll,
  handleHeightChange,
  selectedMedia,
  setSelectedMedia,
  isLoading,
  isMultiSelect,
  setIsMultiSelect,
  setManualPreview,
  currentIndex,
  setCurrentIndex,
  selectedAspectRatio,
  setSelectedAspectRatio,
  mediaItems,
  previewItem,
  openCamera,
  toggleSelection,
  getSelectionNumber,
  width,
  functionParam,
  multipleSelection,
  router,
  calculateCenterCrop,
  preserveSelectionRef,
  isAspectRatioLocked,
  cropMedia,
}: any) => {
  // Initialize crop data for all photos when selection changes
  useEffect(() => {
    // Only initialize if photos don't have cropData yet
    const needsInitialization = selectedMedia.some(
      (item: MediaItem) => item.mediaType === 'photo' && !item.cropData
    );

    if (needsInitialization) {
      const updated = selectedMedia.map((item: MediaItem) => {
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
  }, [selectedMedia, selectedAspectRatio]);

  const handleNext = async () => {
    if (selectedMedia.length === 0) {
      Alert.alert('No Media Selected', 'Please select at least one photo or video');
      return;
    }
    preserveSelectionRef.current = true;

    if (functionParam === 'post') {
      router.push('/(protected)/camera/caption' as any);
    } else if (functionParam === 'project' || functionParam === 'userProfile') {
      // Apply crop if available
      if (selectedMedia.length > 0) {
        const media = selectedMedia[0];
        const croppedMedia = await cropMedia(media);
        
        // Update context with cropped image if it was actually cropped
        if (croppedMedia.uri !== media.uri) {
          const updated = [...selectedMedia];
          updated[0] = croppedMedia;
          setSelectedMedia(updated);
        }
      }

      // Return to Project Modal
      if (router.canGoBack()) router.back();
    } else {
      router.push('/(protected)/projects' as any);
    }
  };

  // Update currentIndex when selection changes to ensure it's valid
  useEffect(() => {
    if (selectedMedia.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= selectedMedia.length) {
      setCurrentIndex(selectedMedia.length - 1);
    }
  }, [selectedMedia.length]);

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
              onPress={handleNext}
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
            keyExtractor={(item: any) => item.id}
            numColumns={3}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: insets.top + 50,
              paddingBottom: insets.bottom + 72,
            }}
            // Preview item - Use stable component
            ListHeaderComponent={
              <CameraCroppingArea
                previewItem={previewItem}
                selectedMedia={selectedMedia}
                currentIndex={currentIndex}
                width={width}
                selectedAspectRatio={selectedAspectRatio}
                setSelectedAspectRatio={setSelectedAspectRatio}
                setCurrentIndex={setCurrentIndex}
                multipleSelection={multipleSelection}
                setIsMultiSelect={setIsMultiSelect}
                isMultiSelect={isMultiSelect}
                isAspectRatioLocked={isAspectRatioLocked}
              />
            }
            // Gallery grid items
            renderItem={({ item, index }: any) => {
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
              const isSelected = selectedMedia.some((m: MediaItem) => m.id === item.id);
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
                        // 3. If already selected, just update current index to show it
                        if (!isSelected) {
                          if (selectedMedia.length >= MAX_SELECTION) {
                            Alert.alert(
                              'Maximum Reached',
                              `You can select up to ${MAX_SELECTION} items`
                            );
                          } else {
                            setSelectedMedia([...selectedMedia, item]);
                            setCurrentIndex(selectedMedia.length); // Focus on new item
                          }
                        } else {
                          // Already selected - find its index in selectedMedia and focus it
                          const index = selectedMedia.findIndex((m: MediaItem) => m.id === item.id);
                          if (index !== -1) {
                            setCurrentIndex(index);
                          }
                        }
                      } else {
                        // In single mode, selecting sets preview automatically via selection
                        toggleSelection(item);
                        setCurrentIndex(0); // Single item is always index 0
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
            }}
          />
        )}
      </View>
    </>
  );
};
