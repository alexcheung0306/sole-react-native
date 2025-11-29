# Collapsible Header - Usage Guide

## Issue Fixed
The collapsible header wasn't showing slide transitions because the ScrollView wasn't properly integrated with React Native's Animated system.

## The Fix
1. **Use `Animated.ScrollView`** instead of regular `ScrollView`
2. **Use `animatedScrollHandler`** instead of `onScroll` prop
3. **Ensure proper height measurement** with `onHeightChange`

## Correct Usage

```tsx
import React from 'react';
import { View, Animated } from 'react-native';
import { CollapsibleHeader } from './components/CollapsibleHeader';
import { useScrollHeader } from './hooks/useScrollHeader';

export const MyScreen = () => {
  const { headerTranslateY, animatedScrollHandler, handleHeightChange } = useScrollHeader();

  return (
    <View style={{ flex: 1 }}>
      <CollapsibleHeader
        title="My Header"
        translateY={headerTranslateY}
        onHeightChange={handleHeightChange}
      />

      <Animated.ScrollView
        onScroll={animatedScrollHandler}
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
2. **ScrollView uses Animated.event** to track scroll position
3. **Header animates** based on scroll direction and position:
   - At top (≤20px): Always visible
   - Scrolling down past header height: Slides up to hide
   - Scrolling up: Slides down to show

## Debug Logs
Check console for:
- `Header height measured: X` - Confirms height is measured
- `Hiding header (scroll down)` - Animation triggered on scroll down
- `Showing header (scroll up)` - Animation triggered on scroll up
- `Showing header at top` - Animation triggered when reaching top

## Common Issues
- Make sure to import `Animated` from react-native
- Use `Animated.ScrollView` not regular `ScrollView`
- Use `animatedScrollHandler` not `handleScroll`
