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
  Alert,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { ProfileSwitchButton } from '~/components/ProfileSwitchButton';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3;

export default function ClientProfileScreen() {
  const [imageSize, setImageSize] = useState(Dimensions.get('window').width / 3);
  const { signOut } = useAuth();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const { headerTranslateY, handleScroll } = useScrollHeader();

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

  const userStats = [
    { label: 'Projects Created', value: '45', icon: 'briefcase' },
    { label: 'Jobs Applied', value: '23', icon: 'send' },
    { label: 'Connections', value: '156', icon: 'people' },
  ];

  const recentActivity = [
    { action: 'Applied for new project', time: '2 hours ago', type: 'success' },
    { action: 'Updated portfolio', time: '1 day ago', type: 'info' },
    { action: 'Connected with client', time: '3 days ago', type: 'warning' },
  ];

  const quickActions = [
    { title: 'Settings', icon: 'settings-outline', onPress: () => {} },
    { title: 'Help & Support', icon: 'help-circle-outline', onPress: () => {} },
    { title: 'Rate App', icon: 'star-outline', onPress: () => {} },
    {
      title: 'Sign Out',
      icon: 'log-out-outline',
      onPress: () => {
        console.log('Sign Out button pressed'); // Debug log
        handleSignOut();
      },
      isDestructive: true,
    },
  ];

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const images = Array.from({ length: 9 }, (_, i) => ({
    id: i.toString(),
    uri: `https://picsum.photos/300/300?random=${i}`,
  }));

  // Update image size when screen dimensions change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setImageSize(window.width / 3);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const renderImage = ({ item }: { item: { id: string; uri: string } }) => (
    <View className="p-0.5">
      <ExpoImage
        source={{ uri: item.uri }}
        style={{
          width: imageSize - 4,
          height: imageSize - 4,
        }}
        className="rounded-3xl"
        contentFit="cover"
      />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title="Client Profile"
          headerRight={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ProfileSwitchButton />
              <>ching chong</> 
              <TouchableOpacity
                style={{ padding: 8 }}
                onPress={() => {
                  // Add settings functionality here
                  console.log('Settings pressed');
                }}>
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
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
            paddingTop: insets.top + 72, // Increased to account for larger header
          }}>
          {/* Profile Header */}
          <View className="mx-4 my-4 items-center rounded-2xl border border-gray-700/30 bg-gray-800/20 p-5">
            <View className="mb-4">
              <ExpoImage
                source={
                  user?.imageUrl
                    ? { uri: user.imageUrl }
                    : require('../../../assets/profile/baldman.jpg')
                }
                className="h-20 w-20 rounded-full border-4 border-white"
                placeholder={user?.firstName || 'User'}
              />
            </View>

            <View className="mb-5 items-center">
              <Text className="mb-1 text-2xl font-bold text-white">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || 'User'}
              </Text>
              <Text className="mb-2 text-sm text-gray-400">
                {user?.primaryEmailAddress?.emailAddress || 'No email'}
              </Text>
            </View>

            <View className="mb-5 flex-row gap-3">
              <View className="rounded-full bg-green-500 px-3 py-1">
                <Text className="text-xs font-semibold text-white">Verified</Text>
              </View>
              <View className="rounded-full bg-blue-400 px-3 py-1">
                <Text className="text-xs font-semibold text-white">Client</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity className="rounded-lg border border-gray-500 px-4 py-2">
                <Text className="font-medium text-white">Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity className="rounded-lg bg-blue-500 px-4 py-2">
                <Text className="font-medium text-white">Share Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Section */}
          <View className="mx-4 my-3 rounded-2xl border border-gray-700/30 bg-gray-800/20 p-5">
            <Text className="mb-4 text-lg font-bold text-white">Your Stats</Text>
            <View className="flex-row justify-between">
              {userStats.map((stat, index) => (
                <View key={index} className="flex-1 items-center">
                  <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
                    <Ionicons name={stat.icon as any} size={24} color="#1DA1F2" />
                  </View>
                  <Text className="mb-1 text-xl font-bold text-white">{stat.value}</Text>
                  <Text className="text-center text-xs text-gray-400">{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Activity */}
          <View className="mx-4 my-3 rounded-2xl border border-gray-700/30 bg-gray-800/20 p-5">
            <Text className="mb-4 text-lg font-bold text-white">Recent Activity</Text>
            <View className="gap-3">
              {recentActivity.map((activity, index) => (
                <View key={index}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="mb-1 text-white">{activity.action}</Text>
                      <Text className="text-xs text-gray-500">{activity.time}</Text>
                    </View>
                    <View className={`${getBadgeColor(activity.type)} rounded px-2 py-1`}>
                      <Text className="text-xs font-semibold uppercase text-white">
                        {activity.type}
                      </Text>
                    </View>
                  </View>
                  {index < recentActivity.length - 1 && (
                    <View className="mt-3 h-px bg-gray-700/50" />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Posted Photos */}
          <View className="mx-4 my-3 rounded-2xl border border-gray-700/30 bg-gray-800/20">
            <View className="p-5 pb-0">
              <Text className="mb-4 text-lg font-bold text-white">Posted Photos</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                paddingHorizontal: 20,
                paddingBottom: 20,
                justifyContent: 'space-between',
              }}>
              {images.map((item) => renderImage({ item }))}
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mx-4 my-3 rounded-2xl border border-gray-700/30 bg-gray-800/20 p-5">
            <Text className="mb-4 text-lg font-bold text-white">Quick Actions</Text>
            <View className="gap-2">
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  className={`flex-row items-center rounded-lg border p-3 ${
                    action.isDestructive ? 'border-red-500/50 bg-red-500/10' : 'border-gray-700/50'
                  }`}
                  onPress={() => {
                    console.log(`Button pressed: ${action.title}`); // Debug log
                    action.onPress();
                  }}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={action.icon as any}
                    size={20}
                    color={action.isDestructive ? '#ef4444' : '#fff'}
                    className="mr-3"
                  />
                  <Text
                    className={`flex-1 font-medium ${
                      action.isDestructive ? 'text-red-400' : 'text-white'
                    }`}>
                    {action.title}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* App Info */}
          <View className="mx-4 my-4 rounded-2xl border border-gray-700/30 bg-gray-800/20 p-5">
            <View className="items-center">
              <Text className="mb-1 text-gray-400">Sole - Client Dashboard</Text>
              <Text className="text-xs text-gray-500">Version 1.0.0</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
