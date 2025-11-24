import React, { useState, useRef } from 'react';
import { Pressable, TouchableOpacity, View, Text } from 'react-native';
import { UserCircle, Settings, LogOut, User, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
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
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const justOpenedRef = useRef(false);

  console.log('isOpen', isOpen);
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

  const handlePressIn = () => {
    // Start timer for long press - opens drawer while holding
    longPressTimerRef.current = setTimeout(() => {
      console.log('Long press detected, opening drawer');
      justOpenedRef.current = true;
      setIsOpen(true);
      longPressTimerRef.current = null;
      // Reset the flag after a short delay to allow the drawer to fully open
      setTimeout(() => {
        justOpenedRef.current = false;
      }, 500);
    }, 400);
  };

  const handlePressOut = () => {
    // Clear timer if still running (means it was a short tap)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      // Single tap - navigate to profile (only if drawer is not open and wasn't just opened)
      if (!isOpen && !justOpenedRef.current) {
        console.log('Single tap detected, navigating');
        if (onPress) {
          onPress();
        }
      }
    }
    // If drawer is already open or just opened, don't do anything - let user close it manually
    // The drawer will stay open until user drags it down or taps backdrop
  };

  return (
    <>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ alignItems: 'center', justifyContent: 'center' }}>
        <UserCircle color={color} size={24} />
      </Pressable>

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
            <SwitchInterface />
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
