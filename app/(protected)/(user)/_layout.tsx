import { Link, Tabs, useRouter } from 'expo-router';
import { View } from 'react-native';
import { TabBarIcon } from '../../../components/TabBarIcon';
import { BriefcaseBusiness, Camera, Home, Plus, Search, UserCircle } from 'lucide-react-native';
import { useUser } from '@clerk/clerk-expo';
import { AccountDropDownMenu } from '../../../components/AccountDropDownMenu';

export default function ClientTabLayout() {
  const { user } = useUser();
  const router = useRouter();

  const handleProfilePress = () => {
    if (user?.username) {
      router.push({
        pathname: '/(protected)/(user)/user/[username]',
        params: { username: user.username },
      } as any);
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
        },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(20px)',
            }}
          />
        ),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Search color={color} size={24} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => <Camera color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="job"
        options={{
          title: 'Job',
          tabBarIcon: ({ color }) => <BriefcaseBusiness color={color} size={24} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="user/[username]"
        options={{
          title: 'User',
          tabBarIcon: ({ color, focused }) => (
            <AccountDropDownMenu color={color} focused={focused} onPress={handleProfilePress} />
          ),
          headerShown: false,
          href: user?.username
            ? ({
              pathname: '/(protected)/(user)/user/[username]',
              params: { username: user.username },
            } as any)
            : '/sign-in',
        }}
      />
      {/* Hidden tabs */}
      <Tabs.Screen
        name="post/[postId]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
