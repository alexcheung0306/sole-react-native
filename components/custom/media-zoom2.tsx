import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  cancelAnimation,
  useDerivedValue,
} from 'react-native-reanimated';

interface MediaZoom2Props {
  children: React.ReactNode;
  width: number;
  height: number;
  resetOnRelease?: boolean;
  minScale?: number;
  maxScale?: number;
  onZoomActiveChange?: (active: boolean) => void;
  onScaleChange?: (scale: number) => void;
}

export function MediaZoom2({
  children,
  width,
  height,
  resetOnRelease = false,
  minScale = 1,
  maxScale = 5,
  onZoomActiveChange,
  onScaleChange,
}: MediaZoom2Props) {
  const pinchSensitivity = 1.0;
  const isLogAvaliable =true;
  
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // These track the saved state when a gesture ends
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Offset to subtract from pan translation to prevent jumps
  const panOffsetX = useSharedValue(0);
  const panOffsetY = useSharedValue(0);

  // Tracks the content point (relative to center) under the focal point at pinch start
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);

  const isPinching = useSharedValue(false);
  const isPanning = useSharedValue(false);
  const isZoomActive = useSharedValue(false);
  const backdropOpacity = useSharedValue(0);
  // Prevent duplicate resets when both gestures fire end events
  const hasResetOnEnd = useSharedValue(false);
  // Track if a reset animation is in progress to prevent gestures during reset
  const isResetting = useSharedValue(false);
  // Cooldown period after pinch ends to prevent immediate re-pinch (in milliseconds)
  const pinchCooldown = useSharedValue(0);
  const PINCH_COOLDOWN_MS = 200; // 200ms cooldown after pinch ends

  const initialFocalX = useSharedValue(0);
  const initialFocalY = useSharedValue(0);

  // Track number of pointers to detect changes (e.g. lifting one finger)
  const activePointers = useSharedValue(0);

  // State for debug z-index display
  const [wrapperZIndex, setWrapperZIndex] = React.useState(10);
  const [contentZIndex, setContentZIndex] = React.useState(30);

  // Update z-index display when zoom state changes
  useDerivedValue(() => {
    const wrapperZ = isZoomActive.value ? 20000 : 10;
    const contentZ = isZoomActive.value ? 9999 : 30;
    runOnJS(setWrapperZIndex)(wrapperZ);
    runOnJS(setContentZIndex)(contentZ);
  }, [isZoomActive]);

  // Continuously notify scale changes during reset animation so header/tab bar can follow
  useDerivedValue(() => {
    // Only notify during reset animation to allow header/tab bar to follow smoothly
    if (isResetting.value && onScaleChange) {
      const currentScale = Math.max(minScale, Math.min(maxScale, scale.value));
      runOnJS(onScaleChange)(currentScale);
    }
  }, [scale, isResetting, onScaleChange, minScale, maxScale]);

  const debugLog = React.useCallback((label: string, payload: Record<string, any>) => {
    if (!__DEV__) return;
    console.log(`[media-zoom-2] ${label}`, payload);
  }, []);

  // Worklet-safe logger; only fires in dev
  const logGesture = React.useCallback(
    (label: string, payload: Record<string, any>) => {
      'worklet';
      if (!__DEV__ || !isLogAvaliable) return;
      runOnJS(debugLog)(label, payload);
    },
    [debugLog]
  );

  const reset = React.useCallback((instant = false) => {
    'worklet';
    // Cancel any ongoing animations first
    cancelAnimation(scale);
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(backdropOpacity);
    
    // Immediately prevent all interactions before starting animations
    // Note: Keep isZoomActive true during animation so z-index stays high
    // We'll set it to false when animation completes
    // Also keep backdrop visible during animation - it will fade out when animation completes
    hasResetOnEnd.value = false;
    isPanning.value = false;
    isPinching.value = false;
    
    isResetting.value = true;
      
    // Smooth reset with gentle spring animation
    // Using high damping and lower stiffness for a smooth, non-bouncy transition
    const springConfig = {
      damping: 20,
      stiffness: 90,
      mass: 0.5,
    };
    
    // Use callback on scale animation to clear the resetting flag and notify zoom inactive
    // Scale is typically the longest animation, so when it's done, others are too
    scale.value = withSpring(1, springConfig, (finished) => {
      'worklet';
      if (finished) {
        isResetting.value = false;
        // Now that animation is complete, set zoom inactive
        // Backdrop will be hidden (opacity = 0) since isZoomActive is false
        // Opacity automatically becomes 0 because scale is 1 and isZoomActive is false
        isZoomActive.value = false;
        if (onZoomActiveChange) {
          runOnJS(onZoomActiveChange)(false); // Z-index will drop now
        }
      }
    });
    translateX.value = withSpring(0, springConfig);
    translateY.value = withSpring(0, springConfig);
    // Backdrop stays visible during animation - will fade out in scale completion callback

    // Note: Scale changes during reset are now handled by useDerivedValue above
    // which continuously tracks scale.value and calls onScaleChange as it animates

    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;

    panOffsetX.value = 0;
    panOffsetY.value = 0;
  }, []);

  // Shared pan-end handler so we can call it from pinch end when no fingers remain
  const handlePanEndReset = React.useCallback(
    (payload: Record<string, any>, instant = false) => {
      'worklet';
      if (hasResetOnEnd.value) {
        return;
      }
      hasResetOnEnd.value = true;
      reset(instant);
      logGesture('pan.end', payload);
    },
    [reset, logGesture]
  );

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      'worklet';
      // Prevent pinch if reset animation is in progress
      if (isResetting.value) {
        return;
      }
      // Prevent pinch if cooldown period hasn't elapsed
      if (pinchCooldown.value > 0) {
        logGesture('pinch.start.blocked', { cooldown: pinchCooldown.value });
        return;
      }
      hasResetOnEnd.value = false;
      isPinching.value = true;
      
      // Set zoom active immediately on pinch start for instant z-index update
      // This ensures the carousel gets highest z-index before any scale change happens
      if (!isZoomActive.value) {
        isZoomActive.value = true;
        if (onZoomActiveChange) {
          runOnJS(onZoomActiveChange)(true); // Notify immediately for instant z-index update
        }
        // Backdrop opacity is now calculated from scale in useAnimatedStyle
        // No need to set it here - it will automatically follow scale
      }

      logGesture('pinch.start', {
        focalX: e.focalX,
        focalY: e.focalY,
        scale: scale.value,
        savedScale: savedScale.value,
      });

      // Cancel any ongoing springs
      cancelAnimation(scale);
      cancelAnimation(translateX);
      cancelAnimation(translateY);

      // Calculate the point in the content (relative to its center) that is currently under the focal point
      // Formula: Focal = Center + Translate + (Origin * Scale)
      // => Origin = (Focal - Center - Translate) / Scale
      const cx = width / 2;
      const cy = height / 2;

      // Use current values (handling the case where we interrupt an animation or start from existing state)
      const currentScale = scale.value;
      const currentTx = translateX.value;
      const currentTy = translateY.value;

      originX.value = (e.focalX - cx - currentTx) / currentScale;
      originY.value = (e.focalY - cy - currentTy) / currentScale;

      initialFocalX.value = e.focalX;
      initialFocalY.value = e.focalY;

      activePointers.value = e.numberOfPointers;

      // If fingers are moving in same direction, we shouldn't start pinching yet.
      // We can check if initial distance is small or if we want to enforce spread.
      // But more robustly, we can check velocity or direction?
      // The simplest way to avoid "pushing" being read as pinch is to wait until scale changes significantly?
      // Or rely on Gesture Handler's built-in recognition.

      savedScale.value = currentScale;
      savedTranslateX.value = currentTx;
      savedTranslateY.value = currentTy;
    })
    .onUpdate((e) => {
      'worklet';

      // isZoomActive is already set in onStart, so we just need to handle scale changes
      // Re-anchor origin on first actual scale change (when transitioning from scale 1)
      if (isZoomActive.value && savedScale.value === 1 && e.scale !== 1) {
        // First actual scale change - re-anchor origin to current focal point
        const cx = width / 2;
        const cy = height / 2;
        originX.value = (e.focalX - cx - translateX.value) / scale.value;
        originY.value = (e.focalY - cy - translateY.value) / scale.value;
        
        // Adjust savedScale so the zoom starts smoothly from current scale (1)
        savedScale.value = scale.value / e.scale;
      }

      // Notify scale change for proportional header/tab bar translation
      if (onScaleChange) {
        const currentScale = Math.max(minScale, Math.min(maxScale, savedScale.value * e.scale));
        runOnJS(onScaleChange)(currentScale);
      }

      // Note: backdropOpacity is now calculated from scale in useAnimatedStyle
      // This allows it to follow the scale animation during reset

      // If number of pointers changes (e.g. 2 -> 1), re-anchor origin to prevent jump
      // because the focal point (center of pointers) changes abruptly.
      if (e.numberOfPointers !== activePointers.value) {
        const cx = width / 2;
        const cy = height / 2;

        // Re-calculate origin so that (Origin * Scale) + Translate + Center = Focal
        // using the *new* focal point but keeping current Translate/Scale.
        originX.value = (e.focalX - cx - translateX.value) / scale.value;
        originY.value = (e.focalY - cy - translateY.value) / scale.value;

        activePointers.value = e.numberOfPointers;

        logGesture('pinch.update.pointersChanged', {
          pointers: e.numberOfPointers,
          focalX: e.focalX,
          focalY: e.focalY,
        });
      }

      // Calculate new scale
      const newScale = savedScale.value * e.scale;
      const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));

      // Calculate new translate to keep the origin point under the *current* focal point
      // Formula: Translate = Focal - Center - (Origin * NewScale)
      const cx = width / 2;
      const cy = height / 2;

      const newTx = e.focalX - cx - originX.value * clampedScale;
      const newTy = e.focalY - cy - originY.value * clampedScale;

      scale.value = clampedScale;
      translateX.value = newTx;
      translateY.value = newTy;

      // Scale change notification is already handled above in the isZoomActive check
      // No need to notify again here to avoid duplicate calls

      // Sync pan saved state so if we release one finger, pan takes over smoothly
      // This is crucial for avoiding jumps when transitioning from 2 fingers to 1 finger
      savedTranslateX.value = newTx;
      savedTranslateY.value = newTy;

      logGesture('pinch.update', {
        pointers: e.numberOfPointers,
        msg: 'Pinch updated',
      });
    })
    .onEnd((e) => {
      'worklet';

      logGesture('pinch.end', {
        pointers: e.numberOfPointers,
        msg: 'Pinch ended',
      });

      // Update saved state before ending pinch
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      isPinching.value = false;

      // If releasing one finger but still have others (e.g. going from pinch to pan),
      // we need to update the saved state to prevent jumping
      if (e.numberOfPointers > 0) {
        logGesture('pinch.end.fingerReleased', { pointers: e.numberOfPointers });
        return;
      }

      // If all fingers are released, smoothly reset if resetOnRelease is enabled
      if (e.numberOfPointers === 0) {
        // Cancel pan gesture immediately to prevent any delays
        isPanning.value = false;
        
        // Start cooldown period to prevent immediate re-pinch
        // Set to max value first so the check blocks immediately, then animate to 0
        pinchCooldown.value = PINCH_COOLDOWN_MS;
        pinchCooldown.value = withTiming(0, { duration: PINCH_COOLDOWN_MS });
        
        if (resetOnRelease) {
          // Smooth animated reset when all fingers are released
          reset(true);
        }
        
        logGesture('pinch.end.allFingersReleased', {
          scale: scale.value,
          translateX: translateX.value,
          translateY: translateY.value,
          resetOnRelease,
          cooldownStarted: true,
        });
        return;
      }

      // Always reset if resetOnRelease is true (for cases where numberOfPointers might not be 0)
      if (resetOnRelease && !isPanning.value) {
        reset();
      }

      logGesture('pinch.end', {
        pointers: e.numberOfPointers,
        scale: scale.value,
        translateX: translateX.value,
        translateY: translateY.value,
      });
    })
    .onFinalize(() => {
      'worklet';
      // Fallback: if pinch is cancelled or ends without firing onEnd, ensure reset when no pan is active
      if (!isPanning.value && resetOnRelease) {
        isPanning.value = false;
        handlePanEndReset({
          velocityX: 0,
          velocityY: 0,
          translateX: translateX.value,
          translateY: translateY.value,
          scale: scale.value,
          reason: 'pinch.finalize',
        }, false);
      }
    });

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .manualActivation(true)
    .onStart((e) => {
      'worklet';
      // Prevent pan if reset animation is in progress
      if (isResetting.value) {
        return;
      }
      hasResetOnEnd.value = false;

      // Note: We rely on onTouchesMove to prevent invalid activation.
      // If we reach here, we set isPanning to true so we properly track the gesture state.
      if (scale.value === 1 && !isZoomActive.value) {
        // This block intentionally empty; we proceed to set isPanning = true
      }
      isPanning.value = true;
      cancelAnimation(translateX);
      cancelAnimation(translateY);

      panOffsetX.value = 0;
      panOffsetY.value = 0;

      logGesture('pan.start', {
        translationX: e.translationX,
        translationY: e.translationY,
        savedTranslateX: savedTranslateX.value,
        savedTranslateY: savedTranslateY.value,
        scale: scale.value,
      });

      // If coming from a pinch (where pinch sets saved values), this might need adjustment
      // But typically we want to just start tracking from where we are
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    // Add manual activation to selectively enable pan only when zoomed
    .onTouchesMove((e, state) => {
      'worklet';
      // Prevent pan activation if reset animation is in progress
      if (isResetting.value) {
        state.fail();
        return;
      }
      if (scale.value > 1 || isZoomActive.value) {
        state.activate();
      } else if (e.allTouches.length < 2) {
        state.fail();
      }
    })
    .onUpdate((e) => {
      'worklet';
      // Prevent pan updates if reset animation is in progress
      if (isResetting.value) {
        return;
      }
      // If we are pinching, we track the offset but don't apply translation here.
      if (isPinching.value) {
        panOffsetX.value = e.translationX;
        panOffsetY.value = e.translationY;
        return;
      }

      if (scale.value > 1 || isZoomActive.value) {
        translateX.value = savedTranslateX.value + (e.translationX - panOffsetX.value);
        translateY.value = savedTranslateY.value + (e.translationY - panOffsetY.value);
      }
    })
    .onEnd((e) => {
      'worklet';
      isPanning.value = false;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      // If all fingers are released, start cooldown to prevent immediate re-pinch
      if (e.numberOfPointers === 0) {
        // Set to max value first so the check blocks immediately, then animate to 0
        pinchCooldown.value = PINCH_COOLDOWN_MS;
        pinchCooldown.value = withTiming(0, { duration: PINCH_COOLDOWN_MS });
      }

      // Reset to original position/scale when pan ends
      // Always use smooth animated reset
      handlePanEndReset({
        velocityX: e.velocityX,
        velocityY: e.velocityY,
        translateX: translateX.value,
        translateY: translateY.value,
        scale: scale.value,
        reason: 'pan.end',
        numberOfPointers: e.numberOfPointers,
      }, true);
    })
    .onFinalize((e) => {
      'worklet';
      // Fallback in case onEnd doesn't fire (e.g., cancellation)
      isPanning.value = false;
      // Always use smooth animated reset
      handlePanEndReset({
        velocityX: e?.velocityX ?? 0,
        velocityY: e?.velocityY ?? 0,
        translateX: translateX.value,
        translateY: translateY.value,
        scale: scale.value,
        reason: 'pan.finalize',
        numberOfPointers: e?.numberOfPointers ?? 0,
      }, true);
    });

  // Activate pan ONLY when zoom is active or scale > 1, otherwise fail to let scrollview take over
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: isZoomActive.value ? 9999 : 30, // Keep high even when not active to be safe, but boost when active
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    if (!isZoomActive.value) {
      return { opacity: 0 };
    }
    const currentScale = Math.max(minScale, Math.min(maxScale, scale.value));
    const targetScale = 2; // Scale at which we want 80% opacity
    const normalizedScale = Math.min(1, (currentScale - minScale) / (targetScale - minScale));
    const opacity = Math.pow(normalizedScale, 1.5) * 0.8;
    return {
      opacity,
    };
  });

  const wrapperAnimatedStyle = useAnimatedStyle(() => {
    const activeZ = isZoomActive.value ? 20000 : 10;
    return {
      zIndex: activeZ,
      elevation: activeZ,
    };
  });

  return (
    <Animated.View style={[styles.wrapper, { width, height }, wrapperAnimatedStyle]}>
      <Animated.View
        style={[
          styles.backdrop,
          {
            position: 'absolute',
            left: -width * 2,
            top: -height * 2,
            width: width * 5,
            height: height * 5,
          },
          backdropStyle,
        ]}
        pointerEvents="none"
      />

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.container, { width, height }]}>
          <Animated.View style={[styles.content, { width, height }, animatedStyle]}>
            {children}
            {/* Debug overlay for MediaZoom2 z-index */}


           { isLogAvaliable && <View
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                padding: 8,
                borderRadius: 4,
                zIndex: 99999,
              }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                Image wrapper: {wrapperZIndex}
              </Text>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                Image content: {contentZIndex}
              </Text>
            </View>}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 10,
    overflow: 'visible', // Ensure wrapper doesn't clip
  },
  container: {
    overflow: 'visible', // Ensure container doesn't clip
    backgroundColor: 'transparent',
    zIndex: 2, // Higher than backdrop
  },
  content: {
    justifyContent: 'center',
    alignItems: 'stretch', // Allow children to fill width
    zIndex: 3, // Highest z-index for the image/content itself
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1, // Lowest z-index
  },
});
