import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserTabContext } from '~/context/UserTabContext';
import { useUser } from '@clerk/clerk-expo';
import { useRouter, usePathname } from 'expo-router';
import { BriefcaseBusiness, Camera, Home, Search, UserCircle } from 'lucide-react-native';
import { AccountDropDownMenu } from '@/components/AccountDropDownMenu';

export default function UserTabBar() {
  const { activeTab, setActiveTab } = useUserTabContext();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname?.includes('/home') || pathname === '/(protected)/(user)/' || pathname === '/(protected)/(user)') {
      setActiveTab('home');
    } else if (pathname?.includes('/explore')) {
      setActiveTab('explore');
    } else if (pathname?.includes('/camera')) {
      setActiveTab('camera');
    } else if (pathname?.includes('/job')) {
      setActiveTab('job');
    } else if (pathname?.includes('/user/')) {
      setActiveTab('user');
    }
  }, [pathname, setActiveTab]);

  const handleProfilePress = () => {
    if (user?.username) {
      setActiveTab('user');
      // Navigate to index route to show the swipeable container at user tab
      router.replace('/(protected)/(user)/');
    }
  };

  const tabs = [
    {
      name: 'Home',
      tab: 'home' as const,
      icon: Home,
    },
    {
      name: 'Explore',
      tab: 'explore' as const,
      icon: Search,
    },
    {
      name: 'Camera',
      tab: 'camera' as const,
      icon: Camera,
    },
    {
      name: 'Job',
      tab: 'job' as const,
      icon: BriefcaseBusiness,
    },
    {
      name: 'User',
      tab: 'user' as const,
      icon: UserCircle,
      customIcon: AccountDropDownMenu,
    },
  ];

  return (
    <View
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        borderTopWidth: 1,
        paddingBottom: insets.bottom,
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.tab;
        const CustomIcon = tab.customIcon;

        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={0.7}
            onPress={() => {
              if (tab.tab === 'user') {
                handleProfilePress();
              } else {
                setActiveTab(tab.tab);
                router.replace('/(protected)/(user)/');
              }
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 4,
            }}>
            {tab.customIcon ? (
              <CustomIcon
                color={active ? '#ffffff' : '#6b7280'}
                focused={active}
                onPress={handleProfilePress}
              />
            ) : (
              <Icon color={active ? '#ffffff' : '#6b7280'} size={24} />
            )}
            <Text
              style={{
                color: active ? '#ffffff' : '#6b7280',
                fontSize: 10,
                marginTop: 4,
              }}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

