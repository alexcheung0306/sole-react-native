import { ChevronLeft } from "lucide-react-native";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import Animated, { Extrapolation, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming, SharedValue } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { PostCard } from "../feed/PostCard";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@gorhom/bottom-sheet";
import { useCallback, useRef, useState } from "react";

export function PostFeedModal({
  postModalVisible,
  insets,
  closePostModal,
  postListRef,
  transformedPosts,
  modalScrollOffset,
  handleItemLayout,
  selectedPostIndex,
  profileScrollY,
  setPostModalVisible,
  getGridPositionForIndex,
  itemHeights,
  expandProgress,
  sourceX,
  sourceY,
  modalOpacity,
}: {
  postModalVisible: boolean,
  insets: any,
  closePostModal: () => void,
  postListRef: any,
  transformedPosts: any,
  modalScrollOffset: number,
  handleItemLayout: (id: string, height: number) => void,
  selectedPostIndex: number,
  profileScrollY: React.RefObject<number>,
  setPostModalVisible: (visible: boolean) => void,
  getGridPositionForIndex: (index: number) => { x: number, y: number },
  itemHeights: any,
  expandProgress: SharedValue<number>,
  sourceX: SharedValue<number>,
  sourceY: SharedValue<number>,
  modalOpacity: SharedValue<number>,
}) {
  const FLING_VELOCITY_THRESHOLD = 300;
  const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
  const MODAL_BORDER_RADIUS = 40;

  const currentVisibleIndex = useRef(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const [zoomingIndex, setZoomingIndex] = useState<number | null>(null);



  const modalAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(expandProgress.value, [0, 1], [0.333, 1], Extrapolation.CLAMP);
    const borderRadius = interpolate(expandProgress.value, [0, 1], [20, MODAL_BORDER_RADIUS], Extrapolation.CLAMP);

    // Animate from source position to center
    const animatedX = interpolate(expandProgress.value, [0, 1], [sourceX.value, 0], Extrapolation.CLAMP);
    const animatedY = interpolate(expandProgress.value, [0, 1], [sourceY.value, 0], Extrapolation.CLAMP);

    return {
      transform: [
        { translateX: translateX.value + animatedX },
        { translateY: translateY.value + animatedY },
        { scale },
      ],
      borderRadius,
    };
  });
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));


  const handleModalScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    // Calculate which post is currently most visible based on scroll position
    let cumulativeHeight = 0;
    const posts = transformedPosts;
    for (let i = 0; i < posts.length; i++) {
      const postHeight = itemHeights.current[posts[i].id] || 400; // fallback height
      if (offsetY < cumulativeHeight + postHeight / 2) {
        currentVisibleIndex.current = i;
        break;
      }
      cumulativeHeight += postHeight;
      if (i === posts.length - 1) {
        currentVisibleIndex.current = i;
      }
    }
  }, [transformedPosts]);

  const handleGestureClose = useCallback(() => {
    // Use currentVisibleIndex (the last viewed post) for close position
    const pos = getGridPositionForIndex(currentVisibleIndex.current);
    sourceX.value = pos.x;
    sourceY.value = pos.y;

    setTimeout(() => {
      setPostModalVisible(false);
    }, 350);
  }, [getGridPositionForIndex, selectedPostIndex]);

  const panGesture = Gesture.Pan()
    .activeOffsetX(15)
    .onUpdate((event) => {
      // Follow finger freely on both axes
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // Scale down based on distance from center
      const distance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
      const swipeProgress = interpolate(
        distance,
        [0, SCREEN_WIDTH * 0.5],
        [1, 0.85],
        Extrapolation.CLAMP
      );
      expandProgress.value = swipeProgress;
    })
    .onEnd((event) => {
      const isFlingRight = event.velocityX > FLING_VELOCITY_THRESHOLD;
      const isFlingDown = event.velocityY > FLING_VELOCITY_THRESHOLD;
      const isPastThreshold = event.translationX > SWIPE_THRESHOLD;

      if (isFlingRight || isFlingDown || isPastThreshold) {
        // Shrink back to source position (thumbnail)
        translateX.value = withTiming(0, { duration: 250 });
        translateY.value = withTiming(0, { duration: 250 });
        expandProgress.value = withTiming(0, { duration: 300 });
        modalOpacity.value = withTiming(0, { duration: 300 });
        runOnJS(handleGestureClose)();
      } else {
        // Snap back to full screen
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        expandProgress.value = withTiming(1, { duration: 200 });
      }
    });



  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { zIndex: postModalVisible ? 99999 : -1, elevation: postModalVisible ? 99999 : -1 }
      ]}
      pointerEvents={postModalVisible ? 'auto' : 'none'}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(0,0,0,0.95)' },
          backdropStyle
        ]}
      />

      {/* Modal Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ flex: 1, backgroundColor: '#000', overflow: zoomingIndex !== null ? 'visible' : 'hidden' }, modalAnimatedStyle]}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: insets.top,
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: '#000',
            borderBottomWidth: 1,
            borderBottomColor: '#1f2937',
          }}>
            <TouchableOpacity onPress={closePostModal} style={{ padding: 8 }}>
              <ChevronLeft color="#93c5fd" size={24} />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center', marginRight: 40 }}>
              Posts
            </Text>
          </View>

          {/* Posts List - Using ScrollView to allow zoom overflow */}
          <Animated.ScrollView
            ref={postListRef}
            showsVerticalScrollIndicator={false}
            scrollEnabled={zoomingIndex === null}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: 10,
              paddingBottom: insets.bottom + 20,
            }}
            contentOffset={{ x: 0, y: modalScrollOffset }}
            scrollEventThrottle={100}
            onScroll={handleModalScroll}
          >
            {transformedPosts.map((item: any, index: number) => {
              const isThisItemZooming = zoomingIndex === index;
              return (
                <View
                  key={item.id}
                  onLayout={(e) => handleItemLayout(item.id, e.nativeEvent.layout.height)}
                  style={{
                    zIndex: isThisItemZooming ? 9999 : 0,
                    elevation: isThisItemZooming ? 9999 : 0,
                  }}
                >
                  <PostCard
                    post={item}
                    onLike={() => { }}
                    onAddComment={() => { }}
                    onZoomChange={(isZooming) => setZoomingIndex(isZooming ? index : null)}
                    onScaleChange={() => { }}
                  />
                </View>
              );
            })}
          </Animated.ScrollView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}