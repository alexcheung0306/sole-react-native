import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';

interface CropData {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
    naturalWidth?: number;
    naturalHeight?: number;
}

interface EditableImageProps {
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

export function EditableImage({
    uri,
    containerWidth,
    containerHeight,
    naturalWidth,
    naturalHeight,
    cropData,
    onUpdate,
}: EditableImageProps) {
    // Calculate initial scale to fit the image into the container (cover)
    // This is the "base" scale where the image covers the container fully.
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
    // scale is relative to the baseScale. 1 means "fit/cover", >1 means zoomed in.
    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // Initialize from cropData if available
    useEffect(() => {
        if (cropData) {
            // If we have crop data, we need to reverse the calculation to find scale/translate
            // cropData.zoom is the relative zoom
            scale.value = cropData.zoom || 1;

            // Calculate translation
            // The cropData.x/y are offsets in the ORIGINAL image coordinates.
            // We need to convert them to view translation.
            // 
            // Logic:
            // totalScale = baseScale * zoom
            // imageLeft = -cropData.x * totalScale
            // imageTop = -cropData.y * totalScale
            // 
            // But wait, our view is centered.
            // Let's look at how we want to behave.
            // 
            // If we simplify:
            // We just want to restore the visual state.
            // If we saved the cropData from THIS component, we should be able to restore it.
            // 
            // Let's assume cropData.x/y are the top-left corner of the crop in original pixels.
            // 
            // center of crop in original = x + width/2, y + height/2
            // center of view = containerWidth/2, containerHeight/2
            // 
            // It's complicated to reverse perfectly if the container size changed.
            // But if we assume consistent container size for the same aspect ratio...
            // 
            // Let's try to use the previous logic from ImageCropModal which seemed to work:
            // translateX = -(x * totalScale) - (frameWidth - scaledWidth) / 2

            const totalScale = baseScale * (cropData.zoom || 1);
            const scaledWidth = naturalWidth * totalScale;
            const scaledHeight = naturalHeight * totalScale;

            // frameWidth is containerWidth
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

        // Calculate the top-left corner of the crop in view coordinates relative to the image
        // imageLeft = (containerWidth - scaledWidth) / 2 + currentTx
        // cropLeft (relative to image) = 0 - imageLeft
        // x (original coords) = cropLeft / totalScale

        const imageLeft = (containerWidth - scaledWidth) / 2 + currentTx;
        const imageTop = (containerHeight - scaledHeight) / 2 + currentTy;

        const x = clamp((0 - imageLeft) / totalScale, 0, naturalWidth);
        const y = clamp((0 - imageTop) / totalScale, 0, naturalHeight);

        // Calculate crop width/height in original pixels
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
            runOnJS(updateCropData)();
        });

    const pinchGesture = Gesture.Pinch()
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
        // Center the image initially
        position: 'absolute',
        left: (containerWidth - displayWidth) / 2,
        top: (containerHeight - displayHeight) / 2,
    }));

    return (
        <View style={{ width: containerWidth, height: containerHeight, overflow: 'hidden', backgroundColor: 'black' }}>
            <GestureDetector gesture={composedGesture}>
                <Animated.View style={animatedStyle}>
                    <ExpoImage
                        source={{ uri }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                    />
                </Animated.View>
            </GestureDetector>

            {/* Grid Overlay - Always visible as requested "add the 4 lines" */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {/* Vertical Lines */}
                <View style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <View style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                {/* Horizontal Lines */}
                <View style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <View style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            </View>
        </View>
    );
}
