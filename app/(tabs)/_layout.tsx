import { Link, Tabs } from 'expo-router';
import { AuthWrapper } from '../../components/AuthWrapper';
import { HeaderButton } from '../../components/HeaderButton';
import { TabBarIcon } from '../../components/TabBarIcon';
import { ChatButton } from '~/components/ChatButton';
import { useTheme } from '../../contexts/ThemeContext';
import { BriefcaseBusiness, Camera, Home, Plus, Search, User } from 'lucide-react-native';

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <AuthWrapper>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          tabBarActiveTintColor: colors.tabBarActiveTint,
          tabBarInactiveTintColor: colors.tabBarInactiveTint,
          tabBarStyle: {
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            borderTopColor: isDark ? '#374151' : '#E5E7EB',
          },
          headerStyle: {
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
          },
          headerTintColor: colors.headerTint,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Tab One',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
            headerRight: () => (
              <Link href="/chat" asChild>
                <ChatButton />
              </Link>
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <Search size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: 'Camera',
            tabBarIcon: ({ color }) => <Camera size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="job"
          options={{
            title: 'Job',
            tabBarIcon: ({ color }) => <BriefcaseBusiness size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
      </Tabs>
    </AuthWrapper>
  );
}
