import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
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
import { PostFeedModal } from '~/components/profile/PostFeedModal';
import { ProfileTabNav } from '~/components/profile/profile-tab-nav';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH / 3;

type TabKey = 'posts' | 'talent' | 'jobs';

export default function ProfileScreen() {
  const [profileTab, setProfileTab] = useState<TabKey>('posts');
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [modalScrollOffset, setModalScrollOffset] = useState(0);
  const [modalKey, setModalKey] = useState(0);
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const postListRef = useRef<any>(null);
  const itemHeights = useRef<{ [key: string]: number }>({});
  const profileScrollY = useRef(0);

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
  const username = params.username || user?.username;
  const isOwnProfile = user?.username === username;
  const isProfileRoute = pathname.includes('/profile/');
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

  // Open modal with Instagram-like expand animation
  const openPostModal = useCallback((index: number, layout?: { x: number; y: number; width: number; height: number; col?: number; row?: number }) => {
    // Set current visible index when post card is pressed
    currentVisibleIndex.current = index;
    setSelectedPostIndex(index);
    if (layout) {
      console.log('Layout of grid ', layout);
      // Calculate screen position: grid position + grid start offset - scroll offset
      const screenX = layout.x + layout.width / 2;
      const screenY = GRID_START_OFFSET + layout.y - profileScrollY.current + layout.height / 2;
      const calcX = screenX - SCREEN_WIDTH / 2;
      const calcY = screenY - SCREEN_HEIGHT / 2;
      sourceX.value = calcX;
      sourceY.value = calcY;
    } else {
      sourceX.value = 0;
      sourceY.value = 0;
    }

    // Show modal and start expand animation
    setPostModalVisible(true);
    expandProgress.value = 0;
    translateX.value = 0;
    // Calculate scroll offset and set state - contentOffset prop will handle positioning
    const offset = getOffsetForIndex(index);
    console.log('openPostModal - setting modalScrollOffset:', offset, 'for index:', index);
    setModalScrollOffset(offset);
    // Reset the ref to ensure fresh ScrollView state
    if (postListRef.current) {
      postListRef.current = null;
    }
    setModalKey(k => k + 1); // Force ScrollView remount
console.log('postListReffdfffffffffffffffffffffff', postListRef);
    // Start animation - opacity is now tied to expandProgress (0-0, 1-1)
    expandProgress.value = withTiming(1, { duration: 300 });
  }, [insets.top, getOffsetForIndex]);

  // Cleanup function for modal close (used by both arrow and gesture close)
  const cleanupModalState = useCallback(() => {
    setModalScrollOffset(0);
    if (postListRef.current) {
      postListRef.current.scrollTo({ x: 0, y: 0, animated: false });
      postListRef.current = null;
    }
  }, []);

  // Close modal with collapse animation back to thumbnail
  const closePostModal = useCallback(() => {
    // Use currentVisibleIndex (the last viewed post) for close position
    const pos = getGridPositionForIndex(currentVisibleIndex.current);
    sourceX.value = pos.x;
    sourceY.value = pos.y;
    // Reset translate values first for clean animation back to source
    translateX.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
    // Opacity is now tied to expandProgress (0-0, 1-1)
    expandProgress.value = withTiming(0, { duration: 300 });
    setTimeout(() => {
      setPostModalVisible(false);
      cleanupModalState();
    }, 350);
  }, [getGridPositionForIndex, selectedPostIndex, cleanupModalState]);

  // Swipe/fling to close gesture - follows finger freely on both axes
  const translateY = useSharedValue(0);

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
          <ProfileTabNav
            profileTab={profileTab}
            setProfileTab={(tab: string) => setProfileTab(tab as TabKey)} />

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

          <PostFeedModal
            postModalVisible={postModalVisible}
            setPostModalVisible={setPostModalVisible}
            insets={insets}
            closePostModal={closePostModal}
            cleanupModalState={cleanupModalState}
            postListRef={postListRef}
            transformedPosts={transformedPosts}
            modalScrollOffset={modalScrollOffset}
            handleItemLayout={handleItemLayout}
            selectedPostIndex={selectedPostIndex}
            getGridPositionForIndex={getGridPositionForIndex}
            itemHeights={itemHeights}
            currentVisibleIndex={currentVisibleIndex}
            expandProgress={expandProgress}
            sourceX={sourceX}
            sourceY={sourceY}
            modalOpacity={modalOpacity}
          />
        )}
      </View>
    </>
  );
}
