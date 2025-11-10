import { Image as ExpoImage } from 'expo-image';
import { Edit2 } from 'lucide-react-native';
import { View, TouchableOpacity, ScrollView, Text } from 'react-native';

export default function TalentProfile({
  talentInfo,
  isOwnProfile,
  setShowEditTalentModal,
}: {
  talentInfo: any;
  isOwnProfile: boolean;
  setShowEditTalentModal: (show: boolean) => void;
}) {
  if (!talentInfo) {
    return (
      <View className="items-center p-4">
        <Text className="mb-4 text-lg text-gray-400">No talent profile available</Text>
        {isOwnProfile && (
          <TouchableOpacity
            className="rounded-lg bg-blue-500 px-6 py-3"
            onPress={() => setShowEditTalentModal(true)}>
            <Text className="font-semibold text-white">Create Talent Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-4">
        {/* Edit Button (for own profile) */}
        {isOwnProfile && (
          <TouchableOpacity
            className="mb-6 flex-row items-center justify-center rounded-lg bg-blue-500 px-4 py-3"
            onPress={() => setShowEditTalentModal(true)}>
            <Edit2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text className="font-semibold text-white">Edit Talent Profile</Text>
          </TouchableOpacity>
        )}

        {/* Personal Information */}
        <View className="mb-6">
          <Text className="mb-4 text-xl font-bold text-white">Personal Information</Text>
          <View className="rounded-lg bg-gray-800/50 p-4">
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Talent Name</Text>
              <Text className="font-medium text-white">{talentInfo.talentName || 'N/A'}</Text>
            </View>
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Gender</Text>
              <Text className="font-medium text-white">{talentInfo.gender || 'N/A'}</Text>
            </View>
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Eye Color</Text>
              <Text className="font-medium text-white">{talentInfo.eyeColor || 'N/A'}</Text>
            </View>
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Hair Color</Text>
              <Text className="font-medium text-white">{talentInfo.hairColor || 'N/A'}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-300">Age</Text>
              <Text className="font-medium text-white">{talentInfo.age || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Physical Measurements */}
        <View className="mb-6">
          <Text className="mb-4 text-xl font-bold text-white">Physical Measurements</Text>
          <View className="rounded-lg bg-gray-800/50 p-4">
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Height</Text>
              <Text className="font-medium text-white">{talentInfo.height || 'N/A'} cm</Text>
            </View>
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Chest</Text>
              <Text className="font-medium text-white">{talentInfo.chest || 'N/A'} cm</Text>
            </View>
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Waist</Text>
              <Text className="font-medium text-white">{talentInfo.waist || 'N/A'} cm</Text>
            </View>
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Hip</Text>
              <Text className="font-medium text-white">{talentInfo.hip || 'N/A'} cm</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-300">Shoes (EU)</Text>
              <Text className="font-medium text-white">{talentInfo.shoes || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Background Information */}
        <View className="mb-6">
          <Text className="mb-4 text-xl font-bold text-white">Background</Text>
          <View className="rounded-lg bg-gray-800/50 p-4">
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Ethnicity</Text>
              <Text className="font-medium text-white">{talentInfo.ethnic || 'N/A'}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-300">Region</Text>
              <Text className="font-medium text-white">{talentInfo.region || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Professional Experience */}
        <View className="mb-6">
          <Text className="mb-4 text-xl font-bold text-white">Professional Experience</Text>
          <View className="rounded-lg bg-gray-800/50 p-4">
            <Text className="leading-6 text-white">
              {talentInfo.experience || 'No experience listed'}
            </Text>
          </View>
        </View>

        {/* Portfolio Snapshots */}
        {(talentInfo.snapshotHalfBody || talentInfo.snapshotFullBody) && (
          <View className="mb-6">
            <Text className="mb-4 text-xl font-bold text-white">Portfolio Snapshots</Text>
            <View className="flex-row gap-3">
              {talentInfo.snapshotHalfBody && (
                <View className="flex-1">
                  <Text className="mb-2 text-sm text-gray-300">Half-Body</Text>
                  <ExpoImage
                    source={{ uri: talentInfo.snapshotHalfBody }}
                    className="w-full rounded-lg"
                    style={{ aspectRatio: 3 / 4 }}
                    contentFit="cover"
                  />
                </View>
              )}
              {talentInfo.snapshotFullBody && (
                <View className="flex-1">
                  <Text className="mb-2 text-sm text-gray-300">Full-Body</Text>
                  <ExpoImage
                    source={{ uri: talentInfo.snapshotFullBody }}
                    className="w-full rounded-lg"
                    style={{ aspectRatio: 3 / 4 }}
                    contentFit="cover"
                  />
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
