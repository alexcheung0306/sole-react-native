import {
  View,
  Image,
  Dimensions,
  TouchableOpacity,
  Text,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
// import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { MediaZoom2 } from '@/components/custom/media-zoom2';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

interface MediaItem {
  mediaUrl: string;
  width?: number;
  height?: number;
}

interface ImageCarouselProps {
  media: MediaItem[];
  onZoomChange?: (isZooming: boolean) => void;
  onScaleChange?: (scale: number) => void;
  onTouchStart?: () => void; // Notify parent immediately when touch starts
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ImageCarousel({ media, onZoomChange, onScaleChange, onTouchStart }: ImageCarouselProps) {
  // const ZoomableView: any = ReactNativeZoomableView;
  // if (ZoomableView && !ZoomableView.displayName) {
  //   ZoomableView.displayName = 'ReactNativeZoomableView';
  // }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageHeights, setImageHeights] = useState<{ [key: number]: number }>({});
  const [currentHeight, setCurrentHeight] = useState<number>(SCREEN_WIDTH); // Default to square
  const [isZooming, setIsZooming] = useState(false);
  const [imageScale, setImageScale] = useState(1); // Track scale from MediaZoom2 (for non-animated use)
  const imageScaleShared = useSharedValue(1); // Shared value for animated style
  const currentZIndexShared = useSharedValue(1);
  const [currentZIndex, setCurrentZIndex] = useState(1);
  const listRef = useRef<FlatList<MediaItem>>(null);

  // Handle zoom state changes - update internal state and notify parent
  // Use useCallback with stable dependencies to ensure gesture handlers work correctly
  const handleZoomChange = useCallback((isZooming: boolean) => {
    setIsZooming(isZooming);
    onZoomChange?.(isZooming);
  }, [onZoomChange]);
  
  // Memoize scale change handler to ensure it's stable across renders
  const handleScaleChange = useCallback((scale: number) => {
    setImageScale(scale); // Track scale for non-animated use
    imageScaleShared.value = scale; // Update shared value for animated style
    onScaleChange?.(scale);
  }, [onScaleChange, imageScaleShared]);

  // Handle touch start - notify parent
  const handleTouchStart = useCallback(() => {
    onTouchStart?.();
  }, [onTouchStart]);

  // Animated style for ImageCarousel wrapper z-index
  // Use scale directly to calculate z-index, matching MediaZoom2's logic
  // Base z-index: 1 when scale = 1
  // Scale-based z-index: scale * 1000000 when scale > 1
  const wrapperAnimatedStyle = useAnimatedStyle(() => {
    // Use shared value for immediate updates - same calculation as MediaZoom2
    const currentScale = imageScaleShared.value;
    const baseZIndex = 1;
    const scaleBasedZIndex = Math.round(currentScale * 1000000);
    const zIndex = currentScale > 1 ? scaleBasedZIndex : baseZIndex;
    
    currentZIndexShared.value = zIndex; // Update for debug display
    return {
      zIndex: zIndex,
      elevation: zIndex, // Android elevation
    };
  }, []);

  // Update debug z-index display
  // useEffect(() => {
  //   if (!__DEV__) return;

  //   const interval = setInterval(() => {
  //     setCurrentZIndex(currentZIndexShared.value);
  //   }, 100); // Update every 100ms

  //   return () => clearInterval(interval);
  // }, [currentZIndexShared]);

  const logOutZoomState = React.useCallback(
    (_event: any, _gestureState: any, zoomState: { zoomLevel?: number }) => {
      if (__DEV__) {
        console.log('Zoom level:', zoomState?.zoomLevel);
      }
    },
    []
  );

  if (!media || media.length === 0) {
    return null;
  }

  // Load image dimensions and calculate heights
  useEffect(() => {
    const loadImageDimensions = async () => {
      const heights: { [key: number]: number } = {};

      for (let i = 0; i < media.length; i++) {
        const item = media[i];

        // If dimensions are already provided, use them
        if (item.width && item.height) {
          const aspectRatio = item.width / item.height;
          heights[i] = SCREEN_WIDTH / aspectRatio;
        } else {
          // Otherwise, fetch image dimensions
          try {
            await new Promise<void>((resolve, reject) => {
              Image.getSize(
                item.mediaUrl,
                (width, height) => {
                  const aspectRatio = width / height;
                  heights[i] = SCREEN_WIDTH / aspectRatio;
                  resolve();
                },
                (error) => {
                  console.error('Error loading image size:', error);
                  // Fallback to square if error
                  heights[i] = SCREEN_WIDTH;
                  resolve();
                }
              );
            });
          } catch (error) {
            console.error('Error loading image dimensions:', error);
            heights[i] = SCREEN_WIDTH; // Fallback to square
          }
        }
      }

      setImageHeights(heights);
      // Set initial height for first image
      if (heights[0]) {
        setCurrentHeight(heights[0]);
      }
    };

    loadImageDimensions();
  }, [media]);

  // Update height when current index changes
  useEffect(() => {
    if (imageHeights[currentIndex] !== undefined) {
      setCurrentHeight(imageHeights[currentIndex]);
    }
  }, [currentIndex, imageHeights]);

  const handlePrevious = () => {
    const nextIndex = currentIndex === 0 ? media.length - 1 : currentIndex - 1;
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setCurrentIndex(nextIndex);
  };

  const handleNext = () => {
    const nextIndex = currentIndex === media.length - 1 ? 0 : currentIndex + 1;
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setCurrentIndex(nextIndex);
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = event.nativeEvent;
    const newIndex = Math.round(contentOffset.x / SCREEN_WIDTH);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  // Single image - no carousel needed
  if (media.length === 1) {
    const singleImageHeight = imageHeights[0] || currentHeight;
    return (
      <Animated.View
        style={[
          {
            width: SCREEN_WIDTH,
            height: 'auto',
            overflow: 'visible',
            position: 'relative',
          },
          wrapperAnimatedStyle,
        ]}>
        <MediaZoom2
          children={
            <Image
              source={{ uri: media[0].mediaUrl }}
              style={{ width: SCREEN_WIDTH, height: singleImageHeight }}
              resizeMode="contain"
            />
          }
          width={SCREEN_WIDTH}
          height={singleImageHeight}
          resetOnRelease={true}
          minScale={1}
          maxScale={3}
          onZoomActiveChange={handleZoomChange}
          onScaleChange={handleScaleChange}
          onTouchStart={handleTouchStart}
          scaleSharedValue={imageScaleShared}
        />
        {/* {__DEV__ && (
          <View
            style={{
              position: 'absolute',
              top: 5,
              left: 5,
              backgroundColor: 'black',
              paddingHorizontal: 5,
              paddingVertical: 2,
              borderRadius: 3,
              borderWidth: 2,
              borderColor: 'red',
              zIndex: 9999999, // Ensure debug overlay is always on top
            }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
              Carousel Z: {currentZIndex}
            </Text>
          </View>
        )} */}
      </Animated.View>
    );
  }

  // Multiple images - show carousel
  return (
    <Animated.View
      style={[
        {
          position: 'relative',
          overflow: 'visible',
        },
        wrapperAnimatedStyle,
      ]}>
      <FlatList
        style={{
          width: SCREEN_WIDTH,
          height: 'auto',
          overflow: 'visible',
          position: 'relative',
        }}
        ref={listRef}
        data={media}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => `${index}`}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item, index }) => {
          // All items use currentHeight for consistent paging
          const itemHeight = imageHeights[index] || currentHeight;
          return (
            <MediaZoom2
              children={
                <Image
                  source={{ uri: item.mediaUrl }}
                  style={{ width: SCREEN_WIDTH, height: itemHeight }}
                  resizeMode="contain"
                />
              }
              width={SCREEN_WIDTH}
              height={itemHeight}
              resetOnRelease={true}
              minScale={1}
              maxScale={3}
              onZoomActiveChange={handleZoomChange}
              onScaleChange={handleScaleChange}
              onTouchStart={handleTouchStart}
              scaleSharedValue={imageScaleShared}
            />
          );
        }}
      />

      {!isZooming && (
        <>
          {/* Navigation Arrows */}
          {media.length > 1 && currentIndex > 0 && (
            <TouchableOpacity
              onPress={handlePrevious}
              className="absolute left-2 h-6 w-6 items-center justify-center rounded-full bg-black/50"
              style={{
                top: '50%',
                transform: [{ translateY: -12 }], // Half of button height (24px / 2 = 12px)
              }}
              activeOpacity={0.7}>
              <ChevronLeft size={12} color="#ffffff" />
            </TouchableOpacity>
          )}

          {media.length > 1 && currentIndex < media.length - 1 && (
            <TouchableOpacity
              onPress={handleNext}
              className="absolute right-2 h-6 w-6 items-center justify-center rounded-full bg-black/50"
              style={{
                top: '50%',
                transform: [{ translateY: -12 }], // Half of button height (24px / 2 = 12px)
              }}
              activeOpacity={0.7}>
              <ChevronRight size={12} color="#ffffff" />
            </TouchableOpacity>
          )}

          {/* Image Counter & Indicators */}
          <View className="absolute bottom-3 left-0 right-0 items-center">
            {/* Dot Indicators */}
            <View className="mb-2 flex-row gap-1">
              {media.map((_, index) => (
                <View
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === currentIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </View>

            {/* Counter */}
            <View className="rounded-full bg-black/60 px-3 py-1">
              <Text className="text-xs font-semibold text-white">
                {currentIndex + 1} / {media.length}
              </Text>
            </View>
          </View>
        </>
      )}
      {/* {__DEV__ && (
        <View
          style={{
            position: 'absolute',
            top: 5,
            left: 5,
            backgroundColor: 'black',
            paddingHorizontal: 5,
            paddingVertical: 2,
            borderRadius: 3,
            borderWidth: 2,
            borderColor: 'red',
            zIndex: 9999999, // Ensure debug overlay is always on top
          }}>
          <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
            Carousel Z: {currentZIndex}
          </Text>
        </View>
      )} */}
    </Animated.View>
  );
}
