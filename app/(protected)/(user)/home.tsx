import React from 'react';
import { Stack } from 'expo-router';
import {
  View,
  FlatList,
  Animated,
  ActivityIndicator,
  Text,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CollapsibleHeader } from '../../../components/CollapsibleHeader';
import { useScrollHeader } from '../../../hooks/useScrollHeader';
import { PostCard } from '../../../components/feed/PostCard';
import { getAppTabBarControl } from '~/hooks/useScrollAppTabBar';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SoleLogo } from '../../../components/SoleLogo';
import {
  searchPosts,
  togglePostLike,
  createPostComment,
  PostWithDetailsResponse,
} from '~/api/apiservice/post_api';

export default React.memo(function UserHome() {
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange, collapseHeader, showHeader, isHeaderCollapsed, setHeaderPositionByScale, getHeaderTranslateY } = useScrollHeader();
  const { soleUserId } = useSoleUserContext();
  const queryClient = useQueryClient();
  const [isAnyImageZooming, setIsAnyImageZooming] = React.useState(false);
  const headerStateBeforeZoom = React.useRef<boolean | null>(null); // null = not zooming, true = was collapsed, false = was open
  const headerStartPosition = React.useRef<number>(0); // Track header position when zoom starts
  const tabBarStartPosition = React.useRef<number>(0); // Track tab bar position when zoom starts
  const isRestoring = React.useRef<boolean>(false); // Track if we're restoring positions after zoom ends

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
    isRefetching,
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

  // Handle zoom state changes - track when zoom starts/ends
  const handleZoomChange = React.useCallback((isZooming: boolean) => {
    setIsAnyImageZooming((prev) => {
      const wasZooming = prev;
      const nowZooming = isZooming;
      
      if (!wasZooming && nowZooming) {
        // Zoom just started - save current positions
        headerStateBeforeZoom.current = isHeaderCollapsed();
        headerStartPosition.current = getHeaderTranslateY();
        
        // Get tab bar start position
        const tabBarControl = getAppTabBarControl();
        if (tabBarControl) {
          tabBarStartPosition.current = tabBarControl.getTabBarTranslateY();
        }
      } else if (wasZooming && !nowZooming) {
        // Zoom just ended - set restore mode and restore header and tab bar to original positions
        isRestoring.current = true;
        
        // Restore header to original position
        if (headerStateBeforeZoom.current === false) {
          // Header was open before zoom, restore it
          showHeader();
        } else {
          // Header was collapsed, restore to its original collapsed position
          setHeaderPositionByScale(1, headerStartPosition.current, 1, 2);
        }
        
        // Restore tab bar to original position
        const tabBarControl = getAppTabBarControl();
        if (tabBarControl) {
          // Restore tab bar to its original position
          tabBarControl.showTabBar();
        }
        
        headerStateBeforeZoom.current = null;
      }
      
      return nowZooming;
    });
  }, [showHeader, isHeaderCollapsed, getHeaderTranslateY]);

  // Handle scale changes - translate header and tab bar proportionally
  const handleScaleChange = React.useCallback((scale: number) => {
    // If we're restoring (zoom just ended), don't use scale-based translation
    // Just ensure positions are at original when scale reaches 1
    if (isRestoring.current) {
      if (scale <= 1) {
        // Scale has reached 1, ensure positions are restored and clear restore mode
        if (headerStateBeforeZoom.current === false) {
          showHeader();
        }
        const tabBarControl = getAppTabBarControl();
        if (tabBarControl) {
          tabBarControl.showTabBar();
        }
        isRestoring.current = false;
      }
      // During restore, don't do scale-based translation
      return;
    }
    
    // Update even if not "officially" zooming yet - this allows animation to start earlier
    // If zoom hasn't started yet, initialize positions
    if (!isAnyImageZooming && scale > 1) {
      headerStartPosition.current = getHeaderTranslateY();
      const tabBarControl = getAppTabBarControl();
      if (tabBarControl) {
        tabBarStartPosition.current = tabBarControl.getTabBarTranslateY();
      }
    }
    
    // Only do scale-based translation if we're actively zooming (not restoring)
    if (isAnyImageZooming || scale > 1) {
      // Update header position proportionally to scale
      // minScale = 1, maxScale = 2 (fully collapsed at scale 2, which is 1/2 of the zoom range 1-3)
      setHeaderPositionByScale(scale, headerStartPosition.current, 1, 2);
      
      // Update tab bar position proportionally to scale
      const tabBarControl = getAppTabBarControl();
      if (tabBarControl) {
        tabBarControl.setTabBarPositionByScale(scale, tabBarStartPosition.current, 1, 2);
      }
    }
  }, [isAnyImageZooming, setHeaderPositionByScale, getHeaderTranslateY, showHeader]);

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
    <BottomSheetModalProvider>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title={
            <View className="pb-2">
              <SoleLogo />
            </View>
          }
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
        />

        <Animated.FlatList
          data={posts}
          renderItem={({ item }) => {
            const transformedPost = transformPost(item);
            return (
              <PostCard
                post={transformedPost}
                onLike={handleLike}
                onAddComment={handleAddComment}
                comments={[]} // Comments will be fetched when sheet opens
                onZoomChange={handleZoomChange}
                onScaleChange={handleScaleChange}
              />
            );
          }}
          keyExtractor={(item) => item.id.toString()}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 70, // Increased for header space
            paddingBottom: insets.bottom + 80,
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
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor="rgb(255, 255, 255)"
              colors={['rgb(255, 255, 255)']}
              progressViewOffset={insets.top + 60}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </BottomSheetModalProvider>
  );
});
