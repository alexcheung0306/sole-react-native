import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useImageSize } from '../../hooks/useImageSize';

export default function ProfileScreen() {
  const imageSize = useImageSize(3, 5); 

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

  const renderImage = ({ item }: { item: { id: string; uri: string } }) => (
    <View className="p-0.5">
      <ExpoImage 
        source={{ uri: item.uri }} 
        style={{ 
          width: imageSize, 
          height: imageSize 
        }}
        className="rounded-3xl"
        contentFit="cover"
      />
    </View>
  );

  

  return (
    <ScrollView className="flex-1 bg-gray-900" showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View className="mx-4 my-4 p-5 bg-gray-800/30 rounded-2xl border border-gray-700/50 items-center">
        <View className="mb-4">
          <ExpoImage
            source={require('../../assets/profile/baldman.jpg')} 
            className="w-20 h-20 rounded-full border-4 border-white"
            placeholder="Alex Chen"
          />
        </View>
        
        <View className="items-center mb-5">
          <Text className="text-2xl font-bold text-white mb-1">Alex Chen</Text>
          <Text className="text-sm text-gray-400 mb-2">Sticker Creator & Photo Editor</Text>
          
        </View>

        <View className="flex-row gap-3 mb-5">
          <View className="bg-green-500 px-3 py-1 rounded-full">
            <Text className="text-xs font-semibold text-white">Verified</Text>
          </View>
          <View className="bg-blue-400 px-3 py-1 rounded-full">
            <Text className="text-xs font-semibold text-white">Actor/Actress</Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity className="border border-gray-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Share Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Section */}
      <View className="mx-4 my-0 p-5 bg-gray-800/30 rounded-2xl border border-gray-700/50">
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
      <View className="mx-4 my-4 p-5 bg-gray-800/30 rounded-2xl border border-gray-700/50">
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
      <View>
        <Text className="text-lg font-bold text-white mb-4">Posted Photos</Text>
        <FlatList
          data={images}
          renderItem={renderImage}
          numColumns={3}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // Important: disable scrolling since it's inside ScrollView
          className="mb-4"
        />
      </View>

      {/* Quick Actions */}
      <View className="mx-4 my-0 p-5 bg-gray-800/30 rounded-2xl border border-gray-700/50">
        <Text className="text-lg font-bold text-white mb-4">Quick Actions</Text>
        <View className="gap-2">
          {quickActions.map((action, index) => (
            <TouchableOpacity 
              key={index} 
              className="flex-row items-center p-3 border border-gray-700/50 rounded-lg"
              onPress={action.onPress}
            >
              <Ionicons name={action.icon as any} size={20} color="#fff" className="mr-3" />
              <Text className="flex-1 text-white font-medium">{action.title}</Text>
              <Ionicons name="chevron-forward" size={16} color="#6B7280" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* App Info */}
      <View className="mx-4 my-4 p-5 bg-gray-800/30 rounded-2xl border border-gray-700/50">
        <View className="items-center">
          <Text className="text-gray-400 mb-1">Sole - Find your next model</Text>
          <Text className="text-xs text-gray-500">Version 1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}