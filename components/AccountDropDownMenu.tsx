import { useState, useRef } from 'react';
import { TouchableOpacity, View, Text, Modal, Pressable, Dimensions } from 'react-native';
import { UserCircle, Settings, LogOut, User, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileSwitchButton } from './ProfileSwitchButton';

interface AccountDropDownMenuProps {
  color: string;
  focused: boolean;
  onPress: () => void;
}

export function AccountDropDownMenu({ color, focused, onPress }: AccountDropDownMenuProps) {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { signOut } = useAuth();
  const { user, isLoaded } = useUser();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get('window');
  
  // Tab bar is typically 50-60px + bottom inset
  const tabBarHeight = 50 + insets.bottom;
  const dropdownBottom = tabBarHeight + 8; // 8px gap above tab bar

  const handleLongPress = () => {
    setDropdownVisible(true);
  };

  const handlePressIn = () => {
    longPressTimerRef.current = setTimeout(() => {
      handleLongPress();
    }, 500);
  };

  const handlePressOut = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleSettings = () => {
    setDropdownVisible(false);
    router.push('/settings' as any);
  };

  const handleSwitchAccount = () => {
    setDropdownVisible(false);
    // Add switch account logic here
  };

  const handleSignOut = async () => {
    setDropdownVisible(false);
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
      onPress: () => {
        setDropdownVisible(false);
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
    <>
      <View
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        onTouchCancel={handlePressOut}
        style={{ alignItems: 'center', justifyContent: 'center' }}>
        <UserCircle color={color} size={24} />
      </View>

      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onPress={() => setDropdownVisible(false)}>
          {/* Dropdown Menu */}
          <View
            style={{
              position: 'absolute',
              bottom: dropdownBottom, // Position above tab bar
              right: 16, // Align to right edge
              backgroundColor: '#1f2937',
              borderRadius: 12,
              paddingVertical: 8,
              minWidth: 220,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              borderWidth: 1,
              borderColor: '#374151',
            }}>
            {/* User Info Header */}
            {isLoaded && user && (
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#374151',
                }}>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                  {user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User'}
                </Text>
                <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 2 }}>
                  @{user?.username || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'username'}
                </Text>
              </View>
            )}
            <ProfileSwitchButton />


            {/* Menu Items */}
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={item.onPress}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: 'transparent',
                  }}
                  activeOpacity={0.7}>
                  <Icon
                    size={20}
                    color={item.danger ? '#ef4444' : '#9ca3af'}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      color: item.danger ? '#ef4444' : '#ffffff',
                      fontSize: 15,
                      fontWeight: item.danger ? '600' : '400',
                    }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

