import { forwardRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable } from 'react-native';

export const ChatButton = forwardRef<typeof Pressable, { onPress?: () => void }>(
  ({ onPress }, ref) => {
    return (
      <Pressable 
        onPress={onPress}
        className="mr-4 active:opacity-50 active:scale-90 transition-all duration-150 ease-in-out"
      >
        <FontAwesome
          name="comment-o"
          size={25}
          color="black"
        />
      </Pressable>
    );
  }
);

ChatButton.displayName = 'ChatButton';