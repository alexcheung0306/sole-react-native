import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Picker } from 'react-native-wheel-pick';

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

    const rangeOptions = Array.from({ length: Math.floor((sliderMax - sliderMin) / sliderStep) + 1 }, (_, i) => {
        const val = String(sliderMin + i * sliderStep);
        return { value: val, label: val };
    });

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
                                        <Picker
                                            style={{ backgroundColor: 'transparent', width: 130, height: 215 }}
                                            selectedValue={String(tempMin)}
                                            pickerData={rangeOptions}
                                            onValueChange={(value: any) => setTempMin(Number(value))}
                                            textColor="white"
                                            textSize={22}
                                        />
                                    </View>
                                    <View className="flex-1 items-center">
                                        <Text className="text-white/60 mb-2 font-medium">Max</Text>
                                        <Picker
                                            style={{ backgroundColor: 'transparent', width: 130, height: 215 }}
                                            selectedValue={String(tempMax)}
                                            pickerData={rangeOptions}
                                            onValueChange={(value: any) => setTempMax(Number(value))}
                                            textColor="white"
                                            textSize={22}
                                        />
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
