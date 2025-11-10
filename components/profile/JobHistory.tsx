import { Briefcase } from "lucide-react-native";
import { View, Text } from "react-native";

export default function JobHistory() {
  return (
    <View className="flex-1 items-center justify-center p-4">
    <Briefcase size={48} color="#6b7280" />
    <Text className="mt-4 text-lg text-gray-400">No Job Records</Text>
    <Text className="mt-2 text-sm text-gray-500">
      Job applications and contracts will appear here
    </Text>
  </View>
  );
}