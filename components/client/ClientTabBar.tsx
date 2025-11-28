import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClientTabContext } from '~/context/ClientTabContext';
import { useUser } from '@clerk/clerk-expo';
import { useRouter, usePathname } from 'expo-router';
import { LayoutDashboard, Bookmark, Search, FolderKanban } from 'lucide-react-native';
import { AccountDropDownMenu } from '@/components/AccountDropDownMenu';

export default function ClientTabBar() {
  const { activeTab, setActiveTab } = useClientTabContext();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname?.includes('/dashboard') || pathname === '/(protected)/(client)/' || pathname === '/(protected)/(client)') {
      setActiveTab('dashboard');
    } else if (pathname?.includes('/bookmark')) {
      setActiveTab('bookmark');
    } else if (pathname?.includes('/explore')) {
      setActiveTab('explore');
    } else if (pathname?.includes('/projects')) {
      setActiveTab('projects');
    } else if (pathname?.includes('/client/')) {
      setActiveTab('client');
    }
  }, [pathname, setActiveTab]);

  // Individual handler functions for each tab
  const handleDashboardPress = () => {
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
      router.replace('/(protected)/(client)' as any);
    }
  };

  const handleBookmarkPress = () => {
    if (activeTab !== 'bookmark') {
      setActiveTab('bookmark');
      router.replace('/(protected)/(client)' as any);
    }
  };

  const handleExplorePress = () => {
    if (activeTab !== 'explore') {
      setActiveTab('explore');
      router.replace('/(protected)/(client)' as any);
    }
  };

  const handleProjectsPress = () => {
    if (activeTab !== 'projects') {
      setActiveTab('projects');
      router.replace('/(protected)/(client)' as any);
    }
  };

  const handleProfilePress = () => {
    if (activeTab !== 'client') {
      setActiveTab('client');
      router.replace('/(protected)/(client)' as any);
    }
  };

  const tabs = [
    {
      name: 'Dashboard',
      tab: 'dashboard' as const,
      icon: LayoutDashboard,
      onPress: handleDashboardPress,
    },
    {
      name: 'Bookmark',
      tab: 'bookmark' as const,
      icon: Bookmark,
      onPress: handleBookmarkPress,
    },
    {
      name: 'Explore',
      tab: 'explore' as const,
      icon: Search,
      onPress: handleExplorePress,
    },
    {
      name: 'Projects',
      tab: 'projects' as const,
      icon: FolderKanban,
      onPress: handleProjectsPress,
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

      {/* Render client tab with AccountDropDownMenu */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 4,
        }}>
        <AccountDropDownMenu
          color={activeTab === 'client' ? '#ffffff' : '#6b7280'}
          focused={activeTab === 'client'}
          onPress={handleProfilePress}
        />
        <Text
          style={{
            color: activeTab === 'client' ? '#ffffff' : '#6b7280',
            fontSize: 10,
            marginTop: 4,
          }}>
          Client
        </Text>
      </View>
    </View>
  );
}

