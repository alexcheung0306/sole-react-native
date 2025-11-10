import { Stack } from 'expo-router';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CollapsibleHeader } from '../../../components/CollapsibleHeader';
import { useScrollHeader } from '../../../hooks/useScrollHeader';
import { PostCard } from '../../../components/feed/PostCard';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchPosts,
  togglePostLike,
  getPostComments,
  createPostComment,
  PostWithDetailsResponse,
} from '~/api/apiservice/post_api';

export default function UserHome() {
  const insets = useSafeAreaInsets();
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const { soleUserId } = useSoleUserContext();
  const queryClient = useQueryClient();

  // Fetch posts from real API with infinite scroll
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['homePagePosts', soleUserId],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('Fetching posts page:', pageParam);
      const response = await searchPosts({
        soleUserId: '', // Empty = ALL users for home feed
        content: '',
        pageNo: pageParam,
        pageSize: 5, // Fetch 5 posts per page
        orderBy: 'createdAt',
        orderSeq: 'desc',
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page;
      const totalPages = Math.ceil(lastPage.total / lastPage.pageSize);
      // If there are more pages, return next page number
      if (currentPage + 1 < totalPages) {
        return currentPage + 1;
      }
      return undefined; // No more pages
    },
    initialPageParam: 0,
    enabled: !!soleUserId, // Only run when we have soleUserId
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnWindowFocus: false,
  });

  // Mutation for liking posts
  const likeMutation = useMutation({
    mutationFn: ({ postId, userId }: { postId: number; userId: string }) =>
      togglePostLike(postId, userId),
    onSuccess: () => {
      // Invalidate and refetch posts to get updated like counts
      queryClient.invalidateQueries({ queryKey: ['homePagePosts'] });
    },
  });

  // Mutation for adding comments
  const commentMutation = useMutation({
    mutationFn: ({
      postId,
      userId,
      content,
    }: {
      postId: number;
      userId: string;
      content: string;
    }) => createPostComment({ postId, soleUserId: userId, content }),
    onSuccess: () => {
      // Invalidate and refetch posts to get updated comment counts
      queryClient.invalidateQueries({ queryKey: ['homePagePosts'] });
    },
  });

  // Flatten all pages into single array
  const posts = postsData?.pages.flatMap((page) => page.data) ?? [];
  const totalPosts = postsData?.pages[0]?.total ?? 0;

  // Handle like
  const handleLike = (postId: string) => {
    if (!soleUserId) return;

    likeMutation.mutate({
      postId: parseInt(postId),
      userId: soleUserId,
    });
  };

  // Handle add comment
  const handleAddComment = (postId: string, content: string) => {
    if (!soleUserId) return;
    commentMutation.mutate({
      postId: parseInt(postId),
      userId: soleUserId,
      content,
    });
  };

 

  // Transform backend response to component format with defensive null checks
  const transformPost = (backendPost: PostWithDetailsResponse) => {
    // DEFENSIVE CHECK: Handle missing soleUserInfo
    if (!backendPost.soleUserInfo) {
      console.warn(`⚠️ Post ${backendPost.id} missing soleUserInfo, using fallback`);
    }

    // Fallback user info if missing
    const userInfo = backendPost.soleUserInfo || {
      soleUserId: backendPost.soleUserId || 'unknown',
      username: 'Unknown User',
      name: 'Unknown User',
      profilePic: null,
      talentLevel: null,
      clientLevel: null,
    };

    return {
      id: backendPost.id.toString(),
      soleUserId: backendPost.soleUserId,
      content: backendPost.content || '',
      createdAt: backendPost.createdAt,
      media: (backendPost.media || []).map((m) => ({
        id: m.id.toString(),
        mediaUrl: m.mediaUrl,
        mediaType: (m.mediaType as 'image' | 'video') || 'image',
        displayOrder: m.displayOrder,
      })),
      likeCount: backendPost.likeCount || 0,
      commentCount: backendPost.commentCount || 0,
      isLikedByUser: false, // We'll need to check this separately if needed
      soleUserInfo: {
        soleUserId: userInfo.soleUserId,
        username: userInfo.username,
        name: userInfo.name,
        profilePic: userInfo.profilePic,
      },
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-400">Loading feed...</Text>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-black p-4">
        <Text className="mb-4 text-center text-red-400">Failed to load posts</Text>
        <Text className="mb-4 text-center text-gray-400">
          {error?.message || 'Please check your connection and try again'}
        </Text>
        <TouchableOpacity onPress={() => refetch()} className="rounded-lg bg-blue-500 px-6 py-3">
          <Text className="font-semibold text-white">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-black">
          <CollapsibleHeader title="Feed" translateY={headerTranslateY} isDark={true} />

          <FlatList
            data={posts}
            renderItem={({ item }) => {
              const transformedPost = transformPost(item);
              return (
                <PostCard
                  post={transformedPost}
                  onLike={handleLike}
                  onAddComment={handleAddComment}
                  comments={[]} // Comments will be fetched when sheet opens
                />
              );
            }}
            keyExtractor={(item) => item.id.toString()}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingTop: insets.top + 72,
            }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => {
              if (!isFetchingNextPage) return null;
              return (
                <View className="items-center py-4">
                  <ActivityIndicator size="large" color="#3b82f6" />
                </View>
              );
            }}
            ListEmptyComponent={() => {
              if (isLoading) return null;
              return (
                <View className="items-center justify-center py-20">
                  <Text className="text-lg text-gray-400">No posts yet</Text>
                  <Text className="mt-2 text-sm text-gray-500">Be the first to create a post!</Text>
                </View>
              );
            }}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => refetch()}
                tintColor="#3b82f6"
                colors={['#3b82f6']}
                progressViewOffset={insets.top + 72}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
