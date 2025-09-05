import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useImageSize } from '../../hooks/useImageSize';
import { useTheme } from '../../contexts/ThemeContext';

export default function ProfileScreen() {
  const { isDark, theme, toggleTheme } = useTheme();
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
    { title: 'Theme', icon: theme === 'dark' ? 'sunny-outline' : 'moon-outline', onPress: toggleTheme },
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
    <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View className={`mx-4 my-4 p-5 rounded-2xl border items-center ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200'}`}>
        <View className="mb-4">
          <ExpoImage
            source={require('../../assets/profile/baldman.jpg')} 
            className="w-20 h-20 rounded-full border-4 border-white"
            placeholder="Alex Chen"
          />
        </View>
        
        <View className="items-center mb-5">
          <Text className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Alex Chen
          </Text>
          <Text className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Sticker Creator & Photo Editor
          </Text>
          
        </View>

        <View className="flex-row gap-3 mb-5">
          <View className="bg-green-500 px-3 py-1 rounded-full">
            <Text className="text-xs font-semibold text-white">Verified</Text>
          </View>
          <View className="bg-blue-400 px-3 py-1 rounded-full">
            <Text className="text-xs font-semibold text-white">Actor/Actress</Text>
          </View>
        </View>

        <View className="flex-row justify-center items-center m-4">
          <TouchableOpacity className="items-center px-6">
            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>1,234</Text>
            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Posts</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center px-6">
            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>5,678</Text>
            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Followers</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center px-6">
            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>1,234</Text>
            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Following</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity className={`border px-4 py-2 rounded-lg ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Edit Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">
              Share Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Section */}
      <View className={`mx-4 my-0 p-5 rounded-2xl border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200'}`}>
        <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Your Stats
        </Text>
        <View className="flex-row justify-between">
          {userStats.map((stat, index) => (
            <View key={index} className="flex-1 items-center">
              <View className="w-12 h-12 rounded-full bg-blue-500/20 justify-center items-center mb-2">
                <Ionicons name={stat.icon as any} size={24} color="#1DA1F2" />
              </View>
              <Text className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stat.value}
              </Text>
              <Text className={`text-xs text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View className={`mx-4 my-4 p-5 rounded-2xl border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200'}`}>
        <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Recent Activity
        </Text>
        <View className="gap-3">
          {recentActivity.map((activity, index) => (
            <View key={index}>
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className={`mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {activity.action}
                  </Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {activity.time}
                  </Text>
                </View>
                <View className={`${getBadgeColor(activity.type)} px-2 py-1 rounded`}>
                  <Text className="text-xs font-semibold text-white uppercase">{activity.type}</Text>
                </View>
              </View>
              {index < recentActivity.length - 1 && (
                <View className={`h-px mt-3 ${isDark ? 'bg-gray-700/50' : 'bg-gray-200'}`} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Posted Photos */}
      <View>
        <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Posted Photos
        </Text>
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
      <View className={`mx-4 my-0 p-5 rounded-2xl border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200'}`}>
        <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </Text>
        <View className="gap-2">
          {quickActions.map((action, index) => (
            <TouchableOpacity 
              key={index} 
              className={`flex-row items-center p-3 border rounded-lg mb-2 ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}
              onPress={action.onPress}
            >
              <Ionicons 
                name={action.icon as any} 
                size={20} 
                color={isDark ? '#fff' : '#000'} 
                className="mr-3" 
              />
              <Text className={`flex-1 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {action.title}
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color={isDark ? '#9CA3AF' : '#6B7280'} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* App Info */}
      <View className={`mx-4 my-4 p-5 rounded-2xl border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200'}`}>
        <View className="items-center">
          <Text className={`mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Sole - Find your next model
          </Text>
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Version 1.0.0
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
