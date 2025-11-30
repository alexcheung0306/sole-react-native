 import { router } from 'expo-router';
import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';

export default function UserPosts({
  userIsLoading,
  posts,
  userHasNextPage,
  userIsFetchingNextPage,
  userFetchNextPage,
}: {
  userIsLoading: boolean;
  posts: any[];
  userHasNextPage: boolean;
  userIsFetchingNextPage: boolean;
  userFetchNextPage: () => void;
}) {
  const { width } = Dimensions.get('window');
  const IMAGE_SIZE = width / 3;

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
              
              return (
                <TouchableOpacity
                  key={item.id}
                  className="aspect-square bg-gray-800"
                  style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
                  onPress={() => router.push(`/(protected)/post/${item.id}` as any)}>
                  {firstMedia ? (
                    <Image
                      source={{ uri: firstMedia.mediaUrl }}
                      className="h-full w-full"
                    //   contentFit="cover"
                    />
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
