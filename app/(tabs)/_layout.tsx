import { Link, Tabs } from 'expo-router';
import { AuthWrapper } from '../../components/AuthWrapper';
import { HeaderButton } from '../../components/HeaderButton';
import { TabBarIcon } from '../../components/TabBarIcon';
import { BriefcaseBusiness, Camera, Home, Plus, Search, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <AuthWrapper>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: 'black',
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Tab One',
            tabBarIcon: ({ color }) => <Home />,
            headerRight: () => (
              <Link href="/chat" asChild>
                <HeaderButton />
              </Link>
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <Search />,
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: 'Camera',
            tabBarIcon: ({ color }) => <Camera />,
          }}
        />
        <Tabs.Screen
          name="job"
          options={{
            title: 'Job',
            tabBarIcon: ({ color }) => <BriefcaseBusiness />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <User />,
          }}
        />
      </Tabs>
    </AuthWrapper>
  );
}
