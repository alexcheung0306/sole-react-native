import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useState, useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Dimensions, ActivityIndicator } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SwitchInterface } from '~/components/profile/switch-interface';
import { useQuery } from '@tanstack/react-query';
import { getUserProfileByUsername } from '~/api/apiservice/soleUser_api';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3;

export default function ProfileScreen() {
  const [imageSize, setImageSize] = useState(Dimensions.get('window').width / 3);
  const { signOut } = useAuth();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const { username } = useLocalSearchParams<{ username: string }>();
  
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
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!username,
    refetchOnWindowFocus: false,
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

  const userStats = [
    { label: 'Stickers Created', value: '127', icon: 'happy' },
    { label: 'Photos Edited', value: '89', icon: 'images' },
    { label: 'Favorites', value: '23', icon: 'heart' },
  ];

  const recentActivity = [
    { action: 'Created a new sticker', time: '2 hours ago', type: 'success' },
    { action: 'Edited photo with emoji', time: '1 day ago', type: 'info' },
    { action: 'Saved to favorites', time: '3 days ago', type: 'warning' },
  ];

  const quickActions = [
    { title: 'Settings', icon: 'settings-outline', onPress: () => {} },
    { title: 'Help & Support', icon: 'help-circle-outline', onPress: () => {} },
    { title: 'Rate App', icon: 'star-outline', onPress: () => {} },
    { title: 'Sign Out', icon: 'log-out-outline', onPress: () => {
      console.log('Sign Out button pressed');
      handleSignOut();
    }, isDestructive: true },
  ];

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const images = Array.from({ length: 9 }, (_, i) => ({
    id: i.toString(),
    uri: `https://picsum.photos/300/300?random=${i}`,
  }));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setImageSize(window.width / 3);
    });
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const [profileTypeModalVisible, setProfileTypeModalVisible] = useState(false);
  const [userInterface, setUserInterface] = useState<string>('USER');

  useEffect(() => {
    console.log('User_State_Interface current value:', userInterface);
  }, [userInterface]);

  // Debug log for profile data
  useEffect(() => {
    if (userProfileData) {
      console.log('Fetched profile data for', username, ':', userProfileData);
    }
  }, [userProfileData, username]);

  const renderImage = ({ item }: { item: { id: string; uri: string } }) => (
    <View className="p-0.5">
      <ExpoImage 
        source={{ uri: item.uri }} 
        style={{ 
          width: imageSize - 4, 
          height: imageSize - 4 
        }}
        className="rounded-3xl"
        contentFit="cover"
      />
    </View>
  );

  const handleBackPress = () => {
    if (!isOwnProfile) {
      router.back();
    }
  };

  // Loading state
  if (profileLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-black justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-4">Loading profile...</Text>
        </View>
      </>
    );
  }

  // Error state
  if (profileError) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-black justify-center items-center p-4">
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text className="text-white text-xl font-bold mt-4">Error Loading Profile</Text>
          <Text className="text-gray-400 text-center mt-2">
            Could not load profile for @{username}
          </Text>
          <TouchableOpacity 
            onPress={() => refetch()}
            className="mt-6 bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
          {!isOwnProfile && (
            <TouchableOpacity 
              onPress={() => router.back()}
              className="mt-3"
            >
              <Text className="text-gray-400">Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </>
    );
  }

  // Extract profile data
  const profileName = userProfileData?.userInfo?.name || username || 'User';
  const profileBio = userProfileData?.userInfo?.bio || 'No bio';
  const profilePic = userProfileData?.userInfo?.profilePic || null;
  const talentLevel = userProfileData?.talentLevel || null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title={isOwnProfile ? "Profile" : `@${username}`}
          headerLeft={!isOwnProfile ? (
            <TouchableOpacity onPress={handleBackPress} style={{ padding: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ) : undefined}
          headerRight={
            isOwnProfile ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={{ padding: 8, marginRight: 8 }}
                  onPress={() => {
                    console.log('Notifications pressed');
                  }}
                >
                  <Ionicons name="notifications-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ padding: 8 }}
                  onPress={() => {
                    setProfileTypeModalVisible(true);
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
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
          }}
        >
          {/* Profile Header */}
          <View className="mx-4 my-4 p-5 bg-gray-800/20 rounded-2xl border border-gray-700/30 items-center">
            <View className="mb-4">
              <ExpoImage
                source={
                  profilePic 
                    ? { uri: profilePic }
                    : isOwnProfile && user?.imageUrl
                    ? { uri: user.imageUrl }
                    : require('../../../../../assets/profile/baldman.jpg')
                } 
                className="w-20 h-20 rounded-full border-4 border-white"
                placeholder={profileName}
                contentFit="cover"
              />
            </View>
            
            <View className="items-center mb-5">
              <Text className="text-2xl font-bold text-white mb-1">
                {profileName}
              </Text>
              <Text className="text-sm text-gray-400 mb-2">
                @{username}
              </Text>
              {profileBio && profileBio !== 'No bio' && (
                <Text className="text-sm text-gray-300 text-center mt-2">
                  {profileBio}
                </Text>
              )}
            </View>

            <View className="flex-row gap-3 mb-5">
              <View className="bg-green-500 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-white">Verified</Text>
              </View>
              {talentLevel && (
                <View className="bg-blue-400 px-3 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-white">{talentLevel}</Text>
                </View>
              )}
              {!talentLevel && (
                <View className="bg-blue-400 px-3 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-white">Actor/Actress</Text>
                </View>
              )}
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity className="border border-gray-500 px-4 py-2 rounded-lg">
                <Text className="text-white font-medium">
                  {isOwnProfile ? 'Edit Profile' : 'Follow'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg">
                <Text className="text-white font-medium">Share Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Section */}
          <View className="mx-4 my-3 p-5 bg-gray-800/20 rounded-2xl border border-gray-700/30">
            <Text className="text-lg font-bold text-white mb-4">Your Stats</Text>
            <View className="flex-row justify-between">
              {userStats.map((stat, index) => (
                <View key={index} className="flex-1 items-center">
                  <View className="w-12 h-12 rounded-full bg-blue-500/20 justify-center items-center mb-2">
                    <Ionicons name={stat.icon as any} size={24} color="#1DA1F2" />
                  </View>
                  <Text className="text-xl font-bold text-white mb-1">{stat.value}</Text>
                  <Text className="text-xs text-gray-400 text-center">{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Activity */}
          <View className="mx-4 my-3 p-5 bg-gray-800/20 rounded-2xl border border-gray-700/30">
            <Text className="text-lg font-bold text-white mb-4">Recent Activity</Text>
            <View className="gap-3">
              {recentActivity.map((activity, index) => (
                <View key={index}>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-white mb-1">{activity.action}</Text>
                      <Text className="text-xs text-gray-500">{activity.time}</Text>
                    </View>
                    <View className={`${getBadgeColor(activity.type)} px-2 py-1 rounded`}>
                      <Text className="text-xs font-semibold text-white uppercase">{activity.type}</Text>
                    </View>
                  </View>
                  {index < recentActivity.length - 1 && (
                    <View className="h-px bg-gray-700/50 mt-3" />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Posted Photos */}
          <View className="mx-4 my-3 bg-gray-800/20 rounded-2xl border border-gray-700/30">
            <View className="p-5 pb-0">
              <Text className="text-lg font-bold text-white mb-4">Posted Photos</Text>
            </View>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingHorizontal: 20,
              paddingBottom: 20,
              justifyContent: 'space-between'
            }}>
              {images.map((item) => renderImage({ item }))}
            </View>
          </View>

          {/* Quick Actions - Only show for own profile */}
          {isOwnProfile && (
            <View className="mx-4 my-3 p-5 bg-gray-800/20 rounded-2xl border border-gray-700/30">
              <Text className="text-lg font-bold text-white mb-4">Quick Actions</Text>
              <View className="gap-2">
                {quickActions.map((action, index) => (
                  <TouchableOpacity 
                    key={index} 
                    className={`flex-row items-center p-3 border rounded-lg ${
                      action.isDestructive 
                        ? 'border-red-500/50 bg-red-500/10' 
                        : 'border-gray-700/50'
                    }`}
                    onPress={() => {
                      console.log(`Button pressed: ${action.title}`);
                      action.onPress();
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={action.icon as any} 
                      size={20} 
                      color={action.isDestructive ? "#ef4444" : "#fff"} 
                      className="mr-3" 
                    />
                    <Text className={`flex-1 font-medium ${
                      action.isDestructive ? 'text-red-400' : 'text-white'
                    }`}>
                      {action.title}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* App Info */}
          <View className="mx-4 my-4 p-5 bg-gray-800/20 rounded-2xl border border-gray-700/30">
            <View className="items-center">
              <Text className="text-gray-400 mb-1">Sole - Sticker Creator</Text>
              <Text className="text-xs text-gray-500">Version 1.0.0</Text>
            </View>
          </View>
        </ScrollView>

        {/* Profile Type Selection Modal - Only show for own profile */}
        {isOwnProfile && (
          <SwitchInterface 
            setProfileTypeModalVisible={setProfileTypeModalVisible} 
            setUserInterface={undefined} 
            profileTypeModalVisible={false} 
            userInterface={''} 
          />
        )}
      </View>
    </>
  );
}
