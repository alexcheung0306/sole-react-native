import React, { useRef } from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { RectangleHorizontal, RectangleVertical, Square } from 'lucide-react-native';

interface AspectRatioWheelProps {
    selectedRatio: number;
    onRatioChange: (ratio: number) => void;
}

const ASPECT_RATIOS = [
    { key: '1/1', value: 1, label: '1:1', icon: Square },
    { key: '4/5', value: 4 / 5, label: '4:5', icon: RectangleVertical },
    { key: '16/9', value: 16 / 9, label: '16:9', icon: RectangleHorizontal },
];

const PAGE_WIDTH = 120; // Increased width
const PAGE_HEIGHT = 80; // Increased height

export function AspectRatioWheel({ selectedRatio, onRatioChange }: AspectRatioWheelProps) {
    const carouselRef = useRef<ICarouselInstance>(null);

    // Find initial index
    const initialIndex = ASPECT_RATIOS.findIndex(
        (r) => Math.abs(r.value - (selectedRatio === -1 ? 1 : selectedRatio)) < 0.01
    );

    return (
        <View style={{ height: PAGE_HEIGHT, width: 300, alignItems: 'center', justifyContent: 'center' }}>
            <Carousel
                ref={carouselRef}
                loop
                width={PAGE_WIDTH}
                height={PAGE_HEIGHT}
                style={{ width: 300, height: PAGE_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
                data={ASPECT_RATIOS}
                defaultIndex={initialIndex === -1 ? 0 : initialIndex}
                onSnapToItem={(index) => {
                    onRatioChange(ASPECT_RATIOS[index].value);
                }}
                renderItem={({ item, index, animationValue }) => {
                    const Icon = item.icon;

                    const animatedStyle = useAnimatedStyle(() => {
                        const backgroundColor = interpolateColor(
                            animationValue.value,
                            [-1, 0, 1],
                            ['#000000', '#FFFFFF', '#000000']
                        );

                        const borderColor = interpolateColor(
                            animationValue.value,
                            [-1, 0, 1],
                            ['#333333', '#E5E7EB', '#333333']
                        );

                        return {
                            backgroundColor,
                            borderColor,
                        };
                    });

                    const textStyle = useAnimatedStyle(() => {
                        const color = interpolateColor(
                            animationValue.value,
                            [-1, 0, 1],
                            ['#FFFFFF', '#000000', '#FFFFFF']
                        );
                        return { color };
                    });

                    // We need a wrapper for the icon to animate its color
                    // Since Lucide icons take a color prop, we can't easily animate it with useAnimatedStyle directly on the icon
                    // But we can use a derived value if we were passing it to a Reanimated component, 
                    // or just swap opacity of two icons.
                    // Simpler approach: Use the text color logic for the icon if possible, 
                    // but Lucide icons don't support animated color prop directly in this version likely.
                    // 
                    // Workaround: Render two icons (one black, one white) and crossfade opacity.

                    const whiteIconOpacity = useAnimatedStyle(() => ({
                        opacity: interpolateColor(animationValue.value, [-0.5, 0, 0.5], [1, 0, 1]) === '#FFFFFF' ? 1 : 0, // Rough approximation or use interpolate
                        // Better:
                        // opacity: Math.abs(animationValue.value) > 0.5 ? 1 : 0 // This is abrupt
                        // Let's use proper interpolation for opacity
                    }));

                    // Actually, interpolateColor returns a string.
                    // Let's just use two icons absolute positioned.

                    const activeOpacity = useAnimatedStyle(() => ({
                        opacity: 1 - Math.abs(animationValue.value), // 1 at center, 0 at sides
                    }));

                    const inactiveOpacity = useAnimatedStyle(() => ({
                        opacity: Math.abs(animationValue.value), // 0 at center, 1 at sides
                    }));

                    return (
                        <TouchableWithoutFeedback onPress={() => {
                            carouselRef.current?.scrollTo({ index, animated: true });
                        }}>
                            <View
                                style={{
                                    flex: 1,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Animated.View
                                    className="items-center justify-center rounded-xl px-4 py-2 border shadow-sm w-full h-full"
                                    style={animatedStyle}
                                >
                                    {/* Active State (Black Icon) */}
                                    <Animated.View style={[{ position: 'absolute', alignItems: 'center' }, activeOpacity]}>
                                        <Icon size={24} color="black" />
                                        <Text className="text-black text-sm font-bold mt-1">{item.label}</Text>
                                    </Animated.View>

                                    {/* Inactive State (White Icon) */}
                                    <Animated.View style={[{ position: 'absolute', alignItems: 'center' }, inactiveOpacity]}>
                                        <Icon size={24} color="white" />
                                        <Text className="text-white text-sm font-bold mt-1">{item.label}</Text>
                                    </Animated.View>
                                </Animated.View>
                            </View>
                        </TouchableWithoutFeedback>
                    );
                }}
                mode="parallax"
                modeConfig={{
                    parallaxScrollingScale: 0.85,
                    parallaxScrollingOffset: 40,
                }}
            />
        </View>
    );
}
