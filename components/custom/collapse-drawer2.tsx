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
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

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
    }
  }, [showDrawer]);

  const closeDrawer = () => {
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
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      const shouldClose = e.translationY > 180 || e.velocityY > 1000;
      if (shouldClose) {
        closeDrawer();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!showDrawer) return null;

  return (
    <Modal transparent visible={showDrawer} animationType="none">
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
        onPress={closeDrawer}>
        
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              animatedStyle,
              {
                height: DRAWER_HEIGHT,
                backgroundColor: '#000',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingTop: 16,
              },
            ]}>
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
                  keyboardShouldPersistTaps="handled">
                  {children}
                </ScrollView>
              </KeyboardAvoidingView>
            ) : (
              <ScrollView style={{ flex: 1 }}>{children}</ScrollView>
            )}
          </Animated.View>
        </GestureDetector>
      </Pressable>
    </Modal>
  );
}