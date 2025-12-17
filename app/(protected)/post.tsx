import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MoreVertical,
  MapPin,
  MessageCircle,
  Heart,
  ChevronLeft,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSoleUserContext } from '~/context/SoleUserContext';
import {
  getPostWithDetailsById,
  togglePostLike,
  getPostComments,
  createPostComment,
} from '~/api/apiservice/post_api';
import { useState, useRef } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import { CommentSheet } from '~/components/feed/CommentSheet';
import { ImageCarousel } from '~/components/feed/ImageCarousel';
import { LikeButton } from '~/components/feed/LikeButton';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatTimeAgo } from '~/utils/time-converts';

export default function PostDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const postIdParam = params.postId as string;
  const { soleUserId } = useSoleUserContext();
  const queryClient = useQueryClient();
  const commentSheetRef = useRef<BottomSheet>(null);
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const insets = useSafeAreaInsets();

  // Extract actual post ID from the "postid{id}" format
  const postId = postIdParam?.replace('postid', '') || postIdParam;

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
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
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
      router.push(`/profile/${postData.soleUserInfo.username}` as any);
    }
  };

  const renderCaption = (content: string) => {
    if (!content) return null;

    // Simple hashtag and mention parsing
    const parts = content.split(/(\s+)/);

    return (
      <Text className="text-sm leading-5 text-gray-200">
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
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-400">Loading post...</Text>
      </View>
    );
  }

  // Error state
  if (postError || !postData) {
    return (
      <View className="flex-1 items-center justify-center bg-black p-4">
        <Text className="mb-4 text-center text-red-400">Failed to load post</Text>
        <TouchableOpacity
          onPress={() => {
            console.log('Navigating back from error state');
            router.replace('/(protected)/(user)/home' as any);
          }}
          className="rounded-lg bg-blue-500 px-6 py-3">
          <Text className="font-semibold text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const post = postData;
  const comments = commentsData || [];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          headerStyle: { backgroundColor: '#000000' },
          contentStyle: { backgroundColor: '#000000' },
        }}
      />
      <View className="flex-1 bg-black" style={{ zIndex: 1000 }}>
        <CollapsibleHeader
          title={'Post'}
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

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + 50,
            paddingBottom: insets.bottom + 80,
            paddingHorizontal: 0,
          }}>
          {/* User Info Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <TouchableOpacity
              onPress={handleUsernamePress}
              className="flex-1 flex-row items-center"
              activeOpacity={0.7}>
              {/* Avatar */}
              {post.soleUserInfo?.profilePic ? (
                <Image
                  source={{ uri: post.soleUserInfo.profilePic }}
                  className="mr-3 h-10 w-10 rounded-full"
                />
              ) : (
                <View className="mr-3 h-10 w-10 rounded-full bg-gray-700" />
              )}

              {/* Username & Time */}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-white">
                  {post.soleUserInfo?.username || 'Unknown User'}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</Text>
                  {/* {post.location && (
                    <>
                      <Text className="text-gray-500 text-xs mx-1">•</Text>
                      <View className="flex-row items-center">
                        <MapPin size={10} color="#9ca3af" />
                        <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
                          {post.location}
                        </Text>
                      </View>
                    </>
                  )} */}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Media */}
          <ImageCarousel media={post.media || []} />

          {/* Actions & Caption */}
          <View className="px-4 py-3">
            {/* Action Buttons */}
            <View className="mb-3 flex-row items-center">
              <LikeButton
                isLiked={post.isLikedByUser || false}
                likeCount={post.likeCount || 0}
                onPress={handleLike}
              />

              <TouchableOpacity
                onPress={handleOpenComments}
                className="ml-4 flex-row items-center gap-2"
                activeOpacity={0.7}>
                <MessageCircle size={24} color="#ffffff" strokeWidth={2} />
                <Text className="text-sm font-semibold text-white">
                  {post.commentCount > 0 ? post.commentCount : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Like Count */}
            {post.likeCount > 0 && (
              <Text className="mb-2 text-sm font-semibold text-white">
                {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
              </Text>
            )}

            {/* Caption */}
            {post.content && (
              <View className="mb-2">
                <Text className="mb-1 text-sm font-semibold text-white">
                  {post.soleUserInfo?.username || 'Unknown User'}
                </Text>
                {renderCaption(post.content)}
              </View>
            )}

            {/* View Comments */}
            {post.commentCount > 0 && (
              <TouchableOpacity onPress={handleOpenComments} activeOpacity={0.7}>
                <Text className="text-sm text-gray-400">View all {post.commentCount} comments</Text>
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
