import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { Animated } from 'react-native';

interface HeaderContextType {
  title: string | ReactNode;
  setTitle: (title: string | ReactNode) => void;
  headerLeft: ReactNode | null;
  setHeaderLeft: (left: ReactNode | null) => void;
  headerRight: ReactNode | null;
  setHeaderRight: (right: ReactNode | null) => void;
  headerTranslateY: Animated.Value;
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
  handleScroll: (event: any) => void;
}

const HEADER_HEIGHT = 120; // Adjust this to match your actual header height

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [title, setTitle] = useState<string | ReactNode>('Projects');
  const [headerLeft, setHeaderLeft] = useState<ReactNode | null>(null);
  const [headerRight, setHeaderRight] = useState<ReactNode | null>(null);
  const [isDark, setIsDark] = useState(true);

  const headerTranslateY:any = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isScrollingDown = useRef(false);

  const animateHeader = useCallback((toValue: number) => {
    Animated.timing(headerTranslateY, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [headerTranslateY]);

  const handleScroll = useCallback(
    (event: any) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const scrollDelta = currentScrollY - lastScrollY.current;
      const isScrollingDownNow = scrollDelta > 0;

      // Always show header when near the top (within 20px)
      if (currentScrollY <= 20) {
        if (headerTranslateY._value !== 0) {
          animateHeader(0);
        }
        lastScrollY.current = currentScrollY;
        isScrollingDown.current = false;
        return;
      }

      // Only react if direction changed or significant movement
      if (
        Math.abs(scrollDelta) > 5 && // threshold
        isScrollingDownNow !== isScrollingDown.current
      ) {
        isScrollingDown.current = isScrollingDownNow;

        if (isScrollingDownNow && currentScrollY > 100) {
          // Scrolling DOWN → HIDE header
          animateHeader(-HEADER_HEIGHT);
        } else {
          // Scrolling UP → SHOW header
          animateHeader(0);
        }
      }

      lastScrollY.current = currentScrollY;
    },
    [animateHeader, headerTranslateY]
  );

  return (
    <HeaderContext.Provider
      value={{
        title,
        setTitle,
        headerLeft,
        setHeaderLeft,
        headerRight,
        setHeaderRight,
        headerTranslateY,
        isDark,
        setIsDark,
        handleScroll,
      }}
    >
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeaderContext = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeaderContext must be used within HeaderProvider');
  }
  return context;
};