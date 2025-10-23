import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useState, useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Dimensions, ActivityIndicator, FlatList } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SwitchInterface } from '~/components/profile/switch-interface';
import { ProfileSwitchButton } from '~/components/ProfileSwitchButton';
import { useNavigation } from '~/context/NavigationContext';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getUserProfileByUsername } from '~/api/apiservice/soleUser_api';
import { searchPosts } from '~/api/apiservice/post_api';
import { Grid, User, Briefcase, Heart, MessageCircle, MoreVertical, MapPin } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3;

type TabKey = 'posts' | 'talent' | 'jobs';

export default function ProfileScreen() {
  const [imageSize, setImageSize] = useState(Dimensions.get('window').width / 3);
  const [profileTab, setProfileTab] = useState<TabKey>('posts');
  const [isUser, setIsUser] = useState(false);
  const [isTalent, setIsTalent] = useState(false);
  const { signOut } = useAuth();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { currentMode } = useNavigation();
  
  // Check if viewing own profile
  const isOwnProfile = user?.username === username;

  // Fetch user profile data from API
  const {
    data: userProfileData,
    isLoading: profileLoading,
    error: profileError,
    refetch,
  } = useQuery({
    queryKey: ["userProfile", username],
    queryFn: async () => {
      if (!username || typeof username !== 'string') {
        throw new Error("Username not found");
      }
      const result = await getUserProfileByUsername(username);
      
      // Check if viewing own profile
      if (user?.username === username) {
        setIsUser(true);
      } else {
        setIsUser(false);
      }
      
      // Check if user has talent profile
      if (result.talentLevel) {
        setIsTalent(true);
      } else {
        setIsTalent(false);
      }
      
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!username,
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
    queryKey: ["profilePagePosts", username],
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

  const handleSignOut = async () => {
    console.log('handleSignOut called');
    
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) {
      console.log('Sign out cancelled');
      return;
    }
    
    try {
      console.log('Attempting to sign out...');
      await signOut();
      console.log('Sign out successful');
      
      localStorage.clear();
      sessionStorage.clear();
      
      router.replace('/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  // Flatten posts from all pages
  const posts = userPostsData?.pages.flatMap((page) => page.data) ?? [];
  const totalPosts = userPostsData?.pages[0]?.total ?? 0;

  const userInfo = userProfileData?.userInfo;
  const talentInfo = userProfileData?.talentInfo;
  const profileBio = userInfo?.bio || 'No bio available';
  const profilePic = userInfo?.profilePic || user?.imageUrl;
  const talentLevel = userProfileData?.talentLevel || null;

  // Parse categories from CSV
  const categoryValue = typeof userInfo?.category === "string" 
    ? userInfo.category.split(",") 
    : [];
  const filteredCategoryChips = categoryValue.filter((item) => item !== "");

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderPost = ({ item, index }: { item: any; index: number }) => {
    const firstMedia = item.media && item.media.length > 0 ? item.media[0] : null;
    
    return (
      <TouchableOpacity
        key={item.id}
        className="aspect-square bg-gray-800"
        style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
        onPress={() => router.push(`/(protected)/(user)/post/${item.id}` as any)}
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

  const renderTalentProfile = () => {
    if (!talentInfo) {
      return (
        <View className="p-4 items-center">
          <Text className="text-gray-400">No talent profile available</Text>
        </View>
      );
    }

    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Physical Stats */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Physical Stats</Text>
            <View className="bg-gray-800/50 rounded-lg p-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300">Age</Text>
                <Text className="text-white">{talentInfo.age || 'N/A'}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300">Height</Text>
                <Text className="text-white">{talentInfo.height || 'N/A'} cm</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300">Gender</Text>
                <Text className="text-white">{talentInfo.gender || 'N/A'}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300">Eye Color</Text>
                <Text className="text-white">{talentInfo.eyeColor || 'N/A'}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300">Hair Color</Text>
                <Text className="text-white">{talentInfo.hairColor || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* Measurements */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Measurements</Text>
            <View className="bg-gray-800/50 rounded-lg p-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300">Chest</Text>
                <Text className="text-white">{talentInfo.chest || 'N/A'} cm</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300">Waist</Text>
                <Text className="text-white">{talentInfo.waist || 'N/A'} cm</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300">Hip</Text>
                <Text className="text-white">{talentInfo.hip || 'N/A'} cm</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300">Shoes</Text>
                <Text className="text-white">{talentInfo.shoes || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* Experience */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Experience</Text>
            <View className="bg-gray-800/50 rounded-lg p-4">
              <Text className="text-white">{talentInfo.experience || 'No experience listed'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderJobsProfile = () => {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Briefcase size={48} color="#6b7280" />
        <Text className="text-gray-400 text-lg mt-4">No Job Records</Text>
        <Text className="text-gray-500 text-sm mt-2">Job applications and contracts will appear here</Text>
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
      case 'talent':
        return renderTalentProfile();
      case 'jobs':
        return renderJobsProfile();
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title={isOwnProfile ? "Talent Profile" : `@${username}`}
          headerLeft={!isOwnProfile ? (
            <TouchableOpacity onPress={handleBackPress} style={{ padding: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ) : undefined}
          headerRight={
            isOwnProfile ? (
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
            ) : undefined
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
                <View className="items-center">
                  <Text className="text-white text-lg font-bold">0</Text>
                  <Text className="text-gray-400 text-sm">Followers</Text>
                </View>
                <View className="items-center">
                  <Text className="text-white text-lg font-bold">0</Text>
                  <Text className="text-gray-400 text-sm">Following</Text>
                </View>
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
                  {filteredCategoryChips.map((category, index) => (
                    <View
                      key={index}
                      className="bg-gray-700 rounded-full px-3 py-1 mr-2 mb-1"
                    >
                      <Text className="text-white text-xs">{category.trim()}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              {isOwnProfile ? (
                <TouchableOpacity className="bg-gray-700 rounded-lg py-2 px-4">
                  <Text className="text-white text-center font-semibold">Edit Profile</Text>
                </TouchableOpacity>
              ) : (
                <View className="flex-row gap-2">
                  <TouchableOpacity className="flex-1 bg-gray-700 rounded-lg py-2 px-4">
                    <Text className="text-white text-center font-semibold">Follow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 bg-gray-700 rounded-lg py-2 px-4">
                    <Text className="text-white text-center font-semibold">Message</Text>
                  </TouchableOpacity>
                </View>
              )}
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
                  profileTab === 'talent' ? 'border-white' : 'border-transparent'
                }`}
                onPress={() => setProfileTab('talent')}
              >
                <User size={24} color={profileTab === 'talent' ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 items-center border-b-2 ${
                  profileTab === 'jobs' ? 'border-white' : 'border-transparent'
                }`}
                onPress={() => setProfileTab('jobs')}
              >
                <Briefcase size={24} color={profileTab === 'jobs' ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Content */}
          <View className="flex-1" style={{ minHeight: 400 }}>
            {renderTabContent()}
          </View>
        </ScrollView>
      </View>
    </>
  );
}