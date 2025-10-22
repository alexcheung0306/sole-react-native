import { View, Text, Modal, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { Post } from '~/types/post';
import { ImageCarousel } from './ImageCarousel';
import { LikeButton } from './LikeButton';
import { MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface PostModalProps {
  visible: boolean;
  post: Post | null;
  onClose: () => void;
  onLike: (postId: string) => void;
  onOpenComments: (postId: string) => void;
}

export function PostModal({ visible, post, onClose, onLike, onOpenComments }: PostModalProps) {
  const router = useRouter();

  if (!post) return null;

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

  const handleUsernamePress = () => {
    onClose();
    router.push(`/(protected)/(user)/user/${post.soleUserInfo.username}` as any);
  };

  const renderCaption = () => {
    if (!post.content) return null;

    const parts = post.content.split(/(\s+)/);
    
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-12 pb-3 border-b border-gray-800">
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white font-semibold">Post</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView className="flex-1">
          {/* User Info */}
          <TouchableOpacity
            onPress={handleUsernamePress}
            className="flex-row items-center px-4 py-3"
            activeOpacity={0.7}
          >
            {post.soleUserInfo.profilePic ? (
              <Image
                source={{ uri: post.soleUserInfo.profilePic }}
                className="w-10 h-10 rounded-full mr-3"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-gray-700 mr-3" />
            )}
            <View>
              <Text className="text-white font-semibold">
                {post.soleUserInfo.username}
              </Text>
              <Text className="text-gray-400 text-xs">
                {formatTimeAgo(post.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Image Carousel */}
          <ImageCarousel media={post.media} />

          {/* Actions */}
          <View className="px-4 py-3">
            <View className="flex-row items-center mb-3">
              <LikeButton
                isLiked={post.isLikedByUser}
                likeCount={post.likeCount}
                onPress={() => onLike(post.id)}
              />

              <TouchableOpacity
                onPress={() => onOpenComments(post.id)}
                className="flex-row items-center gap-2 ml-4"
                activeOpacity={0.7}
              >
                <MessageCircle size={24} color="#ffffff" strokeWidth={2} />
                <Text className="text-white font-semibold text-sm">
                  {post.commentCount > 0 ? post.commentCount : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Caption */}
            {post.content && (
              <View className="mb-3">
                <Text className="text-white font-semibold mb-1">
                  {post.soleUserInfo.username}
                </Text>
                {renderCaption()}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

