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
import { X, Search, User as UserIcon } from 'lucide-react-native';
import { 
  getFollowingListByUsername, 
  getFollowerListByUsername,
  getSingleFollowRecordByFollowerAndFollowingId, 
  updateFollowRecord,
  createFollowRecord,
  FollowRecord
} from '~/api/apiservice/follow_api';
import { useUser } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSoleUserContext } from '~/context/SoleUserContext';

interface FollowingUser {
  id: string;
  username: string;
  name: string;
  profilePic?: string;
  bio?: string;
  soleUserId: string;
}

export default function FollowingScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { user } = useUser();
  const { soleUserId } = useSoleUserContext();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [unfollowedUsers, setUnfollowedUsers] = useState<Set<string>>(new Set());
  const isOwnProfile = user?.username === username;

  // Fetch following list
  const {
    data: followingData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['FollowingList', username],
    queryFn: async () => {
      const result = await getFollowingListByUsername(username || '');
      return result as FollowingUser[];
    },
    enabled: !!username,
  });

  // Fetch followers list to check mutual follows
  const { data: myFollowersData } = useQuery({
    queryKey: ['FollowerList', user?.username],
    queryFn: async () => {
      const result = await getFollowerListByUsername(user?.username || '');
      return result as FollowingUser[];
    },
    enabled: !!user?.username && isOwnProfile,
  });

  // Filter following based on search
  const filteredFollowing = followingData?.filter((following) =>
    following.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    following.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Check if user follows you back (mutual)
  const isFollowingBack = (followingUsername: string) => {
    return myFollowersData?.some((f) => f.username === followingUsername);
  };

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async (targetUsername: string) => {
      console.log('Unfollowing user:', targetUsername);
      console.log('My soleUserId:', soleUserId);
      
      const followRecord = await getSingleFollowRecordByFollowerAndFollowingId(
        soleUserId || '',
        targetUsername
      );
      
      console.log('Follow record found:', followRecord);
      
      if (followRecord?.followRecord?.id) {
        console.log('Updating follow record to unfollowed');
        return await updateFollowRecord(followRecord.followRecord.id, {
          status: 'unfollowed',
          collaborated: false,
          exclusiveContent: false,
          lastUpdate: null,
        });
      }
      throw new Error('Follow record not found');
    },
    onSuccess: (data, targetUsername) => {
      console.log('Unfollow successful');
      setUnfollowedUsers((prev) => new Set(prev).add(targetUsername));
      queryClient.invalidateQueries({ queryKey: ['FollowingList', username] });
      queryClient.invalidateQueries({ queryKey: ['FollowerList', username] });
      // Invalidate the follow status query so the FollowButton on the target user's profile updates
      queryClient.invalidateQueries({ queryKey: ['singleFollowData', targetUsername] });
      // Also invalidate the target user's follower list (they lost a follower)
      queryClient.invalidateQueries({ queryKey: ['FollowerList', targetUsername] });
    },
    onError: (error) => {
      console.error('Error unfollowing user:', error);
      Alert.alert('Error', 'Failed to unfollow user. Check console for details.');
    },
  });

  // Follow back mutation (for re-following after unfollow)
  const followBackMutation = useMutation({
    mutationFn: async (targetUser: FollowingUser) => {
      console.log('Following user:', targetUser.username);
      console.log('My soleUserId:', soleUserId);
      
      const followRecord = await getSingleFollowRecordByFollowerAndFollowingId(
        soleUserId || '',
        targetUser.username
      );

      console.log('Follow record:', followRecord);

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
      console.log('Follow successful');
      setUnfollowedUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(targetUser.username);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['FollowingList', username] });
      queryClient.invalidateQueries({ queryKey: ['FollowerList', username] });
      // Invalidate the follow status query so the FollowButton on the target user's profile updates
      queryClient.invalidateQueries({ queryKey: ['singleFollowData', targetUser.username] });
      // Also invalidate the target user's follower list (they gained a follower)
      queryClient.invalidateQueries({ queryKey: ['FollowerList', targetUser.username] });
    },
    onError: (error) => {
      console.error('Error following user:', error);
      Alert.alert('Error', 'Failed to follow user. Check console for details.');
    },
  });

  const handleUnfollow = (following: FollowingUser) => {
    console.log('Handle unfollow clicked:', following);
    Alert.alert(
      'Unfollow',
      `Unfollow ${following.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: () => {
            console.log('Confirmed unfollow');
            unfollowMutation.mutate(following.username);
          },
        },
      ]
    );
  };

  const handleUserPress = (followingUsername: string) => {
    router.push(`/profile/${followingUsername}` as any);
  };

  const renderFollowing = ({ item }: { item: FollowingUser }) => {
    const followsBack = isFollowingBack(item.username);
    const isUnfollowed = unfollowedUsers.has(item.username);

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
            {followsBack && (
              <Text className="text-gray-500 text-xs mt-0.5">Follows you back</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Follow/Unfollow Button - Separate from user press area */}
        {isOwnProfile && (
          <TouchableOpacity
            onPress={(e) => {
              if (isUnfollowed) {
                console.log('Follow button pressed (re-follow)');
                followBackMutation.mutate(item);
              } else {
                console.log('Unfollow button pressed');
                handleUnfollow(item);
              }
            }}
            disabled={unfollowMutation.isPending || followBackMutation.isPending}
            className={`rounded-lg px-4 py-2 ${
              isUnfollowed ? 'bg-blue-500' : 'bg-gray-700'
            } ${
              (unfollowMutation.isPending || followBackMutation.isPending) ? 'opacity-50' : ''
            }`}
            activeOpacity={0.7}
          >
            {(unfollowMutation.isPending || followBackMutation.isPending) ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white text-sm font-semibold">
                {isUnfollowed ? 'Follow' : 'Following'}
              </Text>
            )}
          </TouchableOpacity>
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
          <Text className="text-white font-semibold text-lg">Following</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View className="px-4 py-3 border-b border-gray-800">
          <View className="flex-row items-center bg-gray-800 rounded-lg px-3 py-2">
            <Search size={18} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-2 text-white"
              placeholder="Search following..."
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Following List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-400 mt-2">Loading following...</Text>
          </View>
        ) : filteredFollowing.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <UserIcon size={64} color="#4b5563" />
            <Text className="text-gray-400 text-lg mt-4">
              {searchQuery ? 'No users found' : 'Not following anyone yet'}
            </Text>
            {!searchQuery && (
              <Text className="text-gray-500 text-sm mt-2 text-center">
                When {isOwnProfile ? 'you' : username} follows people, they'll appear here
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredFollowing}
            renderItem={renderFollowing}
            keyExtractor={(item) => item.soleUserId || item.username}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}
