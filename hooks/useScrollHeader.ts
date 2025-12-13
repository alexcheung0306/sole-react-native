import { useState, useRef, useCallback } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { getAppTabBarControl } from './useScrollAppTabBar';

export const useScrollHeader = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = useSharedValue(0);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('down');
  const headerTranslateY = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  const handleHeightChange = useCallback((height: number) => {
    // console.log('Header height:', height); // Debug: Remove after testing
    setHeaderHeight(height);
  }, []);

  // Create scroll handler function that updates shared values
  const onScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY.current;

    // Update scrollY shared value
    scrollY.value = currentScrollY;


    // Always show header when near the top (within 20px)
    if (currentScrollY <= 10) {
      if (headerTranslateY.value !== 0 && !isAnimating.value) {
        isAnimating.value = true;
        headerTranslateY.value = withSpring(0, {
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

    // Only trigger header animation if scroll delta is significant enough and header height is known
    if (Math.abs(scrollDelta) > 1 && headerHeight > 0) {
      if (scrollDelta > 0) {
        // Scrolling down - hide header immediately
        if (headerTranslateY.value !== -headerHeight && !isAnimating.value) {
          isAnimating.value = true;
          headerTranslateY.value = withTiming(-headerHeight, {
            duration: 200,
          }, () => {
            isAnimating.value = false;
          });
        }
        scrollDirection.current = 'down';
      } else if (scrollDelta < 0) {
        // Scrolling up - show header
        if (headerTranslateY.value !== 0 && !isAnimating.value) {
          isAnimating.value = true;
          headerTranslateY.value = withSpring(0, {
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
  }, [headerHeight]);

  // Create animated style for the header
  const animatedHeaderStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const resetHeader = useCallback(() => {
    headerTranslateY.value = 0;
    lastScrollY.current = 0;
  }, []);

  const collapseHeader = useCallback(() => {
    if (headerHeight > 0) {
      // Cancel any ongoing animation
      cancelAnimation(headerTranslateY);
      isAnimating.value = true;
      headerTranslateY.value = withTiming(-headerHeight, {
        duration: 100, // Faster animation for zoom responsiveness
      }, (finished) => {
        if (finished) {
          isAnimating.value = false;
        }
      });
    }
  }, [headerHeight]);

  const showHeader = useCallback(() => {
    // Cancel any ongoing animation
    cancelAnimation(headerTranslateY);
    isAnimating.value = true;
    headerTranslateY.value = withTiming(0, {
      duration: 100, // Faster animation for zoom responsiveness
    }, (finished) => {
      if (finished) {
        isAnimating.value = false;
      }
    });
  }, []);

  // Set header position based on zoom scale (proportional translation)
  // scale: minScale = start position, maxScale = fully collapsed
  const setHeaderPositionByScale = useCallback((scale: number, startPosition: number, minScale: number = 1, maxScale: number = 3) => {
    if (headerHeight <= 0) return;
    
    // Cancel any ongoing animation
    cancelAnimation(headerTranslateY);
    
    // Normalize scale: minScale -> 0 (start position), maxScale -> 1 (fully collapsed)
    const normalizedScale = Math.max(0, Math.min(1, (scale - minScale) / (maxScale - minScale)));
    
    // Calculate translateY: interpolate from startPosition to -headerHeight
    const collapsedPosition = -headerHeight;
    const targetTranslateY = startPosition + (collapsedPosition - startPosition) * normalizedScale;
    
    // Update header position smoothly but quickly
    headerTranslateY.value = withTiming(targetTranslateY, {
      duration: 50, // Very quick response to scale changes for smooth following
    });
  }, [headerHeight]);

  // Get current header translateY value (for JS use)
  const getHeaderTranslateY = useCallback(() => {
    return headerTranslateY.value;
  }, []);

  // Get current collapsed state (for JS use)
  // Header is considered collapsed if translateY is less than -half of header height
  const getIsHeaderCollapsed = useCallback(() => {
    // Access shared value directly - this will be called from JS thread
    return headerTranslateY.value < -headerHeight / 2;
  }, [headerHeight]);

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
          // Zoom just started - save current positions IMMEDIATELY
          // This must happen synchronously before any scale changes to avoid lag
          headerStateBeforeZoom.current = getIsHeaderCollapsed();
          headerStartPosition.current = getHeaderTranslateY();

          // Get tab bar start position
          const tabBarControl = getAppTabBarControl();
          if (tabBarControl) {
            tabBarStartPosition.current = tabBarControl.getTabBarTranslateY();
          }

          // Clear restore flag if it was set
          isRestoring.current = false;

          // Immediately collapse header and tab bar with transition
          collapseHeader();
          if (tabBarControl) {
            tabBarControl.collapseTabBar();
          }
        } else if (wasZooming && !nowZooming) {
          // Zoom just ended (after reset animation completes) - restore header and tab bar to original positions
          isRestoring.current = true;

          // Restore header to original position
          if (headerStateBeforeZoom.current === false) {
            // Header was open before zoom, restore it
            showHeader();
          } else {
            // Header was collapsed, restore to its original collapsed position
            setHeaderPositionByScale(1, headerStartPosition.current, 1, 2);
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
    [showHeader, getIsHeaderCollapsed, getHeaderTranslateY, setHeaderPositionByScale, collapseHeader]
  );

  // Handle scale changes - collapse fully when scale > 1/3 of zoom range
  const handleScaleChange = useCallback(
    (scale: number) => {
      // If we're restoring (zoom just ended), don't use scale-based translation
      // Just ensure positions are at original when scale reaches 1
      if (isRestoring.current) {
        if (scale <= 1) {
          // Scale has reached 1, ensure positions are restored and clear restore mode
          if (headerStateBeforeZoom.current === false) {
            showHeader();
          }
          const tabBarControl = getAppTabBarControl();
          if (tabBarControl) {
            tabBarControl.showTabBar();
          }
          isRestoring.current = false;
        }
        // During restore, don't do scale-based translation
        return;
      }

      // Only do scale-based translation if we're actively zooming (not restoring)
      // Positions should already be initialized in handleZoomChange when zoom starts
      if (isAnyImageZooming) {
        // Threshold: 1/5 of zoom range (1 to 3) = scale > 1.4
        // minScale = 1, maxScale = 3, threshold = 1 + (3-1)/5 = 1.4
        const threshold = 1 + (3 - 1) / 5; // 1.4
        
        if (scale > threshold) {
          // Scale is over 1/5 of zoom range - fully collapse
          collapseHeader();
          
          // Collapse tab bar
          const tabBarControl = getAppTabBarControl();
          if (tabBarControl) {
            tabBarControl.collapseTabBar();
          }
        } else {
          // Scale is at or below 1/5 of zoom range - restore to original position
          if (headerStateBeforeZoom.current === false) {
            // Header was open before zoom, restore it
            showHeader();
          } else {
            // Header was collapsed, restore to its original collapsed position
            setHeaderPositionByScale(1, headerStartPosition.current, 1, 2);
          }
          
          // Restore tab bar to original position
          const tabBarControl = getAppTabBarControl();
          if (tabBarControl) {
            tabBarControl.showTabBar();
          }
        }
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
    isHeaderCollapsed: getIsHeaderCollapsed,
    setHeaderPositionByScale,
    getHeaderTranslateY,
    handleZoomChange,
    handleScaleChange,
  };
};
