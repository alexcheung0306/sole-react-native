import React, { useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ScreenTransitionProps {
  children: React.ReactNode;
  direction: 'left' | 'right';
  isActive?: boolean; // For tab-based navigation
}

export default function ScreenTransition({ children, direction, isActive }: ScreenTransitionProps) {
  const translateX = useSharedValue(direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH);
  const opacity = useSharedValue(0);
  const previousActiveRef = React.useRef(isActive);

  // Handle tab-based navigation (when isActive prop is provided)
  useEffect(() => {
    if (isActive !== undefined) {
      const wasActive = previousActiveRef.current;
      previousActiveRef.current = isActive;

      if (isActive && !wasActive) {
        // Tab just became active - animate in
        translateX.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        opacity.value = withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      } else if (!isActive && wasActive) {
        // Tab just became inactive - animate out
        translateX.value = withTiming(
          direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH,
          {
            duration: 250,
            easing: Easing.in(Easing.cubic),
          }
        );
        opacity.value = withTiming(0, {
          duration: 250,
          easing: Easing.in(Easing.cubic),
        });
      }
    }
  }, [isActive, direction]);

  // Handle route-based navigation (when isActive is not provided)
  useFocusEffect(
    React.useCallback(() => {
      // Skip if isActive prop is being used (tab-based navigation)
      if (isActive !== undefined) {
        return;
      }

      // Animate in when screen comes into focus
      translateX.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });

      return () => {
        // Reset position when screen loses focus (for next time it's shown)
        translateX.value = direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH;
        opacity.value = 0;
      };
    }, [direction, isActive])
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View 
      style={[
        { 
          flex: 1, 
          backgroundColor: '#000000',
          overflow: 'hidden',
        }, 
        animatedStyle
      ]}
    >
      {children}
    </Animated.View>
  );
}

