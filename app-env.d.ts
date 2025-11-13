// @ts-ignore
/// <reference types="nativewind/types" />

declare module 'expo-blur' {
  import type { ComponentType } from 'react';
  import type { ViewProps } from 'react-native';

  interface BlurViewProps extends ViewProps {
    tint?: 'light' | 'dark' | 'default';
    intensity?: number;
  }

  export const BlurView: ComponentType<BlurViewProps>;
}