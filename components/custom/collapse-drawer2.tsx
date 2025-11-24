import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

// Component for iOS drawer content with conditional padding
function DrawerContentIOS({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} keyboardVerticalOffset={0}>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Component for Android drawer content with conditional padding
function DrawerContentAndroid({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={{ paddingBottom: 20 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

export default function CollapseDrawer2({
  showDrawer,
  setShowDrawer,
  children,
  title,
}: {
  showDrawer: boolean;
  setShowDrawer: (show: boolean) => void;
  children: React.ReactNode;
  title: string;
}) {
  const screenHeight = Dimensions.get('window').height;
  const drawerHeight = screenHeight * 0.8; // At least 40% of screen height
  const translateY = useRef(new Animated.Value(0)).current; // Start at 0 (visible position)

  // Pan gesture for dragging the drawer down to close - using new Gesture API
  const panGesture = Gesture.Pan()
    .minDistance(0) // Allow immediate activation
    .activeOffsetY([0, 1]) // Activate on any downward movement
    .failOffsetX([-50, 50]) // Fail if horizontal movement exceeds 50px
    .onUpdate((event) => {
      const { translationY: newY } = event;
      // Only allow dragging down (positive values)
      if (newY >= 0) {
        translateY.setValue(newY);
      }
    })
    .onEnd((event) => {
      const { translationY: finalY, velocityY } = event;

      // Close if dragged down more than 100px or with high velocity
      if (finalY > 100 || velocityY > 500) {
        // Close immediately
        setShowDrawer(false);
        translateY.setValue(0); // Reset for next open
      } else {
        // Snap back to original position
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      }
    });

  return (
    <Modal
      visible={showDrawer}
      transparent
      animationType="none"
      onRequestClose={() => setShowDrawer(false)}>
      <GestureHandlerRootView style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {/* Backdrop */}
        <Pressable
          onPress={() => {
            setShowDrawer(false);
            translateY.setValue(0); // Reset for next open
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />

        {/* Drawer */}
        <Animated.View
          style={{
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            height: drawerHeight,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderTopColor: 'rgba(255, 255, 255, 0.35)',
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderBottomWidth: 0,
            overflow: 'hidden',
            zIndex: 1000,
            elevation: 8,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            flexDirection: 'column',
            transform: [
              {
                translateY: translateY,
              },
            ],
          }}>
          {/* Drawer Header - Draggable */}
          <GestureDetector gesture={panGesture}>
            <View>
              <View className="items-center py-3">
                <View
                  className="h-1 w-10 rounded-sm opacity-30"
                  style={{ backgroundColor: 'rgb(255, 255, 255)' }}
                />
              </View>
              <View
                className="flex-row items-center justify-between border-b px-5 pb-2.5"
                style={{ borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}>
                <Text className="text-xl font-bold text-white">{title}</Text>
              </View>
            </View>
          </GestureDetector>

          {/* Drawer Content */}
          <View style={{ flex: 1, minHeight: 0 }}>
            {Platform.OS === 'ios' ? (
              <DrawerContentIOS>{children}</DrawerContentIOS>
            ) : (
              <DrawerContentAndroid>{children}</DrawerContentAndroid>
            )}
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
