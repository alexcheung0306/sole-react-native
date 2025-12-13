import { useCallback, useEffect } from 'react';
import { useCollapsibleBar } from './useCollapsibleBar';

// Global ref to store the tab bar control functions - allows AppTabBar to be controlled from outside
interface TabBarControl {
  setTabBarPositionByScale: (scale: number, startPosition: number, minScale: number, maxScale: number) => void;
  getTabBarTranslateY: () => number;
  showTabBar: () => void;
  collapseTabBar: () => void;
}

let globalTabBarControlRef: TabBarControl | null = null;

export const setAppTabBarControl = (control: TabBarControl | null) => {
  globalTabBarControlRef = control;
};

export const getAppTabBarControl = () => globalTabBarControlRef;

export const useScrollAppTabBar = () => {
  // Use the unified collapsible bar hook for base functionality
  const baseBar = useCollapsibleBar({ type: 'tabBar', enableScroll: false });

  // Extract functions from base hook
  const {
    animatedTabBarStyle,
    handleHeightChange,
    collapseTabBar,
    showTabBar,
    setTabBarPositionByScale,
    getTabBarTranslateY,
  } = baseBar;

  // Expose control functions via global ref
  useEffect(() => {
    setAppTabBarControl({
      setTabBarPositionByScale: setTabBarPositionByScale!,
      getTabBarTranslateY: getTabBarTranslateY!,
      showTabBar: showTabBar!,
      collapseTabBar: collapseTabBar!,
    });
    
    return () => {
      setAppTabBarControl(null);
    };
  }, [setTabBarPositionByScale, getTabBarTranslateY, showTabBar, collapseTabBar]);

  return {
    animatedTabBarStyle,
    handleHeightChange,
    collapseTabBar,
    showTabBar,
    setTabBarPositionByScale,
    getTabBarTranslateY,
  };
};

