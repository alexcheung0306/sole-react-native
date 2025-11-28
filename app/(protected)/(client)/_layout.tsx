import { Stack } from 'expo-router';
import { View } from 'react-native';
import { ManageProjectProvider } from '@/context/ManageProjectContext';
import { ManageContractProvider } from '@/context/ManageContractContext';
import { HeaderProvider } from '@/context/HeaderContext';

export default function ClientTabLayout() {
  return (
    <ManageProjectProvider>
      <ManageContractProvider>
        <HeaderProvider>
          <View style={{ flex: 1, backgroundColor: '#000000' }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#000000' },
              }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="dashboard" options={{ headerShown: false }} />
              <Stack.Screen name="bookmark" options={{ headerShown: false }} />
              <Stack.Screen name="talents" options={{ headerShown: false }} />
              <Stack.Screen name="projects" options={{ headerShown: false }} />
              <Stack.Screen name="client" options={{ headerShown: false }} />
            </Stack>
          </View>
        </HeaderProvider>
      </ManageContractProvider>
    </ManageProjectProvider>
  );
}
