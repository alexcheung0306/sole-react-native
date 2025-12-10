import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { X, Image as ImageIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreatePostContext, MediaItem } from '~/context/CreatePostContext';
import MainMedia from '~/components/camera/MainMedia';
import CropControls from '~/components/camera/CropControls';

const { width } = Dimensions.get('window');

// define where the camera is used, passed from camera index
type FunctionParam = 'post' | 'profile' | 'project';

export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const { selectedMedia, setSelectedMedia } = useCreatePostContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  // Default to 1:1 as requested
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number>(1);
  const { functionParam } = useLocalSearchParams<{ functionParam: FunctionParam }>();
  // Calculate center crop for a given aspect ratio
  const calculateCenterCrop = (media: MediaItem, targetRatio: number) => {
    const naturalWidth = media.cropData?.naturalWidth ?? media.width;
    const naturalHeight = media.cropData?.naturalHeight ?? media.height;

    // If we don't have dimensions, return null or default
    if (!naturalWidth || !naturalHeight) return null;

    let cropWidth = naturalWidth;
    let cropHeight = cropWidth / targetRatio;

    if (cropHeight > naturalHeight) {
      cropHeight = naturalHeight;
      cropWidth = cropHeight * targetRatio;
    }

    const x = (naturalWidth - cropWidth) / 2;
    const y = (naturalHeight - cropHeight) / 2;

    return {
      x,
      y,
      width: cropWidth,
      height: cropHeight,
      zoom: 1,
      naturalWidth,
      naturalHeight,
    };
  };
  // Initialize crop data for all photos when component mounts
  useEffect(() => {
    // Only initialize if photos don't have cropData yet
    const needsInitialization = selectedMedia.some(
      (item) => item.mediaType === 'photo' && !item.cropData
    );

    if (needsInitialization) {
      const updated = selectedMedia.map((item) => {
        if (item.mediaType !== 'photo' || item.cropData) return item;

        const newCropData = calculateCenterCrop(item, selectedAspectRatio);
        if (!newCropData) return item;

        const originalUri = item.originalUri ?? item.uri;

        return {
          ...item,
          cropData: newCropData,
          originalUri: originalUri,
        };
      });

      setSelectedMedia(updated);
    }
  }, []); // Only run on mount

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(protected)/(user)/home');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-800 px-4 py-3">
          <TouchableOpacity onPress={handleClose} className="p-2">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-white">Edit</Text>

          <TouchableOpacity
            onPress={() => {
              if (functionParam === 'post') {
                router.push('/(protected)/camera/caption' as any);
              } else if (functionParam === 'project') {
                // Return to Project Modal
                // We use double back to close Edit (modal) and Camera (screen)
                // This preserves the state of the screen underneath (Project Modal)
                if (router.canGoBack()) router.back(); // Dismiss Edit
                setTimeout(() => {
                  if (router.canGoBack()) router.back(); // Dismiss Camera
                }, 50);
              } else {
                router.push('/(protected)/projects' as any);
              }
            }}
            className="p-2">
            <Text className="font-semibold text-blue-500">Next</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Main Media Display */}
          <MainMedia
            currentIndex={currentIndex}
            width={width}
            selectedAspectRatio={selectedAspectRatio}
          />
          {/* Controls */}
          <CropControls
            selectedAspectRatio={selectedAspectRatio}
            setSelectedAspectRatio={setSelectedAspectRatio}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
          />

          {/* Thumbnail Strip */}
          {selectedMedia.length > 1 && (
            <View className="px-4 py-3">
              <Text className="mb-2 text-sm text-gray-400">All Media ({selectedMedia.length})</Text>
              <FlatList
                data={selectedMedia}
                renderItem={({ item, index }: { item: MediaItem; index: number }) => (
                  <TouchableOpacity
                    onPress={() => setCurrentIndex(index)}
                    className={`mr-2 ${currentIndex === index ? 'border-2 border-blue-500' : 'border border-gray-600'} overflow-hidden rounded-lg`}
                    style={{ width: 60, height: 60 }}>
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
                )}
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
