import { TouchableOpacity, Text, View, Animated } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useState, useRef, useEffect } from 'react';

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  onPress: () => void;
}

export function LikeButton({ isLiked, likeCount, onPress }: LikeButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(likeCount);

  useEffect(() => {
    setLocalIsLiked(isLiked);
    setLocalLikeCount(likeCount);
  }, [isLiked, likeCount]);

  const handlePress = () => {
    // Optimistic update
    setLocalIsLiked(!localIsLiked);
    setLocalLikeCount(localIsLiked ? localLikeCount - 1 : localLikeCount + 1);

    // Animate
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Call parent handler
    onPress();
  };

  return (
    <View className="flex-row items-center gap-2">
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Heart
            size={24}
            color={localIsLiked ? '#ef4444' : '#ffffff'}
            fill={localIsLiked ? '#ef4444' : 'none'}
            strokeWidth={2}
          />
        </Animated.View>
      </TouchableOpacity>
      <Text className="text-white font-semibold text-sm">
        {localLikeCount > 0 ? localLikeCount.toLocaleString() : ''}
      </Text>
    </View>
  );
}

