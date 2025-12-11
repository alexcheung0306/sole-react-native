import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView, StyleSheet } from 'react-native';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';

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
    const [modalVisible, setModalVisible] = useState(false);

    const currentMin = values[rangeMinName] !== undefined && values[rangeMinName] !== null
        ? Number(values[rangeMinName])
        : Number(minDefaultValue);

    const currentMax = values[rangeMaxName] !== undefined && values[rangeMaxName] !== null
        ? Number(values[rangeMaxName])
        : Number(maxDefaultValue);

    // Temporary state for the modal
    const [tempMin, setTempMin] = useState(currentMin);
    const [tempMax, setTempMax] = useState(currentMax);
    
    // Refs for ScrollViews
    const minScrollRef = useRef<ScrollView>(null);
    const maxScrollRef = useRef<ScrollView>(null);

    const rangeOptions = Array.from({ length: Math.floor((sliderMax - sliderMin) / sliderStep) + 1 }, (_, i) => {
        const val = String(sliderMin + i * sliderStep);
        return { value: val, label: val };
    });
    
    // Scroll to selected value when modal opens
    useEffect(() => {
        if (modalVisible) {
            const minIndex = rangeOptions.findIndex(opt => Number(opt.value) === tempMin);
            const maxIndex = rangeOptions.findIndex(opt => Number(opt.value) === tempMax);
            
            setTimeout(() => {
                if (minScrollRef.current && minIndex >= 0) {
                    minScrollRef.current.scrollTo({ y: minIndex * 50, animated: false });
                }
                if (maxScrollRef.current && maxIndex >= 0) {
                    maxScrollRef.current.scrollTo({ y: maxIndex * 50, animated: false });
                }
            }, 100);
        }
    }, [modalVisible]);

    const handleOpen = () => {
        setTempMin(currentMin);
        setTempMax(currentMax);
        setModalVisible(true);
    };

    const handleClose = () => {
        setModalVisible(false);
    };

    const handleDone = () => {
        setFieldValue(rangeMinName, tempMin);
        setFieldValue(rangeMaxName, tempMax);
        setModalVisible(false);
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

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleClose}
            >
                <TouchableWithoutFeedback onPress={handleClose}>
                    <View className="flex-1 justify-end bg-black/50">
                        <TouchableWithoutFeedback>
                            <View className="bg-zinc-900 rounded-t-3xl border-t border-white/10 pb-10">
                                {/* Header */}
                                <View className="flex-row justify-between items-center p-4 border-b border-white/10">
                                    <TouchableOpacity onPress={handleClose}>
                                        <Text className="text-white/60 text-lg">Cancel</Text>
                                    </TouchableOpacity>
                                    <Text className="text-white font-bold text-lg">{sliderLabel}</Text>
                                    <TouchableOpacity onPress={handleDone}>
                                        <Text className="text-blue-500 text-lg font-bold">Done</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Pickers */}
                                <View className="flex-row justify-center items-center py-8">
                                    <View className="flex-1 items-center">
                                        <Text className="text-white/60 mb-2 font-medium">Min</Text>
                                        <View style={styles.pickerContainer}>
                                            <ScrollView
                                                ref={minScrollRef}
                                                showsVerticalScrollIndicator={false}
                                                snapToInterval={50}
                                                decelerationRate="fast"
                                                contentContainerStyle={styles.pickerContent}
                                                onMomentumScrollEnd={(e) => {
                                                    const y = e.nativeEvent.contentOffset.y;
                                                    const index = Math.round(y / 50);
                                                    const clampedIndex = Math.max(0, Math.min(index, rangeOptions.length - 1));
                                                    const newValue = Number(rangeOptions[clampedIndex].value);
                                                    setTempMin(newValue);
                                                    // Snap to exact position
                                                    minScrollRef.current?.scrollTo({ y: clampedIndex * 50, animated: true });
                                                }}
                                                onScrollEndDrag={(e) => {
                                                    const y = e.nativeEvent.contentOffset.y;
                                                    const index = Math.round(y / 50);
                                                    const clampedIndex = Math.max(0, Math.min(index, rangeOptions.length - 1));
                                                    minScrollRef.current?.scrollTo({ y: clampedIndex * 50, animated: true });
                                                }}
                                            >
                                                {rangeOptions.map((option, index) => {
                                                    const isSelected = Number(option.value) === tempMin;
                                                    return (
                                                        <TouchableOpacity
                                                            key={option.value}
                                                            style={styles.pickerItem}
                                                            onPress={() => {
                                                                setTempMin(Number(option.value));
                                                                minScrollRef.current?.scrollTo({ y: index * 50, animated: true });
                                                            }}
                                                        >
                                                            <Text style={[styles.pickerText, isSelected && styles.pickerTextSelected]}>
                                                                {option.label}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </ScrollView>
                                            <View style={styles.pickerIndicator} />
                                        </View>
                                    </View>
                                    <View className="flex-1 items-center">
                                        <Text className="text-white/60 mb-2 font-medium">Max</Text>
                                        <View style={styles.pickerContainer}>
                                            <ScrollView
                                                ref={maxScrollRef}
                                                showsVerticalScrollIndicator={false}
                                                snapToInterval={50}
                                                decelerationRate="fast"
                                                contentContainerStyle={styles.pickerContent}
                                                onMomentumScrollEnd={(e) => {
                                                    const y = e.nativeEvent.contentOffset.y;
                                                    const index = Math.round(y / 50);
                                                    const clampedIndex = Math.max(0, Math.min(index, rangeOptions.length - 1));
                                                    const newValue = Number(rangeOptions[clampedIndex].value);
                                                    setTempMax(newValue);
                                                    // Snap to exact position
                                                    maxScrollRef.current?.scrollTo({ y: clampedIndex * 50, animated: true });
                                                }}
                                                onScrollEndDrag={(e) => {
                                                    const y = e.nativeEvent.contentOffset.y;
                                                    const index = Math.round(y / 50);
                                                    const clampedIndex = Math.max(0, Math.min(index, rangeOptions.length - 1));
                                                    maxScrollRef.current?.scrollTo({ y: clampedIndex * 50, animated: true });
                                                }}
                                            >
                                                {rangeOptions.map((option, index) => {
                                                    const isSelected = Number(option.value) === tempMax;
                                                    return (
                                                        <TouchableOpacity
                                                            key={option.value}
                                                            style={styles.pickerItem}
                                                            onPress={() => {
                                                                setTempMax(Number(option.value));
                                                                maxScrollRef.current?.scrollTo({ y: index * 50, animated: true });
                                                            }}
                                                        >
                                                            <Text style={[styles.pickerText, isSelected && styles.pickerTextSelected]}>
                                                                {option.label}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </ScrollView>
                                            <View style={styles.pickerIndicator} />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
    pickerContent: {
        paddingVertical: 82.5, // Center the selected item (215 / 2 - 50 / 2)
    },
    pickerItem: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerText: {
        fontSize: 22,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
    },
    pickerTextSelected: {
        color: '#ffffff',
        fontWeight: 'bold',
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
