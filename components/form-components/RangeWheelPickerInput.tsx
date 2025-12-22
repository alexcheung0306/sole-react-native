import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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

const ITEM_HEIGHT = 50;
const CONTAINER_HEIGHT = 215;
const CENTER_OFFSET = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

interface RangeWheelPickerInputProps {
    title: string;
    values: any;
    setFieldValue: (field: string, value: any) => void;
    minDefaultValue?: string;
    maxDefaultValue?: string;
    rangeName: string;
    rangeMinName: string;
    rangeMaxName: string;
    maxDigits?: number;
    sliderLabel: string;
    sliderStep?: number;
    sliderMin?: number;
    sliderMax?: number;
}

const WheelItem = memo(({ 
    item, 
    index, 
    translateY, 
    onPress 
}: { 
    item: { value: string; label: string }; 
    index: number; 
    translateY: SharedValue<number>;
    onPress: (index: number) => void;
}) => {
    const animatedStyle = useAnimatedStyle(() => {
        'worklet';
        const itemCenterY = translateY.value + (index * ITEM_HEIGHT) + (ITEM_HEIGHT / 2);
        const containerCenterY = CONTAINER_HEIGHT / 2;
        const distanceFromCenter = Math.abs(itemCenterY - containerCenterY);

        // Simplified interpolation - reduce calculations for better performance
        const scale = interpolate(
            distanceFromCenter,
            [0, ITEM_HEIGHT * 1.5],
            [1.1, 0.85],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            distanceFromCenter,
            [0, ITEM_HEIGHT * 1.5],
            [1, 0.4],
            Extrapolation.CLAMP
        );
        
        // Remove expensive rotateX and perspective transforms for better performance
        return {
            transform: [
                { translateY: translateY.value + (index * ITEM_HEIGHT) },
                { scale }
            ],
            opacity
        };
    });

    return (
        <TouchableOpacity activeOpacity={1} onPress={() => onPress(index)}>
            <Animated.View style={[styles.pickerItem, animatedStyle]}>
                <Text style={styles.pickerText}>
                    {item.label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    // Custom comparison - only re-render if item or index changes
    return prevProps.item.value === nextProps.item.value && 
           prevProps.index === nextProps.index;
});

WheelItem.displayName = 'WheelItem';

interface WheelPickerProps {
    value: string | number;
    options: Array<{ value: string; label: string }>;
    onChange: (value: number) => void;
    isVisible?: boolean;
}

const WheelPicker = memo(({ value, options, onChange, isVisible = true }: WheelPickerProps) => {
    const translateY = useSharedValue(0);
    const context = useSharedValue(0);

    const initializePosition = useCallback(() => {
        const index = options.findIndex(opt => Number(opt.value) === Number(value));
        const safeIndex = index >= 0 ? index : 0;
        translateY.value = CENTER_OFFSET - (safeIndex * ITEM_HEIGHT);
    }, [value, options, translateY]);

    useEffect(() => {
        if (isVisible) {
            initializePosition();
        }
    }, [isVisible, initializePosition]);

    const updateValue = (index: number) => {
        const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
        const newValue = Number(options[clampedIndex]?.value);
        if (!isNaN(newValue)) {
            onChange(newValue);
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
        runOnJS(updateValue)(clampedIndex);
    };

    const gesture = Gesture.Pan()
        .onStart(() => {
            cancelAnimation(translateY);
            context.value = translateY.value;
        })
        .onUpdate((e) => {
            let newTranslateY = context.value + e.translationY;
            
            const minTranslateY = CENTER_OFFSET - ((options.length - 1) * ITEM_HEIGHT);
            const maxTranslateY = CENTER_OFFSET;
            
            if (newTranslateY > maxTranslateY) {
                const overscroll = newTranslateY - maxTranslateY;
                newTranslateY = maxTranslateY + Math.pow(overscroll, 0.8);
            } else if (newTranslateY < minTranslateY) {
                const overscroll = minTranslateY - newTranslateY;
                newTranslateY = minTranslateY - Math.pow(overscroll, 0.8);
            }
            
            translateY.value = newTranslateY;
        })
        .onEnd((e) => {
            const velocity = e.velocityY;
            const minTranslateY = CENTER_OFFSET - ((options.length - 1) * ITEM_HEIGHT);
            const maxTranslateY = CENTER_OFFSET;

            if (translateY.value > maxTranslateY || translateY.value < minTranslateY) {
                const targetY = translateY.value > maxTranslateY ? maxTranslateY : minTranslateY;
                const clampedIndex = translateY.value > maxTranslateY ? 0 : options.length - 1;
                
                translateY.value = withSpring(targetY, {
                    damping: 15,
                    stiffness: 150,
                    mass: 0.5,
                    velocity: velocity
                });
                runOnJS(updateValue)(clampedIndex);
                return;
            }
            
            if (Math.abs(velocity) > 500) {
                 translateY.value = withDecay({
                    velocity: velocity,
                    clamp: [minTranslateY, maxTranslateY],
                }, (finished) => {
                    if (finished) {
                         const finalIndex = Math.round((CENTER_OFFSET - translateY.value) / ITEM_HEIGHT);
                         const finalClampedIndex = Math.max(0, Math.min(finalIndex, options.length - 1));
                         const finalTargetY = CENTER_OFFSET - (finalClampedIndex * ITEM_HEIGHT);
                         
                         translateY.value = withSpring(finalTargetY, {
                            damping: 15,
                            stiffness: 150,
                            mass: 0.5
                         });
                         runOnJS(updateValue)(finalClampedIndex);
                    }
                });
            } else {
                const projectedPosition = translateY.value + velocity * 0.2;
                const rawIndex = Math.round((CENTER_OFFSET - projectedPosition) / ITEM_HEIGHT);
                const clampedIndex = Math.max(0, Math.min(rawIndex, options.length - 1));
                const targetY = CENTER_OFFSET - (clampedIndex * ITEM_HEIGHT);

                 translateY.value = withSpring(targetY, {
                    damping: 15,
                    stiffness: 150,
                    mass: 0.5,
                    velocity: velocity 
                });
                runOnJS(updateValue)(clampedIndex);
            }
        });

    return (
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
                                onPress={scrollTo}
                            />
                        ))}
                    </Animated.View>
                </GestureDetector>
            </GestureHandlerRootView>
            <View style={styles.pickerIndicator} pointerEvents="none" />
        </View>
    );
});

