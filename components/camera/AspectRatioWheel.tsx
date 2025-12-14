import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { RectangleHorizontal, RectangleVertical, Square } from 'lucide-react-native';

interface AspectRatioWheelProps {
  selectedRatio: number;
  onRatioChange: (ratio: number) => void;
  isLocked?: boolean;
}

const ASPECT_RATIOS = [
  { key: '1/1', value: 1, label: '1:1', icon: Square },
  { key: '4/5', value: 4 / 5, label: '4:5', icon: RectangleVertical },
  { key: '16/9', value: 16 / 9, label: '16:9', icon: RectangleHorizontal },
];

export function AspectRatioWheel({
  selectedRatio,
  onRatioChange,
  isLocked = false,
}: AspectRatioWheelProps) {
  const currentRatioIndex = ASPECT_RATIOS.findIndex(
    (r) => Math.abs(r.value - (selectedRatio === -1 ? 1 : selectedRatio)) < 0.01
  );

  const handlePress = () => {
    if (isLocked) {
      return; // Don't allow changes when locked
    }
    const nextIndex = (currentRatioIndex + 1) % ASPECT_RATIOS.length;
    onRatioChange(ASPECT_RATIOS[nextIndex].value);
  };

  const currentItem = ASPECT_RATIOS[currentRatioIndex === -1 ? 0 : currentRatioIndex];
  const Icon = currentItem.icon;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isLocked}
      activeOpacity={1}
      style={{
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
      <Icon size={12} color="#ffffff" />
      <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: 'bold' }}>{currentItem.label}</Text>
    </TouchableOpacity>
  );
}
