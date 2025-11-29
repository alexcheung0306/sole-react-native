# Collapsible Header - Usage Guide

## Issue Fixed
The collapsible header wasn't showing slide transitions because the ScrollView wasn't properly integrated with React Native's Animated system.

## The Fix
1. **Use `Animated.ScrollView`** instead of regular `ScrollView`
2. **Use `onScroll` handler** from the hook
3. **Use `animatedStyle`** prop on CollapsibleHeader
4. **Ensure proper height measurement** with `onHeightChange`

## Correct Usage

```tsx
import React from 'react';
import { View, Animated } from 'react-native';
import { CollapsibleHeader } from './components/CollapsibleHeader';
import { useScrollHeader } from './hooks/useScrollHeader';

export const MyScreen = () => {
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();

  return (
    <View style={{ flex: 1 }}>
      <CollapsibleHeader
        title="My Header"
        animatedStyle={animatedHeaderStyle}
        onHeightChange={handleHeightChange}
      />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Your content here */}
        <View style={{ paddingTop: 100 }}> {/* Space for header */}
          {/* Content */}
        </View>
      </Animated.ScrollView>
    </View>
  );
};
```

## How It Works

1. **Header measures its height** using `onLayout` and reports it via `onHeightChange`
2. **ScrollView uses reanimated worklets** to track scroll position on UI thread
3. **Header animates with reanimated** `withSpring` and `withTiming` for smooth 60fps animations:
   - At top (≤20px): Smooth spring animation to show (no bounce)
   - Scrolling down: Fast timing animation to hide immediately
   - Scrolling up: Smooth spring animation to show (no bounce)

## Debug Logs
Check console for:
- `Header height measured: X` - Confirms height is measured
- Animation triggers (commented out for production)

## Common Issues
- Make sure to import `Animated` from `react-native-reanimated`
- Use `Animated.ScrollView` not regular `ScrollView`
- Use `animatedStyle` prop on CollapsibleHeader (not `translateY`)
- Use `onScroll` handler from hook (not `handleScroll`)
