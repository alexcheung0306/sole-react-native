import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface MediaZoomProps {
  imageUrl: string;
  width: number;
  height: number;
  resetOnRelease?: boolean; // If true, resets to normal size when gesture ends
  minScale?: number;
  maxScale?: number;
}


export function MediaZoom({
  imageUrl,
  width,
  height,
  resetOnRelease = false,
  minScale = 1,
  maxScale = 3,
}: MediaZoomProps) {
  const pinchSensitivity = 0.2; // lower = less responsive scaling to pinch distance
  // JS-side logger; safe to call from worklets via runOnJS
  const debugLog = React.useCallback((label: string, payload: Record<string, any>) => {
    if (!__DEV__) return;
    console.log(`[media-zoom] ${label}`, payload);
  }, []);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const touch1X = useSharedValue(-1000);
  const touch1Y = useSharedValue(-1000);
  const touch2X = useSharedValue(-1000);
  const touch2Y = useSharedValue(-1000);
  const touchCount = useSharedValue(0);
  const isZoomActive = useSharedValue(false); // Track if zoom/backdrop is active
  const backdropOpacity = useSharedValue(0); // Backdrop opacity
  const isPinching = useSharedValue(false);
  const activeTouches = useSharedValue(0); // Track number of active touches
  const initialScale = useSharedValue(1);
  const initialTranslateX = useSharedValue(0);
  const initialTranslateY = useSharedValue(0);
  const panStartX = useSharedValue(0); // Track pan gesture start position
  const panStartY = useSharedValue(0);
  // Track content point under the focal at pinch start so we can keep it under the fingers
  const pinchContentX = useSharedValue(0);
  const pinchContentY = useSharedValue(0);
  const logCounter = useSharedValue(0); // throttle logging on UI thread

  const shouldLog = () => {
    'worklet';
    logCounter.value = (logCounter.value + 1) % 4;
    return logCounter.value === 0;
  };

  // Function to reset and close backdrop
  const resetAndClose = React.useCallback(() => {
    'worklet';
    // Animate backdrop out
    backdropOpacity.value = withTiming(0);
    isZoomActive.value = false;
    
    // Reset image transform
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    activeTouches.value = 0;
    isPinching.value = false;
    // Center focal when reset
    focalX.value = width / 2;
    focalY.value = height / 2;
    touchCount.value = 0;
    touch1X.value = -1000;
    touch1Y.value = -1000;
    touch2X.value = -1000;
    touch2Y.value = -1000;
  }, []);

  // Function to check if all touches are released and reset if needed
  const checkAndReset = React.useCallback(() => {
    'worklet';
    if (activeTouches.value === 0 && isZoomActive.value) {
      // All fingers released - animate back to initial size and close backdrop
      scale.value = withSpring(initialScale.value, {}, () => {
        'worklet';
        resetAndClose();
      });
      translateX.value = withSpring(initialTranslateX.value);
      translateY.value = withSpring(initialTranslateY.value);
      savedScale.value = initialScale.value;
      savedTranslateX.value = initialTranslateX.value;
      savedTranslateY.value = initialTranslateY.value;
      // Reset focal/touch visuals
      focalX.value = width / 2;
      focalY.value = height / 2;
      touchCount.value = 0;
      touch1X.value = -1000;
      touch1Y.value = -1000;
      touch2X.value = -1000;
      touch2Y.value = -1000;
    }
  }, [resetAndClose]);

  const setTouches = (touches: any) => {
    'worklet';
    if (!touches || touches.length === 0) {
      // Keep previous positions/visibility to avoid flicker when events omit touches
      touchCount.value = 0;
      return;
    }
    const t1 = touches[0];
    const t2 = touches[1];
    touchCount.value = touches.length;
    if (t1) {
      touch1X.value = t1.x;
      touch1Y.value = t1.y;
    }
    if (t2) {
      touch2X.value = t2.x;
      touch2Y.value = t2.y;
    } else {
      touch2X.value = -1000;
      touch2Y.value = -1000;
    }
  };

  const setFocalFromTouches = (touches: any, fallbackFocalX: number, fallbackFocalY: number) => {
    'worklet';
    const hasTouches = touches && touches.length > 0;
    const t1 = hasTouches ? touches[0] : undefined;
    const t2 = hasTouches ? touches[1] : undefined;
    if (t1 && t2) {
      focalX.value = (t1.x + t2.x) / 2;
      focalY.value = (t1.y + t2.y) / 2;
    } else if (t1) {
      focalX.value = t1.x;
      focalY.value = t1.y;
    } else {
      focalX.value = fallbackFocalX;
      focalY.value = fallbackFocalY;
    }
  };

  // Must be a worklet because it's called inside gesture worklets
  const extractTouches = (e: any) => {
    'worklet';
    return e?.allTouches ?? e?.touches ?? [];
  };

// Zooming in and out
  const pinchGesture = Gesture.Pinch()
    .onTouchesDown((e) => {
      'worklet';
      const touches = extractTouches(e as any);
      setTouches(touches);
      setFocalFromTouches(touches, focalX.value, focalY.value);

      // When pinch starts (2 touches detected)
      if (e.numberOfTouches === 2) {
        isPinching.value = true;
        activeTouches.value = 2;
        // Show backdrop when pinch starts
        if (!isZoomActive.value) {
          isZoomActive.value = true;
          backdropOpacity.value = withTiming(1);
          // Store initial values
          initialScale.value = scale.value;
          initialTranslateX.value = translateX.value;
          initialTranslateY.value = translateY.value;
        }
        setTouches((e as any).allTouches);
      }
    })
    .onStart((e) => {
      'worklet';
      // Save focal point (center between touches if available)
      const touches = extractTouches(e as any);
      setTouches(touches);
      setFocalFromTouches(touches, e.focalX, e.focalY);

      // Capture the transform state at the start of this pinch
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      // Compute the content point currently under the focal so we can keep it under the fingers
      const baseScale = savedScale.value || initialScale.value;
      const contentX = (focalX.value - savedTranslateX.value) / baseScale;
      const contentY = (focalY.value - savedTranslateY.value) / baseScale;
      pinchContentX.value = contentX;
      pinchContentY.value = contentY;

      if (shouldLog()) {
        runOnJS(debugLog)('pinch-start', {
          scale: scale.value,
          focalX: focalX.value,
          focalY: focalY.value,
        });
      }
    })
    .onUpdate((e) => {
      'worklet';
      // Only resize while actively pinching (two fingers)
      const pointerCount =
        (e as any).numberOfTouches ?? (e as any).numberOfPointers ?? touchCount.value;
      if (pointerCount < 2) {
        // Transitioned to one finger: stop scaling and preserve current state for pan
        const touches = extractTouches(e as any);
        setTouches(touches);
        setFocalFromTouches(touches, e.focalX, e.focalY);
        isPinching.value = false;
        activeTouches.value = pointerCount;
        savedScale.value = scale.value;
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        return;
      }

      if (isPinching.value) {
        // Update touches and focal every frame
        const touches = extractTouches(e as any);
        setTouches(touches);
        setFocalFromTouches(touches, e.focalX, e.focalY);

        // Calculate new scale: fingers apart = zoom in, fingers together = zoom out
        const baseScale = savedScale.value || initialScale.value;
        // Reduce sensitivity so scaling tracks pinch distance more gently
        const newScale = baseScale * (1 + (e.scale - 1) * pinchSensitivity);
        // Clamp between minScale (1 = original size) and maxScale
        const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));

        // Keep the original content point under the fingers anchored to the moving focal
        // focal = content * scale + translate => translate = focal - content * scale
        const newTranslateX = focalX.value - pinchContentX.value * clampedScale;
        const newTranslateY = focalY.value - pinchContentY.value * clampedScale;

        // Update touch points for debugging
        setTouches(touches);

        scale.value = clampedScale;
        // translateX.value = clamped.x;
        // translateY.value = clamped.y;
        // Keep saved values in sync so pan can use current state while pinching
        savedScale.value = clampedScale;
        // savedTranslateX.value = clamped.x;
        // savedTranslateY.value = clamped.y;

        // Lightweight debug (bridge): scale + focal
        if (shouldLog()) {
          runOnJS(debugLog)('pinch', {
            scale: clampedScale,
            focalX: focalX.value,
            focalY: focalY.value,
          });
        }
      }
    })
    .onTouchesUp((e) => {
      'worklet';
      const touches = extractTouches(e as any);
      setTouches(touches);
      setFocalFromTouches(touches, focalX.value, focalY.value);
      // Update touch count and pinching state
      const previousPinching = isPinching.value;
      activeTouches.value = touches.length;
      isPinching.value = touches.length === 2;
      
      // When transitioning from pinching (2 fingers) to panning (1 finger)
      // Save current values so pan gesture can continue smoothly
      if (previousPinching && !isPinching.value && activeTouches.value === 1) {
        savedScale.value = scale.value;
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
      
      // If all touches released, trigger reset
      if (activeTouches.value === 0 && isZoomActive.value) {
        checkAndReset();
      }
    })
    .onEnd(() => {
      'worklet';
      const wasPinching = isPinching.value;
      isPinching.value = false;
      // Ensure activeTouches is zeroed on gesture end
      activeTouches.value = 0;
      
      // Save final values after pinch ends
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      
      // Final check if all touches are released
      if (activeTouches.value === 0 && isZoomActive.value) {
        checkAndReset();
      }
    })
    .onFinalize(() => {
      'worklet';
      // Fallback to ensure reset after any termination
      activeTouches.value = 0;
      isPinching.value = false;
      if (isZoomActive.value) {
        checkAndReset();
      }
    });

// Moving the image around (allow simultaneous with pinch)
  const panGesture = Gesture.Pan().manualActivation(true)
    .onBegin(() => {
      'worklet';
      // When pan gesture begins (but may not be active yet)
      // This runs before onStart and helps with transition from pinch
      if (isZoomActive.value) {
        // Update saved values to current position immediately
        // This ensures smooth transition from pinch (2 fingers) to pan (1 finger)
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        savedScale.value = scale.value;
      }
    })
    .onStart((e) => {
      'worklet';
      // Store pan start position when pan gesture begins
      if (isZoomActive.value) {
        panStartX.value = e.x;
        panStartY.value = e.y;
        // Ensure saved values are current and pinching is off
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        savedScale.value = scale.value;
      }
    })
    .onTouchesDown((e, state) => {
      'worklet';
      const touches = extractTouches(e as any);
      setTouches(touches);
      setFocalFromTouches(touches, focalX.value, focalY.value);
      // Activate pan only when zoom is active; otherwise let scroll take over
      const hasState = !!state;
      if (hasState && isZoomActive.value) {
        activeTouches.value = e.allTouches.length;
        state.activate();
      } else if (hasState) {
        state.fail();
      }
    })
    .onTouchesMove((e, state) => {
      'worklet';
      const touches = extractTouches(e as any);
      setTouches(touches);
      setFocalFromTouches(touches, focalX.value, focalY.value);
      // Keep pan active while zoom is active (simultaneous with pinch)
      const hasState = !!state;
      if (hasState && isZoomActive.value) {
        activeTouches.value = e.allTouches.length;
        state.activate();
      } else if (hasState) {
        state.fail();
      }
    })
    .onUpdate((e) => {
      'worklet';
      // Allow panning whenever zoom is active (can be simultaneous with pinch)
      if (isZoomActive.value) {
        // Refresh touches/focal during pan updates so focal follows the active finger
        const touches = extractTouches(e as any);
        setTouches(touches);
        setFocalFromTouches(touches, focalX.value, focalY.value);

        // Use the latest translate as base to stay in sync with pinch updates
        const baseTranslateX = translateX.value;
        const baseTranslateY = translateY.value;
        
        const newX = baseTranslateX + e.translationX;
        const newY = baseTranslateY + e.translationY;

        // const clamped = clampTranslate(newX, newY, scale.value);
        
        // Direct assignment for real-time responsiveness during active gesture
        // translateX.value = clamped.x;
        // translateY.value = clamped.y;

        if (shouldLog()) {
          runOnJS(debugLog)('pan', {
            translationX: e.translationX,
            translationY: e.translationY,
            activeTouches: activeTouches.value,
          });
        }
      }
    })
    .onTouchesUp((e, state) => {
      'worklet';
      const touches = extractTouches(e as any);
      setTouches(touches);
      setFocalFromTouches(touches, focalX.value, focalY.value);
      if (isZoomActive.value) {
        // Update touch count when not pinching (pinch gesture handles when pinching)
        activeTouches.value = touches.length;
        
        // Save current position
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        
        // If all touches are released, trigger reset
        if (activeTouches.value === 0) {
          checkAndReset();
        }
      }
    })
    .onEnd(() => {
      'worklet';
      // Save current position
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      // Zero out touch count on pan end to allow reset
      activeTouches.value = 0;
      // Final check if all touches are released
      if (activeTouches.value === 0 && isZoomActive.value) {
        checkAndReset();
      }
    })
    .onFinalize(() => {
      'worklet';
      activeTouches.value = 0;
      if (isZoomActive.value) {
        checkAndReset();
      }
    });

  // Combine gestures - pinch and pan can work simultaneously
  // This allows zooming while panning, or panning while zoomed
  const gesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        // Use focal-centered positioning while zoom is active; fall back to translate otherwise
        { translateX: isZoomActive.value ? focalX.value - width / 2 : translateX.value },
        { translateY: isZoomActive.value ? focalY.value - height / 2 : translateY.value },
        { scale: scale.value },
      ],
      zIndex: isZoomActive.value ? 10000 : 1, // High z-index when zoomed
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  // Debug dots for focal and touches
  const focalDebugStyle = useAnimatedStyle(() => {
    return {
      opacity: touchCount.value > 0 ? 1 : 0,
      transform: [{ translateX: focalX.value - 6 }, { translateY: focalY.value - 6 }],
    };
  });
  const touch1DebugStyle = useAnimatedStyle(() => {
    return {
      opacity: touchCount.value >= 1 ? 1 : 0,
      transform: [{ translateX: touch1X.value - 6 }, { translateY: touch1Y.value - 6 }],
      zIndex: 10002,
    };
  });
  const touch2DebugStyle = useAnimatedStyle(() => {
    return {
      opacity: touchCount.value >= 2 ? 1 : 0,
      transform: [{ translateX: touch2X.value - 6 }, { translateY: touch2Y.value - 6 }],
      zIndex: 10002,
    };
  });

  return (
    <>
      <View style={[styles.container, { width, height, position: 'relative' }]}>
        <GestureDetector gesture={gesture}>
          <Animated.View 
            style={[
                
              styles.imageContainer, 
              animatedStyle,
              {
                position: 'absolute',
                left: 0,
                top: 0,
                width: width,
                height: height,
              }
            ]}>
            <Image
              source={{ uri: imageUrl }}
              style={[styles.image, { width, height }]}
              resizeMode="contain"
            />
          </Animated.View>
        </GestureDetector>

        {/* Debug circles: red = focal, blue = touches */}
        <Animated.View style={[styles.debugDotFocal, focalDebugStyle]} />
        <Animated.View style={[styles.debugDotTouch, touch1DebugStyle]} />
        <Animated.View style={[styles.debugDotTouch, touch2DebugStyle]} />
      </View>
      
      {/* Backdrop overlay - positioned absolutely to cover full screen */}
      {/* Place after gesture detector to avoid blocking touches */}
      <Animated.View 
        style={[
          styles.backdrop, 
          backdropStyle,
        ]} 
        pointerEvents="none"
      />
    </>
  );
}

const SCREEN_DIMENSIONS = Dimensions.get('window');
const SCREEN_WIDTH = SCREEN_DIMENSIONS.width;
const SCREEN_HEIGHT = SCREEN_DIMENSIONS.height;

  const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
    zIndex: 2, // ensure debug dots/images stay above backdrop
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    zIndex: 0, // keep backdrop behind image/dots
  },
  imageContainer: {
    // Remove justifyContent and alignItems to allow free movement
    // The transform will handle positioning
  },
  image: {
    // Image styles
  },
  debugDotFocal: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
    zIndex: 10001,
  },
  debugDotTouch: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'blue',
    zIndex: 3,
  },
});

