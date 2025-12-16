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
  const initialScrollY = useSharedValue(0);

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
  const [isScrollEnabled, setIsScrollEnabled] = useState(false);

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

  // Native scroll gesture for ScrollView
  const scrollGesture = Gesture.Native();

  console.log('isScrollEnabled', isScrollEnabled);

  // Pan gesture for drawer closing (only downward)
  const panGesture = Gesture.Pan()
    .minDistance(10) // Require some movement to activate
    .activeOffsetY(15) // Only activate on significant downward movement
    .maxPointers(1) // Single finger only
    .failOffsetX([-20, 20]) // Fail if horizontal movement exceeds 20px
    .onStart((e) => {
      'worklet';
      initialScrollY.value = scrollOffset.value;
      console.log('modal opened - gesture started, initial direction: ' +
        (e.translationY > 0 ? 'DOWN' : e.translationY < 0 ? 'UP' : 'NEUTRAL'));
    })
    .onUpdate((e) => {
      'worklet';
      console.log('pan update: ' + e.translationY + ', scrollOffset: ' + scrollOffset.value);

      if (e.translationY > 0) {
        // Finger DOWN - close the drawer
        translateY.value = e.translationY;
        console.log('closing drawer, translateY: ' + e.translationY);
      } else if (e.translationY < 0) {
        // Finger UP - enable scroll
        runOnJS(setIsScrollEnabled)(true);
      }
      // Small movements or slight variations are normal during dragging
    })
    .onEnd((e) => {
      'worklet';
      console.log('pan gesture ended, final translationY: ' + e.translationY + ', velocityY: ' + e.velocityY);

      const shouldClose = e.translationY > 180 || e.velocityY > 1000;
      if (shouldClose) {
        console.log('closing drawer completely');
        cancelAnimation(translateY);
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, (finished) => {
          'worklet';
          if (finished) {
            runOnJS(setShowDrawer)(false);
            // Reset scroll state when drawer closes
          }
        });
      } else {
        console.log('resetting drawer position');
        cancelAnimation(translateY);
        translateY.value = withTiming(0, { duration: 300 });
        // Keep scroll enabled after gesture ends (don't reset to false)
      }
    });

  // Allow both gestures to work together
  const composedGesture = Gesture.Simultaneous(scrollGesture, panGesture);

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
