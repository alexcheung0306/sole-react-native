import { Stack } from 'expo-router';
import { View, FlatList, Image, Dimensions, Button, Text, Alert } from 'react-native';
import { useState } from 'react';
import { getRoleById } from '../../../api/role_api';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3;

export default function UserJob() {
  const [loading, setLoading] = useState(false);
  const [roleData, setRoleData] = useState<any>(null);

  const images = Array.from({ length: 30 }, (_, i) => ({
    id: i.toString(),
    uri: `https://picsum.photos/300/300?random=${i}`,
  }));

  const handleGetRole = async () => {
    setLoading(true);
    try {
      const role = await getRoleById(240);
      setRoleData(role);
      console.log('Role data:', role);
    } catch (error) {
      console.error('Error fetching role:', error);
      Alert.alert(
        'API Error', 
        'Failed to fetch role data. Make sure your backend server is running on port 8080.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

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
      <Stack.Screen options={{ title: 'User Job' }} />
      <View className="flex-1 bg-white p-4">
        <Button 
          title={loading ? "Loading..." : "Get Role"} 
          onPress={handleGetRole}
          disabled={loading}
        />
        
        {roleData && (
          <View className="mt-4 p-4 bg-gray-100 rounded">
            <Text className="font-bold">Role Data:</Text>
            <Text>{JSON.stringify(roleData, null, 2)}</Text>
          </View>
        )}
        
     
      </View>
    </>
  );
}
