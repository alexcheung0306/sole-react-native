import { TouchableOpacity, Text, TextInput, View, Dimensions } from 'react-native';
import CollapseDrawer from '../custom/collapse-drawer';
import { CommentSheet } from './CommentSheet';
import { useState } from 'react';
import { Post } from '~/types/post';
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send } from 'lucide-react-native';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { createPostComment, getPostComments } from '~/api/apiservice/post_api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COMMENTS_PER_PAGE = 10;

export default function CommentModal({ post }: { post: Post }) {
  const [showDrawer, setShowDrawer] = useState(false);
  const { soleUserId } = useSoleUserContext();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [commentText, setCommentText] = useState('');

  // Fetch comments with pagination when drawer is opened
  const {
    data: commentsData,
    isLoading: commentsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchComments,
  } = useInfiniteQuery({
    queryKey: ['postComments', post.id],
    queryFn: ({ pageParam = 0 }) =>
      getPostComments(parseInt(post.id), pageParam, COMMENTS_PER_PAGE, 'desc'),
    getNextPageParam: (lastPage, allPages) => {
      // Handle undefined or null lastPage
      if (!lastPage) {
        return undefined;
      }
      
      // If lastPage is an array, check its length
      if (Array.isArray(lastPage)) {
        // If last page has fewer items than requested, no more pages
        if (lastPage.length < COMMENTS_PER_PAGE) {
          return undefined;
        }
        // Otherwise, return next page number
        return allPages.length;
      }
      
      // If lastPage is an object with a content array (paginated response)
      if (lastPage.content && Array.isArray(lastPage.content)) {
        if (lastPage.content.length < COMMENTS_PER_PAGE) {
          return undefined;
        }
        return allPages.length;
      }
      
      // Default: no more pages
      return undefined;
    },
    initialPageParam: 0,
    enabled: showDrawer && !!post.id && !isNaN(parseInt(post.id)), // Only fetch when drawer is open
  });

  // Flatten all pages into single array
  const allComments = commentsData?.pages?.flatMap((page) => {
    // Handle both array and object with content property
    if (Array.isArray(page)) {
      return page;
    }
    if (page && typeof page === 'object' && Array.isArray(page.content)) {
      return page.content;
    }
    return [];
  }) || [];

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
      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: ['postComments', post.id] });
      // Also invalidate post detail to update comment count
      queryClient.invalidateQueries({ queryKey: ['postDetail', post.id] });
      // Invalidate home page posts to update comment count in feed
      queryClient.invalidateQueries({ queryKey: ['homePagePosts'] });
    },
  });

  const handleAddComment = (content: string) => {
    if (!soleUserId || !post) return;
    commentMutation.mutate({
      postId: parseInt(post.id),
      userId: soleUserId,
      content,
    });
  };

  const handleSendComment = async () => {
    if (commentText.trim()) {
      handleAddComment(commentText.trim());
      setCommentText('');
      // Refetch comments after adding - invalidate will trigger refetch
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowDrawer(true)}
        className="ml-4 flex-row items-center gap-2"
        activeOpacity={0.7}>
        <MessageCircle size={24} color="#ffffff" strokeWidth={2} />
        <Text className="text-sm font-semibold text-white">
          {post.commentCount > 0 ? post.commentCount : ''}
        </Text>
      </TouchableOpacity>

      <CollapseDrawer
        showDrawer={showDrawer}
        setShowDrawer={setShowDrawer}
        title="Comments"
        children={
          <View style={{ flex: 1, flexDirection: 'column' }}>
            {/* Comments List - Fixed height container that fills available space */}
            <View style={{ flex: 1, minHeight: 0 }}>
              <CommentSheet
                postId={post.id}
                comments={allComments}
                isLoading={commentsLoading}
                hasMore={hasNextPage}
                isFetchingMore={isFetchingNextPage}
                onLoadMore={() => fetchNextPage()}
                onAddComment={handleAddComment}
              />
            </View>
          </View>
        }
        bottomArea={
          <View className="flex-row items-center border-t border-gray-700/50   px-4 py-3">
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment..."
              placeholderTextColor="#9ca3af"
              className="mr-2 flex-1 rounded-full bg-gray-700/50 px-4 py-3 text-white"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSendComment}
              disabled={!commentText.trim()}
              className={`rounded-full p-3 ${commentText.trim() ? 'bg-blue-500' : 'bg-gray-700'}`}>
              <Send size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />
    </>
  );
}
