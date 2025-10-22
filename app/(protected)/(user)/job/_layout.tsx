import { Stack, useRouter, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';

export default function JobLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: 'Job Posts', path: '/job/job-posts' },
    { name: 'Applied Roles', path: '/job/applied-roles' },
    { name: 'My Contracts', path: '/job/my-contracts' },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTitle: 'Jobs',
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#ffffff',
          },
        }}
      >
        <Stack.Screen
          name="job-posts"
          options={{
            headerShown: true,
            header: () => (
              <View className="bg-black">
                <View className="pt-12 pb-2 px-4">
                  <Text className="text-xl font-bold text-white">Jobs</Text>
                </View>
                <View className="flex-row border-b border-gray-700/50">
                  {tabs.map((tab) => (
                    <TouchableOpacity
                      key={tab.path}
                      onPress={() => router.push(tab.path as any)}
                      className={`flex-1 py-3 ${
                        isActive(tab.path) ? 'border-b-2 border-blue-500' : ''
                      }`}
                    >
                      <Text
                        className={`text-center font-semibold ${
                          isActive(tab.path) ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {tab.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="applied-roles"
          options={{
            headerShown: true,
            header: () => (
              <View className="bg-black">
                <View className="pt-12 pb-2 px-4">
                  <Text className="text-xl font-bold text-white">Jobs</Text>
                </View>
                <View className="flex-row border-b border-gray-700/50">
                  {tabs.map((tab) => (
                    <TouchableOpacity
                      key={tab.path}
                      onPress={() => router.push(tab.path as any)}
                      className={`flex-1 py-3 ${
                        isActive(tab.path) ? 'border-b-2 border-blue-500' : ''
                      }`}
                    >
                      <Text
                        className={`text-center font-semibold ${
                          isActive(tab.path) ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {tab.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="my-contracts"
          options={{
            headerShown: true,
            header: () => (
              <View className="bg-black">
                <View className="pt-12 pb-2 px-4">
                  <Text className="text-xl font-bold text-white">Jobs</Text>
                </View>
                <View className="flex-row border-b border-gray-700/50">
                  {tabs.map((tab) => (
                    <TouchableOpacity
                      key={tab.path}
                      onPress={() => router.push(tab.path as any)}
                      className={`flex-1 py-3 ${
                        isActive(tab.path) ? 'border-b-2 border-blue-500' : ''
                      }`}
                    >
                      <Text
                        className={`text-center font-semibold ${
                          isActive(tab.path) ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {tab.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ),
          }}
        />
      </Stack>
    </>
  );
}

