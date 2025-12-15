import { Image as ExpoImage } from 'expo-image';
import { ImageIcon, VideoIcon, Layers } from 'lucide-react-native';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { MediaItem } from '~/context/CameraContext';
import MainMedia from './MainMedia';

export const CameraCroppingArea = ({
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
  mask,
  mediaCollapseProgress,
  expandMedia,
  collapseMedia,
  fixedCropControlsPanGesture,
}: any) => {
  // Calculate the fixed container height for collapse animation
  const FIXED_RATIO = 4 / 5;
  const fixedContainerHeight = width / FIXED_RATIO;

  // Animated style for collapsing the main media
  const mainMediaAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      mediaCollapseProgress?.value ?? 0,
      [0, 1],
      [fixedContainerHeight, 0],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      mediaCollapseProgress?.value ?? 0,
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      height,
      opacity,
      overflow: 'hidden' as const,
    };
  });

  // Animated style for container - fully collapse with no height remaining
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const collapseProgress = mediaCollapseProgress?.value ?? 0;
    
    // Calculate total height: main media + thumbnail strip (if visible)
    const thumbnailHeight = selectedMedia.length > 1 ? 120 : 0; // Approximate thumbnail strip height
    const totalHeight = fixedContainerHeight + thumbnailHeight;
    
    // Fully collapse to 0 height - everything inside will be hidden
    const height = interpolate(
      collapseProgress,
      [0, 1],
      [totalHeight, 0],
      Extrapolation.CLAMP
    );

    return {
      height,
      overflow: 'hidden' as const,
      opacity: collapseProgress < 1 ? 1 : 0, // Hide completely when fully collapsed
    };
  });

  // Animated style for thumbnail strip - also collapse
  const thumbnailAnimatedStyle = useAnimatedStyle(() => {
    const collapseProgress = mediaCollapseProgress?.value ?? 0;
    const opacity = interpolate(
      collapseProgress,
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP
    );
    const height = interpolate(
      collapseProgress,
      [0, 1],
      [120, 0], // Approximate thumbnail strip height
      Extrapolation.CLAMP
    );

    return {
      opacity,
      height,
      overflow: 'hidden' as const,
    };
  });
  if (!previewItem) return null;

  if (selectedMedia.length > 0) {
    return (
      <Animated.View
        className="  border-red-500"
        style={[{ position: 'relative' }, containerAnimatedStyle]}>
        {/* Main Media Display (Editable) */}
        <Animated.View style={mainMediaAnimatedStyle}>
          <MainMedia
            currentIndex={currentIndex}
            width={width}
            selectedAspectRatio={selectedAspectRatio}
            mask={mask}
          />
        </Animated.View>

        {/* Crop Controls - Shown when expanded (hidden when collapsed, shown outside) */}

        {/* Thumbnail Strip (only if multiple selected) */}
        {selectedMedia.length > 1 && (
          <Animated.View style={thumbnailAnimatedStyle} className="bg-black px-4 py-3">
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
          </Animated.View>
        )}
      </Animated.View>
    );
  }

  return (
    <View
      style={{ width, height: width, borderWidth: 1, borderColor: 'red' }}
      className="relative bg-black">
      <ExpoImage
        source={previewItem.uri}
        style={{
          width,
          height: width,
          borderRadius: mask === 'circle' ? width / 2 : 0,
        }}
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
