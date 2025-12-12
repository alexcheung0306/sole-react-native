import { useRef, useCallback, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';

// Global ref to store the tab bar control functions - allows AppTabBar to be controlled from outside
interface TabBarControl {
  setTabBarPositionByScale: (scale: number, startPosition: number, minScale: number, maxScale: number) => void;
  getTabBarTranslateY: () => number;
  showTabBar: () => void;
}

let globalTabBarControlRef: TabBarControl | null = null;

export const setAppTabBarControl = (control: TabBarControl | null) => {
  globalTabBarControlRef = control;
};

export const getAppTabBarControl = () => globalTabBarControlRef;

export const useScrollAppTabBar = () => {
  const tabBarHeight = useSharedValue(0);
  const tabBarTranslateY = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  const handleHeightChange = useCallback((height: number) => {
    tabBarHeight.value = height;
  }, []);

  const collapseTabBar = useCallback(() => {
    if (tabBarHeight.value > 0) {
      // Cancel any ongoing animation
      cancelAnimation(tabBarTranslateY);
      isAnimating.value = true;
      tabBarTranslateY.value = withTiming(tabBarHeight.value, {
        duration: 100, // Faster animation for zoom responsiveness
      }, (finished) => {
        if (finished) {
          isAnimating.value = false;
        }
      });
    }
  }, []);

  const showTabBar = useCallback(() => {
    // Cancel any ongoing animation
    cancelAnimation(tabBarTranslateY);
    isAnimating.value = true;
    tabBarTranslateY.value = withTiming(0, {
      duration: 100, // Faster animation for zoom responsiveness
    }, (finished) => {
      if (finished) {
        isAnimating.value = false;
      }
    });
  }, []);

  // Set tab bar position based on zoom scale (proportional translation)
  // scale: minScale = start position, maxScale = fully collapsed
  const setTabBarPositionByScale = useCallback((scale: number, startPosition: number, minScale: number = 1, maxScale: number = 3) => {
    if (tabBarHeight.value <= 0) return;
    
    // Cancel any ongoing animation
    cancelAnimation(tabBarTranslateY);
    
    // Normalize scale: minScale -> 0 (start position), maxScale -> 1 (fully collapsed)
    const normalizedScale = Math.max(0, Math.min(1, (scale - minScale) / (maxScale - minScale)));
    
    // Calculate translateY: interpolate from startPosition to tabBarHeight (collapsed down)
    const collapsedPosition = tabBarHeight.value;
    const targetTranslateY = startPosition + (collapsedPosition - startPosition) * normalizedScale;
    
    // Update tab bar position smoothly but quickly
    tabBarTranslateY.value = withTiming(targetTranslateY, {
      duration: 50, // Very quick response to scale changes for smooth following
    });
  }, []);

  // Get current tab bar translateY value (for JS use)
  const getTabBarTranslateY = useCallback(() => {
    return tabBarTranslateY.value;
  }, []);

  // Create animated style for the tab bar
  const animatedTabBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tabBarTranslateY.value }],
  }));

  const setTabBarControl = useCallback((control: TabBarControl) => {
    setAppTabBarControl(control);
  }, []);

  // Expose control functions
  useEffect(() => {
    setTabBarControl({
      setTabBarPositionByScale,
      getTabBarTranslateY,
      showTabBar,
    });
    
    return () => {
      setAppTabBarControl(null);
    };
  }, [setTabBarPositionByScale, getTabBarTranslateY, showTabBar, setTabBarControl]);

  return {
    animatedTabBarStyle,
    handleHeightChange,
    collapseTabBar,
    showTabBar,
    setTabBarPositionByScale,
    getTabBarTranslateY,
  };
};

