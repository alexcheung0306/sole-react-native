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

  // Tracks the content point (relative to center) under the focal point at pinch start
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  
  const isPinching = useSharedValue(false);
  const isPanning = useSharedValue(false);
  const isZoomActive = useSharedValue(false);
  const backdropOpacity = useSharedValue(0);

  const initialFocalX = useSharedValue(0);
  const initialFocalY = useSharedValue(0);

  const debugLog = React.useCallback((label: string, payload: Record<string, any>) => {
    if (!__DEV__) return;
    console.log(`[media-zoom-2] ${label}`, payload);
  }, []);

  const reset = React.useCallback(() => {
    'worklet';
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    
    isZoomActive.value = false;
    backdropOpacity.value = withTiming(0);
  }, []);

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      'worklet';
      isPinching.value = true;
      isZoomActive.value = true;
      backdropOpacity.value = withTiming(1);

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
      
      savedScale.value = currentScale;
      savedTranslateX.value = currentTx;
      savedTranslateY.value = currentTy;
    })
    .onUpdate((e) => {
      'worklet';
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
    })
    .onEnd((e) => {
      'worklet';
      
      // If releasing one finger but still have others (e.g. going from pinch to pan),
      // we need to update the saved state to prevent jumping
      if (e.numberOfPointers > 0) {
          savedScale.value = scale.value;
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
          return;
      }

      isPinching.value = false;
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      
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
    });

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .onStart((e) => {
      'worklet';
      // If panning starts while zoomed out, don't activate if we want normal scrolling
      // BUT we need to check if we are zooming or not.
      if (scale.value === 1 && !isZoomActive.value) {
         return; 
      }
      isPanning.value = true;
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      
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
      } else {
        state.fail();
      }
    })
    .onUpdate((e) => {
      'worklet';
      // Only pan if we are zoomed in or if zoom is active
      // If we are pinching, the pinch gesture handles translation via focal point movement
      if (isPinching.value) {
        return;
      }
      
      if (scale.value > 1 || isZoomActive.value) {
        // If we are coming from a state where pan wasn't tracking (e.g. pinch), 
        // we might need to reset start values? 
        // Actually, the issue with "jump" on finger lift is often that Pan saved values are stale.
        // We sync them in pinch.onUpdate now.
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd((e) => {
      'worklet';
      isPanning.value = false;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      // Always reset if resetOnRelease is true
      if (resetOnRelease) {
        // If we are still pinching (e.g. lift one finger but still pinching?), 
        // no, pan end usually means all fingers for pan are gone.
        // But if pinch is active, we shouldn't reset.
        if (!isPinching.value) {
            reset();
        }
      }
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
      zIndex: isZoomActive.value ? 100 : 30, // Keep high even when not active to be safe, but boost when active
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  return (
    <View style={[styles.wrapper, { width, height }]}>
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
    </View>
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

