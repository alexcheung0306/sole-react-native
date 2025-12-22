import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCameraContext } from '~/context/CameraContext';
import { TalentFormValues } from './TalentInfoFormPortal';
import { SoleLogo } from '~/components/SoleLogo';

const { width: screenWidth } = Dimensions.get('window');

interface ComcardTemplateProps {
  values: TalentFormValues;
  setFieldValue: (field: string, value: any) => void;
  onPhotoPress?: (index: number) => void;
}

export function ComcardTemplate({ values, setFieldValue, onPhotoPress }: ComcardTemplateProps) {
  const handlePhotoPress = (index: number) => {
    if (onPhotoPress) {
      onPhotoPress(index);
    }
  };
  // Use screen width for responsive design, maintaining aspect ratio
  const cardWidth = screenWidth * 1;
  const aspectRatio = 297 / 210; // Same as web version
  const cardHeight = cardWidth / aspectRatio;

  return (
    <View className="w-full items-center">
      <Text className="mb-4 text-xl font-bold text-white">Comcard Preview</Text>

      {/* Main Card Container */}
      <View
        className="flex-row justify-between border border-white/20 bg-white p-1 gap-1"
        style={{
          width: cardWidth,
          height: cardHeight,
          aspectRatio: aspectRatio,
        }}
      >
        {/* Left Section */}
        <View className="flex-1 flex-col space-y-2">
          {/* Main Photo */}
          <View className="relative" style={{ aspectRatio: 4 / 5 }}>
            <TouchableOpacity
              className="h-full w-full overflow-hidden rounded-none border border-gray-200"
              onPress={() => handlePhotoPress(0)}
            >
              {values.photoConfig?.[0] ? (
                <Image
                  key={values.photoConfig[0]}
                  source={{ uri: values.photoConfig[0] }}
                  className="h-full w-full rounded-none"
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center bg-gray-100">
                  <Plus color="#6b7280" size={32} />
                  <Text className="mt-2 text-sm text-gray-500">Main Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Talent Name Overlay */}
            <View className="absolute bottom-2 left-2 rounded  p-1">
              <Text
                className="text-sm font-semibold"
                style={{ color: values.talentNameColor || 'black' }}
              >
                {values.talentName || 'Talent Name'}
              </Text>
            </View>
          </View>

          {/* Logo Section */}
          <View className="flex-1 items-center justify-center">
            <View className=" w-12 items-center justify-end">
              <SoleLogo width={48} height={24} fill="black" />
            </View>
          </View>
        </View>

        {/* Right Section */}
        <View className="flex-1 flex-col space-y-2">
          {/* Photo Grid */}
          <View
            className="flex-row flex-wrap"
            style={{ aspectRatio: 4 / 5 }}
          >
            {[1, 2, 3, 4].map((index) => (
              <TouchableOpacity
                key={index}
                className="overflow-hidden   border border-gray-200 rounded-none"
                style={{ 
                  width: '49.5%',
                  aspectRatio: 4 / 5,
                  marginRight: index % 2 === 0 ? 0 : '0.5%',
                  marginBottom: index <= 2 ? 2 : 0,
                }}
                onPress={() => handlePhotoPress(index)}
              >
                {values.photoConfig?.[index] ? (
                  <Image
                    key={values.photoConfig[index]}
                    source={{ uri: values.photoConfig[index] }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center bg-gray-100">
                    <Plus color="#6b7280" size={20} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Measurements Section */}
          <View className="flex-1  justify-center">
            {/* First Row: Gender, Hair, Eyes, Shoes */}
            <View className="flex-row justify-between mb-1">
              {[
                { label: "Gender", value: values.gender },
                { label: "Hair", value: values.hairColor },
                { label: "Eyes", value: values.eyeColor },
                { label: "Shoes", value: values.shoes },
              ].map((item, index) => (
                <View key={index} className="flex flex-row flex-start  gap-1">
                  <Text style={{ fontSize: 6 }}>{item.label}</Text>
                  <Text style={{ fontSize: 6 }}>{item.value || '-'}</Text>
                </View>
              ))}
            </View>
            {/* Second Row: Height, Chest, Waist, Hip */}
            <View className="flex-row justify-between">
              {[
                { label: "Height", value: values.height },
                { label: "Chest", value: values.chest },
                { label: "Waist", value: values.waist },
                { label: "Hip", value: values.hip },
              ].map((item, index) => (
                <View key={index} className="flex flex-row flex-start  gap-1">
                  <Text style={{ fontSize: 6 }}>{item.label}</Text>
                  <Text style={{ fontSize: 6 }}>{item.value || '-'}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <Text className="mt-2 text-center text-sm text-white/70">
        Tap on any photo area to add or change images
      </Text>
    </View>
  );
}
