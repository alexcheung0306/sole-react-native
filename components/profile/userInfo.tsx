'use client';

import { useRouter } from 'expo-router';
import { View, Text } from 'react-native';

import FollowList from '../follow/follow-list';
import { FollowButton } from '../follow/follow-button';
import { useUser } from '@clerk/clerk-expo';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { UserAvatar } from './user-avatar';

export function UserInfo({
  username,
  isUser,
  userInfo,
  isLoading,
}: {
  username: string;
  isUser: boolean;
  userInfo: any;
  isLoading: boolean;
}) {
  const { soleUserId } = useSoleUserContext();
  const { user } = useUser();
  const router = useRouter();
  const DisplayTextWithBreaks = ({ text }: { text: string }) => {
    return (
      <Text>
        {text.split('\n').map((line, index) => (
          <Text key={index}>
            {line}
            {index < text.split('\n').length - 1 && '\n'}
          </Text>
        ))}
      </Text>
    );
  };
  const categoryValue = typeof userInfo?.category === 'string' ? userInfo.category.split(',') : [];

  const filteredCategoryCHip = categoryValue.filter((item: any) => item !== '');

  return (
    <View className="w-full">
      <Card className="mx-auto rounded-lg  transition-shadow duration-200 hover:shadow-xl ">
        <View className="grid grid-cols-4 gap-2">
          <View className="col-span-4 flex flex-col justify-between ">
            <View className="grid grid-cols-3 items-center gap-2">
              {/* user */}
              <View>
                <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                  <UserAvatar userInfo={userInfo} username={username} />
                </Skeleton>
              </View>

              {/* Followers and Following */}
              <View className="col-span-3 ml-4 flex flex-row justify-center gap-5 text-sm">
                <View className="flex flex-col items-center">
                  <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                    <Text className="text-sm">100</Text>
                  </Skeleton>
                  <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                    <Text className="text-sm">Posts</Text>
                  </Skeleton>
                </View>

                <FollowList username={username} isLoading={isLoading} type="follower" />

                <FollowList username={username} isLoading={isLoading} type="following" />
              </View>
            </View>
          </View>

          {/* Chips */}
          <View className="col-span-4 text-sm text-gray-600">
            <Skeleton className="rounded-lg" isLoaded={!isLoading}>
              {filteredCategoryCHip && filteredCategoryCHip != '' ? (
                <View>
                  {filteredCategoryCHip &&
                    filteredCategoryCHip.map((category: any, index: any) => (
                      <Badge variant="bordered" key={index} className="mb-2 mr-2">
                        {category}
                      </Badge>
                    ))}
                </View>
              ) : null}
            </Skeleton>
          </View>

          {/* Bio */}
          <View className="col-span-4 text-sm text-gray-600">
            <Skeleton className="rounded-lg" isLoaded={!isLoading}>
              {userInfo?.bio && <DisplayTextWithBreaks text={userInfo?.bio || ''} />}
            </Skeleton>
          </View>

          {/* Button */}
          <View className="col-span-4 flex items-center justify-center">
            <Skeleton className="rounded-lg" isLoaded={!isLoading}>
              {isUser && userInfo && filteredCategoryCHip ? (
                <>User Info Form</>
              ) : (
                userInfo &&
                filteredCategoryCHip && (
                  <View className="flex flex-row flex-wrap w-full gap-2">
                    <FollowButton
                      size="md"
                      username={username}
                      isUser={isUser}
                      soleUserId={soleUserId as string}
                    />
                    <Button
                      onPress={() => router.push(`/chatroom/${username}` as any)}
                      style={{ width: '100%' }}>
                      Message
                    </Button>
                  </View>
                )
              )}
            </Skeleton>
          </View>
        </View>
      </Card>
    </View>
  );
}
