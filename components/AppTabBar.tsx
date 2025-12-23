import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated as RNAnimated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTabContext, UserTab, ClientTab } from '~/context/AppTabContext';
import { useUser } from '@clerk/clerk-expo';
import { useRouter, usePathname } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useScrollAppTabBar } from '~/hooks/useScrollAppTabBar';
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
import { getDeviceScreenRadius } from '~/utils/device-screen-radius';

type TabConfig = {
  name: string;
  tab: UserTab | ClientTab;
  icon: React.ComponentType<{ color: string; size: number; fill?: string }>;
  onPress: () => void;
};

interface AppTabBarProps {
  showTabBar?: boolean;
}

export default function AppTabBar({ showTabBar = true }: AppTabBarProps) {
  const { activeTab, setActiveTab, isUserMode, isClientMode } = useAppTabContext();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [isNavigating, setIsNavigating] = useState(false);
  const { animatedTabBarStyle, handleHeightChange, collapseTabBar, showTabBar: scrollShowTabBar, setTabBarPositionByScale, getTabBarTranslateY } = useScrollAppTabBar();
  const radius = getDeviceScreenRadius();
  // Simple fade animation for mode transitions
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;
  const prevModeRef = useRef<'user' | 'client' | null>(null);
  
  // Slide animation for tab bar visibility
  // Initialize based on showTabBar - if false, start off-screen
  const slideTranslateY = useSharedValue(showTabBar ? 0 : 200);
  const tabBarHeightRef = useRef(0);

  // Animate fade when mode changes
  useEffect(() => {
    const currentMode = isUserMode ? 'user' : isClientMode ? 'client' : null;

    if (currentMode && prevModeRef.current && prevModeRef.current !== currentMode) {
      // Mode changed - fade out then fade in
      RNAnimated.sequence([
        RNAnimated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(fadeAnim, {
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

  // Animate slide when showTabBar changes
  useEffect(() => {
    if (showTabBar) {
      // Slide in (move to original position)
      slideTranslateY.value = withTiming(0, {
        duration: 300,
      });
    } else {
      // Slide out (move down off screen)
      // Use a large value to ensure it goes off screen, or use the actual height
      const translateValue = tabBarHeightRef.current > 0 ? tabBarHeightRef.current + insets.bottom + 20 : 200;
      slideTranslateY.value = withTiming(translateValue, {
        duration: 300,
      });
    }
  }, [showTabBar, insets.bottom, slideTranslateY]);

  // Animated style for slide animation
  const slideAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: slideTranslateY.value }],
    };
  });

  // If not in a valid mode, don't render
  if (!isUserMode && !isClientMode) {
    return null;
  }

  // Handlers are automatically exposed via the hook's useEffect

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
        // } else if (pathname?.includes('/camera')) {
        //   setActiveTab('camera');
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
    // Prevent multiple navigations
    if (isNavigating) {
      return;
    }

    setIsNavigating(true);

    router.push({
      pathname: '/(protected)/camera' as any,
      params: {
        functionParam: 'post',
        multipleSelection: 'true',
        aspectRatio: 'free',
        returnTab: activeTab
      },
    });

    // Reset navigation state after a delay to allow navigation to complete
    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
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
    <Animated.View
      style={[
        {
          marginHorizontal: 10,
          marginBottom: insets.bottom,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          overflow: 'hidden',
          borderRadius: radius,
          borderTopColor: 'rgba(255, 255, 255, 0.3)',
          zIndex: 10,
        },
        animatedTabBarStyle,
        slideAnimatedStyle,
      ]}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        tabBarHeightRef.current = height;
        handleHeightChange(height);
      }}>
      {/* Glass effect overlay */}
      <GlassOverlay intensity={80} tint="dark" />
      {/* Content */}
      <View
        style={{
          // paddingBottom: insets.bottom,
          // paddingTop: 4,
          padding: 10,
        }}>
        <RNAnimated.View
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
                disabled={tab.name === 'Camera' && isNavigating}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 4,
                }}>
                <Icon
                  color={tab.name === 'Camera' && isNavigating ? 'rgb(100, 100, 100)' : active ? 'rgb(164, 164, 164)' : 'rgb(164, 164, 164)'}
                  fill={active ? '#ffffff' : 'none'}
                  size={24}
                />
                <Text
                  style={{
                    color: tab.name === 'Camera' && isNavigating ? 'rgb(100, 100, 100)' : active ? 'rgb(255, 255, 255)' : 'rgb(164, 164, 164)',
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
            onPress={profilePressHandler}
            profileLabel={profileLabel}
            activeTab={activeTab}
            profileTab={profileTab}
          />
        </RNAnimated.View>
      </View>
    </Animated.View>
  );
}
