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
  isScrollCollapsible?: boolean;
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
  isScrollCollapsible = true,
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
        // Only apply animated style if scroll collapsible is enabled
        isScrollCollapsible ? animatedStyle : undefined,
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
          paddingTop: insets.top + 12, // Add extra padding for better spacing
          paddingHorizontal: 0,
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 56, // Increased min height for better proportions
          paddingBottom: secondHeader ? 0 : 0, // Reduce bottom padding when secondHeader exists
        }}>
        {/* Header Left - Fixed width */}
        {headerLeft && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {headerLeft}
          </View>
        )}

        {/* Title - Takes all remaining width */}
        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: headerLeft ? 'flex-start' : 'center',
          marginLeft: headerLeft ? 8 : 0,
          marginRight: headerRight ? 8 : 0,
        }}>
          {typeof title === 'string' ? (
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: textColor || defaultText,
                textAlign: headerLeft || headerRight ? 'left' : 'center',
                flex: 1,
              }}
              numberOfLines={1}
              ellipsizeMode="middle">
              {title}
            </Text>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              {title}
            </View>
          )}
        </View>

        {/* Header Right - Fixed width */}
        {headerRight && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {headerRight}
          </View>
        )}
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
