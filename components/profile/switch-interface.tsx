import { useNavigation } from '@/context/NavigationContext';
import { Briefcase, User } from 'lucide-react-native';
import { useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, View, Text } from 'react-native';

export function SwitchInterface() {
  const { currentMode, switchToClient, switchToUser } = useNavigation();

  const switchWidth = 140;
  const switchHeight = 36;
  const thumbSize = 28;
  const thumbMargin = 4;
  const maxTranslate = switchWidth - thumbSize - thumbMargin * 2;

  const getInitialPosition = () => {
    return currentMode === 'client' ? maxTranslate : 0;
  };

  const translateX = useRef(new Animated.Value(getInitialPosition())).current;
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    const targetPosition = currentMode === 'client' ? maxTranslate : 0;
    Animated.spring(translateX, {
      toValue: targetPosition,
      useNativeDriver: false,
      damping: 15,
      stiffness: 150,
    }).start();
  }, [currentMode, maxTranslate]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        setIsSwiping(true);
        (translateX as any).setOffset((translateX as any)._value);
        (translateX as any).setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const currentOffset = (translateX as any)._offset || 0;
        const newValue = gestureState.dx + currentOffset;
        const clampedValue = Math.max(0, Math.min(maxTranslate, newValue));
        (translateX as any).setValue(clampedValue - currentOffset);
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsSwiping(false);
        const currentOffset = (translateX as any)._offset || 0;
        const finalValue = (translateX as any)._value + currentOffset;
        (translateX as any).flattenOffset();

        const threshold = maxTranslate / 2;
        const velocity = gestureState.vx;

        let newMode: 'client' | 'user';
        if (Math.abs(velocity) > 0.5) {
          // Fast swipe - use velocity direction
          newMode = velocity > 0 ? 'client' : 'user';
        } else {
          // Slow swipe - use position
          newMode = finalValue > threshold ? 'client' : 'user';
        }

        if (newMode !== currentMode) {
          if (newMode === 'client') {
            switchToClient();
          } else {
            switchToUser();
          }
        } else {
          // Snap back to current position
          const targetPosition = currentMode === 'client' ? maxTranslate : 0;
          Animated.spring(translateX, {
            toValue: targetPosition,
            useNativeDriver: false,
            damping: 15,
            stiffness: 150,
          }).start();
        }
      },
    })
  ).current;

  const normalizedValue = translateX.interpolate({
    inputRange: [0, maxTranslate],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const backgroundColor = normalizedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.4)'],
  });

  return (
    <View className="flex flex-row justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <View className=" flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="rounded-full bg-blue-500/20 p-2">
            {currentMode === 'client' ? (
              <Briefcase size={20} color="#bfdbfe" />
            ) : (
              <User size={20} color="#bfdbfe" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-white">Switch Mode</Text>
            <Text className="text-xs text-white/70">
              {currentMode === 'client' ? 'Client mode' : 'User mode'}
            </Text>
          </View>
        </View>
      </View>

      <View
        {...panResponder.panHandlers}
        style={{
          width: switchWidth,
          height: switchHeight,
          borderRadius: switchHeight / 2,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}>
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: switchWidth,
            height: switchHeight,
            borderRadius: switchHeight / 2,
            backgroundColor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: thumbMargin,
            top: thumbMargin,
            bottom: thumbMargin,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: switchWidth - thumbMargin * 2,
            paddingHorizontal: 6,
          }}>
          <View className="flex-row items-center gap-1.5">
            <User size={14} color={currentMode === 'user' ? '#ffffff' : 'rgba(255,255,255,0.5)'} />
            <Text
              className={`text-[11px] font-semibold ${
                currentMode === 'user' ? 'text-white' : 'text-white/50'
              }`}>
              User
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Briefcase
              size={14}
              color={currentMode === 'client' ? '#ffffff' : 'rgba(255,255,255,0.5)'}
            />
            <Text
              className={`text-[11px] font-semibold ${
                currentMode === 'client' ? 'text-white' : 'text-white/50'
              }`}>
              Client
            </Text>
          </View>
        </View>
        <Animated.View
          style={{
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: '#3b82f6',
            position: 'absolute',
            left: thumbMargin,
            top: thumbMargin,
            transform: [{ translateX }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}
        />
      </View>
    </View>
  );
}
