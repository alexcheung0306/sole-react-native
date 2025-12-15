import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { Comment } from '~/types/post';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getPostComments } from '~/api/apiservice/post_api';
import { formatTimeAgo } from '~/utils/time-converts';

interface CommentSheetProps {
  bottomSheetRef?: React.RefObject<any>; // Keep for backward compatibility but not used
  postId: string;
  comments?: Comment[]; // Make optional since we'll fetch from API
  onAddComment: (content: string) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
}

export function CommentSheet({
  bottomSheetRef,
  postId,
  comments: providedComments,
  isLoading: providedIsLoading,
  hasMore,
  isFetchingMore,
  onLoadMore,
}: CommentSheetProps) {
  const insets = useSafeAreaInsets();

  // Fetch comments from API only if not provided
  const {
    data: apiComments,
    isLoading: apiLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['postComments', postId],
    queryFn: () => getPostComments(parseInt(postId), 0, 10, 'desc'),
    enabled: !!postId && !providedComments, // Only fetch if comments are not provided
  });

  // Use provided comments or fetched comments
  const comments = providedComments || apiComments || [];
  const commentsLoading = providedIsLoading !== undefined ? providedIsLoading : apiLoading;


  console.log('comments', comments);
  return (
    <View className="flex-1">
      {/* Comments List */}
      {commentsLoading ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-400 mt-2">Loading comments...</Text>
        </View>
      ) : comments.length === 0 ? (
        <View className="items-center justify-center py-20">
          <Text className="text-gray-400">No comments yet</Text>
          <Text className="text-gray-500 text-sm mt-2">Be the first to comment!</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 16 }}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          indicatorStyle="white"
        >
          {comments.map((item) => (
            <View key={item.id} className="flex-row px-4 py-2 border-b border-gray-700/30">
              {/* Avatar */}
              {item.soleUserInfo.profilePic ? (
                <Image
                  source={{ uri: item.soleUserInfo.profilePic }}
                  className="w-8 h-8 rounded-full mr-3"
                />
              ) : (
                <View className="w-8 h-8 rounded-full bg-gray-700 mr-3" />
              )}

              {/* Comment Content */}
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="text-white font-semibold text-sm mr-2">
                    {item.soleUserInfo.username}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    {formatTimeAgo(item.createdAt)}
                  </Text>
                </View>
                <Text className="text-gray-200 text-sm leading-5">
                  {item.content}
                </Text>
              </View>
            </View>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <View className="items-center py-4">
              {isFetchingMore ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <TouchableOpacity
                  onPress={onLoadMore}
                  className="rounded-lg bg-gray-700/50 px-6 py-3"
                  activeOpacity={0.7}>
                  <Text className="text-sm font-semibold text-white">Load More Comments</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}
 
    </View>
  );
}

