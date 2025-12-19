import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { FlatList } from 'react-native';

export default function CameraScrollBar({
  layoutHeight,
  contentHeight,
  scrollPosition,
  flatListRef,
}: {
  layoutHeight: number;
  contentHeight: number;
  scrollPosition: number;
  flatListRef: React.RefObject<FlatList>;
}) {
  // Calculate scroll bar dimensions based on actual content
  const scrollBarHeight = Math.max(50, layoutHeight - 20); // Minimum height, account for padding
  const handleHeight = Math.max(20, Math.min(80, (layoutHeight / contentHeight) * scrollBarHeight));

  // Calculate handle position safely
  const calculateHandlePosition = (scrollPos: number, contentH: number, layoutH: number) => {
    if (contentH <= layoutH) return 0;
    const scrollableHeight = contentH - layoutH;
    const scrollRatio = scrollPos / scrollableHeight;
    return Math.max(0, Math.min(scrollBarHeight - handleHeight, scrollRatio * (scrollBarHeight - handleHeight)));
  };

  // Animated shared value for handle position
  const animatedHandlePosition = useSharedValue(calculateHandlePosition(scrollPosition, contentHeight, layoutHeight));

  // Update animated position when scrollPosition changes
  animatedHandlePosition.value = calculateHandlePosition(scrollPosition, contentHeight, layoutHeight);

  // Shared value to track initial drag position
  const initialDragPosition = useSharedValue(0);

  // Animated style for smooth handle transitions
  const animatedHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: animatedHandlePosition.value }],
  }));

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      // Store the current handle position when drag starts
      initialDragPosition.value = animatedHandlePosition.value;
    })
    .onUpdate((event) => {
      'worklet';
      const newHandlePosition = Math.max(
        0,
        Math.min(scrollBarHeight - handleHeight, initialDragPosition.value + event.translationY)
      );
      // Update animated position for smooth visual feedback
      animatedHandlePosition.value = newHandlePosition;
      const scrollRatio = newHandlePosition / (scrollBarHeight - handleHeight);
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

  if (contentHeight <= layoutHeight) {
    return null; // No need for scroll bar if content fits
  }
  return (
    <View className="absolute right-2 top-0 bottom-0 justify-center">
      {/* Scroll bar track */}
      <View className="w-1 rounded-full bg-gray-600" style={{ height: scrollBarHeight }} />

      {/* Draggable handle button */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          className="absolute h-12 w-12 rounded-md border border-gray-500 bg-gray-400 shadow-lg"
          style={[
            {
              left: -30, // Position to the left of the track
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            },
            animatedHandleStyle,
          ]}>
          {/* Handle grip lines */}
          <View className="flex-1 items-center justify-center">
            <View className="mb-0.5 h-0.5 w-3 rounded-full bg-gray-600" />
            <View className="mb-0.5 h-0.5 w-3 rounded-full bg-gray-600" />
            <View className="h-0.5 w-3 rounded-full bg-gray-600" />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
