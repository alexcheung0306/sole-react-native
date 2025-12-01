import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { Check, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
// Slider imports removed

import { MediaItem } from '~/context/CreatePostContext';

interface ImageCropModalProps {
  visible: boolean;
  media?: MediaItem;
  onClose: () => void;
  onApply: (payload: {
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
  }) => void;
  aspectRatio?: number; // Optional aspect ratio (width/height), e.g., 16/9 for 16:9
  lockAspectRatio?: boolean; // If true, crop frame is locked to aspectRatio and not resizable
}

const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

export function ImageCropModal({
  visible,
  media,
  onClose,
  onApply,
  aspectRatio,
  lockAspectRatio = false,
}: ImageCropModalProps) {
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoomValue, setZoomValue] = useState(1);

  const baseCropArea = useMemo(() => {
    const horizontalPadding = 24;
    const maxWidth = SCREEN_WIDTH - horizontalPadding * 2;
    // Ensure maxHeight is at least 200 to avoid negative values if insets are huge or screen is small
    const maxHeight = Math.max(200, SCREEN_HEIGHT - (insets.top + insets.bottom + 180));

    if (aspectRatio && lockAspectRatio) {
      // Calculate dimensions based on aspect ratio
      let width = maxWidth;
      let height = width / aspectRatio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      return { width, height };
    }

    // Default square crop area
    const tentativeHeight = maxWidth;
    const height = Math.min(tentativeHeight, maxHeight);
    const width = height;

    return {
      width,
      height,
    };
  }, [insets.bottom, insets.top, aspectRatio, lockAspectRatio]);

  const minCropSize = Math.min(baseCropArea.width, baseCropArea.height) * 0.35;
  const minCropWidth = lockAspectRatio && aspectRatio
    ? baseCropArea.width * 0.5
    : minCropSize;
  const minCropHeight = lockAspectRatio && aspectRatio
    ? baseCropArea.height * 0.5
    : minCropSize;

  const { displayWidth, displayHeight, fittedScale, originalWidth, originalHeight } = useMemo(() => {
    // Get image dimensions with better fallbacks
    let naturalWidth = media?.width ?? media?.cropData?.naturalWidth;
    let naturalHeight = media?.height ?? media?.cropData?.naturalHeight;

    // If dimensions are missing, use a default square aspect ratio
    if (!naturalWidth || !naturalHeight || naturalWidth <= 0 || naturalHeight <= 0) {
      naturalWidth = 1024;
      naturalHeight = 1024;
    }

    const aspect = naturalWidth / naturalHeight || 1;

    // Calculate scale to fit the image within the crop area
    const fitScale = Math.max(baseCropArea.width / naturalWidth, baseCropArea.height / naturalHeight);
    const width = naturalWidth * fitScale;
    const height = naturalHeight * fitScale;

    return {
      displayWidth: Math.max(width, baseCropArea.width),
      displayHeight: Math.max(height, baseCropArea.height),
      fittedScale: fitScale,
      originalWidth: naturalWidth,
      originalHeight: naturalHeight,
      aspect,
    };
  }, [media?.width, media?.height, media?.cropData, baseCropArea.width, baseCropArea.height]);

  const minScale = 1;
  const maxScale = 5; // Limit zoom to max 5x as specified

  const scale = useSharedValue(minScale);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cropWidth = useSharedValue(baseCropArea.width);
  const cropHeight = useSharedValue(baseCropArea.height);

  // Track previous media URI to detect when a new image is loaded
  const prevMediaUriRef = React.useRef<string | undefined>(undefined);

  // Initialize/reset crop frame when modal opens or media changes
  useEffect(() => {
    if (visible) {
      const isNewMedia = prevMediaUriRef.current !== media?.uri;

      // Update crop frame based on aspect ratio (always recalculate)
      if (aspectRatio) {
        // Calculate dimensions based on aspect ratio
        let newWidth = baseCropArea.width;
        let newHeight = newWidth / aspectRatio;

        if (newHeight > baseCropArea.height) {
          newHeight = baseCropArea.height;
          newWidth = newHeight * aspectRatio;
        }

        cropWidth.value = newWidth;
        cropHeight.value = newHeight;
      } else {
        cropWidth.value = baseCropArea.width;
        cropHeight.value = baseCropArea.height;
      }

      // Restore state from cropData if available and it matches the current media
      // We check if cropData exists and if it seems valid for this image
      if (media?.cropData && media.cropData.zoom) {
        const { zoom, x, y } = media.cropData;

        // Restore scale
        scale.value = zoom;
        setZoomValue(zoom);

        // Calculate translation to match the crop x,y
        // Formula derived from handleApply:
        // originX = -imageLeft / totalScale
        // imageLeft = -originX * totalScale
        // imageLeft = (frameWidth - scaledWidth) / 2 + translateX
        // translateX = imageLeft - (frameWidth - scaledWidth) / 2
        // translateX = (-originX * totalScale) - (frameWidth - scaledWidth) / 2

        const totalScale = fittedScale * zoom;
        const scaledWidth = displayWidth * zoom;
        const scaledHeight = displayHeight * zoom;
        const frameWidth = cropWidth.value;
        const frameHeight = cropHeight.value;

        const calculatedTranslateX = -(x * totalScale) - (frameWidth - scaledWidth) / 2;
        const calculatedTranslateY = -(y * totalScale) - (frameHeight - scaledHeight) / 2;

        translateX.value = calculatedTranslateX;
        translateY.value = calculatedTranslateY;

        if (__DEV__) {
          console.log('Restoring crop state:', {
            zoom,
            x,
            y,
            calculatedTranslateX,
            calculatedTranslateY,
            frameWidth,
            frameHeight
          });
        }
      } else if (isNewMedia) {
        // Reset everything for new media if no crop data
        scale.value = minScale;
        translateX.value = 0;
        translateY.value = 0;
        setZoomValue(minScale);
      } else {
        // If not new media and no crop data (shouldn't happen often if we always save), 
        // or if we just reopened the modal without changing media,
        // we might want to keep current state OR reset. 
        // If we are reopening, we probably want to keep state if it's in memory,
        // but if we passed cropData, we used that above.
        // If we didn't pass cropData, we might be in a weird state.
        // Let's ensure we reset if we don't have cropData to be safe, 
        // unless we want to persist in-memory state of the modal (which is risky if props changed).
        if (!media?.cropData) {
          scale.value = minScale;
          translateX.value = 0;
          translateY.value = 0;
          setZoomValue(minScale);
        }
      }

      prevMediaUriRef.current = media?.uri;

      // Adjust translate to keep image within bounds after crop frame change
      // We run this AFTER restoring to ensure we don't violate bounds, 
      // but if we restored correctly, we should be within bounds (mostly).
      // However, if aspect ratio changed, the restored crop might be out of bounds 
      // relative to the NEW frame.
      // So we clamp it.
      const scaledWidth = displayWidth * scale.value;
      const scaledHeight = displayHeight * scale.value;
      const maxTranslateX = Math.max((scaledWidth - cropWidth.value) / 2, 0);
      const maxTranslateY = Math.max((scaledHeight - cropHeight.value) / 2, 0);
      translateX.value = clamp(translateX.value, -maxTranslateX, maxTranslateX);
      translateY.value = clamp(translateY.value, -maxTranslateY, maxTranslateY);
    }
  }, [
    visible,
    media?.uri,
    // media?.cropData, // Add cropData to dependency to update when it changes
    minScale,
    scale,
    translateX,
    translateY,
    baseCropArea.width,
    baseCropArea.height,
    cropHeight,
    cropWidth,
    lockAspectRatio,
    aspectRatio,
    displayWidth,
    displayHeight,
    fittedScale, // Added fittedScale
  ]);

  // Sync zoom value with scale for slider
  useEffect(() => {
    const id = setInterval(() => {
      setZoomValue(scale.value);
    }, 100);
    return () => clearInterval(id);
  }, [scale]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onChange((event) => {
          const scaledWidth = displayWidth * scale.value;
          const scaledHeight = displayHeight * scale.value;
          const maxTranslateX = Math.max((scaledWidth - cropWidth.value) / 2, 0);
          const maxTranslateY = Math.max((scaledHeight - cropHeight.value) / 2, 0);

          const nextX = translateX.value + event.changeX;
          const nextY = translateY.value + event.changeY;

          translateX.value = clamp(nextX, -maxTranslateX, maxTranslateX);
          translateY.value = clamp(nextY, -maxTranslateY, maxTranslateY);
        })
        .enabled(!isProcessing),
    [cropHeight, cropWidth, displayHeight, displayWidth, isProcessing, scale, translateX, translateY]
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onChange((event) => {
          const nextScale = clamp(scale.value * event.scaleChange, minScale, maxScale);
          scale.value = nextScale;
          setZoomValue(nextScale);

          const scaledWidth = displayWidth * nextScale;
          const scaledHeight = displayHeight * nextScale;
          const maxTranslateX = Math.max((scaledWidth - cropWidth.value) / 2, 0);
          const maxTranslateY = Math.max((scaledHeight - cropHeight.value) / 2, 0);
          translateX.value = clamp(translateX.value, -maxTranslateX, maxTranslateX);
          translateY.value = clamp(translateY.value, -maxTranslateY, maxTranslateY);
        })
        .enabled(!isProcessing),
    [cropHeight, cropWidth, displayHeight, displayWidth, maxScale, minScale, isProcessing, scale, translateX, translateY]
  );

  const composedGesture = useMemo(
    () => Gesture.Simultaneous(pinchGesture, panGesture),
    [pinchGesture, panGesture]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const overlayTopStyle = useAnimatedStyle(() => ({
    height: (baseCropArea.height - cropHeight.value) / 2,
  }));

  const overlayBottomStyle = useAnimatedStyle(() => ({
    height: (baseCropArea.height - cropHeight.value) / 2,
  }));

  const overlayLeftStyle = useAnimatedStyle(() => ({
    width: (baseCropArea.width - cropWidth.value) / 2,
  }));

  const overlayRightStyle = useAnimatedStyle(() => ({
    width: (baseCropArea.width - cropWidth.value) / 2,
  }));

  const cropFrameStyle = useAnimatedStyle(() => ({
    width: cropWidth.value,
    height: cropHeight.value,
    marginLeft: -cropWidth.value / 2,
    marginTop: -cropHeight.value / 2,
  }));

  const createEdgeGesture = (direction: 'top' | 'bottom' | 'left' | 'right') =>
    Gesture.Pan()
      .enabled(!isProcessing)
      .onChange((event) => {
        // Safety check for invalid event data
        if (isNaN(event.changeX) || isNaN(event.changeY)) return;

        if (lockAspectRatio && aspectRatio) {
          // When aspect ratio is locked, maintain aspect ratio while resizing
          const isHorizontal = direction === 'left' || direction === 'right';
          const delta = isHorizontal ? event.changeX : event.changeY;
          const sign = direction === 'left' || direction === 'top' ? -1 : 1;
          const adjusted = delta * sign;

          if (isHorizontal) {
            const newWidth = clamp(cropWidth.value + adjusted, minCropWidth, baseCropArea.width);
            const newHeight = newWidth / aspectRatio;

            // Ensure newHeight is valid before applying
            if (newHeight <= baseCropArea.height && newHeight >= minCropHeight && !isNaN(newHeight)) {
              cropWidth.value = newWidth;
              cropHeight.value = newHeight;
            }
          } else {
            const newHeight = clamp(cropHeight.value + adjusted, minCropHeight, baseCropArea.height);
            const newWidth = newHeight * aspectRatio;

            // Ensure newWidth is valid before applying
            if (newWidth <= baseCropArea.width && newWidth >= minCropWidth && !isNaN(newWidth)) {
              cropHeight.value = newHeight;
              cropWidth.value = newWidth;
            }
          }
        } else {
          // Free resize when aspect ratio is not locked
          const isHorizontal = direction === 'left' || direction === 'right';
          const delta = isHorizontal ? event.changeX : event.changeY;
          const sign = direction === 'left' || direction === 'top' ? -1 : 1;
          const adjusted = delta * sign;

          if (isHorizontal) {
            const nextWidth = clamp(cropWidth.value + adjusted, minCropWidth, baseCropArea.width);
            if (!isNaN(nextWidth)) {
              cropWidth.value = nextWidth;
            }
          } else {
            const nextHeight = clamp(cropHeight.value + adjusted, minCropHeight, baseCropArea.height);
            if (!isNaN(nextHeight)) {
              cropHeight.value = nextHeight;
            }
          }
        }

        const scaledWidth = displayWidth * scale.value;
        const scaledHeight = displayHeight * scale.value;
        const maxTranslateX = Math.max((scaledWidth - cropWidth.value) / 2, 0);
        const maxTranslateY = Math.max((scaledHeight - cropHeight.value) / 2, 0);

        // Ensure translation values are valid
        if (!isNaN(maxTranslateX) && !isNaN(maxTranslateY)) {
          translateX.value = clamp(translateX.value, -maxTranslateX, maxTranslateX);
          translateY.value = clamp(translateY.value, -maxTranslateY, maxTranslateY);
        }
      })
      .onEnd(() => {
        const scaledWidth = displayWidth * scale.value;
        const scaledHeight = displayHeight * scale.value;
        const maxTranslateX = Math.max((scaledWidth - cropWidth.value) / 2, 0);
        const maxTranslateY = Math.max((scaledHeight - cropHeight.value) / 2, 0);

        if (!isNaN(maxTranslateX) && !isNaN(maxTranslateY)) {
          translateX.value = clamp(translateX.value, -maxTranslateX, maxTranslateX);
          translateY.value = clamp(translateY.value, -maxTranslateY, maxTranslateY);
        }
      })
      .enabled(!isProcessing);

  const handleApply = async () => {
    if (!media?.uri) {
      return;
    }

    try {
      setIsProcessing(true);

      const totalScale = fittedScale * scale.value;
      const scaledWidth = displayWidth * scale.value;
      const scaledHeight = displayHeight * scale.value;

      const frameWidth = cropWidth.value;
      const frameHeight = cropHeight.value;

      const imageLeft = (frameWidth - scaledWidth) / 2 + translateX.value;
      const imageTop = (frameHeight - scaledHeight) / 2 + translateY.value;

      const originX = clamp((0 - imageLeft) / totalScale, 0, originalWidth);
      const originY = clamp((0 - imageTop) / totalScale, 0, originalHeight);
      const cropWidthPx = clamp(frameWidth / totalScale, minCropWidth / totalScale, originalWidth);
      const cropHeightPx = clamp(frameHeight / totalScale, minCropHeight / totalScale, originalHeight);

      // Safety check: Ensure crop dimensions are valid
      if (cropWidthPx <= 0 || cropHeightPx <= 0) {
        console.warn('Invalid crop dimensions, skipping manipulation', { cropWidthPx, cropHeightPx });
        return;
      }

      const cropResult = await ImageManipulator.manipulateAsync(
        media.uri,
        [
          {
            crop: {
              originX,
              originY,
              width: Math.min(cropWidthPx, originalWidth - originX),
              height: Math.min(cropHeightPx, originalHeight - originY),
            },
          },
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      onApply({
        uri: cropResult.uri,
        width: cropResult.width ?? cropWidthPx,
        height: cropResult.height ?? cropHeightPx,
        cropData: {
          x: originX,
          y: originY,
          width: Math.min(cropWidthPx, originalWidth),
          height: Math.min(cropHeightPx, originalHeight),
          zoom: scale.value,
          naturalWidth: originalWidth,
          naturalHeight: originalHeight,
        },
      });
    } catch (error) {
      console.error('Failed to crop image', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!media || !media.uri) {
    return null;
  }

  // Safety check - ensure we have valid dimensions
  if (!baseCropArea.width || !baseCropArea.height || baseCropArea.width <= 0 || baseCropArea.height <= 0) {
    console.error('Invalid crop area dimensions:', baseCropArea);
    return null;
  }

  if (!displayWidth || !displayHeight || displayWidth <= 0 || displayHeight <= 0) {
    console.error('Invalid display dimensions:', { displayWidth, displayHeight });
    return null;
  }

  // Debug logging (remove in production if needed)
  if (__DEV__) {
    console.log('ImageCropModal - Media:', {
      uri: media.uri,
      width: media.width,
      height: media.height,
      displayWidth,
      displayHeight,
      baseCropArea,
    });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingBottom: 12,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.1)',
            zIndex: 1000,
            backgroundColor: 'black',
          }}
          className="flex-row items-center justify-between"
        >
          <TouchableOpacity onPress={onClose} disabled={isProcessing} className="p-2">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white font-semibold text-lg">Adjust Crop</Text>
          <TouchableOpacity
            onPress={handleApply}
            disabled={isProcessing}
            className="p-2"
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Check size={24} color="#3b82f6" />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center justify-center" style={{ position: 'relative' }}>
          <View
            style={{
              width: baseCropArea.width,
              height: baseCropArea.height,
              borderRadius: 16,
              backgroundColor: '#000',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <GestureDetector gesture={composedGesture}>
              <Animated.View
                style={[
                  {
                    width: displayWidth,
                    height: displayHeight,
                    position: 'absolute',
                    top: (baseCropArea.height - displayHeight) / 2,
                    left: (baseCropArea.width - displayWidth) / 2,
                  },
                  animatedStyle,
                ]}
              >
                <ExpoImage
                  source={{ uri: media.uri }}
                  style={{
                    width: displayWidth,
                    height: displayHeight,
                  }}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory"
                  onError={(error) => {
                    console.error('Image load error:', error);
                  }}
                  onLoad={() => {
                    if (__DEV__) {
                      console.log('Image loaded successfully');
                    }
                  }}
                />
              </Animated.View>
            </GestureDetector>

            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                },
                overlayTopStyle,
              ]}
            >
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                },
                overlayBottomStyle,
              ]}
            >
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                },
                overlayLeftStyle,
              ]}
            >
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                },
                overlayRightStyle,
              ]}
            >
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
            </Animated.View>

            <Animated.View
              pointerEvents="box-none"
              style={[
                {
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.25)',
                  borderRadius: 18,
                  overflow: 'hidden',
                },
                cropFrameStyle,
              ]}
            >
              <View pointerEvents="none" className="absolute inset-0">
                {[1, 2].map((i) => (
                  <View
                    key={`vertical-${i}`}
                    style={{
                      position: 'absolute',
                      left: `${(100 / 3) * i}%`,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                    }}
                  />
                ))}
                {[1, 2].map((i) => (
                  <View
                    key={`horizontal-${i}`}
                    style={{
                      position: 'absolute',
                      top: `${(100 / 3) * i}%`,
                      left: 0,
                      right: 0,
                      height: 1,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                    }}
                  />
                ))}
              </View>

              {(['top', 'bottom'] as const).map((edge) => (
                <GestureDetector key={edge} gesture={createEdgeGesture(edge)}>
                  <View
                    pointerEvents="box-only"
                    style={{
                      position: 'absolute',
                      left: '35%',
                      right: '35%',
                      height: 28,
                      [edge]: -14,
                      borderRadius: 14,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                    }}
                  />
                </GestureDetector>
              ))}

              {(['left', 'right'] as const).map((edge) => (
                <GestureDetector key={edge} gesture={createEdgeGesture(edge)}>
                  <View
                    pointerEvents="box-only"
                    style={{
                      position: 'absolute',
                      top: '35%',
                      bottom: '35%',
                      width: 28,
                      [edge]: -14,
                      borderRadius: 14,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                    }}
                  />
                </GestureDetector>
              ))}

              <View
                pointerEvents="none"
                className="absolute inset-4 rounded-xl"
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.45)',
                }}
              />
            </Animated.View>
          </View>
        </View>

        <View className="px-8 py-6">
          {/* Zoom Slider Removed */}
          <View className="mb-4">
            {/* Slider was here */}
          </View>

          <Text className="text-gray-300 text-center text-sm">
            Pinch to zoom, drag to reposition, and drag edges to resize the crop frame.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
