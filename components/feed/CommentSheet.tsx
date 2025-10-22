import { View, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { X, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Comment } from '~/types/post';
import BottomSheet from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getPostComments } from '~/api/apiservice/post_api';

interface CommentSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  postId: string;
  comments?: Comment[]; // Make optional since we'll fetch from API
  onAddComment: (content: string) => void;
}

export function CommentSheet({ bottomSheetRef, postId, comments: providedComments, onAddComment }: CommentSheetProps) {
  const [commentText, setCommentText] = useState('');
  const insets = useSafeAreaInsets();

  // Fetch comments from API
  const {
    data: apiComments,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['postComments', postId],
    queryFn: () => getPostComments(parseInt(postId)),
    enabled: !!postId,
  });

  // Use provided comments or fetched comments
  const comments = providedComments || apiComments || [];

  const handleSendComment = async () => {
    if (commentText.trim()) {
      onAddComment(commentText.trim());
      setCommentText('');
      // Refetch comments after adding
      setTimeout(() => refetchComments(), 500);
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

  const renderComment = ({ item }: { item: Comment }) => (
    <View className="flex-row p-4 border-b border-gray-700/30">
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
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['75%', '90%']}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: '#1f2937' }}
      handleIndicatorStyle={{ backgroundColor: '#6b7280' }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-700/50">
          <Text className="text-white font-bold text-lg">Comments</Text>
          <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Comments List */}
        {commentsLoading ? (
          <View className="flex-1 items-center justify-center py-10">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-400 mt-2">Loading comments...</Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 16 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Text className="text-gray-400">No comments yet</Text>
                <Text className="text-gray-500 text-sm mt-2">Be the first to comment!</Text>
              </View>
            }
          />
        )}

        {/* Comment Input */}
        <View 
          className="flex-row items-center px-4 py-3 border-t border-gray-700/50 bg-gray-800/50"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-gray-700/50 text-white px-4 py-3 rounded-full mr-2"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSendComment}
            disabled={!commentText.trim()}
            className={`p-3 rounded-full ${commentText.trim() ? 'bg-blue-500' : 'bg-gray-700'}`}
          >
            <Send size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

