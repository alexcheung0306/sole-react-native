// custom/collapse-drawer.tsx
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
  cancelAnimation,
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
};

export default function CollapseDrawer({
  showDrawer,
  setShowDrawer,
  title = '',
  children,
  height = 0.88,
  autoHeight = true,
}: Props) {
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const [isVisible, setIsVisible] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  
  // Handle height: ~33px (5px handle + 12px paddingBottom + 16px title margin if exists)
  const HANDLE_HEIGHT = title ? 33 : 17;
  const MAX_HEIGHT = SCREEN_HEIGHT * 0.88;
  
  // Calculate drawer height: fixed or dynamic
  const getDrawerHeight = () => {
    if (autoHeight) {
      const calculatedHeight = HANDLE_HEIGHT + contentHeight + 20 + insets.bottom; // +20 for padding + bottom inset
      return Math.min(calculatedHeight, MAX_HEIGHT);
    }
    return SCREEN_HEIGHT * height;
  };
  
  const DRAWER_HEIGHT = getDrawerHeight();

  // Handle drawer show/hide with animation
  useEffect(() => {
    if (showDrawer && !isVisible) {
      // Opening
      setIsVisible(true);
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 90,
        mass: 1,
      });
    } else if (!showDrawer && isVisible) {
      // Closing - animate out, then hide
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

  const panGesture = Gesture.Pan()
    .minDistance(0) // Allow immediate activation
    .activeOffsetY([0, 1]) // Activate on any downward movement
    .failOffsetX([-50, 50]) // Fail if horizontal movement exceeds 50px
    .onUpdate((e) => {
      // Only allow dragging down (positive values) and cap at screen height
      if (e.translationY > 0 && e.translationY <= SCREEN_HEIGHT) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      'worklet';
      const shouldClose = e.translationY > 180 || e.velocityY > 1000;
      if (shouldClose) {
        cancelAnimation(translateY);
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, (finished) => {
          'worklet';
          if (finished) {
            runOnJS(setShowDrawer)(false);
          }
        });
      } else {
        cancelAnimation(translateY);
        translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  
  // Calculate current drawer height (reactive to contentHeight changes)
  const currentDrawerHeight = autoHeight
    ? Math.min(HANDLE_HEIGHT + contentHeight + 20 + insets.bottom, MAX_HEIGHT)
    : DRAWER_HEIGHT;

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
            <GestureDetector gesture={panGesture}>
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
            {autoHeight ? (
              <View
                style={{ paddingBottom: insets.bottom }}
                onLayout={(e: LayoutChangeEvent) => {
                  setContentHeight(e.nativeEvent.layout.height);
                }}>
                {children}
              </View>
            ) : (
              <View style={{ flex: 1, paddingBottom: insets.bottom }}>
                {Platform.OS === 'ios' ? (
                  <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                    <ScrollView
                      bounces={false}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      scrollEnabled={true}
                      contentContainerStyle={{ paddingBottom: insets.bottom }}>
                      {children}
                    </ScrollView>
                  </KeyboardAvoidingView>
                ) : (
                  <ScrollView 
                    style={{ flex: 1 }} 
                    scrollEnabled={true} 
                    nestedScrollEnabled={true}
                    contentContainerStyle={{ paddingBottom: insets.bottom }}>
                    {children}
                  </ScrollView>
                )}
              </View>
            )}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
