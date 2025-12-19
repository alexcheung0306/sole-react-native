import { View, ActivityIndicator, Text, TouchableOpacity, Dimensions, Image, StyleSheet } from 'react-native';
import { useRef } from 'react';
import { Layers } from 'lucide-react-native';

export default function UserPosts({
  userIsLoading,
  userIsError,
  userError,
  posts,
  userHasNextPage,
  userIsFetchingNextPage,
  userFetchNextPage,
  onRefresh,
  isRefreshing,
  onPostPress,
  gridOffsetY = 0,
}: {
  userIsLoading: boolean;
  userIsError?: boolean;
  userError?: Error | null;
  posts: any[];
  userHasNextPage: boolean;
  userIsFetchingNextPage: boolean;
  userFetchNextPage: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onPostPress?: (index: number, layout?: { x: number; y: number; width: number; height: number }) => void;
  gridOffsetY?: number;
}) {
  const { width } = Dimensions.get('window');
  const IMAGE_SIZE = width / 3;

  // Error state
  if (userIsError) {
    return (
      <View className="flex-1 items-center justify-center px-4 py-10">
        <Text className="mb-4 text-center text-red-400">Failed to load posts</Text>
        <Text className="mb-4 text-center text-sm text-gray-400">
          {userError?.message || 'Please try again'}
        </Text>
        {onRefresh && (
          <TouchableOpacity
            onPress={onRefresh}
            className="rounded-lg bg-blue-500 px-6 py-3"
            disabled={isRefreshing}>
            <Text className="font-semibold text-white">
              {isRefreshing ? 'Refreshing...' : 'Retry'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1">
      {userIsLoading ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-2 text-gray-400">Loading posts...</Text>
        </View>
      ) : posts.length > 0 ? (
        <View>
          <View className="flex-row flex-wrap">
            {posts.map((item, index) => {
              const firstMedia = item.media && item.media.length > 0 ? item.media[0] : null;
              const hasMultipleMedia = item.media && item.media.length > 1;
              const col = index % 3;
              const row = Math.floor(index / 3);
              
              return (
                  <TouchableOpacity
                    key={item.id}
                    className="aspect-square bg-gray-800"
                    style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
                    onPress={() => {
                      // Pass grid-relative position - the parent will need to account for scroll
                      const layout = {
                        x: col * IMAGE_SIZE,
                        y: row * IMAGE_SIZE,
                        width: IMAGE_SIZE,
                        height: IMAGE_SIZE,
                        col,
                        row,
                      };
                      console.log('UserPosts: Tapped index:', index, 'layout:', layout);
                      onPostPress?.(index, layout as any);
                    }}
                    activeOpacity={0.9}>
                  {firstMedia && firstMedia.mediaUrl ? (
                    <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <Image
                        source={{ uri: firstMedia.mediaUrl }}
                        className="h-full w-full"
                        style={{ resizeMode: 'cover' }}
                      />
                      {hasMultipleMedia && (
                        <View style={styles.stackIconContainer}>
                          <Layers size={16} color="#9caf3af" fill="#ffffff" strokeWidth={2} style={{ opacity: 0.9 }} />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View className="h-full w-full items-center justify-center bg-gray-700">
                      <Text className="text-xs text-gray-400">No Image</Text>
                    </View>
                  )}
                  </TouchableOpacity>
              );
            })}
          </View>

          {/* Load More Button */}
          {userHasNextPage && (
            <TouchableOpacity
              className="items-center py-4"
              onPress={userFetchNextPage}
              disabled={userIsFetchingNextPage}>
              {userIsFetchingNextPage ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Text className="text-blue-500">Load More</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center py-10">
          <Text className="text-lg text-gray-400">No posts yet</Text>
          <Text className="mt-2 text-sm text-gray-500">Start sharing your work!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stackIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
