import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { VideoView, useVideoPlayer } from 'expo-video';

interface CropData {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
    naturalWidth?: number;
    naturalHeight?: number;
}

interface EditableVideoProps {
    uri: string;
    containerWidth: number;
    containerHeight: number;
    naturalWidth: number;
    naturalHeight: number;
    cropData?: CropData;
    onUpdate: (data: CropData) => void;
}

const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(value, min), max);
};

export function EditableVideo({
    uri,
    containerWidth,
    containerHeight,
    naturalWidth,
    naturalHeight,
    cropData,
    onUpdate,
}: EditableVideoProps) {
    // Calculate initial scale to fit the video into the container (cover)
    const { baseScale, displayWidth, displayHeight } = useMemo(() => {
        const scaleX = containerWidth / naturalWidth;
        const scaleY = containerHeight / naturalHeight;
        const scale = Math.max(scaleX, scaleY); // Cover

        return {
            baseScale: scale,
            displayWidth: naturalWidth * scale,
            displayHeight: naturalHeight * scale,
        };
    }, [containerWidth, containerHeight, naturalWidth, naturalHeight]);

    // Shared values for gestures
    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const isGesturing = useSharedValue(0); // 0 = hidden, 1 = visible

    // Create video player
    const player = useVideoPlayer(uri, (player) => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    // Initialize from cropData if available
    useEffect(() => {
        if (cropData) {
            scale.value = cropData.zoom || 1;

            const totalScale = baseScale * (cropData.zoom || 1);
            const scaledWidth = naturalWidth * totalScale;
            const scaledHeight = naturalHeight * totalScale;

            const tx = -(cropData.x * totalScale) - (containerWidth - scaledWidth) / 2;
            const ty = -(cropData.y * totalScale) - (containerHeight - scaledHeight) / 2;

            if (!isNaN(tx) && !isNaN(ty)) {
                translateX.value = tx;
                translateY.value = ty;
            }
        } else {
            // Reset
            scale.value = 1;
            translateX.value = 0;
            translateY.value = 0;
        }
    }, [cropData, baseScale, naturalWidth, naturalHeight, containerWidth, containerHeight]);

    // Notify parent of updates
    const updateCropData = () => {
        const currentScale = scale.value;
        const currentTx = translateX.value;
        const currentTy = translateY.value;

        const totalScale = baseScale * currentScale;
        const scaledWidth = naturalWidth * totalScale;
        const scaledHeight = naturalHeight * totalScale;

        const imageLeft = (containerWidth - scaledWidth) / 2 + currentTx;
        const imageTop = (containerHeight - scaledHeight) / 2 + currentTy;

        const x = clamp((0 - imageLeft) / totalScale, 0, naturalWidth);
        const y = clamp((0 - imageTop) / totalScale, 0, naturalHeight);

        const cropW = containerWidth / totalScale;
        const cropH = containerHeight / totalScale;

        onUpdate({
            x,
            y,
            width: Math.min(cropW, naturalWidth),
            height: Math.min(cropH, naturalHeight),
            zoom: currentScale,
            naturalWidth,
            naturalHeight,
        });
    };

    const panGesture = Gesture.Pan()
        .onBegin(() => {
            isGesturing.value = withTiming(1, { duration: 150 });
        })
        .onChange((event) => {
            if (isNaN(event.changeX) || isNaN(event.changeY)) return;

            const currentScale = scale.value;
            const scaledWidth = displayWidth * currentScale;
            const scaledHeight = displayHeight * currentScale;

            const maxTranslateX = Math.max((scaledWidth - containerWidth) / 2, 0);
            const maxTranslateY = Math.max((scaledHeight - containerHeight) / 2, 0);

            const nextX = translateX.value + event.changeX;
            const nextY = translateY.value + event.changeY;

            translateX.value = clamp(nextX, -maxTranslateX, maxTranslateX);
            translateY.value = clamp(nextY, -maxTranslateY, maxTranslateY);
        })
        .onEnd(() => {
            isGesturing.value = withTiming(0, { duration: 200 });
            runOnJS(updateCropData)();
        });

    const pinchGesture = Gesture.Pinch()
        .onBegin(() => {
            isGesturing.value = withTiming(1, { duration: 150 });
        })
        .onChange((event) => {
            if (isNaN(event.scaleChange)) return;

            const nextScale = clamp(scale.value * event.scaleChange, 1, 5); // Max zoom 5x
            scale.value = nextScale;

            // Re-clamp translation to ensure we don't go out of bounds when zooming out
            const scaledWidth = displayWidth * nextScale;
            const scaledHeight = displayHeight * nextScale;
            const maxTranslateX = Math.max((scaledWidth - containerWidth) / 2, 0);
            const maxTranslateY = Math.max((scaledHeight - containerHeight) / 2, 0);

            translateX.value = clamp(translateX.value, -maxTranslateX, maxTranslateX);
            translateY.value = clamp(translateY.value, -maxTranslateY, maxTranslateY);
        })
        .onEnd(() => {
            isGesturing.value = withTiming(0, { duration: 200 });
            runOnJS(updateCropData)();
        });

    const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        width: displayWidth,
        height: displayHeight,
        position: 'absolute',
        left: (containerWidth - displayWidth) / 2,
        top: (containerHeight - displayHeight) / 2,
    }));

    const gridAnimatedStyle = useAnimatedStyle(() => ({
        opacity: isGesturing.value,
    }));

    return (
        <View style={{ width: containerWidth, height: containerHeight, overflow: 'hidden', backgroundColor: 'black' }}>
            <GestureDetector gesture={composedGesture}>
                <Animated.View style={animatedStyle}>
                    <VideoView
                        player={player}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        allowsPictureInPicture={false}
                        nativeControls={false}
                    />
                </Animated.View>
            </GestureDetector>

            {/* Grid Overlay - Only visible during pan/pinch gestures */}
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, gridAnimatedStyle]}>
                {/* Vertical Lines */}
                <View style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <View style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                {/* Horizontal Lines */}
                <View style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <View style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            </Animated.View>
        </View>
    );
}

