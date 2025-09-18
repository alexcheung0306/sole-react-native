import React from 'react';
import { View, Text, TouchableOpacity, Animated, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface CollapsibleHeaderProps {
  title: string;
  headerRight?: React.ReactNode;
  headerLeft?: React.ReactNode;
  translateY: Animated.Value;
  backgroundColor?: string;
  textColor?: string;
  isDark?: boolean;
}

export const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({
  title,
  headerRight,
  headerLeft,
  translateY,
  backgroundColor,
  textColor,
  isDark = true,
}) => {
  const insets = useSafeAreaInsets();
  
  // Dark theme defaults
  const defaultBg = isDark ? 'rgba(0, 0, 0, 0.9)' : '#fff';
  const defaultText = isDark ? '#fff' : '#000';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: backgroundColor || defaultBg,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
        transform: [{ translateY }],
      }}
    >
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={backgroundColor || defaultBg} 
      />
      <View
        style={{
          paddingTop: insets.top + 8, // Add extra padding for better spacing
          paddingHorizontal: 16,
          paddingBottom: 16, // Increased bottom padding
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 56, // Increased min height for better proportions
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          {headerLeft}
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: textColor || defaultText,
              marginLeft: headerLeft ? 8 : 0,
            }}
          >
            {title}
          </Text>
        </View>
        {headerRight && (
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            {headerRight}
          </View>
        )}
      </View>
    </Animated.View>
  );
};
