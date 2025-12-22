import { View, ActivityIndicator, Text, TouchableOpacity, Dimensions, Image, StyleSheet } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { Layers, Video } from 'lucide-react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';

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

  // Track video thumbnails
  const [videoThumbnails, setVideoThumbnails] = useState<{ [key: string]: string }>({});
  const [thumbnailLoading, setThumbnailLoading] = useState<Set<string>>(new Set());

  // Generate thumbnails for videos when posts change
  useEffect(() => {
    posts.forEach((post, index) => {
      if (post.media && post.media.length > 0) {
        const firstMedia = post.media[0];
        if (firstMedia && firstMedia.mediaUrl && isVideo(firstMedia.mediaUrl, firstMedia.mediaType)) {
          generateVideoThumbnail(firstMedia.mediaUrl, post.id || `post_${index}`);
        }
      }
    });
  }, [posts]);

  // Helper to check if media is a video
  const isVideo = (mediaUrl: string, mediaType?: string): boolean => {
    if (mediaType) {
      return mediaType === 'video' || mediaType.startsWith('video/');
    }
    // Fallback: check file extension
    const url = mediaUrl.toLowerCase();
    return url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.avi') ||
           url.endsWith('.webm') || url.endsWith('.m4v') || url.endsWith('.mpeg') ||
           url.includes('/video/');
  };

  // Generate thumbnail for video
  const generateVideoThumbnail = async (videoUri: string, postId: string) => {
    const cacheKey = `${postId}_${videoUri}`;
    if (videoThumbnails[cacheKey] || thumbnailLoading.has(cacheKey)) {
      return; // Already have thumbnail or generating
    }

    setThumbnailLoading(prev => new Set(prev).add(cacheKey));

    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000, // Get thumbnail at 1 second
        quality: 0.5, // Medium quality for grid view
      });

      setVideoThumbnails(prev => ({
        ...prev,
        [cacheKey]: uri,
      }));
    } catch (error) {
      console.warn('[UserPosts] Failed to generate thumbnail for:', videoUri, error);
    } finally {
      setThumbnailLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(cacheKey);
        return newSet;
      });
    }
  };

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
                      {isVideo(firstMedia.mediaUrl, firstMedia.mediaType) ? (
                        // Show video thumbnail or loading state
                        (() => {
                          const cacheKey = `${posts[index]?.id || `post_${index}`}_${firstMedia.mediaUrl}`;
                          const thumbnailUri = videoThumbnails[cacheKey];
                          const isLoading = thumbnailLoading.has(cacheKey);

                          return (
                            <>
                              {thumbnailUri ? (
                                <Image
                                  source={{ uri: thumbnailUri }}
                                  className="h-full w-full"
                                  style={{ resizeMode: 'cover' }}
                                />
                              ) : (
                                <View className="h-full w-full items-center justify-center bg-gray-800">
                                  {isLoading ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                  ) : (
                                    <Video size={24} color="#ffffff" />
                                  )}
                                </View>
                              )}
                            </>
                          );
                        })()
                      ) : (
                        // Regular image
                        <Image
                          source={{ uri: firstMedia.mediaUrl }}
                          className="h-full w-full"
                          style={{ resizeMode: 'cover' }}
                        />
                      )}
                      {hasMultipleMedia && (
                        <View style={styles.stackIconContainer}>
                          <Layers size={16} color="#f5f5f5" fill="#ffffff" strokeWidth={2} style={{ opacity: 0.9 }} />
                        </View>
                      )}
                      {/* Video indicator */}
                      {isVideo(firstMedia.mediaUrl, firstMedia.mediaType) && (
                        <View style={styles.videoIconContainer}>
                          <Video size={12} color="#ffffff" fill="#000000" style={{ opacity: 0.8 }} />
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
  videoIconContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 2,
  },
});
