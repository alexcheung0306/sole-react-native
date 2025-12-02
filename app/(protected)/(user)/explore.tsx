import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, FlatList, Animated, ActivityIndicator, Text, RefreshControl, Dimensions, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useScrollHeader } from '../../../hooks/useScrollHeader';
import { CollapsibleHeader } from '../../../components/CollapsibleHeader';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { 
  searchPosts, 
  togglePostLike,
  PostWithDetailsResponse 
} from '~/api/apiservice/post_api';
import { 
  autocompleteUsers,
  UserSearchResult 
} from '~/api/apiservice/user_search_api';
import { PostThumbnail } from '../../../components/feed/PostThumbnail';
import { PostModal } from '../../../components/feed/PostModal';
import BottomSheet from '@gorhom/bottom-sheet';
import { CommentSheet } from '../../../components/feed/CommentSheet';
import { Search, Grid3X3, List } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EXPLORE_COLUMNS = 3; // 3 columns for explore page
const GAP = 4;
// Calculate thumbnail size for 3 columns
const EXPLORE_THUMBNAIL_SIZE = (SCREEN_WIDTH - (GAP * (EXPLORE_COLUMNS + 1))) / EXPLORE_COLUMNS;

export default React.memo(function Explore() {
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const { soleUserId } = useSoleUserContext();
  const queryClient = useQueryClient();
  const router = useRouter();
  const commentSheetRef = useRef<BottomSheet>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<View>(null);
  
  // Modal state
  const [selectedPost, setSelectedPost] = useState<PostWithDetailsResponse | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showUserResults, setShowUserResults] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounce search query
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery]);

  // Show/hide user results based on search query
  useEffect(() => {
    setShowUserResults(showSearch && debouncedSearchQuery.trim().length > 0);
  }, [showSearch, debouncedSearchQuery]);

  // Fetch users from API for search dropdown
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isError: isUserSearchError,
    error: userSearchError,
  } = useQuery({
    queryKey: ['userSearch', debouncedSearchQuery],
    queryFn: () => autocompleteUsers(debouncedSearchQuery, 8),
    enabled: debouncedSearchQuery.trim().length > 0 && !!soleUserId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch posts from real API with infinite scroll
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingPosts,
    isError: isPostsError,
    error: postsError,
    refetch: refetchPosts,
  } = useInfiniteQuery({
    queryKey: ['explorePagePosts', soleUserId],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('Fetching explore posts page:', pageParam);
      const response = await searchPosts({
        soleUserId: '', // Empty = ALL users for explore
        content: '',
        pageNo: pageParam,
        pageSize: 12,
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

  // Flatten all pages and filter out null/undefined items
  const posts = postsData?.pages.flatMap(page => page.data ?? []).filter((item): item is PostWithDetailsResponse => item != null) ?? [];
  const totalPosts = postsData?.pages[0]?.total ?? 0;

  // Handle user press from search dropdown
  const handleUserPress = (user: UserSearchResult) => {
    setSearchQuery('');
    setShowUserResults(false);
    setShowSearch(false);
    router.push(`/(protected)/(user)/user/${user.soleUser.username}` as any);
  };

  // Handle thumbnail press
  const handleThumbnailPress = (post: PostWithDetailsResponse) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedPost(null), 300);
  };

  // Handle like
  const handleLike = (postId: string) => {
    if (!soleUserId) return;
    
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
    queryClient.invalidateQueries({ queryKey: ['explorePagePosts'] });
  };

  // Handle open comments
  const handleOpenComments = (postId: string) => {
    commentSheetRef.current?.snapToIndex(0);
  };

  // Load more posts
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    refetchPosts();
  }, [refetchPosts]);

  // Get user display name
  const getUserDisplayName = (user: UserSearchResult) => {
    return (
      user.userInfo?.name ||
      user.talentInfo?.talentName ||
      user.soleUser.username
    );
  };

  // Get user image
  const getUserImage = (user: UserSearchResult) => {
    return (
      user.userInfo?.profilePic ||
      user.talentInfo?.snapshotHalfBody ||
      user.soleUser.image ||
      null
    );
  };

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
    if (!item || !item.id) return null;
    
    const firstImage = item.media?.[0]?.mediaUrl;
    if (!firstImage) return null;

    return (
      <PostThumbnail
        imageUrl={firstImage}
        hasMultipleImages={(item.media?.length || 0) > 1}
        onPress={() => handleThumbnailPress(item)}
        likeCount={item.likeCount}
        commentCount={item.commentCount}
        size={EXPLORE_THUMBNAIL_SIZE}
      />
    );
  };

  // Render user item for dropdown
  const renderUserDropdownItem = (user: UserSearchResult) => {
    const displayName = getUserDisplayName(user);
    const image = getUserImage(user);

    return (
      <TouchableOpacity
        key={user.soleUser.id}
        onPress={() => handleUserPress(user)}
        className="flex-row items-center px-4 py-3 bg-gray-800/80 active:bg-gray-700/80"
      >
        <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 mr-3">
          {image ? (
            <Image
              source={{ uri: image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-white text-base font-semibold">
                {user.soleUser.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold text-sm" numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="text-gray-400 text-xs" numberOfLines={1}>
            @{user.soleUser.username}
          </Text>
        </View>
      </TouchableOpacity>
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
    if (isLoadingPosts) return null;
    
    return (
      <View className="items-center justify-center py-20" style={{ width: SCREEN_WIDTH }}>
        <Text className="text-gray-400 text-lg">No posts to explore</Text>
        <Text className="text-gray-500 text-sm mt-2">Check back later!</Text>
      </View>
    );
  };

  // Loading state
  if (isLoadingPosts) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-400 mt-4">Loading explore...</Text>
      </View>
    );
  }

  // Error state
  if (isPostsError) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-4">
        <Text className="text-red-400 text-center mb-4">
          Failed to load posts
        </Text>
        <Text className="text-gray-400 text-center mb-4 text-sm">
          {postsError?.message || 'Please try again'}
        </Text>
        <TouchableOpacity
          onPress={() => refetchPosts()}
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <BottomSheetModalProvider>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-black">
          <CollapsibleHeader
            title="Explore"
            animatedStyle={animatedHeaderStyle}
            onHeightChange={handleHeightChange}
            isDark={true}
            headerRight={
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowSearch(!showSearch);
                    if (showSearch) {
                      setSearchQuery('');
                      setShowUserResults(false);
                    }
                  }}
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
            }
          />

          

          {/* Search Bar with Dropdown - positioned below header */}
          {showSearch && (
            <View 
              ref={searchContainerRef} 
              className="relative px-4 pb-4 bg-black"
              style={{ paddingTop: insets.top + 72 }}
            >
              <View className="flex-row items-center bg-gray-800/50 rounded-xl px-4 py-3">
                <Search size={20} color="#9ca3af" />
                <TextInput
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setShowUserResults(text.trim().length > 0);
                  }}
                  placeholder="Search users..."
                  placeholderTextColor="#9ca3af"
                  className="flex-1 text-white ml-3 text-base"
                  autoFocus={showSearch}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setShowUserResults(false);
                    }}
                    className="ml-2"
                  >
                    <Text className="text-gray-400 text-lg">×</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* User Search Results Dropdown */}
              {showUserResults && (
                <View className="absolute top-full left-4 right-4 mt-2 bg-gray-900 rounded-xl overflow-hidden z-50 max-h-64">
                  <ScrollView 
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    className="max-h-64"
                  >
                    {isLoadingUsers ? (
                      <View className="py-6 items-center">
                        <ActivityIndicator size="small" color="#3b82f6" />
                      </View>
                    ) : users.length > 0 ? (
                      users.map((user) => renderUserDropdownItem(user))
                    ) : (
                      <View className="py-6 items-center">
                        <Text className="text-gray-400 text-sm">No users found</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
          
          {/* Grid/List Content */}
          <Animated.FlatList
            data={posts}
            renderItem={renderThumbnail}
            keyExtractor={(item, index) => item?.id?.toString() ?? `post-${index}`}
            numColumns={viewMode === 'grid' ? EXPLORE_COLUMNS : 1}
            key={`${viewMode}-${EXPLORE_COLUMNS}`}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: 4,
              paddingTop: showSearch ? 0 : insets.top + 72,
              paddingBottom: insets.bottom + 80,
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
  );
});
