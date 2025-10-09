import { Stack } from 'expo-router';
import { View, FlatList, Image, Dimensions, Text } from 'react-native';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3;

export default function ClientCamera() {
 

  return (
    <>
      <Stack.Screen options={{ title: ' Camera' }} />
      <View className="flex-1 bg-white">
        <Text> Camera</Text>
      </View>
    </>
  );
}
