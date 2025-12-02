import { Stack } from 'expo-router';
import { View, FlatList, Image, Dimensions, TouchableOpacity, Text, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useScrollHeader } from '../../../hooks/useScrollHeader';
import { CollapsibleHeader } from '../../../components/CollapsibleHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3;

export default function ClientTalents() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Add your refresh logic here (e.g., refetch talents)
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing talents:', error);
    } finally {
      setRefreshing(false);
    }
  };

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
          title="Talents"
          headerRight={
            <TouchableOpacity onPress={handleUsersPress} style={{ padding: 8 }}>
              <Ionicons name="people-outline" size={24} color="#fff" />
            </TouchableOpacity>
          }
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
        />
        <FlatList
          data={images}
          renderItem={renderImage}
          numColumns={3}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
          contentContainerStyle={{
            paddingTop: insets.top + 72, // Increased to account for larger header
          }}
        />
      </View>
    </>
  );
}
