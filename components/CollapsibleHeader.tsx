import React, { useCallback } from 'react';
import { View, Text, StatusBar } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassOverlay } from '@/components/custom/GlassView';

interface CollapsibleHeaderProps {
  title: string | React.ReactNode;
  headerRight?: React.ReactNode;
  headerLeft?: React.ReactNode;
  secondHeader?: React.ReactNode;
  animatedStyle?: any; // Reanimated animated style
  onHeightChange?: (height: number) => void;
  backgroundColor?: string;
  textColor?: string;
  isDark?: boolean;
  gradientOpacity?: number; // Opacity for the top of the gradient (0-1)
}

export const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({
  title,
  headerRight,
  headerLeft,
  secondHeader = null,
  animatedStyle,
  onHeightChange,
  backgroundColor,
  textColor,
  isDark = true,
  gradientOpacity = 0.9,
}) => {
  const insets = useSafeAreaInsets();

  // Dark theme defaults
  const defaultBg = isDark ? `rgba(0, 0, 0, ${gradientOpacity})` : '#fff';
  const defaultText = isDark ? '#fff' : '#000';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)';

  const handleLayout = useCallback(
    (event: any) => {
      const { height } = event.nativeEvent.layout;
      // console.log('Header height:', height); // Debug: Remove after testing
      onHeightChange?.(height);
    },
    [onHeightChange]
  );

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        },
        animatedStyle,
      ]}
      onLayout={handleLayout}>
      {/* Glass effect overlay */}
      <GlassOverlay intensity={80} tint={isDark ? 'dark' : 'light'} />

      {/* Border */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}
      />
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* first header */}
      <View
        style={{
          paddingTop: insets.top + 8, // Add extra padding for better spacing
          paddingHorizontal: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 56, // Increased min height for better proportions
          paddingBottom: secondHeader ? 0 : 0, // Reduce bottom padding when secondHeader exists
        }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          {headerLeft}
          {typeof title === 'string' ? (
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: textColor || defaultText,
                marginLeft: headerLeft ? 8 : 0,
                paddingHorizontal: 20,
              }}>
              {title}
            </Text>
          ) : (
            <View
              style={{ marginLeft: headerLeft ? 8 : 0, flex: 1, marginRight: headerRight ? 8 : 0 }}>
              {title}
            </View>
          )}
        </View>
        {headerRight && <View style={{ flex: 1, alignItems: 'flex-end' }}>{headerRight}</View>}
      </View>

      {/* second header */}
      {secondHeader && (
        <View
          style={{
            paddingHorizontal: 0,
            paddingBottom: 12,
            backgroundColor: 'transparent',
          }}>
          {secondHeader}
        </View>
      )}
    </Animated.View>
  );
};
