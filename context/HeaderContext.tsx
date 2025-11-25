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

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [title, setTitle] = useState<string | ReactNode>('Projects');
  const [headerLeft, setHeaderLeft] = useState<ReactNode | null>(null);
  const [headerRight, setHeaderRight] = useState<ReactNode | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY.current;

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
      }
    }

    lastScrollY.current = currentScrollY;
  }, [isHeaderVisible, headerTranslateY]);

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

