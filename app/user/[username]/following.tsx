import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getFollowingListByUsername } from '../../../api/follow_api';
import { useSoleUserContext } from '../../../context/SoleUserContext';
import { FollowButton } from '../../../components/follow/follow-button';

export default function FollowingPage() {
  const { username } = useLocalSearchParams();
  const { soleUser, soleUserId } = useSoleUserContext();

  const { data: followingData, isLoading } = useQuery({
    queryKey: ['FollowingList', username],
    queryFn: async () => {
      const result = await getFollowingListByUsername(username as string);
      return result;
    },
    enabled: !!username,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {isLoading ? (
          <View className="p-4">
            <Text className="text-gray-500 text-center">Loading...</Text>
          </View>
        ) : followingData?.length > 0 ? (
          <View className="p-4">
            {followingData.map((following: any) => {
              const isUser = following?.username === soleUser?.username;
              return (
                <View
                  key={following.followRecord.id}
                  className="flex-row items-center justify-between p-4 border-b border-gray-100">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-gray-300 rounded-full mr-3" />
                    <View className="flex-1">
                      <Text className="text-lg font-medium">@{following?.username}</Text>
                      {following?.name && (
                        <Text className="text-gray-500">{following.name}</Text>
                      )}
                    </View>
                  </View>
                  {!isUser && (
                    <FollowButton
                      soleUserId={soleUserId as string}
                      size="sm"
                      username={following?.username}
                      isUser={isUser}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View className="p-8">
            <Text className="text-gray-500 text-center text-lg">
              Not following anyone yet
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
