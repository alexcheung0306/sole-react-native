import React, { useState, useRef } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { UserCircle, Settings, LogOut, User, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import CollapseDrawer2 from './custom/collapse-drawer2';
import { SwitchInterface } from './profile/switch-interface';

interface AccountDropDownMenuProps {
  color: string;
  focused: boolean;
  onPress: () => void;
}

export function AccountDropDownMenu({ color, focused, onPress }: AccountDropDownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { signOut } = useAuth();
  const { user, isLoaded } = useUser();

  const handleSettings = (close: () => void) => {
    close();
    router.push('/settings' as any);
  };

  const handleSwitchAccount = (close: () => void) => {
    close();
    // Add switch account logic here
  };

  const handleSignOut = async (close: () => void) => {
    close();
    try {
      await signOut();
      router.replace('/sign-in' as any);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const menuItems = [
    {
      icon: User,
      label: 'View Profile',
      onPress: (close: () => void) => {
        close();
        onPress(); // Navigate to profile
      },
    },
    {
      icon: Settings,
      label: 'Settings',
      onPress: handleSettings,
    },
    {
      icon: Users,
      label: 'Switch Account',
      onPress: handleSwitchAccount,
    },
    {
      icon: LogOut,
      label: 'Sign Out',
      onPress: handleSignOut,
      danger: true,
    },
  ];

  const longPressTriggeredRef = useRef(false);

  const handleLongPress = () => {
    longPressTriggeredRef.current = true;
    if (!isOpen) {
      setIsOpen(true);
    }
    // Reset flag after delay to allow tap to check it
    setTimeout(() => {
      longPressTriggeredRef.current = false;
    }, 500);
  };

  const handleTap = () => {
    // Don't navigate if long press was just triggered or drawer is open
    if (longPressTriggeredRef.current || isOpen) {
      return;
    }
    
    // Navigate on tap
    if (onPress) {
      onPress();
    }
  };

  // Long press gesture to open drawer
  const longPressGesture = Gesture.LongPress()
    .minDuration(400) // 400ms long press
    .onStart(() => {
      runOnJS(handleLongPress)();
    });

  // Tap gesture to navigate to profile
  const tapGesture = Gesture.Tap()
    .maxDuration(300) // Must be shorter than long press duration
    .onEnd(() => {
      runOnJS(handleTap)();
    });

  // Use Simultaneous so both gestures can be detected, but logic prevents conflict
  const composedGesture = Gesture.Simultaneous(tapGesture, longPressGesture);

  return (
    <>
      <GestureDetector gesture={composedGesture}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <UserCircle color={color} size={24} />
        </View>
      </GestureDetector>

      <CollapseDrawer2
        showDrawer={isOpen}
        setShowDrawer={setIsOpen}
        title={
          isLoaded && user
            ? user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User'
            : 'Account'
        }>
        <View className="gap-4" style={{ width: '100%' }}>
          {/* User Info */}
          {isLoaded && user && (
            <View className="gap-1 px-5 pb-4">
              <Text className="text-base font-semibold text-white">
                {user?.firstName ||
                  user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
                  'User'}
              </Text>
              <Text className="text-sm text-gray-300">
                @
                {user?.username ||
                  user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
                  'username'}
              </Text>
            </View>
          )}

          {/* Switch Interface */}
          <View style={{ width: '100%', overflow: 'hidden', paddingHorizontal: 20 }}>
            <SwitchInterface setIsOpen={setIsOpen}/>
          </View>

          {/* Menu Items */}
          <View className="gap-3 px-5">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => item.onPress(() => setIsOpen(false))}
                  className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 ${
                    item.danger ? 'border-rose-500/30 bg-rose-500/10' : 'border-white/10 bg-white/5'
                  }`}
                  activeOpacity={0.85}>
                  <View
                    className={`rounded-full p-2 ${
                      item.danger ? 'bg-rose-500/20' : 'bg-blue-500/20'
                    }`}>
                    <Icon size={20} color={item.danger ? '#fecaca' : '#bfdbfe'} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-sm font-semibold ${
                        item.danger ? 'text-rose-300' : 'text-white'
                      }`}>
                      {item.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </CollapseDrawer2>
    </>
  );
}
