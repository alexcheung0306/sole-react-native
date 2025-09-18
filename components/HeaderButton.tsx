import { forwardRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

export const HeaderButton = forwardRef<typeof Pressable, { onPress?: () => void }>(
  ({ onPress }, ref) => {
    return (
      <Pressable onPress={onPress} style={styles.buttonContainer}>
        {({ pressed }) => (
          <Ionicons
            name="chatbubble-outline"
            size={24}
            color="#fff"
            style={[
              styles.headerRight,
              {
                opacity: pressed ? 0.5 : 1,
              },
            ]}
          />
        )}
      </Pressable>
    );
  }
);

HeaderButton.displayName = 'HeaderButton';

export const styles = StyleSheet.create({
  buttonContainer: {
    padding: 8, // Add padding for better touch target and alignment
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    // Icon styling is handled by the icon component
  },
});