WheelPicker.displayName = 'WheelPicker';

export function RangeWheelPickerInput({
    title,
    values,
    setFieldValue,
    minDefaultValue = '15',
    maxDefaultValue = '30',
    rangeMinName,
    rangeMaxName,
    sliderLabel,
    sliderStep = 1,
    sliderMin = 1,
    sliderMax = 99,
}: RangeWheelPickerInputProps) {
    const [showDrawer, setShowDrawer] = useState(false);

    const currentMin = values[rangeMinName] !== undefined && values[rangeMinName] !== null
        ? Number(values[rangeMinName])
        : Number(minDefaultValue);

    const currentMax = values[rangeMaxName] !== undefined && values[rangeMaxName] !== null
        ? Number(values[rangeMaxName])
        : Number(maxDefaultValue);

    const [tempMin, setTempMin] = useState(currentMin);
    const [tempMax, setTempMax] = useState(currentMax);

    const rangeOptions = useMemo(() => {
        return Array.from({ length: Math.floor((sliderMax - sliderMin) / sliderStep) + 1 }, (_, i) => {
            const val = String(sliderMin + i * sliderStep);
            return { value: val, label: val };
        });
    }, [sliderMin, sliderMax, sliderStep]);

    const handleOpen = () => {
        setTempMin(currentMin);
        setTempMax(currentMax);
        setShowDrawer(true);
    };

    const handleClose = () => {
        setShowDrawer(false);
    };

    const handleDone = () => {
        setFieldValue(rangeMinName, tempMin);
        setFieldValue(rangeMaxName, tempMax);
        setShowDrawer(false);
    };

    return (
        <FormControl className="mb-4">
            <FormControlLabel>
                <FormControlLabelText className="text-white">{title}</FormControlLabelText>
            </FormControlLabel>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleOpen}
                className="mt-3 gap-4 rounded-lg border border-white/10 bg-zinc-800 p-4"
            >
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="mb-2 text-sm text-white/80">{sliderLabel}</Text>
                        <Text className="text-xl font-bold text-white">
                            {currentMin} - {currentMax}
                        </Text>
                    </View>
                    <Text className="text-white/60">Edit</Text>
                </View>
            </TouchableOpacity>

            <CollapseDrawer showDrawer={showDrawer} setShowDrawer={setShowDrawer} title={sliderLabel}  >
                {/* Header */}
                <View className="flex-row justify-between items-center px-4 pb-4 border-b border-white/10">
                    <TouchableOpacity onPress={handleClose}>
                        <Text className="text-white/60 text-lg">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDone}>
                        <Text className="text-blue-500 text-lg font-bold">Done</Text>
                    </TouchableOpacity>
                </View>

                {/* Pickers */}
                <View className="flex-row justify-center items-center py-8">
                    <View className="flex-1 items-center">
                        <Text className="text-white/60 mb-2 font-medium">Min</Text>
                        <WheelPicker 
                            value={tempMin} 
                            options={rangeOptions} 
                            onChange={setTempMin}
                            isVisible={showDrawer}
                        />
                    </View>
                    <View className="flex-1 items-center">
                        <Text className="text-white/60 mb-2 font-medium">Max</Text>
                        <WheelPicker 
                            value={tempMax} 
                            options={rangeOptions} 
                            onChange={setTempMax}
                            isVisible={showDrawer}
                        />
                    </View>
                </View>
            </CollapseDrawer>
        </FormControl>
    );
}

const styles = StyleSheet.create({
    pickerContainer: {
        width: 130,
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
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    pickerText: {
        fontSize: 22,
        color: '#ffffff',
        textAlign: 'center',
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
