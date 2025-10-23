import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MoreVertical, MapPin, MessageCircle, Heart } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { getPostWithDetailsById, togglePostLike, getPostComments, createPostComment } from '~/api/apiservice/post_api';
import { useState, useRef } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import { CommentSheet } from '~/components/feed/CommentSheet';
import { ImageCarousel } from '~/components/feed/ImageCarousel';
import { LikeButton } from '~/components/feed/LikeButton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function PostDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const postId = params.postId as string;
  const { soleUserId } = useSoleUserContext();
  const queryClient = useQueryClient();
  const commentSheetRef = useRef<BottomSheet>(null);

  // Fetch post data
  const {
    data: postData,
    isLoading: postLoading,
    error: postError,
  } = useQuery({
    queryKey: ['postDetail', postId],
    queryFn: () => getPostWithDetailsById(parseInt(postId)),
    enabled: !!postId && !isNaN(parseInt(postId)),
  });

  // Fetch comments
  const {
    data: commentsData,
    isLoading: commentsLoading,
  } = useQuery({
    queryKey: ['postComments', postId],
    queryFn: () => getPostComments(parseInt(postId)),
    enabled: !!postId && !isNaN(parseInt(postId)),
  });

  // Mutation for liking posts
  const likeMutation = useMutation({
    mutationFn: ({ postId, userId }: { postId: number; userId: string }) => 
      togglePostLike(postId, userId),
    onSuccess: () => {
      // Invalidate and refetch post to get updated like counts
      queryClient.invalidateQueries({ queryKey: ['postDetail', postId] });
    },
  });

  // Mutation for adding comments
  const commentMutation = useMutation({
    mutationFn: ({ postId, userId, content }: { postId: number; userId: string; content: string }) =>
      createPostComment({ postId, soleUserId: userId, content }),
    onSuccess: () => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
      queryClient.invalidateQueries({ queryKey: ['postDetail', postId] });
    },
  });

  const handleLike = () => {
    if (!soleUserId || !postData) return;
    
    likeMutation.mutate({
      postId: parseInt(postId),
      userId: soleUserId,
    });
  };

  const handleAddComment = (content: string) => {
    if (!soleUserId || !postData) return;
    
    commentMutation.mutate({
      postId: parseInt(postId),
      userId: soleUserId,
      content,
    });
  };

  const handleOpenComments = () => {
    commentSheetRef.current?.snapToIndex(0);
  };

  const handleUsernamePress = () => {
    if (postData?.soleUserInfo?.username) {
      router.push(`/(protected)/(user)/user/${postData.soleUserInfo.username}` as any);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderCaption = (content: string) => {
    if (!content) return null;

    // Simple hashtag and mention parsing
    const parts = content.split(/(\s+)/);
    
    return (
      <Text className="text-gray-200 text-sm leading-5">
        {parts.map((part, index) => {
          if (part.startsWith('#')) {
            return (
              <Text key={index} className="text-blue-400">
                {part}
              </Text>
            );
          } else if (part.startsWith('@')) {
            return (
              <Text key={index} className="text-blue-400">
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  // Loading state
  if (postLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-400 mt-4">Loading post...</Text>
      </View>
    );
  }

  // Error state
  if (postError || !postData) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-4">
        <Text className="text-red-400 text-center mb-4">
          Failed to load post
        </Text>
        <TouchableOpacity
          onPress={() => {
            console.log('Navigating back from error state');
            router.replace('/(protected)/(user)/home' as any);
          }}
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const post = postData;
  const comments = commentsData || [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        {/* Custom Header */}
        <View className="bg-black pt-12 pb-4 px-4 border-b border-gray-700/50">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => {
                console.log('Navigating back from post detail');
                router.replace('/(protected)/(user)/home' as any);
              }}
              className="flex-row items-center"
            >
              <ArrowLeft size={24} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Post</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="p-2">
              <MoreVertical size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* User Info Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <TouchableOpacity
              onPress={handleUsernamePress}
              className="flex-row items-center flex-1"
              activeOpacity={0.7}
            >
              {/* Avatar */}
              {post.soleUserInfo?.profilePic ? (
                <Image
                  source={{ uri: post.soleUserInfo.profilePic }}
                  className="w-10 h-10 rounded-full mr-3"
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-gray-700 mr-3" />
              )}

              {/* Username & Time */}
              <View className="flex-1">
                <Text className="text-white font-semibold text-sm">
                  {post.soleUserInfo?.username || 'Unknown User'}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-400 text-xs">
                    {formatTimeAgo(post.createdAt)}
                  </Text>
                  {post.location && (
                    <>
                      <Text className="text-gray-500 text-xs mx-1">•</Text>
                      <View className="flex-row items-center">
                        <MapPin size={10} color="#9ca3af" />
                        <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
                          {post.location}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Media */}
          <View style={{ height: screenHeight * 0.6 }}>
            <ImageCarousel media={post.media || []} />
          </View>

          {/* Actions & Caption */}
          <View className="px-4 py-3">
            {/* Action Buttons */}
            <View className="flex-row items-center mb-3">
              <LikeButton
                isLiked={post.isLikedByUser || false}
                likeCount={post.likeCount || 0}
                onPress={handleLike}
              />

              <TouchableOpacity
                onPress={handleOpenComments}
                className="flex-row items-center gap-2 ml-4"
                activeOpacity={0.7}
              >
                <MessageCircle size={24} color="#ffffff" strokeWidth={2} />
                <Text className="text-white font-semibold text-sm">
                  {post.commentCount > 0 ? post.commentCount : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Like Count */}
            {post.likeCount > 0 && (
              <Text className="text-white font-semibold text-sm mb-2">
                {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
              </Text>
            )}

            {/* Caption */}
            {post.content && (
              <View className="mb-2">
                <Text className="text-white font-semibold text-sm mb-1">
                  {post.soleUserInfo?.username || 'Unknown User'}
                </Text>
                {renderCaption(post.content)}
              </View>
            )}

            {/* View Comments */}
            {post.commentCount > 0 && (
              <TouchableOpacity onPress={handleOpenComments} activeOpacity={0.7}>
                <Text className="text-gray-400 text-sm">
                  View all {post.commentCount} comments
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Comment Sheet */}
        <CommentSheet
          bottomSheetRef={commentSheetRef}
          postId={postId}
          comments={comments}
          onAddComment={handleAddComment}
        />
      </View>
    </>
  );
}
