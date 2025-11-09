import { Stack } from 'expo-router';
import { View, FlatList, ActivityIndicator, Text, RefreshControl, Dimensions, TouchableOpacity, TextInput } from 'react-native';
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
import { Search, Filter, Grid3X3, List } from 'lucide-react-native';
import { API_BASE_URL } from '~/api/apiservice';

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
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    queryKey: ['explorePagePosts', soleUserId, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('Fetching explore posts page:', pageParam);
      const response = await searchPosts({
        soleUserId: '', // Empty = ALL users for explore
        content: searchQuery || '',
        pageNo: pageParam,
        pageSize: 12, // More posts for better grid
        orderBy: 'createdAt',
        orderSeq: 'desc',
      });
      // Debug: Log post media URLs
      if (response.data && response.data.length > 0) {
        console.log('Explore posts fetched:', response.data.length);
        response.data.forEach((post: any) => {
          if (post.media && post.media.length > 0) {
            console.log(`Explore Post ${post.id} media URLs:`, post.media.map((m: any) => m.mediaUrl));
          } else {
            console.log(`Explore Post ${post.id} has no media`);
          }
        });
      }
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
        console.log('Fixed localhost URL in explore:', { original: url, fixed: fixedUrl });
        return fixedUrl;
      } catch (e) {
        console.error('Error fixing URL in explore:', e, url);
        return url;
      }
    }
    // If it's a relative URL, prepend base URL
    if (url.startsWith('/')) {
      const fullUrl = `${baseUrl}${url}`;
      console.log('Fixed relative URL in explore:', { original: url, full: fullUrl });
      return fullUrl;
    }
    return url;
  };

  // Render thumbnail
  const renderThumbnail = ({ item }: { item: PostWithDetailsResponse }) => {
    const firstImage = item.media?.[0]?.mediaUrl;
    if (!firstImage) {
      console.log('Post has no media:', item.id);
      return null;
    }

    const fixedImageUrl = getMediaUrl(firstImage);
    if (!fixedImageUrl) return null;

    return (
      <PostThumbnail
        imageUrl={fixedImageUrl}
        hasMultipleImages={(item.media?.length || 0) > 1}
        onPress={() => handleThumbnailPress(item)}
        likeCount={item.likeCount}
        commentCount={item.commentCount}
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
          {/* Enhanced Header */}
          <View className="bg-black">
            <View 
              className="pt-12 pb-4 px-4"
              style={{ paddingTop: insets.top + 12 }}
            >
              {/* Top Row */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-2xl font-bold text-white">Explore</Text>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={() => setShowSearch(!showSearch)}
                    className="p-2"
                    activeOpacity={0.7}
                  >
                    <Search size={24} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="p-2"
                    activeOpacity={0.7}
                  >
                    {viewMode === 'grid' ? (
                      <List size={24} color="#ffffff" />
                    ) : (
                      <Grid3X3 size={24} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search Bar */}
              {showSearch && (
                <View className="flex-row items-center bg-gray-800/50 rounded-xl px-4 py-3 mb-4">
                  <Search size={20} color="#9ca3af" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search posts..."
                    placeholderTextColor="#9ca3af"
                    className="flex-1 text-white ml-3 text-base"
                    autoFocus={showSearch}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      className="ml-2"
                    >
                      <Text className="text-gray-400 text-lg">×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Stats */}
              <View className="flex-row items-center gap-6">
                <Text className="text-gray-400 text-sm">
                  {totalPosts.toLocaleString()} posts
                </Text>
                <Text className="text-gray-400 text-sm">
                  {posts.length} loaded
                </Text>
              </View>
            </View>
          </View>
          
          {/* Grid/List Content */}
          <FlatList
            data={posts}
            renderItem={renderThumbnail}
            keyExtractor={(item) => item.id.toString()}
            numColumns={viewMode === 'grid' ? COLUMNS : 1}
            key={`${viewMode}-${COLUMNS}`}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: 4,
              paddingBottom: insets.bottom + 20,
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
                progressViewOffset={insets.top + 120}
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
