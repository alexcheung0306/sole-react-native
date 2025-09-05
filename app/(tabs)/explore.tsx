import { Stack } from 'expo-router';
import { View, FlatList, Image } from 'react-native';
import React from 'react';
import { useImageSize } from '../../hooks/useImageSize';
import { useTheme } from '../../contexts/ThemeContext';

export default function Explore() {
  const { isDark } = useTheme();
  const imageSize = useImageSize(3, 4);

  const images = Array.from({ length: 30 }, (_, i) => ({
    id: i.toString(),
    uri: `https://picsum.photos/300/300?random=${i}`,
  }));

  const renderImage = ({ item }: { item: { id: string; uri: string } }) => (
    <View className="p-0.5">
      <Image 
        source={{ uri: item.uri }} 
        style={{ 
          width: imageSize, 
          height: imageSize 
        }}
        className="rounded"
      />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Explore' }} />
      <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <FlatList
          data={images}
          renderItem={renderImage}
          numColumns={3}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}