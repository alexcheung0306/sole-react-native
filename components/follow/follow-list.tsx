import React from 'react';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { useQuery } from '@tanstack/react-query';
import { getFollowingListByUsername, getFollowerListByUsername } from '~/api/apiservice/follow_api';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

const FollowList = React.memo(function FollowList({
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

  // Only log in development mode
  React.useEffect(() => {
    if (__DEV__) {
      console.log('username', username);
    }
  }, [username]);
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

  const handlePress = () => {
    if (__DEV__) {
      console.log('FollowList handlePress called');
      console.log('Type:', type);
      console.log('Username:', username);
    }
    const pageType = type === 'follower' ? 'followers' : 'following';
    const route = `/profile/${username}/${pageType}`;
    if (__DEV__) {
      console.log('Navigating to:', route);
    }
    router.push(route as any);
  };

  const count = type === 'follower' ? (followersData?.length || 0) : (followingData?.length || 0);
  const label = type === 'follower' ? 'Followers' : 'Following';

  return (
    <TouchableOpacity 
      className="flex flex-col items-center" 
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#3b82f6" />
      ) : (
        <Text className="text-white text-lg font-bold">{count}</Text>
      )}
      <Text className="text-gray-400 text-sm">{label}</Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.username === nextProps.username &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.type === nextProps.type
  );
});

export default FollowList;
