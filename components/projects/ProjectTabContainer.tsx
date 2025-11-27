import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';
import { useProjectTabContext } from '@/context/ProjectTabContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ProjectTabContainerProps = {
  children: React.ReactNode[];
};

// Map tab names to indices
const tabToIndex = {
  'manage-projects': 0,
  'manage-contracts': 1,
} as const;

export default function ProjectTabContainer({ children }: ProjectTabContainerProps) {
  const { activeTab } = useProjectTabContext();
  const translateX = useSharedValue(-tabToIndex[activeTab] * SCREEN_WIDTH);

  // Update translateX when activeTab changes (with animation)
  useEffect(() => {
    const activeIndex = tabToIndex[activeTab];
    if (activeIndex !== undefined) {
      cancelAnimation(translateX);
      translateX.value = withSpring(-activeIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      });
    }
  }, [activeTab, translateX]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Early return if no children
  if (!children || children.length === 0) {
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Animated.View
        style={[
          containerStyle,
          {
            flexDirection: 'row',
            width: SCREEN_WIDTH * children.length,
            flex: 1,
          },
        ]}>
        {children.map((child, index) => (
          <View
            key={index}
            style={{
              width: SCREEN_WIDTH,
              flex: 1,
              backgroundColor: '#000000',
            }}>
            {child}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

