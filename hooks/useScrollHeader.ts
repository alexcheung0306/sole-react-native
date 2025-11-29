import { useState, useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

export const useScrollHeader = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('down');
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  const handleHeightChange = useCallback((height: number) => {
    // console.log('Header height:', height); // Debug: Remove after testing
    setHeaderHeight(height);
  }, []);

  // Create animated scroll event handler
  const animatedScrollHandler = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false, // Set to false since we need to read scrollY value
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollDelta = currentScrollY - lastScrollY.current;
        const currentTranslateY = (headerTranslateY as any)._value;

        // console.log('🔄 Scroll event:', {
        //   currentScrollY: Math.round(currentScrollY),
        //   scrollDelta: Math.round(scrollDelta),
        //   lastScrollY: lastScrollY.current,
        //   headerHeight,
        //   currentTranslateY,
        //   direction: scrollDelta > 0 ? 'down' : 'up'
        // });

        // Always show header when near the top (within 20px)
        if (currentScrollY <= 20) {
          if (currentTranslateY !== 0 && !isAnimating) {
            setIsAnimating(true);
            Animated.timing(headerTranslateY, {
              toValue: 0,
              duration: 300,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1),
              useNativeDriver: true,
            }).start(() => {
              setIsAnimating(false);
            });
          }
          lastScrollY.current = currentScrollY;
          return;
        }

        // Only trigger header animation if scroll delta is significant enough and header height is known
        // console.log('🔍 Checking animation conditions:', {
        //   scrollDeltaSignificant: Math.abs(scrollDelta) > 2, // Lower threshold
        //   headerHeightKnown: headerHeight > 0,
        //   currentScrollYPastHeader: currentScrollY > headerHeight
        // });

        if (Math.abs(scrollDelta) > 1 && headerHeight > 0) {
          if (scrollDelta > 0) {
            // Scrolling down - hide header immediately
            if (currentTranslateY !== -headerHeight && !isAnimating) {
              setIsAnimating(true);
              Animated.timing(headerTranslateY, {
                toValue: -headerHeight,
                duration: 200,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                useNativeDriver: true,
              }).start(() => {
                setIsAnimating(false);
              });
            }
            scrollDirection.current = 'down';
          } else if (scrollDelta < 0) {
            // Scrolling up - show header
            if (currentTranslateY !== 0 && !isAnimating) {
              setIsAnimating(true);
              Animated.timing(headerTranslateY, {
                toValue: 0,
                duration: 300,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                useNativeDriver: true,
              }).start(() => {
                setIsAnimating(false);
              });
            }
            scrollDirection.current = 'up';
          }
        }

        lastScrollY.current = currentScrollY;
      },
    }
  );

  const resetHeader = useCallback(() => {
    headerTranslateY.setValue(0);
    lastScrollY.current = 0;
  }, [headerTranslateY]);

  return {
    headerTranslateY,
    scrollY,
    animatedScrollHandler,
    handleHeightChange,
    resetHeader,
  };
};
