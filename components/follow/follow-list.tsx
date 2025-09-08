'use client';

import { useSoleUserContext } from '@/context/SoleUserContext';

import { useQuery } from '@tanstack/react-query';

import { getFollowingListByUsername } from '~/api/follow_api';

import { FollowButton } from './follow-button';
import { getFollowerListByUsername } from '~/api/follow_api';
import { Skeleton } from '../ui/skeleton';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';

export default function FollowList({
  username,
  isLoading,
  type,
}: {
  username: string;
  isLoading: boolean;
  type: string;
}) {
  const router = useRouter();
  const { soleUser, soleUserId } = useSoleUserContext();

  console.log('username', username);
  const { data: followersData } = useQuery({
    queryKey: ['FollowerList', username],
    queryFn: async () => {
      const result = await getFollowerListByUsername(username);
      return result;
    },
    enabled: !!username,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const { data: followingData } = useQuery({
    queryKey: ['FollowingList', username],
    queryFn: async () => {
      const result = await getFollowingListByUsername(username);
      return result;
    },
    enabled: !!username,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  console.log('followingData', followingData);
  console.log('followersData', followersData);
  console.log('soleUser', soleUser);
  console.log('soleUserId', soleUserId);

  const handlePress = () => {
    const pageType = type === 'follower' ? 'followers' : 'following';
    router.push(`/user/${username}/${pageType}`);
  };

  return (
    <TouchableOpacity className="flex flex-col items-center" onPress={handlePress}>
      <Skeleton className=" rounded-lg" isLoaded={!isLoading}>
        <Text className="text-sm">
          {type == 'follower' ? followersData?.length || 0 : followingData?.length || 0}
        </Text>
      </Skeleton>
      <Skeleton className=" rounded-lg" isLoaded={!isLoading}>
        <Text className="text-sm">{type == 'follower' ? 'Follower' : 'Following'}</Text>
      </Skeleton>
    </TouchableOpacity>
  );
}
