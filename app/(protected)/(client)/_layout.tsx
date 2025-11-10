import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { LayoutDashboard, Bookmark, Search, FolderKanban } from 'lucide-react-native';
import { useUser } from '@clerk/clerk-expo';
import { AccountDropDownMenu } from '~/components/AccountDropDownMenu';

export default function ClientTabLayout() {
  const { user } = useUser();
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
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="bookmark"
        options={{
          title: 'Bookmark',
          tabBarIcon: ({ color }) => <Bookmark color={color} size={24} />,
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
        name="project"
        options={{
          title: 'Project',
          tabBarIcon: ({ color }) => <FolderKanban color={color} size={24} />,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="client/[username]"
        options={{
          title: 'Client',
          tabBarIcon: ({ color, focused }) => (
            <AccountDropDownMenu color={color} focused={focused} onPress={() => {}} />
          ),
          headerShown: false,
          href: user?.username
            ? ({
                pathname: '/(protected)/(client)/client/[username]',
                params: { username: user.username },
              } as any)
            : '/sign-in',
        }}
      />
    </Tabs>
  );
}
