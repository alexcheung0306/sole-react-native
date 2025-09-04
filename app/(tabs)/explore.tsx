import { Stack } from 'expo-router';
import { View, FlatList, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3;

export default function Explore() {
  const images = Array.from({ length: 30 }, (_, i) => ({
    id: i.toString(),
    uri: `https://picsum.photos/300/300?random=${i}`,
  }));

  const renderImage = ({ item }: { item: { id: string; uri: string } }) => (
    <View className="p-0.5">
      <Image 
        source={{ uri: item.uri }} 
        style={{ 
          width: IMAGE_SIZE - 4, 
          height: IMAGE_SIZE - 4 
        }}
        className="rounded"
      />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Explore' }} />
      <View className="flex-1 bg-white">
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