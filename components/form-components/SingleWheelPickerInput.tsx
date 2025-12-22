import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    interpolate,
    Extrapolation,
    withDecay,
    cancelAnimation,
    SharedValue
} from 'react-native-reanimated';
import CollapseDrawer from '../custom/collapse-drawer';

const ITEM_HEIGHT = 60;
const CONTAINER_HEIGHT = 215;
const VISIBLE_ITEMS = 5;
const CENTER_OFFSET = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

interface SingleWheelPickerInputProps {
    title: string;
    value: string | null;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string; category?: string }>;
    placeholder?: string;
    error?: string;
}

const WheelItem = ({
    item,
    index,
    translateY,
    onPress
}: {
    item: { value: string; label: string; category?: string };
    index: number;
    translateY: SharedValue<number>;
    onPress: (index: number) => void;
}) => {
    const animatedStyle = useAnimatedStyle(() => {
        // Calculate the center Y position of this item based on translation
        const itemCenterY = translateY.value + (index * ITEM_HEIGHT) + (ITEM_HEIGHT / 2);
        const containerCenterY = CONTAINER_HEIGHT / 2;
        const distanceFromCenter = Math.abs(itemCenterY - containerCenterY);

        const scale = interpolate(
            distanceFromCenter,
            [0, ITEM_HEIGHT, ITEM_HEIGHT * 2],
            [1.1, 0.9, 0.8],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            distanceFromCenter,
            [0, ITEM_HEIGHT, ITEM_HEIGHT * 2],
            [1, 0.5, 0.3],
            Extrapolation.CLAMP
        );
        
        // Optional: slight rotation for 3D effect
        const rotateX = interpolate(
             (itemCenterY - containerCenterY),
             [-CONTAINER_HEIGHT/2, 0, CONTAINER_HEIGHT/2],
             [45, 0, -45],
             Extrapolation.CLAMP
        );

        return {
            transform: [
                { translateY: translateY.value + (index * ITEM_HEIGHT) },
                { scale },
                { perspective: 1000 },
                { rotateX: `${rotateX}deg` }
            ],
            opacity
        };
    });

    return (
        <TouchableOpacity activeOpacity={1} onPress={() => onPress(index)}>
            <Animated.View style={[styles.pickerItem, animatedStyle]}>
                {item.category && (
                    <Text style={styles.categoryText}>
                        {item.category}
                    </Text>
                )}
                <Text style={styles.pickerText}>
                    {item.label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

export function SingleWheelPickerInput({
    title,
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    error,
}: SingleWheelPickerInputProps) {
    const [showDrawer, setShowDrawer] = useState(false);
    const [tempValue, setTempValue] = useState(value || options[0]?.value || '');
    
    // Shared values
    const translateY = useSharedValue(0);
    const context = useSharedValue(0);

    // Initialize position based on current value
    const initializePosition = useCallback(() => {
        const initialValue = value || options[0]?.value || '';
        const index = options.findIndex(opt => opt.value === initialValue);
        const safeIndex = index >= 0 ? index : 0;
        translateY.value = CENTER_OFFSET - (safeIndex * ITEM_HEIGHT);
        setTempValue(initialValue);
    }, [value, options, translateY]);

    useEffect(() => {
        if (showDrawer) {
            initializePosition();
        }
    }, [showDrawer, initializePosition]);

    const handleOpen = () => {
        setShowDrawer(true);
    };

    const handleClose = () => {
        setShowDrawer(false);
    };

    const handleDone = () => {
        onChange(tempValue);
        setShowDrawer(false);
    };

    const updateTempValue = (index: number) => {
        const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
        const newValue = options[clampedIndex]?.value;
        if (newValue !== undefined) {
            setTempValue(newValue);
        }
    };

    const scrollTo = (index: number) => {
        'worklet';
        const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
        const targetY = CENTER_OFFSET - (clampedIndex * ITEM_HEIGHT);
        translateY.value = withSpring(targetY, {
            damping: 15,
            stiffness: 150,
            mass: 0.5
        });
        runOnJS(updateTempValue)(clampedIndex);
    };

    const gesture = Gesture.Pan()
        .onStart(() => {
            cancelAnimation(translateY);
            context.value = translateY.value;
        })
        .onUpdate((e) => {
            // Apply translation directly from gesture
            let newTranslateY = context.value + e.translationY;
            
            // Calculate boundaries
            const minTranslateY = CENTER_OFFSET - ((options.length - 1) * ITEM_HEIGHT);
            const maxTranslateY = CENTER_OFFSET;
            
            // Apply rubber banding effect when overscrolling
            if (newTranslateY > maxTranslateY) {
                // Dragging down past the top item
                const overscroll = newTranslateY - maxTranslateY;
                newTranslateY = maxTranslateY + Math.pow(overscroll, 0.8);
            } else if (newTranslateY < minTranslateY) {
                // Dragging up past the bottom item
                const overscroll = minTranslateY - newTranslateY;
                newTranslateY = minTranslateY - Math.pow(overscroll, 0.8);
            }
            
            translateY.value = newTranslateY;
        })
        .onEnd((e) => {
            const velocity = e.velocityY;
            
            const minTranslateY = CENTER_OFFSET - ((options.length - 1) * ITEM_HEIGHT);
            const maxTranslateY = CENTER_OFFSET;

            // If we are currently out of bounds, snap back immediately
            if (translateY.value > maxTranslateY || translateY.value < minTranslateY) {
                const targetY = translateY.value > maxTranslateY ? maxTranslateY : minTranslateY;
                const clampedIndex = translateY.value > maxTranslateY ? 0 : options.length - 1;
                
                translateY.value = withSpring(targetY, {
                    damping: 15,
                    stiffness: 150,
                    mass: 0.5,
                    velocity: velocity
                });
                runOnJS(updateTempValue)(clampedIndex);
                return;
            }
            
            // Calculate projected position with decay
            const projectedPosition = translateY.value + velocity * 0.2;
            const rawIndex = Math.round((CENTER_OFFSET - projectedPosition) / ITEM_HEIGHT);
            const clampedIndex = Math.max(0, Math.min(rawIndex, options.length - 1));
            const targetY = CENTER_OFFSET - (clampedIndex * ITEM_HEIGHT);

            // Use withDecay for smooth momentum if velocity is high enough
            if (Math.abs(velocity) > 500) {
                 translateY.value = withDecay({
                    velocity: velocity,
                    clamp: [minTranslateY, maxTranslateY],
                }, (finished) => {
                    if (finished) {
                        // After decay, snap to nearest
                         const finalIndex = Math.round((CENTER_OFFSET - translateY.value) / ITEM_HEIGHT);
                         const finalClampedIndex = Math.max(0, Math.min(finalIndex, options.length - 1));
                         const finalTargetY = CENTER_OFFSET - (finalClampedIndex * ITEM_HEIGHT);
                         
                         translateY.value = withSpring(finalTargetY, {
                            damping: 15,
                            stiffness: 150,
                            mass: 0.5
                         });
                         runOnJS(updateTempValue)(finalClampedIndex);
                    }
                });
            } else {
                 translateY.value = withSpring(targetY, {
                    damping: 15,
                    stiffness: 150,
                    mass: 0.5,
                    velocity: velocity 
                });
                runOnJS(updateTempValue)(clampedIndex);
            }
        });

    const handleItemPress = (index: number) => {
        scrollTo(index);
    };

    const selectedLabel = value ? options.find(opt => opt.value === value)?.label || value : placeholder;

    return (
        <FormControl className="mb-3">
            <FormControlLabel>
                <FormControlLabelText className="text-white">{title}</FormControlLabelText>
            </FormControlLabel>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleOpen}
                className="mt-3 flex-row items-center justify-between rounded-2xl border border-white/20 bg-zinc-600 p-3"
            >
                <Text className={`flex-1 text-sm font-semibold ${value ? 'text-white' : 'text-white/60'}`}>
                    {selectedLabel}
                </Text>
                <Text className="text-white/60">▼</Text>
            </TouchableOpacity>

            {error && (
                <Text className="mt-1 text-xs text-red-400">{error}</Text>
            )}

            <CollapseDrawer showDrawer={showDrawer} setShowDrawer={setShowDrawer} title={title} >
                {/* Header */}
                <View className="flex-row justify-between items-center px-4 pb-4 border-b border-white/10">
                    <TouchableOpacity onPress={handleClose}>
                        <Text className="text-white/60 text-lg">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDone}>
                        <Text className="text-blue-500 text-lg font-bold">Done</Text>
                    </TouchableOpacity>
                </View>

                {/* Picker */}
                <View className="items-center py-8">
                    <View style={styles.pickerContainer}>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                            <GestureDetector gesture={gesture}>
                                <Animated.View style={styles.gestureArea}>
                                    {options.map((option, index) => (
                                        <WheelItem
                                            key={option.value}
                                            item={option}
                                            index={index}
                                            translateY={translateY}
                                            onPress={handleItemPress}
                                        />
                                    ))}
                                </Animated.View>
                            </GestureDetector>
                        </GestureHandlerRootView>
                        <View style={styles.pickerIndicator} pointerEvents="none" />
                    </View>
                </View>
            </CollapseDrawer>
        </FormControl>
    );
}

const styles = StyleSheet.create({
    pickerContainer: {
        width: 280,
        height: 215,
        backgroundColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
    },
    gestureArea: {
        width: '100%',
        minHeight: '100%',
    },
    pickerItem: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 8,
    },
    categoryText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        marginBottom: 2,
        fontWeight: '500',
    },
    pickerText: {
        fontSize: 18,
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: '600',
    },
    pickerIndicator: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: 50,
        marginTop: -25,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        pointerEvents: 'none',
    },
});
