import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MessageCircle, MoreVertical, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import { Post, Comment } from '~/types/post';
import { ImageCarousel } from './ImageCarousel';
import { LikeButton } from './LikeButton';
import { CommentSheet } from './CommentSheet';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  comments: Comment[];
}

export function PostCard({ post, onLike, onAddComment, comments }: PostCardProps) {
  const router = useRouter();
  const commentSheetRef = useRef<BottomSheet>(null);

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

  const renderCaption = () => {
    if (!post.content) return null;

    // Simple hashtag and mention parsing
    const parts = post.content.split(/(\s+)/);

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

  return (
    <>
      <View className="mb-2 border-b border-gray-800/50 bg-black">
        {/* Header: User Info */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity
            onPress={() =>
              router.push(`/(protected)/(user)/user/${post.soleUserInfo.username}` as any)
            }
            className="flex-1 flex-row items-center"
            activeOpacity={0.7}>
            {/* Avatar */}
            {post.soleUserInfo.profilePic ? (
              <Image
                source={{ uri: post.soleUserInfo.profilePic }}
                className="mr-3 h-10 w-10 rounded-full"
              />
            ) : (
              <View className="mr-3 h-10 w-10 rounded-full bg-gray-700" />
            )}

            {/* Username & Time */}
            <View className="flex-1">
              <Text className="text-sm font-semibold text-white">{post.soleUserInfo.username}</Text>
              <View className="flex-row items-center">
                <Text className="text-xs text-gray-400">{formatTimeAgo(post.createdAt)}</Text>
                {post.location && (
                  <>
                    <Text className="mx-1 text-xs text-gray-500">•</Text>
                    <View className="flex-row items-center">
                      <MapPin size={10} color="#9ca3af" />
                      <Text className="ml-1 text-xs text-gray-400" numberOfLines={1}>
                        {post.location}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* More Options */}
          <TouchableOpacity className="p-2">
            <MoreVertical size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Body: Image/Video */}
        <ImageCarousel media={post.media} />

        {/* Footer: Actions & Caption */}
        <View className="px-4 py-3">
          {/* Action Buttons */}
          <View className="mb-3 flex-row items-center">
            <LikeButton
              isLiked={post.isLikedByUser}
              likeCount={post.likeCount}
              onPress={() => onLike(post.id)}
            />

            <TouchableOpacity
              // onPress={() => router.push(`/(protected)/(user)/post/postid${post.id}` as any)}
              onPress={() => router.push(`/(protected)/post/${post.id}` as any)}
              className="ml-4 flex-row items-center gap-2"
              activeOpacity={0.7}>
              <MessageCircle size={24} color="#ffffff" strokeWidth={2} />
              <Text className="text-sm font-semibold text-white">
                {post.commentCount > 0 ? post.commentCount : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Caption */}
          {post.content && (
            <View className="mb-2">
              <Text className="mb-1 text-sm font-semibold text-white">
                {post.soleUserInfo.username}
              </Text>
              {renderCaption()}
            </View>
          )}

          {/* View Comments */}
          {post.commentCount > 0 && (
            <TouchableOpacity
              // onPress={() => router.push(`/(protected)/(user)/post/postid${post.id}` as any)}
              onPress={() => router.push(`/(protected)/post/${post.id}` as any)}
              activeOpacity={0.7}>
              <Text className="text-sm text-gray-400">View all {post.commentCount} comments</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Comment Sheet */}
      <CommentSheet
        bottomSheetRef={commentSheetRef}
        postId={post.id}
        comments={comments}
        onAddComment={(content) => onAddComment(post.id, content)}
      />
    </>
  );
}
