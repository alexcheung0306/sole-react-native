import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { X, Search, User as UserIcon, UserCheck, UserMinus, UserPlus } from 'lucide-react-native';
import { getFollowerListByUsername, getSingleFollowRecordByFollowerAndFollowingId, createFollowRecord, updateFollowRecord, FollowRecord, getFollowingListByUsername } from '~/api/apiservice/follow_api';
import { useUser } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSoleUserContext } from '~/context/SoleUserContext';
 
interface FollowerUser {
  id: string;
  username: string;
  name: string;
  profilePic?: string;
  bio?: string;
  soleUserId: string;
}

export default function FollowersScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { user } = useUser();
  const { soleUserId } = useSoleUserContext();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [followedBackUsers, setFollowedBackUsers] = useState<Set<string>>(new Set());
  const [removedFollowers, setRemovedFollowers] = useState<Set<string>>(new Set());
  const isOwnProfile = user?.username === username;

  // Fetch followers list
  const {
    data: followersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['FollowerList', username],
    queryFn: async () => {
      const result = await getFollowerListByUsername(username || '');
      return result as FollowerUser[];
    },
    enabled: !!username,
  });

  // Fetch following list to check mutual follows
  const { data: myFollowingData } = useQuery({
    queryKey: ['FollowingList', user?.username],
    queryFn: async () => {
      const result = await getFollowingListByUsername(user?.username || '');
      return result as FollowerUser[];
    },
    enabled: !!user?.username && isOwnProfile,
  });

  // Filter followers based on search
  const filteredFollowers = followersData?.filter((follower) =>
    follower.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    follower.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Check if user is mutually following
  const isMutualFollow = (followerUsername: string) => {
    return myFollowingData?.some((f) => f.username === followerUsername);
  };

  // Remove follower mutation (unfollow them on their behalf)
  const removeFollowerMutation = useMutation({
    mutationFn: async (follower: FollowerUser) => {
      console.log('Removing follower:', follower.username);
      console.log('Follower soleUserId:', follower.soleUserId);
      console.log('My username:', username);
      
      // Get the follow record where follower is following me
      const followRecord = await getSingleFollowRecordByFollowerAndFollowingId(
        follower.soleUserId,
        username || ''
      );
      
      console.log('Follow record found:', followRecord);
      
      if (followRecord?.followRecord?.id) {
        console.log('Updating follow record to removed');
        return await updateFollowRecord(followRecord.followRecord.id, {
          status: 'unfollowed',
          collaborated: false,
          exclusiveContent: false,
          lastUpdate: null,
        });
      }
      throw new Error('Follow record not found');
    },
    onSuccess: (data, follower) => {
      setRemovedFollowers((prev) => new Set(prev).add(follower.username));
      queryClient.invalidateQueries({ queryKey: ['FollowerList', username] });
      Alert.alert('Success', 'Follower removed');
    },
    onError: (error) => {
      console.error('Error removing follower:', error);
      Alert.alert('Error', 'Failed to remove follower. Check console for details.');
    },
  });

  // Follow back mutation
  const followBackMutation = useMutation({
    mutationFn: async (targetUser: FollowerUser) => {
      console.log('Following back user:', targetUser.username);
      console.log('My soleUserId:', soleUserId);
      console.log('Target username:', targetUser.username);
      
      const followRecord = await getSingleFollowRecordByFollowerAndFollowingId(
        soleUserId || '',
        targetUser.username
      );

      console.log('Follow back record:', followRecord);

      const formData: FollowRecord = {
        status: 'following',
        collaborated: false,
        exclusiveContent: false,
        lastUpdate: null,
      };

      if (!followRecord?.followRecord) {
        console.log('Creating new follow record');
        return await createFollowRecord(soleUserId || '', targetUser.username, formData);
      } else {
        console.log('Updating existing follow record');
        return await updateFollowRecord(followRecord.followRecord.id, formData);
      }
    },
    onSuccess: (data, targetUser) => {
      console.log('Follow back successful');
      setFollowedBackUsers((prev) => new Set(prev).add(targetUser.username));
      queryClient.invalidateQueries({ queryKey: ['FollowingList', username] });
      queryClient.invalidateQueries({ queryKey: ['FollowerList', username] });
    },
    onError: (error) => {
      console.error('Error following user:', error);
      Alert.alert('Error', 'Failed to follow user. Check console for details.');
    },
  });

  const handleRemoveFollower = (follower: FollowerUser) => {
    console.log('Handle remove follower clicked:', follower);
    Alert.alert(
      'Remove Follower',
      `Remove ${follower.username} from your followers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            console.log('Confirmed removal');
            removeFollowerMutation.mutate(follower);
          },
        },
      ]
    );
  };

  const handleFollowBack = (follower: FollowerUser) => {
    console.log('Handle follow back clicked:', follower);
    followBackMutation.mutate(follower);
  };

  const handleUserPress = (followerUsername: string) => {
    router.push(`/(protected)/(user)/user/${followerUsername}` as any);
  };

  const renderFollower = ({ item }: { item: FollowerUser }) => {
    const isMutual = isMutualFollow(item.username) || followedBackUsers.has(item.username);
    const isRemoved = removedFollowers.has(item.username);

    // Don't show removed followers
    if (isRemoved) {
      return null;
    }

    return (
      <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
        {/* Profile Picture and User Info - Clickable to navigate */}
        <TouchableOpacity
          onPress={() => handleUserPress(item.username)}
          className="flex-row items-center flex-1 mr-3"
          activeOpacity={0.7}
        >
          <View className="mr-3">
            {item.profilePic ? (
              <ExpoImage
                source={{ uri: item.profilePic }}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <View className="w-12 h-12 rounded-full bg-gray-700 items-center justify-center">
                <UserIcon size={24} color="#9ca3af" />
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className="text-white font-semibold">{item.username}</Text>
            {item.name && (
              <Text className="text-gray-400 text-sm">{item.name}</Text>
            )}
            {isMutual && (
              <Text className="text-gray-500 text-xs mt-0.5">Follows you</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Actions - Separate from user press area */}
        {isOwnProfile && (
          <View className="flex-row gap-2">
            {!isMutual && (
              <TouchableOpacity
                onPress={(e) => {
                  console.log('Follow button pressed');
                  handleFollowBack(item);
                }}
                disabled={followBackMutation.isPending}
                className={`bg-blue-500 rounded-lg px-3 py-1.5 ${
                  followBackMutation.isPending ? 'opacity-50' : ''
                }`}
                activeOpacity={0.7}
              >
                {followBackMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white text-xs font-semibold">Follow</Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={(e) => {
                console.log('Remove button pressed');
                handleRemoveFollower(item);
              }}
              disabled={removeFollowerMutation.isPending}
              className={`bg-gray-700 rounded-lg px-3 py-1.5 ${
                removeFollowerMutation.isPending ? 'opacity-50' : ''
              }`}
              activeOpacity={0.7}
            >
              {removeFollowerMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white text-xs font-semibold">Remove</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
      <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white font-semibold text-lg">Followers</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View className="px-4 py-3 border-b border-gray-800">
          <View className="flex-row items-center bg-gray-800 rounded-lg px-3 py-2">
            <Search size={18} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-2 text-white"
              placeholder="Search followers..."
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Followers List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-400 mt-2">Loading followers...</Text>
          </View>
        ) : filteredFollowers.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <UserIcon size={64} color="#4b5563" />
            <Text className="text-gray-400 text-lg mt-4">
              {searchQuery ? 'No followers found' : 'No followers yet'}
            </Text>
            {!searchQuery && (
              <Text className="text-gray-500 text-sm mt-2 text-center">
                When people follow {isOwnProfile ? 'you' : username}, they'll appear here
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredFollowers}
            renderItem={renderFollower}
            keyExtractor={(item) => item.soleUserId || item.username}
            showsVerticalScrollIndicator={false}
          />
        )}
    </View>
    </>
  );
}
