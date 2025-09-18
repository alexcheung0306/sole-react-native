import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getFollowerListByUsername } from '~/api/follow_api';
import { FollowButton } from '~/components/follow/follow-button';
import { useSoleUserContext } from '~/context/SoleUserContext';
 

export default function FollowersPage() {
  const { username } = useLocalSearchParams();
  const { soleUser, soleUserId } = useSoleUserContext();

  const { data: followersData, isLoading } = useQuery({
    queryKey: ['FollowerList', username],
    queryFn: async () => {
      const result = await getFollowerListByUsername(username as string);
      return result;
    },
    enabled: !!username,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  return (
    <View className="flex-1 bg-black">
      <ScrollView className="flex-1">
        {isLoading ? (
          <View className="p-4">
            <Text className="text-gray-400 text-center">Loading...</Text>
          </View>
        ) : followersData?.length > 0 ? (
          <View className="p-4">
            {followersData.map((follower: any) => {
              const isUser = follower?.username === soleUser?.username;
              return (
                <View
                  key={follower.followRecord.id}
                  className="flex-row items-center justify-between p-4 border-b border-gray-800 bg-gray-900/30 rounded-lg mx-2 mb-2">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-gray-300 rounded-full mr-3" />
                    <View className="flex-1">
                      <Text className="text-lg font-medium text-white">@{follower?.username}</Text>
                      {follower?.name && (
                        <Text className="text-gray-400">{follower.name}</Text>
                      )}
                    </View>
                  </View>
                  {!isUser && (
                    <FollowButton
                      soleUserId={soleUserId as string}
                      size="sm"
                      username={follower?.username}
                      isUser={isUser}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View className="p-8">
            <Text className="text-gray-400 text-center text-lg">
              No followers yet
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
