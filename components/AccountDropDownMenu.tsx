import { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, View, Text, Animated, PanResponder } from 'react-native';
import { UserCircle, Settings, LogOut, User, Users, Briefcase } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { CollapseDrawer } from './custom/collapse-drawer';
import { useNavigation } from '@/context/NavigationContext';
import { SwitchInterface } from './profile/switch-interface';

interface AccountDropDownMenuProps {
  color: string;
  focused: boolean;
  onPress: () => void;
}

export function AccountDropDownMenu({ color, focused, onPress }: AccountDropDownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { signOut } = useAuth();
  const { user, isLoaded } = useUser();

  const handleLongPress = (open: () => void) => {
    open();
  };

  const handlePressIn = (open: () => void) => {
    longPressTimerRef.current = setTimeout(() => {
      handleLongPress(open);
    }, 500);
  };

  const handlePressOut = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

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

  return (
    <CollapseDrawer
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={({ open }) => (
        <View
          onTouchStart={() => handlePressIn(open)}
          onTouchEnd={handlePressOut}
          onTouchCancel={handlePressOut}
          style={{ alignItems: 'center', justifyContent: 'center' }}>
          <UserCircle color={color} size={24} />
        </View>
      )}
      header={(close) => (
        <View className="gap-1  px-5 pb-4">
          {isLoaded && user && (
            <>
              <Text className="text-base font-semibold text-white">
                {user?.firstName ||
                  user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
                  'User'}
              </Text>
              <Text className="text-sm text-zinc-400">
                @
                {user?.username ||
                  user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
                  'username'}
              </Text>
            </>
          )}
        </View>
      )}
      content={(close) => (
        <View className="gap-4 px-5 pb-6">
          <SwitchInterface />

          {/* Menu Items */}
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => item.onPress(close)}
                className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 ${
                  item.danger ? 'border-rose-500/30 bg-rose-500/5' : 'border-white/10 bg-white/5'
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
                      item.danger ? 'text-rose-100' : 'text-white'
                    }`}>
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    />
  );
}
