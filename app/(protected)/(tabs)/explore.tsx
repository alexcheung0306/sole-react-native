import { Stack } from 'expo-router';
import { View, FlatList, Image, Dimensions, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useScrollHeader } from '../../../hooks/useScrollHeader';
import { CollapsibleHeader } from '../../../components/CollapsibleHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3;

export default function Explore() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { headerTranslateY, handleScroll } = useScrollHeader();
  
  const images = Array.from({ length: 30 }, (_, i) => ({
    id: i.toString(),
    uri: `https://picsum.photos/300/300?random=${i}`,
  }));

  const handleUsersPress = () => {
    // router.push('/users');
  };

  const renderImage = ({ item }: { item: { id: string; uri: string } }) => (
    <View className="p-0.5">
      <Image 
        source={{ uri: item.uri }} 
        style={{ 
          width: IMAGE_SIZE - 4, 
          height: IMAGE_SIZE - 4 
        }}
        className="rounded-lg"
      />
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false, // Hide the default header
        }} 
      />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title="Explore"
          headerRight={
            <TouchableOpacity onPress={handleUsersPress} style={{ padding: 8 }}>
              <Ionicons name="people-outline" size={24} color="#fff" />
            </TouchableOpacity>
          }
          translateY={headerTranslateY}
          isDark={true}
        />
        <FlatList
          data={images}
          renderItem={renderImage}
          numColumns={3}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72, // Increased to account for larger header
          }}
        />
      </View>
    </>
  );
}