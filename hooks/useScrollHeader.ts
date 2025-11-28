import { useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

export const useScrollHeader = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('down');
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY.current;

    console.log('currentScrollY', currentScrollY, 'scrollDelta', scrollDelta, 'isHeaderVisible', isHeaderVisible);

    // Always show header when near the top (within 20px)
    if (currentScrollY <= 20) {
      if (!isHeaderVisible) {
        setIsHeaderVisible(true);
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
      lastScrollY.current = currentScrollY;
      scrollY.setValue(currentScrollY);
      return;
    }

    // Only trigger header animation if scroll delta is significant enough
    if (Math.abs(scrollDelta) > 5) {
      if (scrollDelta > 0 && currentScrollY > 100) {
        // Scrolling down - hide header
        if (isHeaderVisible) {
          setIsHeaderVisible(false);
          Animated.timing(headerTranslateY, {
            toValue: -100,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
        scrollDirection.current = 'down';
      } else if (scrollDelta < 0) {
        // Scrolling up - show header
        if (!isHeaderVisible) {
          setIsHeaderVisible(true);
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
        scrollDirection.current = 'up';
      }
    }

    lastScrollY.current = currentScrollY;
    scrollY.setValue(currentScrollY);
  }, [isHeaderVisible, headerTranslateY, scrollY]);

  const resetHeader = useCallback(() => {
    setIsHeaderVisible(true);
    headerTranslateY.setValue(0);
    lastScrollY.current = 0;
  }, [headerTranslateY]);

  return {
    isHeaderVisible,
    headerTranslateY,
    scrollY,
    handleScroll,
    resetHeader,
  };
};
