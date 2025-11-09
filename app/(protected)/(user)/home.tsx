import { Stack } from 'expo-router';
import { View, FlatList, ActivityIndicator, Text, RefreshControl, TouchableOpacity } from 'react-native';
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
  PostWithDetailsResponse 
} from '~/api/apiservice/post_api';
import { API_BASE_URL } from '~/api/apiservice';

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
      // Debug: Log post media URLs
      if (response.data && response.data.length > 0) {
        console.log('Home posts fetched:', response.data.length);
        response.data.forEach((post: any) => {
          if (post.media && post.media.length > 0) {
            console.log(`Home Post ${post.id} media URLs:`, post.media.map((m: any) => m.mediaUrl));
          } else {
            console.log(`Home Post ${post.id} has no media`);
          }
        });
      }
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
    mutationFn: ({ postId, userId, content }: { postId: number; userId: string; content: string }) =>
      createPostComment({ postId, soleUserId: userId, content }),
    onSuccess: () => {
      // Invalidate and refetch posts to get updated comment counts
      queryClient.invalidateQueries({ queryKey: ['homePagePosts'] });
    },
  });

  // Flatten all pages into single array
  const posts = postsData?.pages.flatMap(page => page.data) ?? [];
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

  // Load more posts
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Fix mediaUrl if it uses localhost (for physical devices)
  const getMediaUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    
    // Extract base URL from API_BASE_URL (remove /api suffix if present)
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
    
    // Replace localhost with the API base URL host if needed
    if (url.includes('localhost:8080') || url.includes('127.0.0.1:8080')) {
      try {
        const apiUrl = new URL(baseUrl);
        const fixedUrl = url.replace(/https?:\/\/[^\/]+/, `${apiUrl.protocol}//${apiUrl.host}`);
        console.log('Fixed localhost URL in home:', { original: url, fixed: fixedUrl });
        return fixedUrl;
      } catch (e) {
        console.error('Error fixing URL in home:', e, url);
        return url;
      }
    }
    // If it's a relative URL, prepend base URL
    if (url.startsWith('/')) {
      const fullUrl = `${baseUrl}${url}`;
      console.log('Fixed relative URL in home:', { original: url, full: fullUrl });
      return fullUrl;
    }
    return url;
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
      media: (backendPost.media || []).map(m => ({
        id: m.id.toString(),
        mediaUrl: getMediaUrl(m.mediaUrl) || m.mediaUrl, // Fix URL if needed
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

  const renderPost = ({ item }: { item: PostWithDetailsResponse }) => {
    const transformedPost = transformPost(item);
    return (
      <PostCard
        post={transformedPost}
        onLike={handleLike}
        onAddComment={handleAddComment}
        comments={[]} // Comments will be fetched when sheet opens
      />
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View className="items-center justify-center py-20">
        <Text className="text-gray-400 text-lg">No posts yet</Text>
        <Text className="text-gray-500 text-sm mt-2">Be the first to create a post!</Text>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-400 mt-4">Loading feed...</Text>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-4">
        <Text className="text-red-400 text-center mb-4">
          Failed to load posts
        </Text>
        <Text className="text-gray-400 text-center mb-4">
          {error?.message || 'Please check your connection and try again'}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-black">
          <CollapsibleHeader
            title="Feed"
            translateY={headerTranslateY}
            isDark={true}
          />
          
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id.toString()}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingTop: insets.top + 72,
            }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={onRefresh}
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
