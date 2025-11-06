import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { X, Check, Trash2, Image as ImageIcon, Crop, Grid3x3 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video } from 'expo-av';
import { useCreatePostContext, MediaItem } from '~/context/CreatePostContext';

const { width, height } = Dimensions.get('window');

type AspectRatio = '1:1' | '4:5' | '16:9';

const ASPECT_RATIOS: { key: AspectRatio; value: number; label: string }[] = [
  { key: '1:1', value: 1 / 1, label: 'Square' },
  { key: '4:5', value: 4 / 5, label: 'Portrait' },
  { key: '16:9', value: 16 / 9, label: 'Landscape' },
];

export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const { selectedMedia, setSelectedMedia, selectedAspectRatio, setSelectedAspectRatio, removeMedia } = useCreatePostContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAspectPicker, setShowAspectPicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleDelete = () => {
    if (!selectedMedia[currentIndex]) return;

    Alert.alert(
      'Delete Media',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeMedia(selectedMedia[currentIndex].id);
            
            if (selectedMedia.length === 1) {
              router.back();
            } else if (currentIndex >= selectedMedia.length - 1) {
              setCurrentIndex(selectedMedia.length - 2);
            }
          },
        },
      ]
    );
  };

  const handleAspectChange = (aspect: AspectRatio) => {
    setSelectedAspectRatio(aspect);
    setShowAspectPicker(false);
  };

  const navigateToCaption = () => {
    router.push('/(protected)/(user)/create-post/caption' as any);
  };

  const getAspectRatioValue = () => {
    const ratio = ASPECT_RATIOS.find((r) => r.key === selectedAspectRatio);
    return ratio?.value || 1;
  };

  const renderMainMedia = () => {
    if (selectedMedia.length === 0 || !selectedMedia[currentIndex]) {
      return null;
    }

    const item = selectedMedia[currentIndex];
    const aspectValue = getAspectRatioValue();
    const mediaHeight = width / aspectValue;

    return (
      <View
        style={{ width, height: mediaHeight }}
        className="bg-black items-center justify-center"
      >
        {item.mediaType === 'video' ? (
          <Video
            source={{ uri: item.uri }}
            style={{ width, height: mediaHeight }}
            resizeMode="cover"
            shouldPlay={false}
            useNativeControls
          />
        ) : (
          <ExpoImage
            source={{ uri: item.uri }}
            style={{ width, height: mediaHeight }}
            contentFit="cover"
          />
        )}
      </View>
    );
  };

  const renderThumbnail = ({ item, index }: { item: MediaItem; index: number }) => (
    <TouchableOpacity
      onPress={() => setCurrentIndex(index)}
      className={`mr-2 ${currentIndex === index ? 'border-2 border-blue-500' : 'border border-gray-600'} rounded-lg overflow-hidden`}
      style={{ width: 60, height: 60 }}
    >
      <ExpoImage
        source={{ uri: item.uri }}
        style={{ width: 60, height: 60 }}
        contentFit="cover"
      />
      {item.mediaType === 'video' && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <ImageIcon size={16} color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white font-semibold text-lg">Edit</Text>
          <TouchableOpacity onPress={navigateToCaption} className="p-2">
            <Text className="text-blue-500 font-semibold">Next</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Main Media Display */}
          {renderMainMedia()}

          {/* Controls */}
          <View className="px-4 py-4 border-b border-gray-800">
            <View className="flex-row items-center justify-between">
              {/* Crop Button */}
              <TouchableOpacity className="flex-row items-center bg-gray-800 rounded-lg px-4 py-2">
                <Crop size={18} color="#ffffff" />
                <Text className="text-white ml-2 font-medium">Crop</Text>
              </TouchableOpacity>

              {/* Aspect Ratio Selector */}
              <TouchableOpacity
                onPress={() => setShowAspectPicker(!showAspectPicker)}
                className="flex-row items-center bg-gray-800 rounded-lg px-4 py-2"
              >
                <Grid3x3 size={18} color="#ffffff" />
                <Text className="text-white ml-2 font-medium">{selectedAspectRatio}</Text>
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-row items-center bg-red-500/20 rounded-lg px-4 py-2"
              >
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>

            {/* Aspect Ratio Picker */}
            {showAspectPicker && (
              <View className="mt-3 flex-row justify-around bg-gray-800/50 rounded-lg p-3">
                {ASPECT_RATIOS.map((ratio) => (
                  <TouchableOpacity
                    key={ratio.key}
                    onPress={() => handleAspectChange(ratio.key)}
                    className={`px-4 py-2 rounded-lg ${
                      selectedAspect === ratio.key ? 'bg-blue-500' : 'bg-gray-700'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedAspect === ratio.key ? 'text-white' : 'text-gray-300'
                      }`}
                    >
                      {ratio.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Thumbnail Strip */}
          {selectedMedia.length > 1 && (
            <View className="px-4 py-3">
              <Text className="text-gray-400 text-sm mb-2">All Media ({selectedMedia.length})</Text>
              <FlatList
                data={selectedMedia}
                renderItem={renderThumbnail}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

