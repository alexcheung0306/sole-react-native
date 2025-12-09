import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

/**
 * GlassOverlay - Renders the glass effect layers (blur + gradient)
 * Can be used inside any View component, including Animated.View
 * 
 * @example
 * ```tsx
 * <Animated.View style={styles.container}>
 *   <GlassOverlay intensity={80} tint="dark" darkOverlayOpacity={0.5} />
 *   <Text>Your content</Text>
 * </Animated.View>
 * ```
 */
export function GlassOverlay({
  intensity = 80,
  tint = 'dark',
  darkOverlayOpacity = 0.5,
}: {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  darkOverlayOpacity?: number;
}) {
  return (
    <>
      {/* Blur background for glass effect - this blurs content behind it */}
      {/* 
        Note: BlurView from expo-blur blurs content behind it when:
        1. Positioned absolutely over other content
        2. The content behind is in the same view hierarchy
        3. On iOS, it uses UIVisualEffectView which provides native backdrop blur
        4. On Android, it uses RenderScript or native blur
        
        The blur effect is most visible when there's actual content (images, text, patterns) behind it.
        For solid colors, the blur effect may be less noticeable.
      */}
      <BlurView
        intensity={intensity}
        tint={tint}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Dark overlay to reduce visibility of content behind */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(0, 0, 0, ${darkOverlayOpacity})`, // Dark overlay to make background less visible
          },
        ]}
      />
      
      {/* Gradient overlay for the glass effect - matches the CSS gradient */}
      {/* This is placed on top of the blur to create the glass effect */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.15)',
          'rgba(255, 255, 255, 0.06)',
          'rgba(255, 255, 255, 0.02)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
}

type GlassViewProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
  borderWidth?: number;
  darkOverlayOpacity?: number;
};

 
export default function GlassView({
  children,
  style,
  className,
  intensity = 80,
  tint = 'dark',
  borderRadius,
  borderWidth = 1,
  darkOverlayOpacity = 0.5,
}: GlassViewProps) {
  const containerStyle: ViewStyle = {
    ...styles.container,
    ...(borderRadius !== undefined && { borderRadius }),
    ...(borderWidth !== undefined && { borderWidth }),
  };

  return (
    <View style={[containerStyle, style]} className={className}>
      <GlassOverlay intensity={intensity} tint={tint} darkOverlayOpacity={darkOverlayOpacity} />
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  content: {
    flex: 1,
  },
});

