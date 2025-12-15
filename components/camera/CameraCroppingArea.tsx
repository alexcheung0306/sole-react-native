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

    // Fully collapse to 0 height - only the main media is inside this container now
    const height = interpolate(collapseProgress, [0, 1], [fixedContainerHeight, 0], Extrapolation.CLAMP);

    return {
      height,
      overflow: 'hidden' as const,
      opacity: collapseProgress < 1 ? 1 : 0, // Hide completely when fully collapsed
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
    </View>
  );
};
