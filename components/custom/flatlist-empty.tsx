import { View, ActivityIndicator, Text } from 'react-native';

export default function FlatListEmpty({
  title,
  description,
  isLoading,
  error,
}: {
  isLoading: boolean;
  error: Error | null;
  title: string;
  description: string;
}) {
  if (isLoading) {
    return (
      <View className="py-15 items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-3 text-sm text-gray-400">Loading {title}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="py-15 items-center">
        <Text className="mb-2 text-base font-semibold text-red-400">Error loading {title}</Text>
        <Text className="mb-2 text-center text-sm text-gray-400">
          {error?.message || `Failed to load ${title}`}
        </Text>
        <Text className="text-center text-xs italic text-gray-500">
          Please check your network connection and try again
        </Text>
      </View>
    );
  }

  return (
    <View className="py-15 items-center">
      <Text className="mb-2 text-lg font-semibold text-white">No {title} found</Text>
      <Text className="text-center text-sm text-gray-400">{description}</Text>
    </View>
  );
}
