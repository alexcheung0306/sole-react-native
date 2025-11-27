import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClientTabContext } from '~/context/ClientTabContext';
import { useUser } from '@clerk/clerk-expo';
import { useRouter, usePathname } from 'expo-router';
import { LayoutDashboard, Bookmark, Search, FolderKanban, UserCircle } from 'lucide-react-native';
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

  const handleProfilePress = () => {
    if (user?.username) {
      setActiveTab('client');
      // Navigate to index route to show the swipeable container at client tab
      router.replace('/(protected)/(client)/');
    }
  };

  const tabs = [
    {
      name: 'Dashboard',
      tab: 'dashboard' as const,
      icon: LayoutDashboard,
    },
    {
      name: 'Bookmark',
      tab: 'bookmark' as const,
      icon: Bookmark,
    },
    {
      name: 'Explore',
      tab: 'explore' as const,
      icon: Search,
    },
    {
      name: 'Projects',
      tab: 'projects' as const,
      icon: FolderKanban,
    },
    {
      name: 'Client',
      tab: 'client' as const,
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
              if (tab.tab === 'client') {
                handleProfilePress();
              } else {
                setActiveTab(tab.tab);
                router.replace('/(protected)/(client)/');
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

