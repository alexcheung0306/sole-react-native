import { useState, useRef, useCallback } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

export const useScrollHeader = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = useSharedValue(0);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('down');
  const headerTranslateY = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  const handleHeightChange = useCallback((height: number) => {
    // console.log('Header height:', height); // Debug: Remove after testing
    setHeaderHeight(height);
  }, []);

  // Create scroll handler function that updates shared values
  const onScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY.current;

    // Update scrollY shared value
    scrollY.value = currentScrollY;

    // Always show header when near the top (within 20px)
    if (currentScrollY <= 20) {
      if (headerTranslateY.value !== 0 && !isAnimating.value) {
        isAnimating.value = true;
        headerTranslateY.value = withSpring(0, {
          damping: 40,
          stiffness: 250,
          mass: 1,
        }, () => {
          isAnimating.value = false;
        });
      }
      lastScrollY.current = currentScrollY;
      return;
    }

    // Only trigger header animation if scroll delta is significant enough and header height is known
    if (Math.abs(scrollDelta) > 1 && headerHeight > 0) {
      if (scrollDelta > 0) {
        // Scrolling down - hide header immediately
        if (headerTranslateY.value !== -headerHeight && !isAnimating.value) {
          isAnimating.value = true;
          headerTranslateY.value = withTiming(-headerHeight, {
            duration: 200,
          }, () => {
            isAnimating.value = false;
          });
        }
        scrollDirection.current = 'down';
      } else if (scrollDelta < 0) {
        // Scrolling up - show header
        if (headerTranslateY.value !== 0 && !isAnimating.value) {
          isAnimating.value = true;
          headerTranslateY.value = withSpring(0, {
            damping: 35,
            stiffness: 200,
            mass: 1,
          }, () => {
            isAnimating.value = false;
          });
        }
        scrollDirection.current = 'up';
      }
    }

    lastScrollY.current = currentScrollY;
  }, [headerHeight]);

  // Create animated style for the header
  const animatedHeaderStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const resetHeader = useCallback(() => {
    headerTranslateY.value = 0;
    lastScrollY.current = 0;
  }, []);

  return {
    animatedHeaderStyle,
    scrollY,
    onScroll,
    handleHeightChange,
    resetHeader,
  };
};
