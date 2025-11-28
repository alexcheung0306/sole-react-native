import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserTabContext } from '~/context/UserTabContext';
import { useUser } from '@clerk/clerk-expo';
import { useRouter, usePathname } from 'expo-router';
import { BriefcaseBusiness, Camera, Home, Search } from 'lucide-react-native';
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

  // Individual handler functions for each tab
 // we go to /(protected)/(user) as now we render the UserSwipeableContainer at user tab
  const handleHomePress = () => {
    if (activeTab !== 'home') {
      setActiveTab('home');
      router.replace('/(protected)/(user)' as any);
    }
  };

  const handleExplorePress = () => {
    if (activeTab !== 'explore') {
      setActiveTab('explore');
      router.replace('/(protected)/(user)' as any);
    }
  };

  const handleCameraPress = () => {
    if (activeTab !== 'camera') {
      setActiveTab('camera');
      router.replace('/(protected)/(user)' as any);
    }
  };

  const handleJobPress = () => {
    if (activeTab !== 'job') {
      setActiveTab('job');
      router.replace('/(protected)/(user)' as any);
    }
  };

  const handleProfilePress = () => {
    if (activeTab !== 'user') {
      setActiveTab('user');
      router.replace('/(protected)/(user)' as any);
    }
  };

  const tabs = [
    {
      name: 'Home',
      tab: 'home' as const,
      icon: Home,
      onPress: handleHomePress,
    },
    {
      name: 'Explore',
      tab: 'explore' as const,
      icon: Search,
      onPress: handleExplorePress,
    },
    {
      name: 'Camera',
      tab: 'camera' as const,
      icon: Camera,
      onPress: handleCameraPress,
    },
    {
      name: 'Job',
      tab: 'job' as const,
      icon: BriefcaseBusiness,
      onPress: handleJobPress,
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
      {/* Render regular tabs */}
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.tab;

        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={0.7}
            onPress={tab.onPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 4,
            }}>
            <Icon color={active ? '#ffffff' : '#6b7280'} size={24} />
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

      {/* Render user tab with AccountDropDownMenu */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 4,
        }}>
        <AccountDropDownMenu
          color={activeTab === 'user' ? '#ffffff' : '#6b7280'}
          focused={activeTab === 'user'}
          onPress={handleProfilePress}
        />
        <Text
          style={{
            color: activeTab === 'user' ? '#ffffff' : '#6b7280',
            fontSize: 10,
            marginTop: 4,
          }}>
          User
        </Text>
      </View>
    </View>
  );
}

