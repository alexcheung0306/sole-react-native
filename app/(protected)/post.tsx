import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { useProfileQueries } from '~/hooks/useProfileQueries';
import { useRef, useEffect } from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PostCard } from '~/components/feed/PostCard';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

export default function UserPostsFeed() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const postIdParam = params.postId as string;
  const userIdParam = params.userId as string;
  const { soleUserId } = useSoleUserContext();
  const queryClient = useQueryClient();
  const flatListRef = useRef<any>(null);
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const insets = useSafeAreaInsets();

  // Extract actual post ID from the "postid{id}" format
  const targetPostId = postIdParam?.replace('postid', '') || postIdParam;
  const userId = userIdParam || soleUserId;

  // Transform backend response to component format
  const transformPost = (backendPost: any) => {
    return {
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
    };
  };

  // Use custom hook for profile posts (no profile data needed)
  const {
    userPostsData,
    posts: userPosts,
    userFetchNextPage,
    userHasNextPage,
    userIsFetchingNextPage,
    userIsLoading: userPostsLoading,
    isRefetchingPosts,
    userIsError: userPostsError,
    userError: userPostsErrorObj,
    onRefresh,
    isRefreshing,
  } = useProfileQueries(userId, soleUserId, false);

  // Find the target post index for scrolling
  const targetPostIndex = userPosts.findIndex(post => post.id.toString() === targetPostId);

  // Scroll to target post when data loads
  useEffect(() => {
    if (targetPostIndex >= 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: targetPostIndex,
          animated: true,
        });
      }, 500); // Small delay to ensure list is rendered
    }
  }, [targetPostIndex]);

  const handleLike = (postId: string) => {
    if (!soleUserId) return;
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['homePagePosts'] });
    queryClient.invalidateQueries({ queryKey: ['userPostsList', userId] });
  };

  // Loading state
  if (userPostsLoading && userPosts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-400">Loading posts...</Text>
      </View>
    );
  }

  // Error state
  if (userPostsError) {
    return (
      <View className="flex-1 items-center justify-center bg-black p-4">
        <Text className="mb-4 text-center text-red-400">Failed to load posts</Text>
        <Text className="mb-4 text-center text-sm text-gray-400">
          {userPostsErrorObj?.message || 'Please try again'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-lg bg-blue-500 px-6 py-3">
          <Text className="font-semibold text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <BottomSheetModalProvider>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title="Posts"
          headerLeft={
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              className="flex items-center justify-center p-2">
              <ChevronLeft color="#93c5fd" size={24} />
            </TouchableOpacity>
          }
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
        />

        <Animated.FlatList
          ref={flatListRef}
          data={userPosts}
          renderItem={({ item }) => {
            const transformedPost = transformPost(item);
            return (
              <PostCard
                post={transformedPost}
                onLike={handleLike}
                onAddComment={(postId, content) => {
                  // Handle comment if needed
                }}
                onZoomChange={() => {}}
                onScaleChange={() => {}}
              />
            );
          }}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 50,
            paddingBottom: insets.bottom + 80,
          }}
          onEndReached={() => {
            if (userHasNextPage && !userIsFetchingNextPage) {
              userFetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            userIsFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
              progressViewOffset={insets.top + 50}
            />
          }
        />
      </View>
    </BottomSheetModalProvider>
  );
}
