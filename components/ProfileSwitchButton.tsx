import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { User, Briefcase } from 'lucide-react-native';
import { useNavigation } from '~/context/NavigationContext';

interface ProfileSwitchButtonProps {
  style?: any;
}

export function ProfileSwitchButton({ style }: ProfileSwitchButtonProps) {
  const { currentMode, toggleMode } = useNavigation();

  const handlePress = () => {
    toggleMode();
  };

  return (
    <View className="rounded-lg border border-gray-700 bg-gray-800 p-4 ">
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8, fontWeight: '500' }}>
        SWITCH MODE
      </Text>

      {/* Toggle Container */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#111827',
          borderRadius: 8,
          padding: 4,
          borderWidth: 1,
          borderColor: '#374151',
        }}>
        {/* User Option */}
        <TouchableOpacity
          onPress={() => currentMode !== 'user' && handlePress()}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 6,
            backgroundColor: currentMode === 'user' ? '#3b82f6' : 'transparent',
          }}
          activeOpacity={0.7}>
          <User
            size={16}
            color={currentMode === 'user' ? '#ffffff' : '#6b7280'}
            style={{ marginRight: 6 }}
          />
          <Text className="text-sm font-medium text-white">User</Text>
        </TouchableOpacity>

        {/* Client Option */}
        <TouchableOpacity
          onPress={() => currentMode !== 'client' && handlePress()}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 6,
            backgroundColor: currentMode === 'client' ? '#3b82f6' : 'transparent',
          }}
          activeOpacity={0.7}>
          <Briefcase
            size={16}
            color={currentMode === 'client' ? '#ffffff' : '#6b7280'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              color: currentMode === 'client' ? '#ffffff' : '#6b7280',
              fontSize: 14,
              fontWeight: currentMode === 'client' ? '600' : '400',
            }}>
            Client
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
