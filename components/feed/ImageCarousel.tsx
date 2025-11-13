import { View, Image, Dimensions, TouchableOpacity, Text, FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface MediaItem {
  mediaUrl: string;
  width?: number;
  height?: number;
}

interface ImageCarouselProps {
  media: MediaItem[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ImageCarousel({ media }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList<MediaItem>>(null);
  
  if (!media || media.length === 0) {
    return null;
  }

  // Calculate aspect ratio for consistent sizing
  const firstMedia = media[0];
  const aspectRatio = firstMedia.width && firstMedia.height 
    ? firstMedia.width / firstMedia.height 
    : 1;

  // Determine height based on aspect ratio
  const getHeight = () => {
    if (aspectRatio > 1.5) {
      // Landscape (16:9)
      return SCREEN_WIDTH / 1.78;
    } else if (aspectRatio < 0.9) {
      // Portrait (4:5)
      return SCREEN_WIDTH * 1.25;
    } else {
      // Square (1:1)
      return SCREEN_WIDTH;
    }
  };

  const imageHeight = getHeight();

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
    return (
      <View style={{ width: SCREEN_WIDTH, height: imageHeight }}>
        <Image
          source={{ uri: media[0].mediaUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Multiple images - show carousel
  return (
    <View style={{ width: SCREEN_WIDTH, height: imageHeight, position: 'relative' }}>
      <FlatList
        ref={listRef}
        data={media}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => `${index}`}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.mediaUrl }}
            style={{ width: SCREEN_WIDTH, height: imageHeight }}
            resizeMode="cover"
          />
        )}
      />

      {/* Navigation Arrows */}
      {media.length > 1 && currentIndex > 0 && (
        <TouchableOpacity
          onPress={handlePrevious}
          className="absolute left-2 bg-black/50 p-2 rounded-full"
          style={{ top: '50%', marginTop: -20 }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
      )}

      {media.length > 1 && currentIndex < media.length - 1 && (
        <TouchableOpacity
          onPress={handleNext}
          className="absolute right-2 bg-black/50 p-2 rounded-full"
          style={{ top: '50%', marginTop: -20 }}
          activeOpacity={0.7}
        >
          <ChevronRight size={24} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Image Counter & Indicators */}
      <View className="absolute bottom-3 left-0 right-0 items-center">
        {/* Dot Indicators */}
        <View className="flex-row gap-1 mb-2">
          {media.map((_, index) => (
            <View
              key={index}
              className={`w-1.5 h-1.5 rounded-full ${
                index === currentIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </View>

        {/* Counter */}
        <View className="bg-black/60 px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-semibold">
            {currentIndex + 1} / {media.length}
          </Text>
        </View>
      </View>
    </View>
  );
}

