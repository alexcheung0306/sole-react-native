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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH / 3;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

type TabKey = 'posts' | 'talent' | 'jobs';

export default function ProfileScreen() {
  const [profileTab, setProfileTab] = useState<TabKey>('posts');
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const postListRef = useRef<any>(null);
  const itemHeights = useRef<{ [key: string]: number }>({});

  // Animation values for modal
  const translateX = useSharedValue(SCREEN_WIDTH);
  const modalOpacity = useSharedValue(0);
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

  // Open modal with animation - scroll instantly, then animate in
  const openPostModal = useCallback((index: number) => {
    console.log('Tapped post at index:', index);
    setSelectedPostIndex(index);
    
    // Show modal first
    setPostModalVisible(true);
    translateX.value = SCREEN_WIDTH;
    modalOpacity.value = 0;
    
    // Calculate offset and scroll
    const offset = getOffsetForIndex(index);
    console.log('Scrolling to offset:', offset, 'for index:', index);
    
    setTimeout(() => {
      console.log('postListRef.current:', !!postListRef.current);
      if (postListRef.current) {
        postListRef.current.scrollToOffset({
          offset,
          animated: false,
        });
        // Double-check with another call after a tick
        requestAnimationFrame(() => {
          postListRef.current?.scrollToOffset({
            offset,
            animated: false,
          });
          console.log('scrollToOffset called again with offset:', offset);
        });
      }
      
      // Animate in after scroll
      translateX.value = withTiming(0, { duration: 250 });
      modalOpacity.value = withTiming(1, { duration: 200 });
    }, 100);
  }, [getOffsetForIndex]);

  // Close modal with animation
  const closePostModal = useCallback(() => {
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 });
    modalOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      setPostModalVisible(false);
    }, 250);
  }, []);

  // Swipe right to close gesture
  const panGesture = Gesture.Pan()
    .activeOffsetX(20)
    .failOffsetY([-20, 20])
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
        modalOpacity.value = interpolate(
          event.translationX,
          [0, SCREEN_WIDTH],
          [1, 0.3],
          Extrapolation.CLAMP
        );
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(closePostModal)();
      } else {
        translateX.value = withTiming(0, { duration: 200 });
        modalOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  // Animated styles
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  // Track item height on layout
  const handleItemLayout = useCallback((postId: string, height: number) => {
    if (itemHeights.current[postId] !== height) {
      itemHeights.current[postId] = height;
      console.log('Item height captured:', postId, height, 'All heights:', JSON.stringify(itemHeights.current));
    }
  }, []);

  // Memoized render item with height tracking
  const renderPostItem = useCallback(({ item }: { item: any }) => (
    <View onLayout={(e) => handleItemLayout(item.id, e.nativeEvent.layout.height)}>
      <PostCard
        post={item}
        onLike={() => {}}
        onAddComment={() => {}}
        onZoomChange={() => {}}
        onScaleChange={() => {}}
      />
    </View>
  ), [handleItemLayout]);

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
          onScroll={onScroll}
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
              <Animated.View style={[{ flex: 1, backgroundColor: '#000' }, modalAnimatedStyle]}>
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

                {/* Posts List - Always mounted */}
                <Animated.FlatList
                  ref={postListRef}
                  data={transformedPosts}
                  renderItem={renderPostItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingTop: 10,
                    paddingBottom: insets.bottom + 20,
                  }}
                  contentOffset={{ x: 0, y: getOffsetForIndex(selectedPostIndex) }}
                  onScroll={(e) => {
                    console.log('FlatList scroll Y:', e.nativeEvent.contentOffset.y);
                  }}
                  scrollEventThrottle={100}
                />
              </Animated.View>
            </GestureDetector>
          </View>
        )}
      </View>
    </>
  );
}
