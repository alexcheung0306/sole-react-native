import { Stack } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button, ButtonText } from '~/components/ui/button';

export default function Home() {
  const { isDark } = useTheme();

  const quickActions = [
    { title: 'Find Models', icon: 'people-outline', color: '#1DA1F2' },
    { title: 'Browse Jobs', icon: 'briefcase-outline', color: '#10B981' },
    { title: 'Create Portfolio', icon: 'camera-outline', color: '#F59E0B' },
    { title: 'Messages', icon: 'chatbubbles-outline', color: '#8B5CF6' },
  ];

  const recentActivity = [
    { action: 'New job posted for Fashion Week', time: '2 hours ago' },
    { action: 'Sarah liked your portfolio', time: '4 hours ago' },
    { action: 'Message from Mike Chen', time: '1 day ago' },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Sole' }} />
      <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View className="px-6 pt-6 pb-4">
          <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome to Sole
          </Text>
          <Text className={`text-lg mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Find your next modeling opportunity
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                className={`flex-1 min-w-[45%] p-4 rounded-xl border ${
                  isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <View className="items-center">
                  <View className="w-12 h-12 rounded-full justify-center items-center mb-3" style={{ backgroundColor: `${action.color}20` }}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text className={`font-medium text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {action.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mb-6">
          <Text className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Recent Activity
          </Text>
          <View className={`rounded-xl border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200'}`}>
            {recentActivity.map((activity, index) => (
              <View key={index} className={`p-4 ${index < recentActivity.length - 1 ? 'border-b border-gray-200/50' : ''}`}>
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {activity.action}
                </Text>
                <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {activity.time}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Button */}
        <View className="px-6 pb-6">
          <Button variant="solid" size="lg" action="primary" onPress={() => console.log('Get Started pressed')}>
            <ButtonText>Get Started</ButtonText>
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

