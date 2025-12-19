import React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { FlatList } from 'react-native';

interface NativeScrollHandleProps {
  layoutHeight: number;
  contentHeight: number;
  scrollPosition: number;
  flatListRef: React.RefObject<FlatList>;
}

const NativeScrollHandle = React.memo(({
  layoutHeight,
  contentHeight,
  scrollPosition,
  flatListRef,
}: NativeScrollHandleProps) => {
  // Calculate handle position to match native scroll indicator
  const scrollableHeight = contentHeight - layoutHeight;
  const scrollRatio = scrollPosition / scrollableHeight;
  const handlePosition = scrollRatio * (layoutHeight - 40); // Account for indicator height

  console.log('handlePosition', handlePosition);

  // Shared value for smooth animations
  const animatedHandlePosition = useSharedValue(handlePosition);

  // Update animated position when scrollPosition changes
  animatedHandlePosition.value = handlePosition;

  // Animated style for smooth handle transitions
  const animatedHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: animatedHandlePosition.value }],
  }));

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      // Store the current handle position when drag starts
      animatedHandlePosition.value = handlePosition;
    })
    .onUpdate((event) => {
      'worklet';
      const newHandlePosition = Math.max(
        0,
        Math.min(layoutHeight - 40, handlePosition + event.translationY)
      );
      // Update animated position for smooth visual feedback
      animatedHandlePosition.value = newHandlePosition;
      const scrollRatio = newHandlePosition / (layoutHeight - 40);
      const newScrollPosition = scrollRatio * Math.max(0, contentHeight - layoutHeight);

      // Directly scroll the FlatList
      runOnJS(() => {
        flatListRef.current?.scrollToOffset({
          offset: Math.max(0, newScrollPosition),
          animated: false,
        });
      });
    })
    .onEnd(() => {
      'worklet';
    });

  return (
    <View className="absolute right-1 top-0 bottom-0 justify-center">
      <GestureDetector gesture={panGesture}>
        <Animated.View
          className="absolute w-8 h-6 rounded border border-gray-400 bg-gray-300 shadow-sm"
          style={[
            {
              left: -36, // Position to the left of the native indicator
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 3,
            },
            animatedHandleStyle,
          ]}>
          {/* Handle grip lines */}
          <View className="flex-1 items-center justify-center">
            <View className="h-0.5 w-2 rounded-full bg-gray-600 mb-0.5" />
            <View className="h-0.5 w-2 rounded-full bg-gray-600 mb-0.5" />
            <View className="h-0.5 w-2 rounded-full bg-gray-600" />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

export default NativeScrollHandle;
