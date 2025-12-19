import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Dimensions, Alert, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useSharedValue,
  withTiming,
  runOnJS,
  useAnimatedReaction,
  cancelAnimation,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useCameraContext, MediaItem, CACHE_DURATION } from '~/context/CameraContext';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import CropControls from '~/components/camera/CropControls';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import CameraHeader from '~/components/camera/CameraHeader';
import CameraPreview from '~/components/camera/CameraPreview';
import CameraThumbnailStrip from '~/components/camera/CameraThumbnailStrip';
import CameraGallery from '~/components/camera/CameraGallery';
import { calculateCenterCrop } from '~/utils/cameraUtils';
import { Image as ImageIcon } from 'lucide-react-native';
import { FlatList } from 'react-native';

// define where the camera is used
type FunctionParam = 'post' | 'profile' | 'project' | 'userProfile';

type AspectRatio = '1:1' | '4:5' | '16:9' | 'free';
type Mask = 'circle' | 'square';

const { width } = Dimensions.get('window');
const MAX_SELECTION = 10;
const galleryLoadQuantity = 100;

export default React.memo(function CameraScreen() {
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const { selectedMedia, setSelectedMedia, clearMedia, cropMedia, photosCache, setPhotosCache } =
    useCameraContext();
  // Animated value for main media collapse (0 = expanded, 1 = collapsed)
  const mediaCollapseProgress = useSharedValue(0);
  const [isMediaCollapsed, setIsMediaCollapsed] = useState(false);
  const preserveSelectionRef = useRef(false);

  // Track collapse state for JS rendering
  useAnimatedReaction(
    () => mediaCollapseProgress.value,
    (current) => {
      const collapsed = current > 0.5;
      runOnJS(setIsMediaCollapsed)(collapsed);
    }
  );
  // Store the original onScroll in a ref to access it in the animated handler
  const onScrollRef = useRef(onScroll);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMultiSelect, setIsMultiSelect] = useState(true);
  const [manualPreview, setManualPreview] = useState<MediaItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number>(1);
  const [showThumbnailStrip, setShowThumbnailStrip] = useState(true);

  // Scroll bar state
  const [contentHeight, setContentHeight] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const flatListRef = useRef<FlatList | null>(null);

  const { functionParam, multipleSelection, aspectRatio, mask } = useLocalSearchParams<{
    functionParam: FunctionParam;
    multipleSelection?: string;
    aspectRatio?: AspectRatio;
    mask?: Mask;
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

  const { value: initialAspectRatio, isLocked: isAspectRatioLocked } =
    parseAspectRatio(aspectRatio);

  // Initialize aspect ratio from param
  useEffect(() => {
    setSelectedAspectRatio(initialAspectRatio);
  }, [initialAspectRatio]);

  // Update onScroll ref when it changes
  useEffect(() => {
    onScrollRef.current = onScroll;
  }, [onScroll]);

  // Track scroll position for media collapse
  const scrollY = useSharedValue(0);
  const lastScrollYValue = useSharedValue(0);
  const flingStartY = useSharedValue(0);
  const isExpandingFromFling = useSharedValue(false);

  // Track previous scroll position for direction detection
  const prevScrollYRef = useRef(0);

  // Combined scroll handler that handles both header and media collapse
  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const prevScrollY = prevScrollYRef.current;
    const scrollDelta = currentScrollY - prevScrollY;

    // Update scroll position
    scrollY.value = currentScrollY;
    setScrollPosition(currentScrollY);

    // Collapse crop area when scrolling down (finger up)
    if (scrollDelta > 10 && currentScrollY > 20 && mediaCollapseProgress.value < 0.5) {
      cancelAnimation(mediaCollapseProgress);
      mediaCollapseProgress.value = withTiming(1, { duration: 300 });
    }

    // Update previous scroll position
    prevScrollYRef.current = currentScrollY;

    // Call the original header scroll handler
    if (onScrollRef.current) {
      onScrollRef.current(event);
    }
  }, [mediaCollapseProgress]);


  // React to scroll changes for media collapse
  useAnimatedReaction(
    () => scrollY.value,
    (current, previous) => {
      if (previous === null) {
        lastScrollYValue.value = current;
        return;
      }

      const scrollDelta = current - lastScrollYValue.value;
      lastScrollYValue.value = current;

      // Handle media collapse based on scroll direction
      // Don't collapse if we just expanded from fling (give it time to animate)
      if (isExpandingFromFling.value) {
        return;
      }

      // Don't collapse if media is fully expanded (just expanded) - give it time
      // This prevents immediate collapse after fling expansion
      if (mediaCollapseProgress.value < 0.1) {
        return;
      }

      // Only collapse when:
      // 1. Actually scrolled down significantly (not at top, account for bounce)
      // 2. Scrolling down (positive delta)
      // 3. Media is expanded but not just expanded
      if (
        current > 5 &&
        scrollDelta > 5 &&
        mediaCollapseProgress.value < 0.5 &&
        mediaCollapseProgress.value >= 0.1
      ) {
        // Scrolled down and scrolling further down, media is expanded - collapse media
        cancelAnimation(mediaCollapseProgress);
        mediaCollapseProgress.value = withTiming(1, { duration: 300 });
      }
      // Removed auto-expand on scroll up - media will only expand via drag gesture or fling
    }
  );

  // Function to reset the expanding flag (with delay to prevent immediate collapse)
  const resetExpandingFlag = useCallback(() => {
    // Keep the flag set for a bit longer to prevent scroll reaction from collapsing
    setTimeout(() => {
      isExpandingFromFling.value = false;
      console.log('[EXPAND MEDIA] Flag reset, scroll reaction can now collapse');
    }, 500); // Keep flag for 500ms after animation completes
  }, []);

  // Function to expand media (called from drag gesture or fling)
  const expandMedia = useCallback(() => {
    console.log('[EXPAND MEDIA] Called, current progress:', mediaCollapseProgress.value);
    isExpandingFromFling.value = true;
    cancelAnimation(mediaCollapseProgress);
    mediaCollapseProgress.value = withTiming(0, { duration: 300 }, (finished) => {
      'worklet';
      if (finished) {
        console.log(
          '[EXPAND MEDIA] Animation completed, new progress:',
          mediaCollapseProgress.value
        );
        // Reset the flag after animation completes (with delay)
        runOnJS(resetExpandingFlag)();
      }
    });
  }, [resetExpandingFlag]);

  // Prevent collapse when aspect ratio is pressed
  const handleAspectRatioPress = useCallback(() => {
    // If media is collapsed, expand it when aspect ratio is pressed
    if (mediaCollapseProgress.value > 0.5) {
      expandMedia();
    }
  }, [mediaCollapseProgress, expandMedia]);

  // Function to collapse media (called from drag gesture)
  const collapseMedia = useCallback(() => {
    mediaCollapseProgress.value = withTiming(1, { duration: 300 });
  }, []);

  // Pan gesture for fixed crop controls
  const fixedCropControlsPanGesture = Gesture.Pan().onEnd((event) => {
    'worklet';
    const currentProgress = mediaCollapseProgress.value;
    const dragThreshold = 50;

    // If dragged down more than threshold and media is collapsed, expand it
    if (event.translationY > dragThreshold && currentProgress > 0.5) {
      runOnJS(expandMedia)();
    }
    // If dragged up more than threshold and media is expanded, collapse it
    else if (event.translationY < -dragThreshold && currentProgress < 0.5) {
      runOnJS(collapseMedia)();
    }
  });

  // Logging function for fling trigger
  const logFlingTrigger = (event: string, details?: string) => {
    console.log(`[CAMERA FLING] ${event}${details ? ` - ${details}` : ''}`);
  };

  // Fling gesture to expand CameraCroppingArea when scrolling at top
  const flingGesture = Gesture.Pan()
    .manualActivation(true)
    .minDistance(30) // Increased from 20 - require more significant movement
    .activeOffsetY(30) // Increased from 20 - require clearer downward movement
    .maxPointers(1)
    .failOffsetX([-20, 20]) // Increased from 15 - more tolerance for horizontal movement
    .shouldCancelWhenOutside(false)
    // .onTouchesDown((e, state) => {
    //   'worklet';
    //   // Fail immediately if scroll is not at top - this allows buttons to work
    //   if (scrollY.value > 5) {
    //     state.fail();
    //     runOnJS(logFlingTrigger)('GESTURE FAILED', `Scroll not at top: ${scrollY.value.toFixed(0)}`);
    //     return;
    //   }
    //   // Store initial Y position to detect movement
    //   if (e.allTouches.length > 0) {
    //     flingStartY.value = e.allTouches[0].y;
    //   }
    //   runOnJS(logFlingTrigger)('TOUCHES DOWN', `Scroll at top: ${scrollY.value.toFixed(0)}`);
    //   // Don't activate yet - wait to see if there's actual downward movement
    // })
    .onTouchesMove((e, state) => {
      'worklet';
      // Check if scroll moved away from top
      if (scrollY.value > 5) {
        state.fail();
        return;
      }
      // Only activate if there's significant downward movement (not a button tap)
      if (e.allTouches.length > 0) {
        const currentY = e.allTouches[0].y;
        const deltaY = currentY - flingStartY.value;

        // Only activate when there's clear downward movement (> 30px)
        // Increased from 15px to reduce false activations
        if (deltaY > 30) {
          state.activate();
          runOnJS(logFlingTrigger)('GESTURE ACTIVATED', `Downward: ${deltaY.toFixed(0)}px`);
        } else if (deltaY < -10) {
          // Moving upward - not a fling, fail
          state.fail();
        }
        // For small movements (0-30px), wait (don't fail yet, but don't activate)
      }
    })
    .onStart(() => {
      'worklet';
      runOnJS(logFlingTrigger)('GESTURE STARTED', `Scroll: ${scrollY.value.toFixed(0)}`);
    })
    .onEnd((e) => {
      'worklet';
      const velocity = e.velocityY;
      const translation = e.translationY;
      const currentScrollOffset = scrollY.value;

      runOnJS(logFlingTrigger)(
        'GESTURE ENDED',
        `Velocity: ${velocity.toFixed(0)}, Translation: ${translation.toFixed(0)}, Scroll: ${currentScrollOffset.toFixed(0)}`
      );

      // Only allow fling when scroll is at the top (within 5px tolerance)
      const isAtTop = currentScrollOffset <= 5;

      if (!isAtTop) {
        runOnJS(logFlingTrigger)(
          'FLING BLOCKED',
          `Scroll not at top: ${currentScrollOffset.toFixed(0)}`
        );
        return;
      }

      // More restrictive fling detection: higher velocity (>1200) or significant downward swipe (>150px with velocity >700)
      // Increased thresholds to reduce false triggers during normal scrolling
      const isFling = velocity > 1200 || (translation > 150 && velocity > 700);

      if (isFling && translation > 0) {
        runOnJS(logFlingTrigger)(
          'FLING DETECTED',
          `Collapsing CameraCroppingArea, current progress: ${mediaCollapseProgress.value.toFixed(2)}`
        );
        // Only collapse if not already collapsed
        if (mediaCollapseProgress.value < 0.9) {
          // Collapse the CameraCroppingArea
          runOnJS(collapseMedia)();
        } else {
          runOnJS(logFlingTrigger)(
            'ALREADY COLLAPSED',
            `Progress: ${mediaCollapseProgress.value.toFixed(2)}`
          );
        }
      } else {
        runOnJS(logFlingTrigger)(
          'FLING NOT DETECTED',
          `Velocity: ${velocity.toFixed(0)}, Translation: ${translation.toFixed(0)}`
        );
      }
    });

  // Native scroll gesture for FlatList
  const scrollGesture = Gesture.Native();

  // Compose gestures - fling can trigger even during scroll
  const composedGesture = Gesture.Simultaneous(scrollGesture, flingGesture);

  // Clear previous data when screen mounts
  useEffect(() => {
    clearMedia();
    setIsMultiSelect(false); // Default to single selection
  }, []);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    // Check cache first - if valid cache exists, use it immediately without loading
    if (photosCache) {
      const cacheAge = Date.now() - photosCache.timestamp;
      if (cacheAge < CACHE_DURATION && photosCache.photos.length > 0) {
        // Use cached photos immediately
        setPhotos(photosCache.photos);
        console.log(`[GALLERY] Loaded ${photosCache.photos.length} photos from cache`);
        setIsLoading(false);

        // Automatically select the first photo if nothing is selected yet
        if (photosCache.photos.length > 0 && selectedMedia.length === 0) {
          setSelectedMedia([photosCache.photos[0]]);
        }

        // Still check permissions in background, but don't block UI
        try {
          const { status } = await MediaLibrary.getPermissionsAsync();
          setHasPermission(status === 'granted');
        } catch {
          // Ignore permission check errors when using cache
        }
        return;
      }
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status === 'granted') {
        loadPhotos();
      } else {
        setIsLoading(false);
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
            setIsLoading(false);
          }
        } catch {
          setHasPermission(false);
          setIsLoading(false);
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

  const loadPhotos = async (retryCount = 0, forceReload = false) => {
    try {
      // Check cache first (unless force reload is requested)
      if (!forceReload && photosCache) {
        const cacheAge = Date.now() - photosCache.timestamp;
        if (cacheAge < CACHE_DURATION && photosCache.photos.length > 0) {
          // Use cached photos
          setPhotos(photosCache.photos);
          console.log(`[GALLERY] Loaded ${photosCache.photos.length} photos from cache`);
          setIsLoading(false);

          // Automatically select the first photo if nothing is selected yet
          if (retryCount === 0 && photosCache.photos.length > 0 && selectedMedia.length === 0) {
            setSelectedMedia([photosCache.photos[0]]);
          }
          return;
        }
      }

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

      // Load all assets using pagination
      const allAssets: MediaItem[] = [];
      let hasNextPage = true;
      let after: string | undefined = undefined;
      const pageSize = galleryLoadQuantity; // Load 100 at a time for better performance

      while (hasNextPage) {
        const media = await MediaLibrary.getAssetsAsync({
          first: pageSize,
          after: after,
          mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
          sortBy: MediaLibrary.SortBy.creationTime,
        });

        const pageAssets: MediaItem[] = media.assets.map((asset) => ({
          id: asset.id,
          uri: asset.uri,
          mediaType: asset.mediaType === MediaLibrary.MediaType.video ? 'video' : 'photo',
          duration: asset.duration,
          width: asset.width,
          height: asset.height,
          filename: asset.filename,
        }));

        allAssets.push(...pageAssets);

        // Check if there are more pages
        hasNextPage = media.hasNextPage;
        if (media.assets.length > 0) {
          after = media.assets[media.assets.length - 1].id;
        } else {
          hasNextPage = false;
        }
      }

      setPhotos(allAssets);
      console.log(`[GALLERY] Loaded ${allAssets.length} photos from media library`);

      // Update cache
      setPhotosCache({
        photos: allAssets,
        timestamp: Date.now(),
      });

      // Automatically select the first photo (most recent) if nothing is selected yet
      if (retryCount === 0 && allAssets.length > 0 && selectedMedia.length === 0) {
        setSelectedMedia([allAssets[0]]);
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
        // Force reload to invalidate cache and show the new photo
        loadPhotos(0, true);
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

  const removeFromSelection = (mediaId: string) => {
    const removedIndex = selectedMedia.findIndex((m) => m.id === mediaId);
    if (removedIndex === -1) return;

    // Remove the item
    const updated = selectedMedia.filter((m) => m.id !== mediaId);
    setSelectedMedia(updated);

    // Adjust currentIndex if needed
    if (updated.length === 0) {
      // If no items left, reset to 0
      setCurrentIndex(0);
    } else if (removedIndex <= currentIndex) {
      // If we removed an item at or before currentIndex, adjust it
      const newIndex = Math.max(0, currentIndex - 1);
      setCurrentIndex(newIndex);
    } else if (currentIndex >= updated.length) {
      // If currentIndex is now out of bounds, set to last item
      setCurrentIndex(updated.length - 1);
    }
  };

  // Update currentIndex when selection changes to ensure it's valid
  useEffect(() => {
    if (selectedMedia.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= selectedMedia.length) {
      setCurrentIndex(selectedMedia.length - 1);
    }
  }, [selectedMedia.length, currentIndex, setCurrentIndex]);

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

  // Stable refs to avoid callback recreation
  const selectedMediaRef = useRef(selectedMedia);
  const isMultiSelectRef = useRef(isMultiSelect);
  const setManualPreviewRef = useRef(setManualPreview);
  const setSelectedMediaRef = useRef(setSelectedMedia);
  const setCurrentIndexRef = useRef(setCurrentIndex);
  const toggleSelectionRef = useRef(toggleSelection);

  // Update refs when values change
  selectedMediaRef.current = selectedMedia;
  isMultiSelectRef.current = isMultiSelect;
  setManualPreviewRef.current = setManualPreview;
  setSelectedMediaRef.current = setSelectedMedia;
  setCurrentIndexRef.current = setCurrentIndex;
  toggleSelectionRef.current = toggleSelection;

  // Initialize crop data for selected media (moved before early returns to ensure consistent hook order)
  useEffect(() => {
    // Only initialize if photos don't have cropData yet
    const needsInitialization = selectedMedia.some(
      (item: MediaItem) => item.mediaType === 'photo' && !item.cropData
    );

    if (!needsInitialization) return;

    const updatedMedia = selectedMedia.map((item: MediaItem) => {
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

    setSelectedMedia(updatedMedia);
  }, [selectedMedia, selectedAspectRatio, setSelectedMedia]);

  // Optimized selection handlers with stable refs
  const handleImagePress = useCallback(
    (item: MediaItem, isSelected: boolean) => {
      // Always expand the crop area when pressing grid images
      if (mediaCollapseProgress.value > 0.5) {
        expandMedia();
      }

      if (isMultiSelectRef.current) {
        // In multi-select mode:
        // 1. Set preview
        setManualPreviewRef.current(item);
        // 2. Select (add) if not already selected
        // 3. If already selected, just update current index to show it
        if (!isSelected) {
          if (selectedMediaRef.current.length >= MAX_SELECTION) {
            Alert.alert('Maximum Reached', `You can select up to ${MAX_SELECTION} items`);
          } else {
            setSelectedMediaRef.current([...selectedMediaRef.current, item]);
            setCurrentIndexRef.current(selectedMediaRef.current.length); // Focus on new item
          }
        } else {
          // Already selected - find its index in selectedMedia and focus it
          const index = selectedMediaRef.current.findIndex((m: MediaItem) => m.id === item.id);
          if (index !== -1) {
            setCurrentIndexRef.current(index);
          }
        }
      } else {
        // In single mode, selecting sets preview automatically via selection
        toggleSelectionRef.current(item);
        setCurrentIndexRef.current(0); // Single item is always index 0
      }
    },
    [mediaCollapseProgress, expandMedia] // Need these dependencies for the collapse check
  );

  const handleSelectionToggle = useCallback(
    (item: MediaItem) => {
      if (isMultiSelectRef.current) {
        toggleSelectionRef.current(item);
      } else {
        // In single mode, pressing number also toggles selection (standard behavior)
        toggleSelectionRef.current(item);
      }
    },
    [] // No dependencies - callback is now stable
  );

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

  // Create selection map for efficient lookups
  const selectionMap: Record<string, number> = {};
  selectedMedia.forEach((media, index) => {
    selectionMap[media.id] = index + 1; // 1-based selection number
  });

  return (
    <>
      <View className="flex-1 bg-black">
        <CameraHeader
          selectedMedia={selectedMedia}
          isMultiSelect={isMultiSelect}
          animatedHeaderStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          handleNext={handleNext}
        />

        <CameraPreview
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
          mask={mask}
          mediaCollapseProgress={mediaCollapseProgress}
          expandMedia={expandMedia}
          collapseMedia={collapseMedia}
          fixedCropControlsPanGesture={fixedCropControlsPanGesture}
        />

        {/* Fixed Crop Controls */}
        <GestureDetector gesture={fixedCropControlsPanGesture}>
          <View collapsable={false}>
            <CropControls
              selectedAspectRatio={selectedAspectRatio}
              setSelectedAspectRatio={setSelectedAspectRatio}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              multipleSelection={multipleSelection}
              setIsMultiSelect={setIsMultiSelect}
              isMultiSelect={isMultiSelect}
              isAspectRatioLocked={isAspectRatioLocked}
              onAspectRatioPress={handleAspectRatioPress}
              showThumbnailStrip={showThumbnailStrip}
              setShowThumbnailStrip={setShowThumbnailStrip}
              selectedCount={selectedMedia.length}
            />

            <CameraThumbnailStrip
              selectedMedia={selectedMedia}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              removeFromSelection={removeFromSelection}
              isVisible={showThumbnailStrip}
            />
          </View>
        </GestureDetector>

        <CameraGallery
          mediaItems={mediaItems}
          selectionMap={selectionMap}
          isLoading={isLoading}
          isMultiSelect={isMultiSelect}
          composedGesture={composedGesture}
          onScroll={handleScroll}
          openCamera={openCamera}
          handleImagePress={handleImagePress}
          handleSelectionToggle={handleSelectionToggle}
          contentHeight={contentHeight}
          layoutHeight={layoutHeight}
          scrollPosition={scrollPosition}
          setContentHeight={setContentHeight}
          setLayoutHeight={setLayoutHeight}
          flatListRef={flatListRef}
        />
      </View>
    </>
  );
});

