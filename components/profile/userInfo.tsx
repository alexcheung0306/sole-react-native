'use client';

import React from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import FollowList from '../follow/follow-list';
import { useUser } from '@clerk/clerk-expo';
import { User } from 'lucide-react-native';
import { UserInfoForm } from '../form-components/userInfo-form/UserInfo-form';

export const UserInfo = React.memo(function UserInfo({
  userPostsData,
  username,
  userProfileData,
}: {
  userPostsData: any;
  username: string;
  userProfileData: any;
}) {
  const { user } = useUser();
  const userInfo = userProfileData?.userInfo;
  const soleUser = userProfileData?.soleUser;
  
  const profilePic = userInfo?.profilePic || user?.imageUrl;
  const totalPosts = userPostsData?.pages[0]?.total ?? 0;
  const profileLoading = userPostsData?.isLoading;
  const profileBio = userInfo?.bio || 'No bio available';
  const filteredCategoryChips =
    userInfo?.category?.split(',').filter((item: string) => item !== '') || [];
  const isOwnProfile = user?.username === username;

  // Only log in development mode
  if (__DEV__) {
    React.useEffect(() => {
      console.log('UserInfo - soleUser:', soleUser);
      console.log('UserInfo - userInfo:', userInfo);
    }, [soleUser, userInfo]);
  }

  return (
    <View className="px-4 py-4">
      {/* User Info Row */}
      <View className="mb-4 flex-row items-center">
        {/* Avatar */}
        <View className="mr-4">
          {profilePic ? (
            <Image
              source={{ uri: profilePic }}
              className="h-20 w-20 rounded-full border-2 border-gray-600"
            />
          ) : (
            <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-gray-600 bg-gray-700">
              <User size={32} color="#9ca3af" />
            </View>
          )}
        </View>

        {/* Stats */}
        <View className="flex-1 flex-row justify-around">
          <View className="items-center">
            <Text className="text-lg font-bold text-white">{totalPosts}</Text>
            <Text className="text-sm text-gray-400">Posts</Text>
          </View>
          <FollowList username={username || ''} isLoading={profileLoading} type="follower" />
          <FollowList username={username || ''} isLoading={profileLoading} type="following" />
        </View>
      </View>

      {/* Name and Bio */}
      <View className="mb-4">
        <Text className="mb-1 text-sm font-semibold text-white">
          {userInfo?.name || user?.firstName || 'Unknown User'}
        </Text>
        <Text className="mb-2 text-sm text-white">{profileBio}</Text>

        {/* Category Chips */}
        {filteredCategoryChips?.length > 0 && (
          <View className="mb-3 flex-row flex-wrap">
            {filteredCategoryChips.map((category: string, index: number) => (
              <View key={index} className="mb-1 mr-2 rounded-full bg-gray-700 px-3 py-1">
                <Text className="text-xs text-white">{category.trim()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        {isOwnProfile ? (
          <UserInfoForm userProfileData={userProfileData} />
        ) : (
          <View className="flex-row gap-2">
            <TouchableOpacity className="flex-1 rounded-lg bg-gray-700 px-4 py-2">
              <Text className="text-center font-semibold text-white">Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 rounded-lg bg-gray-700 px-4 py-2">
              <Text className="text-center font-semibold text-white">Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.username === nextProps.username &&
    prevProps.userPostsData === nextProps.userPostsData &&
    prevProps.userProfileData === nextProps.userProfileData
  );
});
