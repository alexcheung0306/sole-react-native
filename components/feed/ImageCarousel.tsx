import {
  View,
  Image,
  Dimensions,
  TouchableOpacity,
  Text,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
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
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ImageCarousel({ media, onZoomChange, onScaleChange }: ImageCarouselProps) {

  const isLogAvaliable = false;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageHeights, setImageHeights] = useState<{ [key: number]: number }>({});
  const [currentHeight, setCurrentHeight] = useState<number>(300); // Default to reasonable height to prevent layout shift
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set()); // Track loaded images
  const [imageRefs, setImageRefs] = useState<{ [key: number]: any }>({}); // Store image refs for blur control
  const [isZooming, setIsZooming] = useState(false);
  const listRef = useRef<FlatList<MediaItem>>(null);

  // Shared value for z-index - updates instantly on UI thread
  const isZoomingShared = useSharedValue(false);

  // Handle zoom state changes - update both React state and shared value
  const handleZoomChange = useCallback((isZooming: boolean) => {
    setIsZooming(isZooming);
    isZoomingShared.value = isZooming; // Update shared value immediately for instant z-index change
    onZoomChange?.(isZooming);
  }, [onZoomChange, isZoomingShared]);

  // Animated style for z-index - updates instantly on UI thread
  const carouselAnimatedStyle = useAnimatedStyle(() => {
    const activeZ = isZoomingShared.value ? 8888 : 100;
    return {
      zIndex: activeZ,
      elevation: activeZ,
    };
  });

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
                  // Fallback to reasonable height if error
                  heights[i] = 300;
                  resolve();
                }
              );
            });
          } catch (error) {
            console.error('Error loading image dimensions:', error);
            heights[i] = 300; // Fallback to reasonable height
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

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
    // Remove blur effect after image loads
    if (imageRefs[index]) {
      // The blur will be removed through state update
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
          carouselAnimatedStyle, // Uses Reanimated for instant z-index updates
        ]}>
        {/* Debug overlay for ImageCarousel z-index */}
        {isLogAvaliable && <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: 'rgba(0, 0, 255, 0.8)',
            padding: 8,
            borderRadius: 4,
            zIndex: 99999,
          }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
            Carousel z-index: {isZooming ? 8888 : 100}
          </Text>
        </View>}
        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            padding: 8,
            borderRadius: 4,
            zIndex: 99999,
          }}>
     
        </View>
        <MediaZoom2
          children={
            <View style={{ width: SCREEN_WIDTH, height: singleImageHeight }}>
              {!loadedImages.has(0) && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <ActivityIndicator size="large" color="#666" />
                </View>
              )}
              <Image
                source={{ uri: media[0].mediaUrl }}
                style={{
                  width: SCREEN_WIDTH,
                  height: singleImageHeight,
                  opacity: loadedImages.has(0) ? 1 : 0
                }}
                resizeMode="contain"
                onLoad={() => handleImageLoad(0)}
              />
            </View>
          }
          width={SCREEN_WIDTH}
          height={singleImageHeight}
          resetOnRelease={true}
          minScale={1}
          maxScale={3}
          onZoomActiveChange={handleZoomChange}
          onScaleChange={onScaleChange}
        />
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
        carouselAnimatedStyle, // Uses Reanimated for instant z-index updates
      ]}>
      {/* Debug overlay for ImageCarousel z-index */}
     {isLogAvaliable && <View
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          backgroundColor: 'rgba(0, 0, 255, 0.8)',
          padding: 8,
          borderRadius: 4,
          zIndex: 99999,
        }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
          Carousel z-index: {isZooming ? 8888 : 100}
        </Text>
      </View>}
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
            <View style={{ width: SCREEN_WIDTH, height: itemHeight }}>
              <MediaZoom2
                children={
                <View style={{ width: SCREEN_WIDTH, height: itemHeight }}>
                  {!loadedImages.has(index) && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <ActivityIndicator size="large" color="#666" />
                    </View>
                  )}
                  <Image
                    source={{ uri: item.mediaUrl }}
                    style={{
                      width: SCREEN_WIDTH,
                      height: itemHeight,
                      opacity: loadedImages.has(index) ? 1 : 0
                    }}
                    resizeMode="contain"
                    onLoad={() => handleImageLoad(index)}
                  />
                </View>
                }
                width={SCREEN_WIDTH}
                height={itemHeight}
                resetOnRelease={true}
                minScale={1}
                maxScale={3}
                onZoomActiveChange={handleZoomChange}
                onScaleChange={onScaleChange}
              />
            </View>
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
                  className={`h-1.5 w-1.5 rounded-full ${index === currentIndex ? 'bg-white' : 'bg-white/40'
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
    </Animated.View>
  );
}
