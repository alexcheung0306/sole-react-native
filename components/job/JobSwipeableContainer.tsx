import React, { useCallback, useEffect, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useJobTabContext } from '~/context/JobTabContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type JobSwipeableContainerProps = {
  children: React.ReactNode[];
  activeIndex: number;
};

export default function JobSwipeableContainer({
  children,
  activeIndex,
}: JobSwipeableContainerProps) {
  const { activeTab, setActiveTab } = useJobTabContext();
  const activeTabRef = useRef(activeTab);

  // Keep ref updated with latest activeTab value
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const indexToTab = ['job-posts', 'applied-roles', 'my-contracts'] as const;
  const onIndexChange = useCallback(
    (index: number) => {
      // Get the latest activeTab value from ref to avoid stale closure
      const currentActiveTab = activeTabRef.current;
      console.log('onIndexChange called with index:', index, 'current activeTab:', currentActiveTab);
      // Safety check
      if (index < 0 || index >= indexToTab.length) {
        console.log('onIndexChange: index out of bounds');
        return;
      }

      const newTab = indexToTab[index];
      console.log('onIndexChange: newTab:', newTab, 'activeTab:', currentActiveTab);
      if (newTab && newTab !== currentActiveTab) {
        console.log('onIndexChange: setting new tab to', newTab);
        setActiveTab(newTab);
      } else {
        console.log('onIndexChange: skipping - newTab same as activeTab or invalid');
      }
    },
    [setActiveTab]
  );

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

  const panGesture = Gesture.Pan()
    .minDistance(3)
    .activeOffsetX([-10, 10])
    .failOffsetY([-25, 25])
    .onStart(() => {
      cancelAnimation(translateX);
      isGestureActive.value = true;
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      'worklet';
      // Safety check for children length
      const len = childrenLength.value;
      if (len === 0) return;

      // Only update if horizontal movement is dominant
      if (Math.abs(e.translationX) > Math.abs(e.translationY) * 1.5) {
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

      // Only process swipe if horizontal movement was dominant
      if (Math.abs(e.translationX) > Math.abs(e.translationY) * 1.5) {
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
          runOnJS(onIndexChangeRef.current)(targetIndex);
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

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <GestureDetector gesture={panGesture}>
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
