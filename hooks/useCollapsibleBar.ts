import { useState, useRef, useCallback } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnUI,
  cancelAnimation,
  useDerivedValue,
} from 'react-native-reanimated';

export type CollapsibleBarType = 'header' | 'tabBar';

interface UseCollapsibleBarOptions {
  type: CollapsibleBarType;
  enableScroll?: boolean; // Only for header
}

export const useCollapsibleBar = (options: UseCollapsibleBarOptions) => {
  const { type, enableScroll = type === 'header' } = options;
  const isHeader = type === 'header';
  
  const [barHeight, setBarHeight] = useState(0);
  const barHeightShared = useSharedValue(0); // Shared value for worklet access
  const scrollY = useSharedValue(0);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('down');
  const barTranslateY = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  const handleHeightChange = useCallback((height: number) => {
    setBarHeight(height);
    barHeightShared.value = height; // Update shared value for worklet access
  }, []);

  // Scroll handler (only for header)
  const onScroll = useCallback((event: any) => {
    if (!enableScroll || !isHeader) return;
    
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY.current;

    // Update scrollY shared value
    scrollY.value = currentScrollY;

    // Always show header when near the top (within 20px)
    if (currentScrollY <= 10) {
      if (barTranslateY.value !== 0 && !isAnimating.value) {
        isAnimating.value = true;
        barTranslateY.value = withSpring(0, {
          damping: 40,
          stiffness: 250,
          mass: 1,
        }, () => {
          isAnimating.value = false;
        });
      }
      lastScrollY.current = currentScrollY;
      return;
    }

    // Only trigger animation if scroll delta is significant enough and height is known
    if (Math.abs(scrollDelta) > 1 && barHeight > 0) {
      const collapsedPosition = isHeader ? -barHeight : barHeight;
      
      if (scrollDelta > 0) {
        // Scrolling down - hide (header up, tab bar down)
        if (barTranslateY.value !== collapsedPosition && !isAnimating.value) {
          isAnimating.value = true;
          barTranslateY.value = withTiming(collapsedPosition, {
            duration: 200,
          }, () => {
            isAnimating.value = false;
          });
        }
        scrollDirection.current = 'down';
      } else if (scrollDelta < 0) {
        // Scrolling up - show
        if (barTranslateY.value !== 0 && !isAnimating.value) {
          isAnimating.value = true;
          barTranslateY.value = withSpring(0, {
            damping: 35,
            stiffness: 200,
            mass: 1,
          }, () => {
            isAnimating.value = false;
          });
        }
        scrollDirection.current = 'up';
      }
    }

    lastScrollY.current = currentScrollY;
  }, [barHeight, enableScroll, isHeader]);

  // Create animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: barTranslateY.value }],
  }));

  const resetBar = useCallback(() => {
    barTranslateY.value = 0;
    lastScrollY.current = 0;
  }, []);

  // Worklet function to collapse on UI thread (faster, no JS thread blocking)
  const collapseBarWorklet = useCallback(() => {
    'worklet';
    const height = barHeightShared.value;
    if (height > 0) {
      cancelAnimation(barTranslateY);
      isAnimating.value = true;
      // For tab bar, use a multiplier to translate more (1.5x the height for more movement)
      const translationMultiplier = isHeader ? 1 : 1.5; // Tab bar translates 1.5x more
      const collapsedPosition = isHeader ? -height : height * translationMultiplier;
      barTranslateY.value = withTiming(collapsedPosition, {
        duration: 100, // Faster animation for zoom responsiveness
      }, (finished) => {
        'worklet';
        if (finished) {
          isAnimating.value = false;
        }
      });
    }
  }, [isHeader]);

  const collapseBar = useCallback(() => {
    // Execute on UI thread for better performance
    runOnUI(collapseBarWorklet)();
  }, [collapseBarWorklet]);

  const showBar = useCallback(() => {
    // Cancel any ongoing animation
    cancelAnimation(barTranslateY);
    isAnimating.value = true;
    barTranslateY.value = withTiming(0, {
      duration: 100, // Faster animation for zoom responsiveness
    }, (finished) => {
      if (finished) {
        isAnimating.value = false;
      }
    });
  }, []);

  // Set bar position based on zoom scale (proportional translation)
  // scale: minScale = start position, maxScale = fully collapsed
  const setBarPositionByScale = useCallback((scale: number, startPosition: number, minScale: number = 1, maxScale: number = 3) => {
    const height = barHeightShared.value; // Use shared value for faster access
    if (height <= 0) return;
    
    // Cancel any ongoing animation
    cancelAnimation(barTranslateY);
    
    // Normalize scale: minScale -> 0 (start position), maxScale -> 1 (fully collapsed)
    const normalizedScale = Math.max(0, Math.min(1, (scale - minScale) / (maxScale - minScale)));
    
    // Calculate translateY: interpolate from startPosition to collapsed position
    // For tab bar, use a multiplier to translate more (1.5x the height for more movement)
    const translationMultiplier = isHeader ? 1 : 1.5; // Tab bar translates 1.5x more
    const collapsedPosition = isHeader ? -height : height * translationMultiplier;
    const targetTranslateY = startPosition + (collapsedPosition - startPosition) * normalizedScale;
    
    // Update bar position smoothly but quickly
    barTranslateY.value = withTiming(targetTranslateY, {
      duration: 50, // Very quick response to scale changes for smooth following
    });
  }, [isHeader]);

  // Cache bar state in refs for fast synchronous access (updated via worklet)
  const cachedBarTranslateY = useRef<number>(0);
  const cachedIsBarCollapsed = useRef<boolean>(false);

  // Update cached values on UI thread via derived value (no JS thread blocking)
  useDerivedValue(() => {
    'worklet';
    cachedBarTranslateY.current = barTranslateY.value;
    const height = barHeightShared.value;
    if (isHeader) {
      cachedIsBarCollapsed.current = height > 0 && barTranslateY.value < -height / 2;
    } else {
      cachedIsBarCollapsed.current = height > 0 && barTranslateY.value > height / 2;
    }
  });

  // Get current bar translateY value (for JS use) - now uses cached value
  const getBarTranslateY = useCallback(() => {
    return cachedBarTranslateY.current;
  }, []);

  // Get current collapsed state (for JS use) - now uses cached value
  const getIsBarCollapsed = useCallback(() => {
    return cachedIsBarCollapsed.current;
  }, []);

  // Return appropriate interface based on type
  if (isHeader) {
    return {
      animatedStyle,
      scrollY,
      onScroll,
      handleHeightChange,
      resetBar,
      collapseBar,
      showBar,
      isBarCollapsed: getIsBarCollapsed,
      setBarPositionByScale,
      getBarTranslateY,
      // Header-specific aliases for backward compatibility
      animatedHeaderStyle: animatedStyle,
      resetHeader: resetBar,
      collapseHeader: collapseBar,
      showHeader: showBar,
      isHeaderCollapsed: getIsBarCollapsed,
      setHeaderPositionByScale: setBarPositionByScale,
      getHeaderTranslateY: getBarTranslateY,
    };
  } else {
    return {
      animatedStyle,
      handleHeightChange,
      collapseBar,
      showBar,
      setBarPositionByScale,
      getBarTranslateY,
      // Tab bar-specific aliases for backward compatibility
      animatedTabBarStyle: animatedStyle,
      collapseTabBar: collapseBar,
      showTabBar: showBar,
      setTabBarPositionByScale: setBarPositionByScale,
      getTabBarTranslateY: getBarTranslateY,
    };
  }
};

