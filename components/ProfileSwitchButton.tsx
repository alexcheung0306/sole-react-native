import React from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { UserCircle } from 'lucide-react-native';
import { useNavigation } from '~/context/NavigationContext';

interface ProfileSwitchButtonProps {
  color?: string;
  size?: number;
  style?: any;
}

export function ProfileSwitchButton({ 
  color = '#fff', 
  size = 24, 
  style 
}: ProfileSwitchButtonProps) {
  const { currentMode, toggleMode } = useNavigation();

  const handlePress = () => {
    console.log('ProfileSwitchButton clicked, current mode:', currentMode);
    console.log('Directly switching mode...');
    toggleMode();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        {
          padding: 8,
          borderRadius: 20,
          backgroundColor: currentMode === 'client' 
            ? 'rgba(59, 130, 246, 0.2)' 
            : 'rgba(34, 197, 94, 0.2)',
          borderWidth: 1,
          borderColor: currentMode === 'client' 
            ? 'rgba(59, 130, 246, 0.5)' 
            : 'rgba(34, 197, 94, 0.5)',
        },
        style,
      ]}
      activeOpacity={0.7}
    >
      <UserCircle 
        color={currentMode === 'client' ? '#3B82F6' : '#22C55E'} 
        size={size} 
      />
    </TouchableOpacity>
  );
}
