import React, { useEffect, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SwipeableContainerProps = {
  children: React.ReactNode[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  shouldFailAtEdges?: boolean; // If true, gesture fails at edges to allow parent to handle
};

export default function SwipeableContainer({
  children,
  activeIndex,
  onIndexChange,
  shouldFailAtEdges = false,
}: SwipeableContainerProps) {
  const translateX = useSharedValue(-activeIndex * SCREEN_WIDTH);
  const currentIndex = useSharedValue(activeIndex);
  const isGestureActive = useSharedValue(false);
  const startX = useSharedValue(0);
  const onIndexChangeRef = useRef(onIndexChange);
  const isAnimating = useSharedValue(false);
  const childrenLength = useSharedValue(children.length);

  // Update children length when it changes
  useEffect(() => {
    childrenLength.value = children.length;
  }, [children.length]);

  // Create a stable callback that reads from ref to avoid worklet mutation warning
  // This function is stable and can be safely passed to worklets
  const callOnIndexChange = React.useCallback((index: number) => {
    onIndexChangeRef.current(index);
  }, []);

  // Keep callback ref updated
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  }, [onIndexChange]);

  // Update translateX when activeIndex changes externally (e.g., from tab click)
  useEffect(() => {
    // Safety check
    if (activeIndex < 0 || activeIndex >= children.length) return;

    // Only animate if not already at target position
    const targetPos = -activeIndex * SCREEN_WIDTH;
    const currentPos = translateX.value;

    if (Math.abs(currentPos - targetPos) > 1) {
      // Cancel any ongoing animation
      cancelAnimation(translateX);
      isAnimating.value = true;
      translateX.value = withSpring(
        targetPos,
        {
          damping: 20,
          stiffness: 90,
          mass: 0.8,
        },
        (finished) => {
          'worklet';
          if (finished) {
            isAnimating.value = false;
          }
        }
      );
    }
    currentIndex.value = activeIndex;
  }, [activeIndex, children.length]);

  // Track if we should fail the gesture (for nested containers at edges)
  const shouldFailGesture = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      'worklet';
      shouldFailGesture.value = false;
      cancelAnimation(translateX);
      isGestureActive.value = true;
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      'worklet';
      // Safety check for children length
      const len = childrenLength.value;
      if (len === 0) return;

      // Only update if horizontal movement is clearly dominant (2:1 ratio)
      // This allows vertical scrolling to work when movement is more vertical
      if (Math.abs(e.translationX) > Math.abs(e.translationY) * 2) {
        // If shouldFailAtEdges is true, check if we're at an edge trying to swipe beyond
        if (shouldFailAtEdges) {
          const currentIdx = currentIndex.value;
          // At first index and swiping right, or at last index and swiping left
          if ((currentIdx === 0 && e.translationX > 30) || 
              (currentIdx === len - 1 && e.translationX < -30)) {
            // Mark gesture to fail - don't handle it, let parent take over
            shouldFailGesture.value = true;
            // Apply slight resistance for visual feedback, then snap back
            const resistance = 0.2;
            if (currentIdx === 0 && e.translationX > 0) {
              translateX.value = Math.min(0, startX.value + e.translationX * resistance);
            } else if (currentIdx === len - 1 && e.translationX < 0) {
              const minTranslateX = -(len - 1) * SCREEN_WIDTH;
              translateX.value = Math.max(minTranslateX, startX.value + e.translationX * resistance);
            }
            return;
          }
        }
        
        const newPos = startX.value + e.translationX;
        const minTranslateX = -(len - 1) * SCREEN_WIDTH;
        const maxTranslateX = 0;
        const clampedPos = Math.max(minTranslateX, Math.min(newPos, maxTranslateX));
        translateX.value = clampedPos;
      }
    })
    .onEnd((e) => {
      'worklet';
      isGestureActive.value = false;

      // Safety check for children length
      const len = childrenLength.value;
      if (len === 0) return;

      // If gesture was marked to fail (at edge in nested container), snap back immediately
      if (shouldFailGesture.value) {
        shouldFailGesture.value = false;
        const currentIdx = currentIndex.value;
        translateX.value = withSpring(-currentIdx * SCREEN_WIDTH, {
          damping: 20,
          stiffness: 90,
          mass: 0.8,
        });
        return; // Don't process further - let parent handle
      }

      // Only process swipe if horizontal movement was clearly dominant (2:1 ratio)
      if (Math.abs(e.translationX) > Math.abs(e.translationY) * 2) {
        
        const threshold = SCREEN_WIDTH * 0.2; // Lower threshold for gentler feel
        const velocity = e.velocityX;
        const currentPos = translateX.value;

        // Calculate target index based on final position first
        let targetIndex = Math.round(-currentPos / SCREEN_WIDTH);
        targetIndex = Math.max(0, Math.min(targetIndex, len - 1));

        // If swipe was significant, determine target based on direction
        if (Math.abs(e.translationX) > threshold || Math.abs(velocity) > 300) {
          if (e.translationX > 0 && currentIndex.value > 0) {
            // Swiping right - go to previous index
            targetIndex = Math.max(0, currentIndex.value - 1);
          } else if (e.translationX < 0 && currentIndex.value < len - 1) {
            // Swiping left - go to next index
            targetIndex = Math.min(len - 1, currentIndex.value + 1);
          }
        }

        // Animate to target position with gentle spring
        translateX.value = withSpring(-targetIndex * SCREEN_WIDTH, {
          damping: 20,
          stiffness: 90,
          mass: 0.8,
        });

        currentIndex.value = targetIndex;
        // Always call onIndexChange when gesture ends with a valid target
        // The callback will check if the tab actually needs to change
        if (targetIndex >= 0 && targetIndex < len) {
          runOnJS(callOnIndexChange)(targetIndex);
        }
      } else {
        // Snap back to current position if gesture was mostly vertical (gentle spring)
        translateX.value = withSpring(-currentIndex.value * SCREEN_WIDTH, {
          damping: 20,
          stiffness: 90,
          mass: 0.8,
        });
      }
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Early return if no children
  if (!children || children.length === 0) {
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
  }

  // If shouldFailAtEdges, wrap in Simultaneous to allow parent gesture to also work
  const finalGesture = shouldFailAtEdges
    ? Gesture.Simultaneous(panGesture)
    : panGesture;

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <GestureDetector gesture={finalGesture}>
        <Animated.View
          style={[
            containerStyle,
            {
              flexDirection: 'row',
              width: SCREEN_WIDTH * children.length,
              flex: 1,
            },
          ]}>
          {children.map((child, index) => (
            <View
              key={index}
              style={{
                width: SCREEN_WIDTH,
                flex: 1,
                backgroundColor: '#000000',
              }}>
              {child}
            </View>
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

