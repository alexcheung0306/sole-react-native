import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { Check, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

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
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

export function ImageCropModal({
  visible,
  media,
  onClose,
  onApply,
}: ImageCropModalProps) {
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);

  const baseCropArea = useMemo(() => {
    const horizontalPadding = 24;
    const maxWidth = SCREEN_WIDTH - horizontalPadding * 2;
    const tentativeHeight = maxWidth;
    const maxHeight = SCREEN_HEIGHT - (insets.top + insets.bottom + 180);
    const height = Math.min(tentativeHeight, maxHeight);
    const width = height;

    return {
      width,
      height,
    };
  }, [insets.bottom, insets.top]);

  const minCropSize = Math.min(baseCropArea.width, baseCropArea.height) * 0.35;
  const minCropWidth = minCropSize;
  const minCropHeight = minCropSize;

  const { displayWidth, displayHeight, fittedScale, originalWidth, originalHeight } = useMemo(() => {
    const naturalWidth = media?.width ?? media?.cropData?.naturalWidth ?? 1024;
    const naturalHeight = media?.height ?? media?.cropData?.naturalHeight ?? 1024;
    const aspect = naturalWidth / naturalHeight || 1;

    const fitScale = Math.max(baseCropArea.width / naturalWidth, baseCropArea.height / naturalHeight);
    const width = naturalWidth * fitScale;
    const height = naturalHeight * fitScale;

    return {
      displayWidth: width,
      displayHeight: height,
      fittedScale: fitScale,
      originalWidth: naturalWidth,
      originalHeight: naturalHeight,
      aspect,
    };
  }, [media?.width, media?.height, media?.cropData, baseCropArea.width, baseCropArea.height]);

  const minScale = 1;
  const maxScale = 6;

  const scale = useSharedValue(minScale);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cropWidth = useSharedValue(baseCropArea.width);
  const cropHeight = useSharedValue(baseCropArea.height);
  useEffect(() => {
    if (visible) {
      scale.value = minScale;
      translateX.value = 0;
      translateY.value = 0;
      cropWidth.value = baseCropArea.width;
      cropHeight.value = baseCropArea.height;
    }
  }, [
    visible,
    minScale,
    scale,
    translateX,
    translateY,
    media?.uri,
    baseCropArea.width,
    baseCropArea.height,
    cropHeight,
    cropWidth,
  ]);

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
      .onChange((event) => {
        const isHorizontal = direction === 'left' || direction === 'right';
        const delta = isHorizontal ? event.changeX : event.changeY;
        const sign = direction === 'left' || direction === 'top' ? -1 : 1;
        const adjusted = delta * sign;

        if (isHorizontal) {
          cropWidth.value = clamp(cropWidth.value + adjusted, minCropWidth, baseCropArea.width);
        } else {
          cropHeight.value = clamp(cropHeight.value + adjusted, minCropHeight, baseCropArea.height);
        }

        const scaledWidth = displayWidth * scale.value;
        const scaledHeight = displayHeight * scale.value;
        const maxTranslateX = Math.max((scaledWidth - cropWidth.value) / 2, 0);
        const maxTranslateY = Math.max((scaledHeight - cropHeight.value) / 2, 0);
        translateX.value = clamp(translateX.value, -maxTranslateX, maxTranslateX);
        translateY.value = clamp(translateY.value, -maxTranslateY, maxTranslateY);
      })
      .onEnd(() => {
        const scaledWidth = displayWidth * scale.value;
        const scaledHeight = displayHeight * scale.value;
        const maxTranslateX = Math.max((scaledWidth - cropWidth.value) / 2, 0);
        const maxTranslateY = Math.max((scaledHeight - cropHeight.value) / 2, 0);
        translateX.value = clamp(translateX.value, -maxTranslateX, maxTranslateX);
        translateY.value = clamp(translateY.value, -maxTranslateY, maxTranslateY);
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

  if (!media) {
    return null;
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

        <View className="flex-1 items-center justify-center">
          <View
            style={{
              width: baseCropArea.width,
              height: baseCropArea.height,
              borderRadius: 16,
              backgroundColor: '#000',
            }}
          >
            <GestureDetector gesture={composedGesture}>
              <Animated.View
                style={[
                  {
                    width: displayWidth,
                    height: displayHeight,
                    alignSelf: 'center',
                  },
                  animatedStyle,
                ]}
              >
                <ExpoImage
                  source={{ uri: media.uri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
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
          <Text className="text-gray-300 text-center text-sm">
            Pinch to zoom, drag to reposition, and freely resize the frame.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

