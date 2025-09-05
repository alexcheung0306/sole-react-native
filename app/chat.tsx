import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function ChatScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  
  const chatRooms = [
    { id: 1, name: 'Sarah Johnson', lastMessage: 'Hey! Are you available for a shoot?', time: '2m ago', unread: 2 },
    { id: 2, name: 'Mike Chen', lastMessage: 'The photos look amazing!', time: '1h ago', unread: 0 },
    { id: 3, name: 'Emma Davis', lastMessage: 'Can we schedule for next week?', time: '3h ago', unread: 1 },
    { id: 4, name: 'Alex Rodriguez', lastMessage: 'Thanks for the collaboration!', time: '1d ago', unread: 0 },
    { id: 5, name: 'Lisa Wang', lastMessage: 'Love your portfolio!', time: '2d ago', unread: 0 },
  ];

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      {/* <View className={`flex-row justify-between items-center px-5 pt-15 pb-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <TouchableOpacity className="p-2" onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
        <Text className={`text-2xl font-bold flex-1 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Messages</Text>
        <TouchableOpacity className="p-2">
          <Ionicons name="create-outline" size={24} color="#1DA1F2" />
        </TouchableOpacity>
      </View> */}

      {/* Chat List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {chatRooms.map((chat) => (
          <TouchableOpacity 
            key={chat.id} 
            className={`flex-row px-5 py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
          >
            <View className="w-12 h-12 rounded-full bg-blue-500 justify-center items-center mr-4">
              <Text className="text-white text-xl font-bold">
                {chat.name.charAt(0)}
              </Text>
            </View>
            
            <View className="flex-1 justify-center">
              <View className="flex-row justify-between items-center mb-1">
                <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {chat.name}
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {chat.time}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text 
                  className={`flex-1 text-sm mr-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} 
                  numberOfLines={1}
                >
                  {chat.lastMessage}
                </Text>
                {chat.unread > 0 && (
                  <View className="bg-blue-500 rounded-full min-w-5 h-5 justify-center items-center px-1.5">
                    <Text className="text-white text-xs font-bold">{chat.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

