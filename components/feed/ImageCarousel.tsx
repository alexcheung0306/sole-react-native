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
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set()); // Track loaded images
  const [imageDimensions, setImageDimensions] = useState<{ [key: number]: { width: number; height: number } }>({}); // Store image dimensions
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

  // Simple helper to get aspect ratio from media item or loaded dimensions
  const getAspectRatio = (item: MediaItem, index: number): number => {
    // First check if dimensions are provided in the media item
    if (item.width && item.height) {
      return item.width / item.height;
    }
    // Then check if we've loaded the dimensions from the image
    if (imageDimensions[index]) {
      return imageDimensions[index].width / imageDimensions[index].height;
    }
    // Default to 16:9 if dimensions not available yet
    return 16 / 9;
  };

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

  const handleImageLoad = (index: number, event?: any) => {
    setLoadedImages(prev => new Set(prev).add(index));
    // Get dimensions from the loaded image
    if (event?.nativeEvent?.source) {
      const { width, height } = event.nativeEvent.source;
      if (width && height) {
        setImageDimensions(prev => ({
          ...prev,
          [index]: { width, height }
        }));
      }
    }
  };

  // Single image - no carousel needed
  if (media.length === 1) {
    const aspectRatio = getAspectRatio(media[0], 0);
    const calculatedHeight = SCREEN_WIDTH / aspectRatio;
    return (
      <Animated.View
        style={[
          {
            width: SCREEN_WIDTH,
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
            <View style={{ width: '100%', height: '100%' }}>
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
                  width: '100%',
                  height: '100%',
                  opacity: loadedImages.has(0) ? 1 : 0
                }}
                resizeMode="contain"
                onLoad={(event) => handleImageLoad(0, event)}
                onError={(error) => {
                  console.warn('Image failed to load:', media[0].mediaUrl, error);
                  handleImageLoad(0);
                }}
              />
            </View>
          }
          width={SCREEN_WIDTH}
          height={calculatedHeight}
          resetOnRelease={true}
          minScale={1}
          maxScale={3}
          onZoomActiveChange={handleZoomChange}
          onScaleChange={onScaleChange}
        />
      </Animated.View>
    );
    // multiple images
  } else if (media.length > 1) {
    // Use first image's aspect ratio for FlatList height (or default)
    const firstAspectRatio = getAspectRatio(media[0], 0);
    const defaultHeight = SCREEN_WIDTH / firstAspectRatio;
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
            const aspectRatio = getAspectRatio(item, index);
            const calculatedHeight = SCREEN_WIDTH / aspectRatio;

            return (
              <View style={{ width: SCREEN_WIDTH, height: calculatedHeight }}>
                <MediaZoom2
                  children={
                    <View style={{ width: SCREEN_WIDTH, height: '100%' }}>
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
                          height: '100%',
                          opacity: loadedImages.has(index) ? 1 : 0
                        }}
                        resizeMode="contain"
                        onLoad={(event) => handleImageLoad(index, event)}
                        onError={(error) => {
                          console.warn('Image failed to load:', item.mediaUrl, error);
                          handleImageLoad(index);
                        }}
                      />
                    </View>
                  }
                  width={SCREEN_WIDTH}
                  height={calculatedHeight}
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


}
