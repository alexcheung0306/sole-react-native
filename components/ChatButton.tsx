import { forwardRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const ChatButton = forwardRef<typeof Pressable, { onPress?: () => void }>(
  ({ onPress }, ref) => {
    const { isDark } = useTheme();
    
    return (
      <Pressable 
        onPress={onPress}
        className="mr-4 active:opacity-50 active:scale-90 transition-all duration-150 ease-in-out"
      >
        <FontAwesome
          name="comment-o"
          size={25}
          color={isDark ? '#FFFFFF': '#111827'}
        />
      </Pressable>
    );
  }
);

ChatButton.displayName = 'ChatButton';