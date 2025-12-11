import React, { useEffect, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  cancelAnimation,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SwipeableContainerProps = {
  children: React.ReactNode[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  shouldFailAtEdges?: boolean; // If true, gesture fails at edges to allow parent to handle
  shrink?: boolean; // If true, applies shrink transition effect when swiping (default: true)
};

export default function SwipeableContainer({
  children,
  activeIndex,
  onIndexChange,
  shouldFailAtEdges = false,
  shrink = true,
}: SwipeableContainerProps) {
  const translateX = useSharedValue(-activeIndex * SCREEN_WIDTH);
  const currentIndex = useSharedValue(activeIndex);
  const isGestureActive = useSharedValue(false);
  const startX = useSharedValue(0);
  const onIndexChangeRef = useRef(onIndexChange);
  const isAnimating = useSharedValue(false);
  const childrenLength = useSharedValue(children.length);
  // For swipe transition effects
  const isSwiping = useSharedValue(false);
  const swipeOffset = useSharedValue(0); // Distance from center position
  // Track if we should fail the gesture (for nested containers at edges)
  const shouldFailGesture = useSharedValue(false);
  const shouldLogGesture = false;
  // Store shrink prop in shared value so it can be accessed in worklets
  const shrinkEnabled = useSharedValue(shrink);
  // Track if we've committed to a horizontal gesture - once committed, continue even if vertical movement increases
  const isHorizontalGestureCommitted = useSharedValue(false);
  
  // Update shrink value when prop changes
  useEffect(() => {
    shrinkEnabled.value = shrink;
  }, [shrink]);

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

    // Always sync currentIndex immediately - this ensures gesture handler has correct value
    currentIndex.value = activeIndex;

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
    } else {
      // If already at position, ensure translateX is exactly at target
      translateX.value = targetPos;
      isAnimating.value = false;
    }
  }, [activeIndex, children.length]);

  // Logging function
  const logGesture = React.useCallback((event: string, data: any) => {
    if (shouldLogGesture) {
      console.log(`[SwipeableContainer] ${event}:`, data);
    }
  }, []);

  const panGesture = Gesture.Pan()
    .minDistance(20) // Lower minimum distance for more sensitive horizontal detection
    .activeOffsetX([-60, 60]) // Lower threshold - activate horizontal gestures sooner
    .failOffsetY([-50, 50]) // Higher threshold - allow more vertical movement before failing
    .onStart(() => {
      'worklet';
      shouldFailGesture.value = false;
      cancelAnimation(translateX);
      isGestureActive.value = true;
      startX.value = translateX.value;
      isSwiping.value = true;
      swipeOffset.value = 0;
      isHorizontalGestureCommitted.value = false; // Reset on new gesture
      runOnJS(logGesture)('onStart', {
        currentIndex: currentIndex.value,
        startX: startX.value,
        translateX: translateX.value,
      });
    })
    .onUpdate((e) => {
      'worklet';
      // Safety check for children length
      const len = childrenLength.value;
      if (len === 0) return;

      // Check if horizontal movement is dominant (1.5:1 ratio - more sensitive to horizontal)
      const isHorizontalDominant = Math.abs(e.translationX) > Math.abs(e.translationY) * 1.5;
      
      // Check if movement is significant (lowered thresholds for more sensitive horizontal)
      const isSignificantSwipe = Math.abs(e.translationX) > 60 || Math.abs(e.velocityX) > 400;
      
      // If we've already committed to a horizontal gesture, continue updating as long as there's horizontal movement
      // This prevents pausing when the gesture becomes more vertical during an active horizontal scroll
      const shouldUpdate = isHorizontalGestureCommitted.value 
        ? Math.abs(e.translationX) > 0 // Continue if there's any horizontal movement
        : (isHorizontalDominant && isSignificantSwipe); // Initial check: must be horizontal and significant
      
      // Commit to horizontal gesture if conditions are met
      if (!isHorizontalGestureCommitted.value && isHorizontalDominant && isSignificantSwipe) {
        isHorizontalGestureCommitted.value = true;
      }
      
      if (shouldUpdate) {
        const currentIdx = currentIndex.value;

        // Check if we're trying to swipe beyond boundaries (hard boundary lock)
        const atLeftEdge = currentIdx === 0 && e.translationX > 0;
        const atRightEdge = currentIdx === len - 1 && e.translationX < 0;

        // If at edge and trying to swipe beyond, completely block movement
        if (atLeftEdge || atRightEdge) {
          // Don't move at all - stay at current position
          translateX.value = startX.value;
          // Still track swipe offset for visual effects
          swipeOffset.value = 0; // No offset when blocked
          runOnJS(logGesture)('onUpdate (blocked at edge)', {
            currentIndex: currentIdx,
            translationX: e.translationX,
            translationY: e.translationY,
            atLeftEdge,
            atRightEdge,
          });
          return;
        }

        // If shouldFailAtEdges is true, check if we're at an edge trying to swipe beyond
        if (shouldFailAtEdges) {
          // At first index and swiping right, or at last index and swiping left
          if (
            (currentIdx === 0 && e.translationX > 30) ||
            (currentIdx === len - 1 && e.translationX < -30)
          ) {
            // Mark gesture to fail - don't handle it, let parent take over
            shouldFailGesture.value = true;
            runOnJS(logGesture)('onUpdate (should fail)', {
              currentIndex: currentIdx,
              translationX: e.translationX,
            });
            return;
          }
        }

        const newPos = startX.value + e.translationX;
        const minTranslateX = -(len - 1) * SCREEN_WIDTH;
        const maxTranslateX = 0;
        const clampedPos = Math.max(minTranslateX, Math.min(newPos, maxTranslateX));
        translateX.value = clampedPos;

        // Track swipe offset for visual effects
        swipeOffset.value = e.translationX;

        runOnJS(logGesture)('onUpdate', {
          currentIndex: currentIdx,
          translationX: e.translationX,
          translationY: e.translationY,
          velocityX: e.velocityX,
          velocityY: e.velocityY,
          translateX: translateX.value,
          swipeOffset: swipeOffset.value,
        });
      }
    })
    .onEnd((e) => {
      'worklet';
      isGestureActive.value = false;
      isHorizontalGestureCommitted.value = false; // Reset for next gesture

      // Safety check for children length
      const len = childrenLength.value;
      if (len === 0) {
        isSwiping.value = false;
        swipeOffset.value = 0;
        return;
      }

      // If gesture was marked to fail (at edge in nested container), snap back immediately
      if (shouldFailGesture.value) {
        shouldFailGesture.value = false;
        const currentIdx = currentIndex.value;
        translateX.value = withSpring(-currentIdx * SCREEN_WIDTH, {
          damping: 20,
          stiffness: 90,
          mass: 0.8,
        });
        // Animate swipeOffset back smoothly
        swipeOffset.value = withSpring(
          0,
          {
            damping: 20,
            stiffness: 90,
            mass: 0.8,
          },
          (finished) => {
            'worklet';
            if (finished) {
              isSwiping.value = false;
            }
          }
        );
        runOnJS(logGesture)('onEnd (gesture failed)', {
          currentIndex: currentIdx,
          translationX: e.translationX,
          translationY: e.translationY,
        });
        return; // Don't process further - let parent handle
      }

      // Check if horizontal movement was dominant (1.5:1 ratio - more sensitive to horizontal)
      const isHorizontalDominant = Math.abs(e.translationX) > Math.abs(e.translationY) * 1.5;
      // Lowered thresholds for more sensitive horizontal detection
      const isSignificantSwipe = Math.abs(e.translationX) > 60 || Math.abs(e.velocityX) > 400;
      
      // Process if we've committed to horizontal gesture OR if it's currently horizontal dominant
      // This ensures we complete horizontal swipes even if they end with more vertical movement
      const shouldProcessSwipe = isHorizontalGestureCommitted.value || (isHorizontalDominant && isSignificantSwipe);
      
      if (shouldProcessSwipe && Math.abs(e.translationX) > 0) {
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

        // Animate swipeOffset back smoothly to restore size
        swipeOffset.value = withSpring(
          0,
          {
            damping: 20,
            stiffness: 90,
            mass: 0.8,
          },
          (finished) => {
            'worklet';
            if (finished) {
              isSwiping.value = false;
            }
          }
        );

        currentIndex.value = targetIndex;

        runOnJS(logGesture)('onEnd', {
          currentIndex: currentIndex.value,
          targetIndex,
          translationX: e.translationX,
          translationY: e.translationY,
          velocityX: e.velocityX,
          velocityY: e.velocityY,
          threshold,
          exceededThreshold: Math.abs(e.translationX) > threshold,
          exceededVelocity: Math.abs(velocity) > 300,
        });

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
        // Animate swipeOffset back smoothly to restore size
        swipeOffset.value = withSpring(
          0,
          {
            damping: 20,
            stiffness: 90,
            mass: 0.8,
          },
          (finished) => {
            'worklet';
            if (finished) {
              isSwiping.value = false;
            }
          }
        );
        runOnJS(logGesture)('onEnd (vertical gesture, snapping back)', {
          currentIndex: currentIndex.value,
          translationX: e.translationX,
          translationY: e.translationY,
          ratio: Math.abs(e.translationX) / Math.abs(e.translationY),
        });
      }
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Create animated style for swipe transition effects
  const createSwipeEffectStyle = useAnimatedStyle(() => {
    const swipeProgress = Math.abs(swipeOffset.value) / SCREEN_WIDTH;
    const isActive = isSwiping.value;
    const shouldShrink = shrinkEnabled.value;

    // If shrink is disabled, return no effects
    if (!shouldShrink) {
      return {
        transform: [{ scale: 1 }],
        borderRadius: 0,
        shadowColor: '#ffffff',
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      };
    }

    // Scale down during swipe (shrink effect)
    const scale = interpolate(swipeProgress, [0, 0.3, 1], [1, 0.95, 0.9], Extrapolate.CLAMP);

    // Border radius increases during swipe (phone-like rounded corners)
    const borderRadius = interpolate(swipeProgress, [0, 0.5, 1], [0, 20, 30], Extrapolate.CLAMP);

    // Shadow opacity increases during swipe
    const shadowOpacity = interpolate(swipeProgress, [0, 0.2, 1], [0, 0.3, 0.6], Extrapolate.CLAMP);

    return {
      transform: [{ scale: isActive ? scale : 1 }],
      borderRadius: isActive ? borderRadius : 0,
      shadowColor: '#ffffff',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: isActive ? shadowOpacity : 0,
      shadowRadius: isActive ? 20 : 0,
      elevation: isActive ? 10 : 0,
    };
  });

  // Early return if no children
  if (!children || children.length === 0) {
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
  }

  // Use Race gesture to allow ScrollView to win for small movements
  // Only activate tab swipe for large, clear swipes
  const finalGesture = panGesture;

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
            <Animated.View
              key={index}
              style={[
                createSwipeEffectStyle,
                {
                  width: SCREEN_WIDTH,
                  flex: 1,
                  backgroundColor: '#000000',
                  overflow: 'hidden', // Ensure border radius clips content
                },
              ]}>
              {child}
            </Animated.View>
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
