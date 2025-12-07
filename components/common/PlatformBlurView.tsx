import React from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { BlurView as ExpoBlurView } from 'expo-blur';
import { BlurView as NativeBlurView } from '@react-native-community/blur';

type BlurType = 'xlight' | 'light' | 'dark';

type Props = {
  style?: StyleProp<ViewStyle>;
  blurType?: BlurType;
  blurAmount?: number;
  intensity?: number;
  children?: React.ReactNode;
};

/**
 * Cross-platform blur:
 * - iOS: native @react-native-community/blur for stronger effect
 * - Android: expo-blur fallback (avoids AndroidBlurView registration issues)
 */
export function PlatformBlurView({
  style,
  blurType = 'dark',
  blurAmount = 20,
  intensity,
  children,
}: Props) {
  if (Platform.OS === 'android') {
    const expoIntensity = intensity ?? Math.min(blurAmount * 4, 100);
    const tint: 'light' | 'dark' | 'default' = blurType === 'light' || blurType === 'xlight' ? 'light' : 'dark';
    return (
      <ExpoBlurView intensity={expoIntensity} tint={tint} style={style}>
        {children}
      </ExpoBlurView>
    );
  }

  return (
    <NativeBlurView blurType={blurType} blurAmount={blurAmount} style={style}>
      {children}
    </NativeBlurView>
  );
}

