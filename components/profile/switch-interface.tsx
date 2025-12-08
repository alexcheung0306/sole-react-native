import { View, Text } from 'react-native';
import { Briefcase, User } from 'lucide-react-native';
import { useNavigation } from '@/context/NavigationContext';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { useCallback } from 'react';
import React from 'react';

const TOGGLE_HEIGHT = 56;
const TOGGLE_CIRCLE_SIZE = 48;
const TOGGLE_PADDING = 4;

export function SwitchInterface({ setIsOpen }: { setIsOpen: (isOpen: boolean) => void }) {
  const { currentMode, switchToClient, switchToUser } = useNavigation();
  
  // Use a ref to measure the actual width
  const toggleWidth = useSharedValue(280); // Will be updated on layout
  const maxTranslateX = useSharedValue(280 - TOGGLE_CIRCLE_SIZE - TOGGLE_PADDING * 2);
  
  // Initialize translateX based on current mode immediately (no animation on mount)
  // 0 = User (left), maxTranslateX = Client (right)
  // Use a temporary max value to calculate initial position
  const initialMaxTranslateX = 280 - TOGGLE_CIRCLE_SIZE - TOGGLE_PADDING * 2;
  const translateX = useSharedValue(
    currentMode === 'client' ? initialMaxTranslateX : 0
  );
  const isGestureActive = useSharedValue(false);
  const startX = useSharedValue(0); // Track starting position when gesture begins
  const hasInitialized = React.useRef(false);
  
  // Update translateX when mode changes externally (only after initial render)
  React.useEffect(() => {
    if (hasInitialized.current && maxTranslateX.value > 0) {
      if (currentMode === 'client') {
        translateX.value = withTiming(maxTranslateX.value, {
          duration: 200,
        });
      } else {
        translateX.value = withTiming(0, {
          duration: 200,
        });
      }
    } else {
      hasInitialized.current = true;
    }
  }, [currentMode]);

  const handleModeChange = useCallback((mode: 'user' | 'client') => {
    if (mode !== currentMode) {
      if (mode === 'client') {
        switchToClient();
      } else {
        switchToUser(); 
      }
      // Delay closing to allow switch animation to complete, then close drawer with animation
      setTimeout(() => {
        setIsOpen(false);
      }, 250); // Wait for switch animation (200ms) plus small buffer
    }
  }, [currentMode, switchToClient, switchToUser, setIsOpen]);

  const panGesture = Gesture.Pan()
    .minDistance(5) // Require minimum movement to activate
    .activeOffsetX([-15, 15]) // Activate on horizontal movement (less sensitive)
    .failOffsetY([-30, 30]) // Fail if vertical movement is too much
    .onStart(() => {
      'worklet';
      cancelAnimation(translateX);
      isGestureActive.value = true;
      startX.value = translateX.value; // Store the starting position
    })
    .onUpdate((e) => {
      'worklet';
      // Calculate new position based on starting position + translation
      const newPos = startX.value + e.translationX;
      
      // Clamp between 0 and maxTranslateX
      const clampedPos = Math.max(0, Math.min(newPos, maxTranslateX.value));
      translateX.value = clampedPos;
    })
    .onEnd((e) => {
      'worklet';
      isGestureActive.value = false;
      
      // Use the actual toggle width minus padding for threshold calculation
      const availableWidth = maxTranslateX.value;
      const threshold = availableWidth * 0.5; // 50% threshold
      const currentPos = translateX.value;
      
      // Determine target position based on current position
      // If past 50%, snap to opposite side
      let targetPos: number;
      let targetMode: 'user' | 'client';
      
      if (currentPos >= threshold) {
        // More than 50% to the right, snap to Client (right)
        targetPos = maxTranslateX.value;
        targetMode = 'client';
      } else {
        // Less than 50%, snap to User (left)
        targetPos = 0;
        targetMode = 'user';
      }
      
      // Animate to target position first with fast, non-bouncy animation
      translateX.value = withTiming(
        targetPos,
        {
          duration: 200, // Fast animation (200ms)
        },
        (finished) => {
          'worklet';
          // Only trigger navigation after animation completes
          if (finished) {
            runOnJS(handleModeChange)(targetMode);
          }
        }
      );
    });

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const userSectionStyle = useAnimatedStyle(() => {
    const progress = maxTranslateX.value > 0 ? translateX.value / maxTranslateX.value : 0;
    return {
      opacity: Math.max(0.3, 1 - progress * 0.7), // Fade out as we move right
    };
  });

  const clientSectionStyle = useAnimatedStyle(() => {
    const progress = maxTranslateX.value > 0 ? translateX.value / maxTranslateX.value : 0;
    return {
      opacity: Math.max(0.3, 0.3 + progress * 0.7), // Fade in as we move right
    };
  });

  return (
    <View className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" style={{ width: '100%' }}>
      <Text className="text-sm font-semibold text-white mb-3">Switch Mode</Text>
      
      <GestureDetector gesture={panGesture}>
        <View
          onLayout={(e) => {
            const width = e.nativeEvent.layout.width;
            toggleWidth.value = width;
            const newMaxTranslateX = width - TOGGLE_CIRCLE_SIZE - TOGGLE_PADDING * 2;
            maxTranslateX.value = newMaxTranslateX;
            // Set initial position immediately without animation if not already set correctly
            if (!hasInitialized.current) {
              if (currentMode === 'client') {
                translateX.value = newMaxTranslateX;
              } else {
                translateX.value = 0;
              }
              hasInitialized.current = true;
            } else {
              // Only animate if the position needs to change after layout
              if (currentMode === 'client' && translateX.value !== newMaxTranslateX) {
                translateX.value = withTiming(newMaxTranslateX, {
                  duration: 200,
                });
              } else if (currentMode === 'user' && translateX.value !== 0) {
                translateX.value = withTiming(0, {
                  duration: 200,
                });
              }
            }
          }}
          className="w-full relative overflow-hidden rounded-[30px] border border-white/15 bg-white/[0.08] 
          flex-row items-center "
          style={{
            height: TOGGLE_HEIGHT,
            padding: TOGGLE_PADDING,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1.5,
          }}>
          {/* Background sections */}
          <View className="absolute h-full w-full flex-row">
            {/* User section (left) */}
            <Animated.View
              className="flex-1 items-center justify-center flex-row gap-2"
              style={[userSectionStyle]}>
              <User size={18} color="#9ca3af" strokeWidth={2} />
              <Text className="text-sm font-semibold text-gray-400">User</Text>
            </Animated.View>
            
            {/* Client section (right) */}
            <Animated.View
              className="flex-1 items-center justify-center flex-row gap-2"
              style={[clientSectionStyle]}>
              <Briefcase size={18} color="#9ca3af" strokeWidth={2} />
              <Text className="text-sm font-semibold text-gray-400">Client</Text>
            </Animated.View>
          </View>

          {/* Draggable circle */}
          <Animated.View
            className="absolute items-center justify-center bg-blue-500 rounded-full border-2 border-white/20"
            style={[
              {
                width: TOGGLE_CIRCLE_SIZE,
                height: TOGGLE_CIRCLE_SIZE,
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 8,
              },
              circleStyle,
            ]}>
            {/* Icon inside circle - changes based on position with smooth transition */}
            <Animated.View
              className="absolute"
              style={useAnimatedStyle(() => {
                const progress = maxTranslateX.value > 0 ? translateX.value / maxTranslateX.value : 0;
                const opacity = Math.max(0, 1 - progress * 2);
                const scale = Math.max(0.8, 1 - progress * 0.2);
                return {
                  opacity,
                  transform: [{ scale }],
                };
              })}>
              <User size={22} color="#ffffff" strokeWidth={2.5} />
            </Animated.View>
            <Animated.View
              className="absolute"
              style={useAnimatedStyle(() => {
                const progress = maxTranslateX.value > 0 ? translateX.value / maxTranslateX.value : 0;
                const opacity = Math.max(0, (progress - 0.5) * 2);
                const scale = Math.max(0.8, 0.8 + (progress - 0.5) * 0.4);
                return {
                  opacity,
                  transform: [{ scale }],
                };
              })}>
              <Briefcase size={22} color="#ffffff" strokeWidth={2.5} />
            </Animated.View>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}
