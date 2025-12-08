import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useAppTabContext,
  isUserTab,
  isClientTab,
  UserTab,
  ClientTab,
} from '~/context/AppTabContext';
import { useUser } from '@clerk/clerk-expo';
import { useRouter, usePathname } from 'expo-router';
import {
  BriefcaseBusiness,
  Camera,
  Home,
  Search,
  LayoutDashboard,
  Bookmark,
  FolderKanban,
} from 'lucide-react-native';
import { AccountDropDownMenu } from '@/components/AccountDropDownMenu';
import { GlassOverlay } from '@/components/custom/GlassView';

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

  // Simple fade animation for mode transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevModeRef = useRef<'user' | 'client' | null>(null);

  // Animate fade when mode changes
  useEffect(() => {
    const currentMode = isUserMode ? 'user' : isClientMode ? 'client' : null;

    if (currentMode && prevModeRef.current && prevModeRef.current !== currentMode) {
      // Mode changed - fade out then fade in
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (currentMode) {
      prevModeRef.current = currentMode;
    }
  }, [isUserMode, isClientMode, fadeAnim]);

  // If not in a valid mode, don't render
  if (!isUserMode && !isClientMode) {
    return null;
  }

  // Sync active tab with pathname
  useEffect(() => {
    if (isUserMode) {
      if (
        pathname?.includes('/home') ||
        pathname === '/(protected)/(user)/' ||
        pathname === '/(protected)/(user)'
      ) {
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
      if (
        pathname?.includes('/dashboard') ||
        pathname === '/(protected)/(client)/' ||
        pathname === '/(protected)/(client)'
      ) {
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
    }
  };

  const handleUserExplorePress = () => {
    if (activeTab !== 'explore') {
      setActiveTab('explore');
    }
  };

  const handleUserCameraPress = () => {
    if (activeTab !== 'camera') {
      setActiveTab('camera');
    }
  };

  const handleUserJobPress = () => {
    if (activeTab !== 'job') {
      setActiveTab('job');
    }
  };

  const handleUserProfilePress = () => {
    if (activeTab !== 'user') {
      setActiveTab('user');
    }
  };

  // Handler functions for client mode
  const handleClientDashboardPress = () => {
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  };

  const handleClientBookmarkPress = () => {
    if (activeTab !== 'bookmark') {
      setActiveTab('bookmark');
    }
  };

  const handleClientTalentsPress = () => {
    if (activeTab !== 'talents') {
      setActiveTab('talents');
    }
  };

  const handleClientProjectsPress = () => {
    if (activeTab !== 'projects') {
      setActiveTab('projects');
    }
  };

  const handleClientProfilePress = () => {
    if (activeTab !== 'client') {
      setActiveTab('client');
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
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.3)',
      }}>
      {/* Glass effect overlay */}
      <GlassOverlay intensity={80} tint="dark" />
      {/* Content */}
      <View
        style={{
          paddingBottom: insets.bottom,
          paddingTop: 4,
        }}>
        <Animated.View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            opacity: fadeAnim,
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
                <Icon color={active ? 'rgb(255, 255, 255)' : 'rgb(164, 164, 164)'} size={24} />
                <Text
                  style={{
                    color: active ? 'rgb(255, 255, 255)' : 'rgb(164, 164, 164)',
                    fontSize: 10,
                    marginTop: 4,
                  }}>
                  {tab.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Render profile tab with AccountDropDownMenu */}

          <AccountDropDownMenu
            color={activeTab === profileTab ? 'rgb(255, 255, 255)' : 'rgb(164, 164, 164)'}
            focused={activeTab === profileTab}
            onPress={profilePressHandler} profileLabel={profileLabel} activeTab={activeTab} profileTab={profileTab} />

        </Animated.View>
      </View>
    </View>
  );
}
