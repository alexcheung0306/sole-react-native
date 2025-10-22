import { Stack } from 'expo-router';
import { View, FlatList, ActivityIndicator, Text, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CollapsibleHeader } from '../../../components/CollapsibleHeader';
import { useScrollHeader } from '../../../hooks/useScrollHeader';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  searchPosts, 
  togglePostLike,
  PostWithDetailsResponse 
} from '~/api/apiservice/post_api';
import { PostThumbnail, COLUMNS } from '../../../components/feed/PostThumbnail';
import { PostModal } from '../../../components/feed/PostModal';
import BottomSheet from '@gorhom/bottom-sheet';
import { CommentSheet } from '../../../components/feed/CommentSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Explore() {
  const insets = useSafeAreaInsets();
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const { soleUserId } = useSoleUserContext();
  const queryClient = useQueryClient();
  const commentSheetRef = useRef<BottomSheet>(null);

  // Modal state
  const [selectedPost, setSelectedPost] = useState<PostWithDetailsResponse | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
    queryKey: ['explorePagePosts', soleUserId],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('Fetching explore posts page:', pageParam);
      const response = await searchPosts({
        soleUserId: '', // Empty = ALL users for explore
        content: '',
        pageNo: pageParam,
        pageSize: 6, // 6 posts per page (2 cols = 3 rows, or 3 cols = 2 rows)
        orderBy: 'createdAt',
        orderSeq: 'desc',
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page;
      const totalPages = Math.ceil(lastPage.total / lastPage.pageSize);
      
      if (currentPage + 1 < totalPages) {
        return currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 0,
    enabled: !!soleUserId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Mutation for liking posts
  const likeMutation = useMutation({
    mutationFn: ({ postId, userId }: { postId: number; userId: string }) => 
      togglePostLike(postId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['explorePagePosts'] });
    },
  });

  // Flatten all pages
  const posts = postsData?.pages.flatMap(page => page.data) ?? [];
  const totalPosts = postsData?.pages[0]?.total ?? 0;

  // Handle thumbnail press
  const handleThumbnailPress = (post: PostWithDetailsResponse) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedPost(null), 300); // Clear after animation
  };

  // Handle like
  const handleLike = (postId: string) => {
    if (!soleUserId) return;
    
    // Optimistic update
    if (selectedPost && selectedPost.id.toString() === postId) {
      setSelectedPost({
        ...selectedPost,
        likeCount: selectedPost.likeCount + ((selectedPost.isLikedByUser || false) ? -1 : 1),
        isLikedByUser: !(selectedPost.isLikedByUser || false),
      });
    }
    
    likeMutation.mutate({
      postId: parseInt(postId),
      userId: soleUserId,
    });
  };

  // Handle add comment
  const handleAddComment = (postId: string, content: string) => {
    if (!soleUserId) return;
    console.log('Add comment:', postId, content);
    // Will be implemented when comment API is connected
    queryClient.invalidateQueries({ queryKey: ['explorePagePosts'] });
  };

  // Handle open comments
  const handleOpenComments = (postId: string) => {
    commentSheetRef.current?.snapToIndex(0);
  };

  // Load more
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Transform post for modal
  const transformPostForModal = (backendPost: PostWithDetailsResponse) => {
    const userInfo = backendPost.soleUserInfo || {
      soleUserId: backendPost.soleUserId || 'unknown',
      username: 'Unknown User',
      name: 'Unknown User',
      profilePic: null,
    };

    return {
      id: backendPost.id.toString(),
      soleUserId: backendPost.soleUserId,
      content: backendPost.content || '',
      createdAt: backendPost.createdAt,
      media: (backendPost.media || []).map(m => ({
        id: m.id.toString(),
        mediaUrl: m.mediaUrl,
        mediaType: 'image' as const,
        displayOrder: m.displayOrder,
      })),
      likeCount: backendPost.likeCount || 0,
      commentCount: backendPost.commentCount || 0,
      isLikedByUser: false,
      soleUserInfo: {
        soleUserId: userInfo.soleUserId,
        username: userInfo.username,
        name: userInfo.name,
        profilePic: userInfo.profilePic,
      },
    };
  };

  // Render thumbnail
  const renderThumbnail = ({ item }: { item: PostWithDetailsResponse }) => {
    const firstImage = item.media?.[0]?.mediaUrl;
    if (!firstImage) return null;

    return (
      <PostThumbnail
        imageUrl={firstImage}
        hasMultipleImages={(item.media?.length || 0) > 1}
        onPress={() => handleThumbnailPress(item)}
      />
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-6 items-center" style={{ width: SCREEN_WIDTH }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View className="items-center justify-center py-20" style={{ width: SCREEN_WIDTH }}>
        <Text className="text-gray-400 text-lg">No posts to explore</Text>
        <Text className="text-gray-500 text-sm mt-2">Check back later!</Text>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-400 mt-4">Loading explore...</Text>
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
        <Text className="text-gray-400 text-center mb-4 text-sm">
          {error?.message || 'Please try again'}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Retry</Text>
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
            title="Explore"
            translateY={headerTranslateY}
            isDark={true}
          />
          
          <FlatList
            data={posts}
            renderItem={renderThumbnail}
            keyExtractor={(item) => item.id.toString()}
            numColumns={COLUMNS}
            key={`grid-${COLUMNS}`} // Force re-render if columns change
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

        {/* Post Detail Modal */}
        {selectedPost && (
          <PostModal
            visible={modalVisible}
            post={transformPostForModal(selectedPost)}
            onClose={handleCloseModal}
            onLike={handleLike}
            onOpenComments={handleOpenComments}
          />
        )}

        {/* Comment Sheet */}
        {selectedPost && (
          <CommentSheet
            bottomSheetRef={commentSheetRef as any}
            postId={selectedPost.id.toString()}
            onAddComment={(content) => handleAddComment(selectedPost.id.toString(), content)}
          />
        )}
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
