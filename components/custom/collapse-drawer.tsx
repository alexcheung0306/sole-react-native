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
import { GlassOverlay } from './GlassView';

type Props = {
  showDrawer: boolean;
  setShowDrawer: (value: boolean) => void;
  title?: string;
  children: React.ReactNode;
  height?: number;
};

export default function CollapseDrawer({
  showDrawer,
  setShowDrawer,
  title = '',
  children,
  height = 0.88,
}: Props) {
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const DRAWER_HEIGHT = SCREEN_HEIGHT * height;
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const [isVisible, setIsVisible] = useState(false);

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
                height: DRAWER_HEIGHT,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderBottomWidth: 0,
              },
            ]}>
            {/* Glass effect overlay */}
            <GlassOverlay intensity={100} tint="dark" />

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
            {Platform.OS === 'ios' ? (
              <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <ScrollView
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  scrollEnabled={true}>
                  {children}
                </ScrollView>
              </KeyboardAvoidingView>
            ) : (
              <ScrollView style={{ flex: 1 }} scrollEnabled={true} nestedScrollEnabled={true}>
                {children}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
