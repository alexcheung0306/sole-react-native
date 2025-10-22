import { View, Image, TouchableOpacity, Dimensions, Text } from 'react-native';
import { Image as MultipleImages } from 'lucide-react-native';

interface PostThumbnailProps {
  imageUrl: string;
  hasMultipleImages: boolean;
  onPress: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = SCREEN_WIDTH < 768 ? 2 : 3; // 2 columns on phones, 3 on tablets
const GAP = 2;
const THUMBNAIL_SIZE = (SCREEN_WIDTH - (GAP * (COLUMNS + 1))) / COLUMNS;

export function PostThumbnail({ imageUrl, hasMultipleImages, onPress }: PostThumbnailProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE, margin: GAP / 2 }}
    >
      {/* Image */}
      <Image
        source={{ uri: imageUrl }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />

      {/* Multiple Images Indicator */}
      {hasMultipleImages && (
        <View className="absolute top-2 right-2">
          <View className="bg-black/60 p-1.5 rounded">
            <MultipleImages size={14} color="#ffffff" />
          </View>
        </View>
      )}

      {/* Subtle overlay on press */}
      <View className="absolute inset-0 bg-black/0 active:bg-black/10" />
    </TouchableOpacity>
  );
}

export { THUMBNAIL_SIZE, COLUMNS };

