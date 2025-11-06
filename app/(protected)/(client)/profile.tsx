import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useState, useEffect } from 'react';
import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { ProfileSwitchButton } from '~/components/ProfileSwitchButton';
import { useNavigation } from '~/context/NavigationContext';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfileByUsername } from '~/api/apiservice/soleUser_api';
import { searchPosts } from '~/api/apiservice/post_api';
import { updateUserInfoBySoleUserId } from '~/api/apiservice/userInfo_api';
import { updateSoleUserByClerkId, getSoleUserByClerkId } from '~/api/apiservice';
import { Grid, User, Briefcase, Heart, MessageCircle, MoreVertical, MapPin, FolderKanban, Star } from 'lucide-react-native';
import { ProfileEditModal, ProfileFormValues } from '~/components/profile/ProfileEditModal';
import FollowList from '~/components/follow/follow-list';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3;

type TabKey = 'posts' | 'projects' | 'contracts';

export default function ClientProfileScreen() {
  const [imageSize, setImageSize] = useState(Dimensions.get('window').width / 3);
  const [profileTab, setProfileTab] = useState<TabKey>('posts');
  const [isUser, setIsUser] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { signOut } = useAuth();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const { currentMode } = useNavigation();
  const queryClient = useQueryClient();

  // Fetch user profile data from API
  const {
    data: userProfileData,
    isLoading: profileLoading,
    error: profileError,
    refetch,
  } = useQuery({
    queryKey: ["clientProfile", user?.username],
    queryFn: async () => {
      if (!user?.username) {
        throw new Error("Username not found");
      }
      const result = await getUserProfileByUsername(user.username);
      setIsUser(true);
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!user?.username,
    refetchOnWindowFocus: false,
  });

  // Fetch user posts with infinite scroll
  const {
    data: userPostsData,
    fetchNextPage: userFetchNextPage,
    hasNextPage: userHasNextPage,
    isFetchingNextPage: userIsFetchingNextPage,
    isLoading: userIsLoading,
    isError: userIsError,
    error: userError,
  } = useInfiniteQuery({
    queryKey: ["clientProfilePosts", user?.username],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await searchPosts({
        soleUserId: userProfileData?.userInfo?.soleUserId,
        content: "",
        pageNo: pageParam,
        pageSize: 9, // 3x3 grid
        orderBy: "createdAt",
        orderSeq: "desc",
      });
      return response;
    },
    enabled: !!userProfileData?.userInfo?.soleUserId,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length - 1;
      const loadedItems = allPages.reduce(
        (sum, page) => sum + page.data.length,
        0
      );
      // Check if there are more items to load
      if (loadedItems < lastPage.total) {
        return currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  // Mutation for updating user_info
  const updateUserInfoMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const soleUserId = userProfileData?.userInfo?.soleUserId;
      if (!soleUserId) throw new Error('User ID not found');

      const userInfoValues = {
        ...values,
        profilePic: values.profilePic || userInfo?.profilePic,
        category: values.category.join(','), // Convert array to CSV
        soleUserId,
      };

      return await updateUserInfoBySoleUserId(soleUserId, userInfoValues);
    },
    onSuccess: () => {
      console.log('User Info updated successfully');
    },
    onError: (error) => {
      console.error('Error updating User Info:', error);
      throw error;
    },
  });

  // Mutation for updating sole_user
  const updateSoleUserMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user?.id) throw new Error('Clerk ID not found');

      // Get current data to preserve existing fields
      const currentSoleUser = await getSoleUserByClerkId(user.id);

      const soleUserValues = {
        clerkId: user.id,
        username: values.username,
        email: currentSoleUser?.email || user.primaryEmailAddress?.emailAddress,
        talentLevel: currentSoleUser?.talentLevel,
        clientLevel: currentSoleUser?.clientLevel,
        image: values.profilePic || currentSoleUser?.image,
      };

      return await updateSoleUserByClerkId(user.id, soleUserValues);
    },
    onSuccess: () => {
      console.log('Sole User updated successfully');
    },
    onError: (error) => {
      console.error('Error updating Sole User:', error);
      throw error;
    },
  });

  // Handle profile save
  const handleProfileSave = async (values: ProfileFormValues) => {
    try {
      const usernameChanged = values.username !== user?.username;

      // Execute both mutations in parallel
      await Promise.all([
        updateUserInfoMutation.mutateAsync(values),
        updateSoleUserMutation.mutateAsync(values),
      ]);

      // Update Clerk profile
      if (user) {
        try {
          await user.update({
            username: values.username,
          });

          // Update profile image in Clerk if changed
          if (values.profilePic && values.profilePic !== userInfo?.profilePic) {
            // Note: Clerk profile image update would need proper blob conversion
            // This is a simplified version
          }
        } catch (clerkError) {
          console.error('Clerk update error:', clerkError);
        }
      }

      // Invalidate queries to refresh data (both old and new username)
      queryClient.invalidateQueries({ queryKey: ['clientProfile', user?.username] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.username] });
      queryClient.invalidateQueries({ queryKey: ['clientProfile', values.username] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', values.username] });

      Alert.alert('Success', 'Profile updated successfully');
      
      // If username changed, redirect to new profile URL
      if (usernameChanged) {
        router.replace(`/(protected)/(user)/user/${values.username}` as any);
      } else {
        refetch();
      }
    } catch (error) {
      console.error('Profile save error:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    console.log('handleSignOut called');

    // Simple confirmation first
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) {
      console.log('Sign out cancelled');
      return;
    }

    try {
      console.log('Attempting to sign out...');
      await signOut();
      console.log('Sign out successful');

      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();

      // Navigate to sign-in screen
      router.replace('/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  // Flatten posts from all pages
  const posts = userPostsData?.pages.flatMap((page) => page.data) ?? [];
  const totalPosts = userPostsData?.pages[0]?.total ?? 0;

  const userInfo = userProfileData?.userInfo;
  const profileBio = userInfo?.bio || 'No bio available';
  const profilePic = userInfo?.profilePic || user?.imageUrl;

  // Parse categories from CSV
  const categoryValue = typeof userInfo?.category === "string" 
    ? userInfo.category.split(",") 
    : [];
  const filteredCategoryChips = categoryValue.filter((item: string) => item !== "");

  const renderPost = ({ item, index }: { item: any; index: number }) => {
    const firstMedia = item.media && item.media.length > 0 ? item.media[0] : null;
    
    return (
      <TouchableOpacity
        key={item.id}
        className="aspect-square bg-gray-800"
        style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
        onPress={() => router.push(`/(protected)/(user)/post/postid${item.id}` as any)}
      >
        {firstMedia ? (
          <ExpoImage
            source={{ uri: firstMedia.mediaUrl }}
            className="w-full h-full"
            contentFit="cover"
          />
        ) : (
          <View className="w-full h-full bg-gray-700 items-center justify-center">
            <Text className="text-gray-400 text-xs">No Image</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderProjectsProfile = () => {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <FolderKanban size={48} color="#6b7280" />
        <Text className="text-gray-400 text-lg mt-4">No Projects Yet</Text>
        <Text className="text-gray-500 text-sm mt-2">Your created projects will appear here</Text>
        <TouchableOpacity className="bg-blue-500 rounded-lg py-2 px-4 mt-4">
          <Text className="text-white font-semibold">Create Project</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContractsProfile = () => {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Briefcase size={48} color="#6b7280" />
        <Text className="text-gray-400 text-lg mt-4">No Contracts Yet</Text>
        <Text className="text-gray-500 text-sm mt-2">Your job contracts will appear here</Text>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (profileTab) {
      case 'posts':
        return (
          <View className="flex-1">
            {userIsLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-gray-400 mt-2">Loading posts...</Text>
              </View>
            ) : posts.length > 0 ? (
              <FlatList
                data={posts}
                renderItem={renderPost}
                numColumns={3}
                keyExtractor={(item) => item.id.toString()}
                onEndReached={() => {
                  if (userHasNextPage && !userIsFetchingNextPage) {
                    userFetchNextPage();
                  }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => 
                  userIsFetchingNextPage ? (
                    <View className="py-4 items-center">
                      <ActivityIndicator size="small" color="#3b82f6" />
                    </View>
                  ) : null
                }
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-gray-400 text-lg">No posts yet</Text>
                <Text className="text-gray-500 text-sm mt-2">Start sharing your work!</Text>
              </View>
            )}
          </View>
        );
      case 'projects':
        return renderProjectsProfile();
      case 'contracts':
        return renderContractsProfile();
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title="Client Profile"
          headerRight={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ProfileSwitchButton />
              <TouchableOpacity
                style={{ padding: 8 }}
                onPress={() => {
                  console.log('Notifications pressed');
                }}
              >
                <Ionicons name="notifications-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 8 }}
                onPress={() => {
                  console.log('Settings pressed');
                }}
              >
                <Ionicons name="ellipsis-horizontal-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          }
          translateY={headerTranslateY}
          isDark={true}
        />
        
        <ScrollView 
          className="flex-1 bg-black"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 20,
          }}
        >
          {/* Profile Header - Instagram Style */}
          <View className="px-4 py-4">
            {/* User Info Row */}
            <View className="flex-row items-center mb-4">
              {/* Avatar */}
              <View className="mr-4">
                {profilePic ? (
                  <ExpoImage
                    source={{ uri: profilePic }}
                    className="w-20 h-20 rounded-full border-2 border-gray-600"
                  />
                ) : (
                  <View className="w-20 h-20 rounded-full bg-gray-700 border-2 border-gray-600 items-center justify-center">
                    <User size={32} color="#9ca3af" />
                  </View>
                )}
              </View>

              {/* Stats */}
              <View className="flex-1 flex-row justify-around">
                <View className="items-center">
                  <Text className="text-white text-lg font-bold">{totalPosts}</Text>
                  <Text className="text-gray-400 text-sm">Posts</Text>
                </View>
                <FollowList
                  username={user?.username || ''}
                  isLoading={profileLoading}
                  type="follower"
                />
                <FollowList
                  username={user?.username || ''}
                  isLoading={profileLoading}
                  type="following"
                />
              </View>
            </View>

            {/* Name and Bio */}
            <View className="mb-4">
              <Text className="text-white text-sm font-semibold mb-1">
                {userInfo?.name || user?.firstName || 'Unknown User'}
              </Text>
              <Text className="text-white text-sm mb-2">
                {profileBio}
              </Text>
              
              {/* Category Chips */}
              {filteredCategoryChips.length > 0 && (
                <View className="flex-row flex-wrap mb-3">
                  {filteredCategoryChips.map((category: string, index: number) => (
                    <View
                      key={index}
                      className="bg-gray-700 rounded-full px-3 py-1 mr-2 mb-1"
                    >
                      <Text className="text-white text-xs">{category.trim()}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Client Badge */}
              <View className="flex-row items-center mb-3">
                <View className="bg-green-500 rounded-full px-3 py-1 mr-2">
                  <Text className="text-white text-xs font-semibold">Verified Client</Text>
                </View>
                <View className="bg-blue-500 rounded-full px-3 py-1">
                  <Text className="text-white text-xs font-semibold">Premium</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-2">
                <TouchableOpacity 
                  className="flex-1 bg-gray-700 rounded-lg py-2 px-4"
                  onPress={() => setShowEditModal(true)}
                >
                  <Text className="text-white text-center font-semibold">Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-blue-500 rounded-lg py-2 px-4">
                  <Text className="text-white text-center font-semibold">Share Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View className="border-t border-gray-800">
            <View className="flex-row">
              <TouchableOpacity
                className={`flex-1 py-3 items-center border-b-2 ${
                  profileTab === 'posts' ? 'border-white' : 'border-transparent'
                }`}
                onPress={() => setProfileTab('posts')}
              >
                <Grid size={24} color={profileTab === 'posts' ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 items-center border-b-2 ${
                  profileTab === 'projects' ? 'border-white' : 'border-transparent'
                }`}
                onPress={() => setProfileTab('projects')}
              >
                <FolderKanban size={24} color={profileTab === 'projects' ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 items-center border-b-2 ${
                  profileTab === 'contracts' ? 'border-white' : 'border-transparent'
                }`}
                onPress={() => setProfileTab('contracts')}
              >
                <Briefcase size={24} color={profileTab === 'contracts' ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Content */}
          <View className="flex-1" style={{ minHeight: 400 }}>
            {renderTabContent()}
          </View>
        </ScrollView>

        {/* Profile Edit Modal */}
        <ProfileEditModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleProfileSave}
          initialValues={{
            profilePic: userInfo?.profilePic || user?.imageUrl || '',
            username: user?.username || '',
            name: userInfo?.name || user?.firstName || '',
            bio: userInfo?.bio || '',
            category: filteredCategoryChips || [],
          }}
          isLoading={updateUserInfoMutation.isPending || updateSoleUserMutation.isPending}
        />
      </View>
    </>
  );
}