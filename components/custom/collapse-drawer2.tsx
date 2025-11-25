// custom/collapse-drawer2.tsx
import React, { useEffect } from 'react';
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
import { BlurView } from 'expo-blur';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.88;

type Props = {
  showDrawer: boolean;
  setShowDrawer: (value: boolean) => void;
  title?: string;
  children: React.ReactNode;
};

export default function CollapseDrawer2({
  showDrawer,
  setShowDrawer,
  title = '',
  children,
}: Props) {
  const translateY = useSharedValue(SCREEN_HEIGHT);

  // Gentle open animation
  useEffect(() => {
    if (showDrawer) {
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 90,
        mass: 1,
      });
    } else {
      // Reset position when drawer is closed
      cancelAnimation(translateY);
      translateY.value = SCREEN_HEIGHT;
    }
  }, [showDrawer]);

  const closeDrawer = () => {
    cancelAnimation(translateY);
    translateY.value = withTiming(
      SCREEN_HEIGHT,
      { duration: 400 },
      (finished) => {
        if (finished) {
          runOnJS(setShowDrawer)(false);
        }
      }
    );
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
      const shouldClose = e.translationY > 180 || e.velocityY > 1000;
      if (shouldClose) {
        cancelAnimation(translateY);
        translateY.value = withTiming(
          SCREEN_HEIGHT,
          { duration: 300 },
          (finished) => {
            if (finished) {
              runOnJS(setShowDrawer)(false);
            }
          }
        );
      } else {
        cancelAnimation(translateY);
        translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!showDrawer) return null;

  return (
    <Modal transparent visible={showDrawer} animationType="none">
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
              backgroundColor: 'rgba(0,0,0,0.65)',
            }}
            onPress={closeDrawer}
          />
          
          <GestureDetector gesture={panGesture}>
            <Animated.View
              className="border border-b-0 border-white/35 rounded-t-[28px] pt-4 overflow-hidden"
              style={[
                animatedStyle,
                {
                  height: DRAWER_HEIGHT,
                },
              ]}>
              {/* Blur Background */}
              <BlurView
                intensity={20}
                tint="dark"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              {/* Semi-transparent overlay for better contrast */}
              <View className="absolute inset-0 bg-black/12" />
              
              {/* Handle + Title */}
              <View style={{ alignItems: 'center', paddingBottom: 12 }}>
                <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: '#ffffff40' }} />
                {title ? (
                  <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 16 }}>
                    {title}
                  </Text>
                ) : null}
              </View>

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
              <ScrollView 
                style={{ flex: 1 }} 
                scrollEnabled={true}
                nestedScrollEnabled={true}>
                {children}
              </ScrollView>
            )}
            </Animated.View>
          </GestureDetector>
      </View>
    </GestureHandlerRootView>
    </Modal>
  );
}