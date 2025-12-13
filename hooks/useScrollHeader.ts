import { useState, useRef, useCallback } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  runOnUI,
  cancelAnimation,
  useDerivedValue,
} from 'react-native-reanimated';
import { getAppTabBarControl } from './useScrollAppTabBar';
import { useCollapsibleBar } from './useCollapsibleBar';

export const useScrollHeader = () => {
  // Use the unified collapsible bar hook for base functionality
  const baseBar = useCollapsibleBar({ type: 'header', enableScroll: true });
  
  // Keep headerHeight state for backward compatibility and zoom logic
  const [headerHeight, setHeaderHeight] = useState(0);

  // Wrap handleHeightChange to update both state and base hook
  const handleHeightChange = useCallback((height: number) => {
    setHeaderHeight(height);
    baseBar.handleHeightChange(height);
  }, [baseBar]);

  // Use base hook's functions
  const {
    animatedHeaderStyle,
    scrollY,
    onScroll,
    resetHeader,
    collapseHeader,
    showHeader,
    isHeaderCollapsed,
    setHeaderPositionByScale,
    getHeaderTranslateY,
  } = baseBar;

  // Zoom handling state and refs
  const [isAnyImageZooming, setIsAnyImageZooming] = useState(false);
  const headerStateBeforeZoom = useRef<boolean | null>(null); // null = not zooming, true = was collapsed, false = was open
  const headerStartPosition = useRef<number>(0); // Track header position when zoom starts
  const tabBarStartPosition = useRef<number>(0); // Track tab bar position when zoom starts
  const isRestoring = useRef<boolean>(false); // Track if we're restoring positions after zoom ends

  // Handle zoom state changes - track when zoom starts/ends
  const handleZoomChange = useCallback(
    (isZooming: boolean) => {
      setIsAnyImageZooming((prev) => {
        const wasZooming = prev;
        const nowZooming = isZooming;

        if (!wasZooming && nowZooming) {
          // Zoom just started - save current positions IMMEDIATELY using cached values (fast, no blocking)
          headerStateBeforeZoom.current = isHeaderCollapsed?.() ?? false;
          headerStartPosition.current = getHeaderTranslateY?.() ?? 0;

          // Get tab bar start position
          const tabBarControl = getAppTabBarControl();
          if (tabBarControl) {
            tabBarStartPosition.current = tabBarControl.getTabBarTranslateY();
          }

          // Clear restore flag if it was set
          isRestoring.current = false;
          maxScaleReached.current = 1;
          lastScale.current = 1;

          // Immediately collapse header and tab bar on UI thread (non-blocking)
          collapseHeader?.();
          if (tabBarControl) {
            tabBarControl.collapseTabBar();
          }
        } else if (wasZooming && !nowZooming) {
          // Zoom just ended (after reset animation completes) - restore header and tab bar to original positions
          isRestoring.current = true;

          // Restore header to original position
          if (headerStateBeforeZoom.current === false) {
            // Header was open before zoom, restore it
            showHeader?.();
          } else {
            // Header was collapsed, restore to its original collapsed position
            setHeaderPositionByScale?.(1, headerStartPosition.current, 1, 2);
          }

          // Restore tab bar to original position
          const tabBarControl = getAppTabBarControl();
          if (tabBarControl) {
            // Restore tab bar to its original position
            tabBarControl.showTabBar();
          }

          headerStateBeforeZoom.current = null;
        }

        return nowZooming;
      });
    },
    [showHeader, isHeaderCollapsed, getHeaderTranslateY, setHeaderPositionByScale, collapseHeader]
  );

  // Track the max scale reached and last scale to detect reset
  const maxScaleReached = useRef<number>(1);
  const lastScale = useRef<number>(1);

  // Handle scale changes - collapse fully when scale > 1/3 of zoom range
  const handleScaleChange = useCallback(
    (scale: number) => {
      // Track max scale reached
      if (scale > maxScaleReached.current) {
        maxScaleReached.current = scale;
      }

      // Detect if reset has started: scale is decreasing from a significant zoom level (> 1.5) towards 1
      // Check before updating lastScale
      const wasSignificantlyZoomed = lastScale.current > 1.5;
      const isScaleDecreasing = scale < lastScale.current && scale >= 1;
      const resetStartScale = maxScaleReached.current;
      
      // Update lastScale after checking
      lastScale.current = scale;

      // If we're restoring (during reset animation), smoothly follow the scale
      // Only trigger reset detection if we were significantly zoomed and scale is decreasing
      if (isRestoring.current || (isAnyImageZooming && wasSignificantlyZoomed && isScaleDecreasing && scale > 1 && resetStartScale > 1.5)) {
        // If reset just started, mark it
        if (!isRestoring.current && isScaleDecreasing) {
          isRestoring.current = true;
        }

        // During reset, interpolate from collapsed position back to original position
        // as scale goes from resetStartScale to 1
        const endScale = 1;
        
        if (scale <= endScale) {
          // Scale has reached 1, always restore to open (regardless of original state)
          showHeader?.();
          
          const tabBarControl = getAppTabBarControl();
          if (tabBarControl) {
            tabBarControl.showTabBar();
          }
          
          // Clear restore mode when scale reaches 1
          isRestoring.current = false;
          maxScaleReached.current = 1;
        } else {
          // During reset animation, ALWAYS follow scale to restore (regardless of original state)
          // Interpolate from collapsed to open (0) as scale goes from resetStartScale to 1
          // Use setHeaderPositionByScale: startPosition=0 (open), minScale=1, maxScale=resetStartScale
          // This will interpolate from 0 (when scale=1) to collapsed (when scale=resetStartScale)
          setHeaderPositionByScale?.(scale, 0, endScale, resetStartScale);
          
          // Tab bar: interpolate from collapsed to original
          const tabBarControl = getAppTabBarControl();
          if (tabBarControl && tabBarControl.setTabBarPositionByScale) {
            // Invert scale for tab bar too
            tabBarControl.setTabBarPositionByScale(scale, tabBarStartPosition.current, endScale, resetStartScale);
          }
        }
        return;
      }

      // Only do scale-based translation if we're actively zooming (not restoring)
      // Positions should already be initialized in handleZoomChange when zoom starts
      if (isAnyImageZooming) {
        // Collapse immediately when scale > 1 (any zoom) - no threshold needed
        if (scale > 1) {
          // Only collapse if header was originally open
          if (headerStateBeforeZoom.current === false) {
            collapseHeader?.();
          }
          // If header was originally collapsed, keep it collapsed (don't change it)
          
          // Always collapse tab bar
          const tabBarControl = getAppTabBarControl();
          if (tabBarControl) {
            tabBarControl.collapseTabBar();
          }
        }
        // During zoom, stay collapsed - no restoration until reset
      }
    },
    [isAnyImageZooming, setHeaderPositionByScale, showHeader, collapseHeader]
  );

  return {
    animatedHeaderStyle,
    scrollY,
    onScroll,
    handleHeightChange,
    resetHeader,
    collapseHeader,
    showHeader,
    isHeaderCollapsed,
    setHeaderPositionByScale,
    getHeaderTranslateY,
    handleZoomChange,
    handleScaleChange,
  };
};
