import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { ScrollView, TouchableOpacity, View, Dimensions, RefreshControl, Text, StyleSheet } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { router, Stack, useLocalSearchParams, usePathname } from 'expo-router';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileQueries } from '~/hooks/useProfileQueries';
import { Grid, User, Briefcase, ChevronLeft } from 'lucide-react-native';
import TalentProfile from '~/components/talent-profile/TalentProfile';
import UserPosts from '~/components/profile/UserPosts';
import JobHistory from '~/components/profile/JobHistory';
import ProfileSettings from '~/components/profile/profile-settings';
import { UserInfo } from '~/components/profile/userInfo';
import { PostCard } from '~/components/feed/PostCard';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH / 3;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const MODAL_BORDER_RADIUS = 40;

type TabKey = 'posts' | 'talent' | 'jobs';

export default function ProfileScreen() {
  const [profileTab, setProfileTab] = useState<TabKey>('posts');
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [zoomingIndex, setZoomingIndex] = useState<number | null>(null);
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const postListRef = useRef<any>(null);
  const itemHeights = useRef<{ [key: string]: number }>({});
  const profileScrollY = useRef(0);
  const userPostsGridY = useRef(0);

  // Animation values for modal - Instagram-like expand animation
  const expandProgress = useSharedValue(0);
  const translateX = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  
  // Source thumbnail position for expand animation (shared values for worklet access)
  const sourceX = useSharedValue(SCREEN_WIDTH / 2 - IMAGE_SIZE / 2);
  const sourceY = useSharedValue(SCREEN_HEIGHT / 2 - IMAGE_SIZE / 2);
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const params = useLocalSearchParams<{ username?: string }>();
  const pathname = usePathname();

  // Get username from params, or fallback to current user's username (for swipeable container)
  const username = params.username || user?.username;

  // Check if viewing own profile
  const isOwnProfile = user?.username === username;

  // Check if we're in a profile route (vs. swipable container)
  const isProfileRoute = pathname.includes('/profile/');

  // Get viewer user ID safely
  const viewerUserId = user?.id;

  // Use custom hook for profile queries
  const {
    userProfileData,
    profileLoading,
    isRefetchingProfile,
    profileError,
    refetchProfile,
    userPostsData,
    posts,
    userFetchNextPage,
    userHasNextPage,
    userIsFetchingNextPage,
    userIsLoading,
    isRefetchingPosts,
    userIsError,
    userError,
    refetchPosts,
    onRefresh,
    isRefreshing,
  } = useProfileQueries(username as string, viewerUserId as string | undefined, true);

  // Debug logging
  console.log('Profile Debug:', {
    username,
    viewerUserId,
    profileLoading,
    userIsLoading,
    postsCount: posts.length,
    hasProfileData: !!userProfileData,
    targetUserId: userProfileData?.userInfo?.soleUserId
  });

  const userInfo = userProfileData?.userInfo;
  const talentInfo = userProfileData?.talentInfo;
  const talentLevel = userProfileData?.talentLevel || null;

  // Transform posts once and memoize
  const transformedPosts = useMemo(() => {
    return posts.map((post: any) => ({
      id: post.id.toString(),
      soleUserId: post.soleUserId,
      content: post.content || '',
      createdAt: post.createdAt,
      media: (post.media || []).map((m: any) => ({
        id: m.id.toString(),
        mediaUrl: m.mediaUrl,
        mediaType: (m.mediaType as 'image' | 'video') || 'image',
        displayOrder: m.displayOrder,
      })),
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      isLikedByUser: post.isLikedByUser || false,
      soleUserInfo: {
        soleUserId: post.soleUserInfo?.soleUserId || post.soleUserId,
        username: post.soleUserInfo?.username || 'Unknown',
        name: post.soleUserInfo?.name || 'Unknown',
        profilePic: post.soleUserInfo?.profilePic || null,
      },
    }));
  }, [posts]);

  // Calculate scroll offset for a given index
  const getOffsetForIndex = useCallback((index: number) => {
    let offset = 10; // paddingTop
    for (let i = 0; i < index; i++) {
      const postId = transformedPosts[i]?.id;
      const height = postId ? itemHeights.current[postId] : undefined;
      offset += height || 600; // fallback estimate
    }
    return offset;
  }, [transformedPosts]);

  // Estimate grid start position (UserInfo ~200px + tabs ~50px + paddingTop)
  const GRID_START_OFFSET = 250 + insets.top + 50;
  
  // Open modal with Instagram-like expand animation
  const openPostModal = useCallback((index: number, layout?: { x: number; y: number; width: number; height: number; col?: number; row?: number }) => {
    console.log('openPostModal called - index:', index);
    console.log('openPostModal layout:', JSON.stringify(layout));
    console.log('profileScrollY:', profileScrollY.current, 'GRID_START_OFFSET:', GRID_START_OFFSET);
    setSelectedPostIndex(index);
    
    // Set source position for animation origin
    if (layout) {
      // Calculate screen position: grid position + grid start offset - scroll offset
      const screenX = layout.x + layout.width / 2;
      const screenY = GRID_START_OFFSET + layout.y - profileScrollY.current + layout.height / 2;
      
      const calcX = screenX - SCREEN_WIDTH / 2;
      const calcY = screenY - SCREEN_HEIGHT / 2;
      console.log('Screen position - screenX:', screenX, 'screenY:', screenY);
      console.log('Calculated sourceX:', calcX, 'sourceY:', calcY);
      sourceX.value = calcX;
      sourceY.value = calcY;
    } else {
      console.log('No layout provided, using center');
      // Fallback to center
      sourceX.value = 0;
      sourceY.value = 0;
    }
    
    // Show modal and start expand animation
    setPostModalVisible(true);
    expandProgress.value = 0;
    translateX.value = 0;
    modalOpacity.value = 0;
    
    // Animate expand from thumbnail to fullscreen
    requestAnimationFrame(() => {
      expandProgress.value = withTiming(1, { duration: 300 });
      modalOpacity.value = withTiming(1, { duration: 200 });
    });
  }, [insets.top]);

  // Track current visible post index in modal
  const currentVisibleIndex = useRef(selectedPostIndex);
  
  // Calculate grid position for a given post index
  const getGridPositionForIndex = useCallback((index: number) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = col * IMAGE_SIZE + IMAGE_SIZE / 2;
    const y = GRID_START_OFFSET + row * IMAGE_SIZE - profileScrollY.current + IMAGE_SIZE / 2;
    return {
      x: x - SCREEN_WIDTH / 2,
      y: y - SCREEN_HEIGHT / 2,
    };
  }, [GRID_START_OFFSET]);
  
  // Handle scroll to track visible post
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

  // Close modal with collapse animation back to thumbnail
  const closePostModal = useCallback(() => {
    // Use currentVisibleIndex (the last viewed post) for close position
    const pos = getGridPositionForIndex(currentVisibleIndex.current);
    sourceX.value = pos.x;
    sourceY.value = pos.y;
    
    // Reset translate values first for clean animation back to source
    translateX.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
    expandProgress.value = withTiming(0, { duration: 300 });
    modalOpacity.value = withTiming(0, { duration: 300 });
    setTimeout(() => {
      setPostModalVisible(false);
    }, 350);
  }, [getGridPositionForIndex, selectedPostIndex]);

  // Swipe/fling to close gesture - follows finger freely on both axes
  const FLING_VELOCITY_THRESHOLD = 300;
  const translateY = useSharedValue(0);
  
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

  // Animated styles - Instagram-like expand/collapse from source position
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

  // Track item height on layout
  const handleItemLayout = useCallback((postId: string, height: number) => {
    if (itemHeights.current[postId] !== height) {
      itemHeights.current[postId] = height;
      console.log('Item height captured:', postId, height, 'All heights:', JSON.stringify(itemHeights.current));
    }
  }, []);


  // Profile error state
  if (profileError && !profileLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-black">
          <CollapsibleHeader
            title={isOwnProfile ? 'User Profile' : `@${username}`}
            headerLeft={
              isProfileRoute ? (
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
              ) : undefined
            }
            animatedStyle={animatedHeaderStyle}
            onHeightChange={handleHeightChange}
            isDark={true}
          />
          <ScrollView
            className="flex-1 bg-black"
            contentContainerStyle={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing || false}
                onRefresh={onRefresh}
                tintColor="#3b82f6"
                colors={['#3b82f6']}
                progressViewOffset={insets.top + 50}
              />
            }>
            <Text className="mb-4 text-center text-red-400">Failed to load profile</Text>
            <Text className="mb-4 text-center text-sm text-gray-400">
              {profileError?.message || 'Please try again'}
            </Text>
            <TouchableOpacity
              onPress={onRefresh}
              className="rounded-lg bg-blue-500 px-6 py-3"
              disabled={isRefreshing}>
              <Text className="font-semibold text-white">
                {isRefreshing ? 'Refreshing...' : 'Retry'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title={isOwnProfile ? 'Talent Profile' : `@${username}`}
          headerLeft={
            isProfileRoute && !isOwnProfile ? (
              <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            ) : undefined
          }
          headerRight={
            isOwnProfile ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  style={{ padding: 8 }}
                  onPress={() => {
                    console.log('Notifications pressed');
                  }}>
                  <Ionicons name="notifications-outline" size={24} color="#fff" />
                </TouchableOpacity>

                <ProfileSettings />
              </View>
            ) : undefined
          }
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
        />

        <ScrollView
          className="flex-1 bg-black"
          onScroll={(e) => {
            profileScrollY.current = e.nativeEvent.contentOffset.y;
            onScroll?.(e);
          }}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 50,
            paddingBottom: insets.bottom + 80,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing || false}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
              progressViewOffset={insets.top + 50}
            />
          }>
          {/* Profile Header - Instagram Style */}
          <UserInfo
            userPostsData={userPostsData}
            username={username || ''}
            userProfileData={userProfileData}
          />

          {/* Tab Navigation */}
          <View className="border-t border-gray-800">
            <View className="flex-row">
              <TouchableOpacity
                activeOpacity={1}
                className={`flex-1 items-center border-b-2 py-3 ${
                  profileTab === 'posts' ? 'border-white' : 'border-transparent'
                }`}
                onPress={() => setProfileTab('posts')}>
                <Grid size={24} color={profileTab === 'posts' ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={1}
                className={`flex-1 items-center border-b-2 py-3 ${
                  profileTab === 'talent' ? 'border-white' : 'border-transparent'
                }`}
                onPress={() => setProfileTab('talent')}>
                <User size={24} color={profileTab === 'talent' ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={1}
                className={`flex-1 items-center border-b-2 py-3 ${
                  profileTab === 'jobs' ? 'border-white' : 'border-transparent'
                }`}
                onPress={() => setProfileTab('jobs')}>
                <Briefcase size={24} color={profileTab === 'jobs' ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Content */}
          <View className="flex-1" style={{ minHeight: 400 }}>
            {profileTab === 'posts' ? (
              <UserPosts
                userIsLoading={userIsLoading}
                userIsError={userIsError}
                userError={userError}
                posts={posts}
                userHasNextPage={userHasNextPage}
                userIsFetchingNextPage={userIsFetchingNextPage}
                userFetchNextPage={userFetchNextPage}
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
                onPostPress={openPostModal}
              />
            ) : profileTab === 'talent' ? (
              <TalentProfile
                userProfileData={userProfileData}
                talentLevel={talentLevel as unknown as number}
                talentInfo={talentInfo}
                isOwnProfile={isOwnProfile}
              />
            ) : profileTab === 'jobs' ? (
              <JobHistory />
            ) : null}
          </View>
        </ScrollView>

        {/* Post Feed - Always mounted, visibility controlled by modal state */}
        {transformedPosts.length > 0 && (
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
                  contentOffset={{ x: 0, y: getOffsetForIndex(selectedPostIndex) }}
                  scrollEventThrottle={100}
                  onScroll={handleModalScroll}
                >
                  {transformedPosts.map((item, index) => {
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
                          onLike={() => {}}
                          onAddComment={() => {}}
                          onZoomChange={(isZooming) => setZoomingIndex(isZooming ? index : null)}
                          onScaleChange={() => {}}
                        />
                      </View>
                    );
                  })}
                </Animated.ScrollView>
              </Animated.View>
            </GestureDetector>
          </View>
        )}
      </View>
    </>
  );
}
