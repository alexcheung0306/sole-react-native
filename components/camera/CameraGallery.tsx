import React, { useCallback, useMemo } from 'react';
import { View, TouchableOpacity, Text, FlatList, ActivityIndicator } from 'react-native';
import { Camera, ImageIcon } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MediaItem } from '~/context/CameraContext';
import MediaGridItem from './MediaGridItem';
import NativeScrollHandle from './NativeScrollHandle';

const { width } = require('react-native').Dimensions.get('window');
const ITEM_SIZE = width / 3;
const galleryGridColumns = 4;

interface CameraGalleryProps {
  mediaItems: (MediaItem | { id: 'camera' })[];
  selectionMap: Record<string, number>;
  isLoading: boolean;
  isMultiSelect: boolean;
  composedGesture: any;
  onScroll: (event: any) => void;
  openCamera: () => void;
  handleImagePress: (item: MediaItem, isSelected: boolean) => void;
  handleSelectionToggle: (item: MediaItem) => void;
  contentHeight: number;
  layoutHeight: number;
  scrollPosition: number;
  setContentHeight: (height: number) => void;
  setLayoutHeight: (height: number) => void;
  flatListRef: React.RefObject<FlatList | null>;
}

const CameraGallery = React.memo(({
  mediaItems,
  selectionMap,
  isLoading,
  isMultiSelect,
  composedGesture,
  onScroll,
  openCamera,
  handleImagePress,
  handleSelectionToggle,
  contentHeight,
  layoutHeight,
  scrollPosition,
  setContentHeight,
  setLayoutHeight,
  flatListRef,
}: CameraGalleryProps) => {
  const insets = useSafeAreaInsets();

  // Memoized styles to prevent recreation on every render
  const flatListStyle = useMemo(() => ({ paddingTop: 0 }), []);
  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: insets.bottom + 72,
    }),
    [insets.bottom]
  );


  // Memoized renderItem for FlatList to prevent unnecessary re-renders
  const renderItem = useCallback(
    ({ item, index }: any) => {
      // Camera option in first position
      if (index === 0 && item.id === 'camera') {
        return (
          <TouchableOpacity
            style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
            className="items-center justify-center border-b border-r border-gray-900 bg-gray-800"
            onPress={openCamera}
            activeOpacity={0.8}>
            <Camera size={40} color="#ffffff" />
            <Text className="mt-2 text-xs font-medium text-white">Camera</Text>
          </TouchableOpacity>
        );
      }
      const selectionNumber = selectionMap[item.id] || null;
      const isSelected = selectionNumber !== null;
      return (
        <MediaGridItem
          item={item}
          isSelected={isSelected}
          selectionNumber={selectionNumber}
          isMultiSelect={isMultiSelect}
          onImagePress={handleImagePress}
          onSelectionToggle={handleSelectionToggle}
        />
      );
    },
    [
      openCamera,
      selectionMap,
      isMultiSelect,
      handleImagePress,
      handleSelectionToggle,
    ]
  );

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: insets.top + 70, paddingBottom: insets.bottom + 70 }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-2 text-gray-400">Loading media...</Text>
      </View>
    );
  }

  return (
    <View className="relative flex-1">
      {/* <GestureDetector gesture={composedGesture}> */}
        <FlatList
          ref={flatListRef}
          bounces={false}
          style={flatListStyle}
          data={mediaItems}
          keyExtractor={(item: any) => item.id}
          numColumns={galleryGridColumns}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={contentContainerStyle}
          renderItem={renderItem}
          onLayout={(event) => {
            setLayoutHeight(event.nativeEvent.layout.height);
          }}
          onContentSizeChange={(width, height) => {
            setContentHeight(height);
          }}
        />
      {/* </GestureDetector> */}

      {/* Native Scroll Indicator Handle */}
      {contentHeight > layoutHeight && (
        <NativeScrollHandle
          layoutHeight={layoutHeight}
          contentHeight={contentHeight}
          scrollPosition={scrollPosition}
          flatListRef={flatListRef as React.RefObject<FlatList>}
        />
      )}
    </View>
  );
});

export default CameraGallery;
