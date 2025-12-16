// custom/collapse-drawer.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Keyboard,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
  cancelAnimation,
  useAnimatedRef,
  scrollTo,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassOverlay } from './GlassView';

type Props = {
  showDrawer: boolean;
  setShowDrawer: (value: boolean) => void;
  title?: string;
  children: React.ReactNode;
  height?: number;
  autoHeight?: boolean; // If true, height fits content (max 0.88 of screen)
  bottomArea?: React.ReactNode;
};

export default function CollapseDrawer({
  showDrawer,
  setShowDrawer,
  title = '',
  children,
  height = 0.88,
  autoHeight = false,
  bottomArea,
}: Props) {
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const keyboardOffset = useSharedValue(0);
  const [isVisible, setIsVisible] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useSharedValue(0);
  const flingStartY = useSharedValue(0);
  const handlePanOffset = useSharedValue(0);

  // Handle height: ~33px (5px handle + 12px paddingBottom + 16px title margin if exists)
  const HANDLE_HEIGHT = title ? 33 : 17;
  const MAX_HEIGHT = SCREEN_HEIGHT * 0.88;

  // Handle keyboard show/hide to move drawer up
  useEffect(() => {
    if (!bottomArea) return; // Only listen to keyboard if bottomArea exists

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const kbHeight = e.endCoordinates.height;
        // Move drawer up by keyboard height (negative translateY)
        keyboardOffset.value = withTiming(-kbHeight, {
          duration: Platform.OS === 'ios' ? 250 : 100,
        });
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Move drawer back to original position
        keyboardOffset.value = withTiming(0, {
          duration: Platform.OS === 'ios' ? 250 : 100,
        });
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [bottomArea]);

  // Calculate drawer height: fixed or dynamic
  const getDrawerHeight = () => {
    if (autoHeight) {
      const calculatedHeight = HANDLE_HEIGHT + contentHeight + 20 + insets.bottom;
      return Math.min(calculatedHeight, MAX_HEIGHT);
    }
    return SCREEN_HEIGHT * height;
  };

  const DRAWER_HEIGHT = getDrawerHeight();
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

  // Handle drawer show/hide with animation
  useEffect(() => {
    if (showDrawer && !isVisible) {
      // Opening
      console.log('modal opening');
      setIsVisible(true);
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 90,
        mass: 1,
      });
    } else if (!showDrawer && isVisible) {
      // Closing - animate out, then hide
      console.log('modal closing');
      cancelAnimation(translateY);
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(setIsVisible)(false);
        }
      });
    }
  }, [showDrawer, isVisible]);

  const closeDrawer = () => {
    setShowDrawer(false);
  };

  // Logging function for fling trigger
  const logFlingTrigger = (event: string, details?: string) => {
    console.log(`[FLING TRIGGER] ${event}${details ? ` - ${details}` : ''}`);
  };

  // Pan gesture that detects fling-like behavior (high velocity downward swipes)
  // Fails immediately when it shouldn't activate to allow buttons to work
  const flingGesture = Gesture.Pan()
    .manualActivation(true) // Manual activation to check scroll position
    .minDistance(20) // Require significant movement to avoid interfering with button taps
    .activeOffsetY(20) // Require clear downward movement (button taps are usually < 10px)
    .maxPointers(1)
    .failOffsetX([-15, 15]) // Fail on horizontal movement
    .shouldCancelWhenOutside(false)
    .onTouchesDown((e, state) => {
      'worklet';
      // Fail immediately if scroll is not at top - this allows buttons to work
      if (scrollOffset.value > 5) {
        state.fail();
        return;
      }
      // Store initial Y position to detect movement
      if (e.allTouches.length > 0) {
        flingStartY.value = e.allTouches[0].y;
      }
      // Don't activate yet - wait to see if there's actual downward movement
      // This prevents button taps from activating the gesture
    })
    .onTouchesMove((e, state) => {
      'worklet';
      // Check if scroll moved away from top
      if (scrollOffset.value > 5) {
        state.fail();
        return;
      }
      // Only activate if there's clear downward movement (not a button tap)
      if (e.allTouches.length > 0) {
        const currentY = e.allTouches[0].y;
        const deltaY = currentY - flingStartY.value;
        
        // Only activate when there's clear downward movement (> 15px)
        // Button taps usually have minimal movement (< 10px)
        if (deltaY > 15) {
          state.activate();
          runOnJS(logFlingTrigger)('GESTURE ACTIVATED', `Scroll at top: ${scrollOffset.value.toFixed(0)}, Downward: ${deltaY.toFixed(0)}px`);
        } else if (deltaY < -5) {
          // Moving upward - not a fling, fail
          state.fail();
        }
        // For small movements (0-15px), wait (don't fail yet, but don't activate)
        // This allows the gesture to activate if user continues swiping
      }
    })
    .onStart(() => {
      'worklet';
      const currentScrollOffset = scrollOffset.value;
      runOnJS(logFlingTrigger)('GESTURE STARTED', `Scroll offset: ${currentScrollOffset.toFixed(0)}`);
    })
    .onUpdate((e) => {
      'worklet';
      // Only log significant movements
      if (Math.abs(e.translationY) > 20) {
        runOnJS(logFlingTrigger)('GESTURE UPDATE', `Translation: ${e.translationY.toFixed(0)}, Velocity: ${e.velocityY.toFixed(0)}`);
      }
    })
    .onEnd((e) => {
      'worklet';
      const velocity = e.velocityY;
      const translation = e.translationY;
      const currentScrollOffset = scrollOffset.value;
      
      runOnJS(logFlingTrigger)('GESTURE ENDED', `Velocity: ${velocity.toFixed(0)}, Translation: ${translation.toFixed(0)}, Scroll: ${currentScrollOffset.toFixed(0)}`);
      
      // Only allow fling when scroll is at the top (within 5px tolerance)
      const isAtTop = currentScrollOffset <= 5;
      
      if (!isAtTop) {
        runOnJS(logFlingTrigger)('FLING BLOCKED', `Scroll not at top (${currentScrollOffset.toFixed(0)}px)`);
        return;
      }
      
      // Close on fling: high downward velocity (>800) or significant downward swipe (>100px with velocity >500)
      const isFling = velocity > 800 || (translation > 100 && velocity > 500);
      
      if (isFling && translation > 0) {
        runOnJS(logFlingTrigger)('FLING DETECTED', 'Closing drawer');
        cancelAnimation(translateY);
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, (finished) => {
          'worklet';
          if (finished) {
            runOnJS(logFlingTrigger)('DRAWER CLOSED', 'Animation completed');
            runOnJS(setShowDrawer)(false);
          }
        });
      } else {
        runOnJS(logFlingTrigger)('FLING NOT DETECTED', `Velocity too low or wrong direction`);
      }
    });

  // Pan gesture for handle - allows dragging but returns to position on release
  const handlePanGesture = Gesture.Pan()
    .minDistance(5)
    .activeOffsetY(5) // Activate on downward movement
    .maxPointers(1)
    .shouldCancelWhenOutside(false)
    .onStart(() => {
      'worklet';
      cancelAnimation(handlePanOffset);
      cancelAnimation(translateY);
    })
    .onUpdate((e) => {
      'worklet';
      // Only allow downward dragging
      if (e.translationY > 0) {
        handlePanOffset.value = e.translationY;
      }
    })
    .onEnd(() => {
      'worklet';
      // Return to original position (don't close) - gentle, smooth animation
      handlePanOffset.value = withTiming(0, {
        duration: 300,
      });
    });

  // Native scroll gesture for ScrollView
  const scrollGesture = Gesture.Native();

  console.log('isScrollEnabled', isScrollEnabled);

  // Allow both gestures to work together - fling can trigger even during scroll
  const composedGesture = Gesture.Simultaneous(scrollGesture, flingGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + keyboardOffset.value + handlePanOffset.value }],
  }));

  // Calculate current drawer height (reactive to contentHeight changes)
  const currentDrawerHeight = getDrawerHeight();

  if (!isVisible) return null;

  return (
    <Modal transparent visible={isVisible} animationType="none">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* Backdrop - only this area is pressable */}
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0)',
            }}
            onPress={closeDrawer}
          />

          <GestureDetector gesture={composedGesture}>
            <Animated.View
              className="overflow-hidden rounded-t-[28px] pt-4"
              style={[
                animatedStyle,
                {
                  height: currentDrawerHeight,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  borderBottomWidth: 0,
                },
              ]}>
              {/* Glass effect overlay */}
              <GlassOverlay intensity={100} tint="dark" darkOverlayOpacity={0.5} />

              {/* Handle + Title - Draggable Area */}
              <GestureDetector gesture={handlePanGesture}>
                <View style={{ alignItems: 'center', paddingBottom: 12 }}>
                  <View
                    style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: '#ffffff40' }}
                  />
                  {title ? (
                    <Text style={{ color: '#fff', fontSize: 12, marginTop: 16 }}>{title}</Text>
                  ) : null}
                </View>
              </GestureDetector>

              {/* Content */}
              <Animated.ScrollView
              scrollEnabled={isScrollEnabled}
                ref={scrollViewRef}
                onScroll={(e) => {
                  'worklet';
                  scrollOffset.value = e.nativeEvent.contentOffset.y;
                  console.log('scroll', e.nativeEvent.contentOffset.y);
                }}
                style={{ flex: 1 }}
                bounces={true}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                contentContainerStyle={{ paddingBottom: insets.bottom }}>
                {children}
              </Animated.ScrollView>
              {bottomArea && <View style={{ paddingBottom: insets.bottom }}>{bottomArea}</View>}
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
