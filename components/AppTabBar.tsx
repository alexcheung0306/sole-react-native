import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTabContext, isUserTab, isClientTab, UserTab, ClientTab } from '~/context/AppTabContext';
import { useUser } from '@clerk/clerk-expo';
import { useRouter, usePathname } from 'expo-router';
import { BriefcaseBusiness, Camera, Home, Search, LayoutDashboard, Bookmark, FolderKanban } from 'lucide-react-native';
import { AccountDropDownMenu } from '@/components/AccountDropDownMenu';

type TabConfig = {
  name: string;
  tab: UserTab | ClientTab;
  icon: React.ComponentType<{ color: string; size: number }>;
  onPress: () => void;
};

export default function AppTabBar() {
  const { activeTab, setActiveTab, isUserMode, isClientMode } = useAppTabContext();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // If not in a valid mode, don't render
  if (!isUserMode && !isClientMode) {
    return null;
  }

  // Sync active tab with pathname
  useEffect(() => {
    if (isUserMode) {
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
    } else if (isClientMode) {
      if (pathname?.includes('/dashboard') || pathname === '/(protected)/(client)/' || pathname === '/(protected)/(client)') {
        setActiveTab('dashboard');
      } else if (pathname?.includes('/bookmark')) {
        setActiveTab('bookmark');
      } else if (pathname?.includes('/talents')) {
        setActiveTab('talents');
      } else if (pathname?.includes('/projects')) {
        setActiveTab('projects');
      } else if (pathname?.includes('/client/')) {
        setActiveTab('client');
      }
    }
  }, [pathname, setActiveTab, isUserMode, isClientMode]);

  // Handler functions for user mode
  const handleUserHomePress = () => {
    if (activeTab !== 'home') {
      setActiveTab('home');
      router.replace('/(protected)/(user)' as any);
    }
  };

  const handleUserExplorePress = () => {
    if (activeTab !== 'explore') {
      setActiveTab('explore');
      router.replace('/(protected)/(user)' as any);
    }
  };

  const handleUserCameraPress = () => {
    if (activeTab !== 'camera') {
      setActiveTab('camera');
      router.replace('/(protected)/(user)' as any);
    }
  };

  const handleUserJobPress = () => {
    if (activeTab !== 'job') {
      setActiveTab('job');
      router.replace('/(protected)/(user)' as any);
    }
  };

  const handleUserProfilePress = () => {
    if (activeTab !== 'user') {
      setActiveTab('user');
      router.replace('/(protected)/(user)' as any);
    }
  };

  // Handler functions for client mode
  const handleClientDashboardPress = () => {
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
      router.replace('/(protected)/(client)' as any);
    }
  };

  const handleClientBookmarkPress = () => {
    if (activeTab !== 'bookmark') {
      setActiveTab('bookmark');
      router.replace('/(protected)/(client)' as any);
    }
  };

  const handleClientTalentsPress = () => {
    if (activeTab !== 'talents') {
      setActiveTab('talents');
      router.replace('/(protected)/(client)' as any);
    }
  };

  const handleClientProjectsPress = () => {
    if (activeTab !== 'projects') {
      setActiveTab('projects');
      router.replace('/(protected)/(client)' as any);
    }
  };

  const handleClientProfilePress = () => {
    if (activeTab !== 'client') {
      setActiveTab('client');
      router.replace('/(protected)/(client)' as any);
    }
  };

  // Define tabs based on current mode
  const getTabs = (): TabConfig[] => {
    if (isUserMode) {
      return [
        {
          name: 'Home',
          tab: 'home',
          icon: Home,
          onPress: handleUserHomePress,
        },
        {
          name: 'Explore',
          tab: 'explore',
          icon: Search,
          onPress: handleUserExplorePress,
        },
        {
          name: 'Camera',
          tab: 'camera',
          icon: Camera,
          onPress: handleUserCameraPress,
        },
        {
          name: 'Job',
          tab: 'job',
          icon: BriefcaseBusiness,
          onPress: handleUserJobPress,
        },
      ];
    } else if (isClientMode) {
      return [
        {
          name: 'Dashboard',
          tab: 'dashboard',
          icon: LayoutDashboard,
          onPress: handleClientDashboardPress,
        },
        {
          name: 'Bookmark',
          tab: 'bookmark',
          icon: Bookmark,
          onPress: handleClientBookmarkPress,
        },
        {
          name: 'Talents',
          tab: 'talents',
          icon: Search,
          onPress: handleClientTalentsPress,
        },
        {
          name: 'Projects',
          tab: 'projects',
          icon: FolderKanban,
          onPress: handleClientProjectsPress,
        },
      ];
    }
    return [];
  };

  const tabs = getTabs();
  const profileTab = isUserMode ? 'user' : 'client';
  const profilePressHandler = isUserMode ? handleUserProfilePress : handleClientProfilePress;
  const profileLabel = isUserMode ? 'User' : 'Client';

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

      {/* Render profile tab with AccountDropDownMenu */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 4,
        }}>
        <AccountDropDownMenu
          color={activeTab === profileTab ? '#ffffff' : '#6b7280'}
          focused={activeTab === profileTab}
          onPress={profilePressHandler}
        />
        <Text
          style={{
            color: activeTab === profileTab ? '#ffffff' : '#6b7280',
            fontSize: 10,
            marginTop: 4,
          }}>
          {profileLabel}
        </Text>
      </View>
    </View>
  );
}
