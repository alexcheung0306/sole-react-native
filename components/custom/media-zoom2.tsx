import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';

interface MediaZoom2Props {
  children: React.ReactNode;
  width: number;
  height: number;
  resetOnRelease?: boolean;
  minScale?: number;
  maxScale?: number;
}

export function MediaZoom2({
  children,
  width,
  height,
  resetOnRelease = false,
  minScale = 1,
  maxScale = 5,
}: MediaZoom2Props) {
  const pinchSensitivity = 1.0; 

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

  const initialFocalX = useSharedValue(0);
  const initialFocalY = useSharedValue(0);
  
  // Track number of pointers to detect changes (e.g. lifting one finger)
  const activePointers = useSharedValue(0);

  const debugLog = React.useCallback((label: string, payload: Record<string, any>) => {
    if (!__DEV__) return;
    console.log(`[media-zoom-2] ${label}`, payload);
  }, []);

  // Worklet-safe logger; only fires in dev
  const logGesture = React.useCallback(
    (label: string, payload: Record<string, any>) => {
      'worklet';
      if (!__DEV__) return;
      runOnJS(debugLog)(label, payload);
    },
    [debugLog],
  );

  const reset = React.useCallback(() => {
    'worklet';
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    
    panOffsetX.value = 0;
    panOffsetY.value = 0;
    
    isZoomActive.value = false;
    backdropOpacity.value = withTiming(0);
    hasResetOnEnd.value = false;
  }, []);

  // Shared pan-end handler so we can call it from pinch end when no fingers remain
  const handlePanEndReset = React.useCallback(
    (payload: Record<string, any>) => {
      'worklet';
      if (hasResetOnEnd.value) {
        return;
      }
      hasResetOnEnd.value = true;
      reset();
      logGesture('pan.end', payload);
    },
    [reset, logGesture],
  );

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      'worklet';
      hasResetOnEnd.value = false;
      isPinching.value = true;
      // Don't set isZoomActive here; wait for actual scale change in onUpdate
      // isZoomActive.value = true;
      // backdropOpacity.value = withTiming(1);
      
      logGesture('pinch.start', {
        focalX: e.focalX,
        focalY: e.focalY,
        scale: scale.value,
        savedScale: savedScale.value,
      });

      isZoomActive.value = true

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

      if (!isZoomActive.value) {
        // Enforce a threshold to distinguish "push" (parallel fingers) from "pinch" (zoom)
        const scaleChange = Math.abs(e.scale - 1);
        if (scaleChange > 0.05) { // 5% threshold
           isZoomActive.value = true;
           backdropOpacity.value = withTiming(1);
           
           // Re-anchor origin to current focal point to prevent jump upon activation
           const cx = width / 2;
           const cy = height / 2;
           originX.value = (e.focalX - cx - translateX.value) / scale.value;
           originY.value = (e.focalY - cy - translateY.value) / scale.value;
           
           // Adjust savedScale so the zoom starts smoothly from current scale (1)
           // effectively treating current e.scale as the baseline
           savedScale.value = scale.value / e.scale;
           
        } else {
           // Wait until threshold is met
           return;
        }
      }
      
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
            focalY: e.focalY
        });
      }

      // Calculate new scale
      const newScale = savedScale.value * e.scale;
      const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
      
      // Calculate new translate to keep the origin point under the *current* focal point
      // Formula: Translate = Focal - Center - (Origin * NewScale)
      const cx = width / 2;
      const cy = height / 2;

      const newTx = e.focalX - cx - (originX.value * clampedScale);
      const newTy = e.focalY - cy - (originY.value * clampedScale);

      scale.value = clampedScale;
      translateX.value = newTx;
      translateY.value = newTy;

      // Sync pan saved state so if we release one finger, pan takes over smoothly
      // This is crucial for avoiding jumps when transitioning from 2 fingers to 1 finger
      savedTranslateX.value = newTx;
      savedTranslateY.value = newTy;

      logGesture('pinch.update', { 
        pointers: e.numberOfPointers,
        msg: 'Pinch updated'
      });
    })
    .onEnd((e) => {
      'worklet';
      
      logGesture('pinch.end', { 
        pointers: e.numberOfPointers,
        msg: 'Pinch ended'
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
      
      // Always reset if resetOnRelease is true
      if (resetOnRelease) {
        // Only reset if we are NOT panning (i.e., we let go of everything)
        // If we are still panning (isPanning is true), wait for pan to end.
        // However, pinch end often fires before pan end if we lift all fingers at once.
        // Let's check number of pointers in pan or overall state?
        // Actually, if we lift all fingers, both pinch.onEnd and pan.onEnd will fire.
        if (!isPanning.value) {
            reset();
        }
      }

      // If all fingers are lifted and pan isn't active, treat this as a pan end
      // so we consistently snap back.
      if (e.numberOfPointers === 0 && !isPanning.value) {
        handlePanEndReset({
          velocityX: 0,
          velocityY: 0,
          translateX: translateX.value,
          translateY: translateY.value,
          scale: scale.value,
          reason: 'pinch.end.noPointers',
        });
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
      if (!isPanning.value) {
        handlePanEndReset({
          velocityX: 0,
          velocityY: 0,
          translateX: translateX.value,
          translateY: translateY.value,
          scale: scale.value,
          reason: 'pinch.finalize',
        });
      }
    });

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .manualActivation(true)
    .onStart((e) => {
      'worklet';
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
      if (scale.value > 1 || isZoomActive.value) {
        state.activate();
      } else if (e.allTouches.length < 2) {
        state.fail();
      }
    })
    .onUpdate((e) => {
      'worklet';
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

      // Reset to original position/scale when pan ends
      handlePanEndReset({
        velocityX: e.velocityX,
        velocityY: e.velocityY,
        translateX: translateX.value,
        translateY: translateY.value,
        scale: scale.value,
        reason: 'pan.end',
      });
    })
    .onFinalize((e) => {
      'worklet';
      // Fallback in case onEnd doesn't fire (e.g., cancellation)
      handlePanEndReset({
        velocityX: e?.velocityX ?? 0,
        velocityY: e?.velocityY ?? 0,
        translateX: translateX.value,
        translateY: translateY.value,
        scale: scale.value,
        reason: 'pan.finalize',
      });
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
    return {
      opacity: backdropOpacity.value,
    };
  });

  const wrapperAnimatedStyle = useAnimatedStyle(() => {
    const activeZ = isZoomActive.value ? 2000 : 10;
    return {
      zIndex: activeZ,
      elevation: activeZ,
    };
  });

  return (
    <Animated.View style={[styles.wrapper, { width, height }, wrapperAnimatedStyle]}>
       <Animated.View
        style={[styles.backdrop, StyleSheet.absoluteFill, backdropStyle]} 
        pointerEvents="none" 
      />
      
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.container, { width, height }]}>
          <Animated.View style={[styles.content, { width, height }, animatedStyle]}>
            {children}
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
    zIndex: 20, // Higher than backdrop
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30, // Highest z-index for the image/content itself
  },
  backdrop: {
    backgroundColor: 'black',
    zIndex: 1, // Lowest z-index
  },
});

