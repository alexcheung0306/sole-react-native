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

export default function CollapseDrawer2({
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
  const flingGesture = Gesture.Pan()
    .manualActivation(true) // Manual activation to check scroll position
    .minDistance(10)
    .activeOffsetY(10) // Activate on downward movement
    .maxPointers(1)
    .failOffsetX([-30, 30]) // Fail if too much horizontal movement
    .onTouchesDown((e, state) => {
      'worklet';
      // Only activate if scroll is at top (within 5px tolerance)
      if (scrollOffset.value <= 5) {
        state.activate();
        runOnJS(logFlingTrigger)('GESTURE ACTIVATED', `Scroll at top: ${scrollOffset.value.toFixed(0)}`);
      } else {
        state.fail();
        runOnJS(logFlingTrigger)('GESTURE FAILED', `Scroll not at top (${scrollOffset.value.toFixed(0)}px)`);
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

  // Native scroll gesture for ScrollView
  const scrollGesture = Gesture.Native();

  console.log('isScrollEnabled', isScrollEnabled);

  // Allow both gestures to work together - fling can trigger even during scroll
  const composedGesture = Gesture.Simultaneous(scrollGesture, flingGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + keyboardOffset.value }],
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
              <View style={{ alignItems: 'center', paddingBottom: 12 }}>
                <View
                  style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: '#ffffff40' }}
                />
                {title ? (
                  <Text style={{ color: '#fff', fontSize: 12, marginTop: 16 }}>{title}</Text>
                ) : null}
              </View>

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
                bounces={false}
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
