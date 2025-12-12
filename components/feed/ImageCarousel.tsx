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
  // const ZoomableView: any = ReactNativeZoomableView;
  // if (ZoomableView && !ZoomableView.displayName) {
  //   ZoomableView.displayName = 'ReactNativeZoomableView';
  // }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageHeights, setImageHeights] = useState<{ [key: number]: number }>({});
  const [currentHeight, setCurrentHeight] = useState<number>(SCREEN_WIDTH); // Default to square
  const [isZooming, setIsZooming] = useState(false);
  const listRef = useRef<FlatList<MediaItem>>(null);

  // Handle zoom state changes - update internal state and notify parent
  const handleZoomChange = useCallback((isZooming: boolean) => {
    setIsZooming(isZooming);
    onZoomChange?.(isZooming);
  }, [onZoomChange]);

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
      <View
        style={{
          width: SCREEN_WIDTH,
          height: 'auto',
          overflow: 'visible',
          position: 'relative',
        }}>
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
        />
      </View>
    );
  }

  // Multiple images - show carousel
  return (
    <View
      style={{
        position: 'relative',
        overflow: 'visible',
        zIndex: 50, // keep zoomed media above surrounding UI (e.g., like/comment buttons)
        elevation: 50,
      }}>
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
              onScaleChange={onScaleChange}
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
    </View>
  );
}
