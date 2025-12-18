import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { PostCard } from '../feed/PostCard';
import { useSoleUserContext } from '~/context/SoleUserContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface PostFeedModalProps {
  visible: boolean;
  posts: any[];
  initialIndex: number;
  onClose: () => void;
  onLike?: (postId: string) => void;
  onAddComment?: (postId: string, content: string) => void;
  // For expand animation
  sourceLayout?: { x: number; y: number; width: number; height: number } | null;
}

export function PostFeedModal({
  visible,
  posts,
  initialIndex,
  onClose,
  onLike,
  onAddComment,
  sourceLayout,
}: PostFeedModalProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<any>(null);
  const { soleUserId } = useSoleUserContext();

  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const expandProgress = useSharedValue(0);

  // Transform post data
  const transformPost = (backendPost: any) => ({
    id: backendPost.id.toString(),
    soleUserId: backendPost.soleUserId,
    content: backendPost.content || '',
    createdAt: backendPost.createdAt,
    media: (backendPost.media || []).map((m: any) => ({
      id: m.id.toString(),
      mediaUrl: m.mediaUrl,
      mediaType: (m.mediaType as 'image' | 'video') || 'image',
      displayOrder: m.displayOrder,
    })),
    likeCount: backendPost.likeCount || 0,
    commentCount: backendPost.commentCount || 0,
    isLikedByUser: backendPost.isLikedByUser || false,
    soleUserInfo: {
      soleUserId: backendPost.soleUserInfo?.soleUserId || backendPost.soleUserId,
      username: backendPost.soleUserInfo?.username || 'Unknown',
      name: backendPost.soleUserInfo?.name || 'Unknown',
      profilePic: backendPost.soleUserInfo?.profilePic || null,
    },
  });

  // Open/close animation
  useEffect(() => {
    if (visible) {
      // Expand animation
      expandProgress.value = withSpring(1, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 20, stiffness: 200 });
      
      // Scroll to initial index after animation
      setTimeout(() => {
        if (flatListRef.current && initialIndex > 0) {
          flatListRef.current.scrollToIndex({
            index: initialIndex,
            animated: false,
          });
        }
      }, 100);
    } else {
      expandProgress.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible, initialIndex]);

  const closeModal = useCallback(() => {
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 });
    opacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      runOnJS(onClose)();
      translateX.value = 0;
    }, 250);
  }, [onClose]);

  // Swipe right to close gesture
  const panGesture = Gesture.Pan()
    .activeOffsetX(20)
    .failOffsetY([-20, 20])
    .onUpdate((event) => {
      // Only allow swipe right (positive X)
      if (event.translationX > 0) {
        translateX.value = event.translationX;
        opacity.value = interpolate(
          event.translationX,
          [0, SCREEN_WIDTH],
          [1, 0.3],
          Extrapolation.CLAMP
        );
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Close modal
        runOnJS(closeModal)();
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20 });
        opacity.value = withTiming(1, { duration: 150 });
      }
    });

  // Animated styles
  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: interpolate(expandProgress.value, [0, 1], [0.9, 1]) },
      ],
      opacity: opacity.value,
    };
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0, 1], [0, 1]),
  }));

  const handleLike = (postId: string) => {
    onLike?.(postId);
  };

  const handleAddComment = (postId: string, content: string) => {
    onAddComment?.(postId, content);
  };

  if (!visible && expandProgress.value === 0) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      {/* Modal Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <TouchableOpacity
              onPress={closeModal}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ChevronLeft color="#93c5fd" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Posts</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Posts List */}
          <Animated.FlatList
            ref={flatListRef}
            data={posts}
            renderItem={({ item }) => (
              <PostCard
                post={transformPost(item)}
                onLike={handleLike}
                onAddComment={handleAddComment}
                onZoomChange={() => {}}
                onScaleChange={() => {}}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 10,
              paddingBottom: insets.bottom + 20,
            }}
            getItemLayout={(_, index) => ({
              length: 500,
              offset: 500 * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                });
              }, 100);
            }}
            initialNumToRender={3}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 40, // Offset for back button
  },
  headerSpacer: {
    width: 40,
  },
});

