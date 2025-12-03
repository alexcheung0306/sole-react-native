import { Image as ExpoImage } from 'expo-image';
import { View, ScrollView, Text, Image, Dimensions } from 'react-native';
import { TalentInfoForm } from './TalentInfo-form';
import { useState, useEffect } from 'react';

export default function TalentProfile({
  talentLevel,
  talentInfo,
  isOwnProfile,
  userProfileData,
}: {
  talentLevel: number;
  talentInfo: any;
  isOwnProfile: boolean;
  userProfileData: any;
}) {
  const [imageHeight, setImageHeight] = useState<number | undefined>(undefined);
  const comcardPng = userProfileData?.comcardWithPhotosResponse?.png;
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (comcardPng) {
      Image.getSize(
        comcardPng,
        (width, height) => {
          // Calculate height based on full screen width
          const calculatedHeight = (height / width) * screenWidth;
          setImageHeight(calculatedHeight);
        },
        (error) => {
          console.error('Error loading image dimensions:', error);
          // Fallback to a default aspect ratio if dimensions can't be loaded
          setImageHeight(screenWidth * 1.33); // Default to 3:4 aspect ratio
        }
      );
    }
  }, [comcardPng, screenWidth]);

  console.log('talentProfile', userProfileData);
  // Handle null talentInfo
  if (!talentInfo) {
    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          <View className="rounded-lg bg-gray-800/50 p-4">
            <Text className="text-center text-gray-400">
              No talent profile information available
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="py-4">
        {/* Edit Button (for own profile) */}
        {isOwnProfile && (
          <TalentInfoForm
            talentLevel={talentLevel}
            talentInfo={talentInfo}
            userProfileData={userProfileData}
          />
        )}

        {/* Comcard Image */}
        {userProfileData?.comcardWithPhotosResponse?.png && (
          <View className="mb-6" style={{ width: screenWidth }}>
            <ExpoImage
              source={{ uri: userProfileData.comcardWithPhotosResponse.png }}
              style={{
                width: screenWidth,
                height: imageHeight || screenWidth * 1.33,
                minHeight: 200,
                borderRadius: 0,
              }}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
            />
          </View>
        )}

        {/* Personal Information */}
        <View className="">
          <Text className="mb-4 text-xl font-bold text-white">Personal Information</Text>
          <View className="rounded-lg  p-4">
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Talent Name</Text>
              <Text className="font-medium text-white">{talentInfo?.talentName || 'N/A'}</Text>
            </View>
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Gender</Text>
              <Text className="font-medium text-white">{talentInfo?.gender || 'N/A'}</Text>
            </View>
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Eye Color</Text>
              <Text className="font-medium text-white">{talentInfo?.eyeColor || 'N/A'}</Text>
            </View>
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Hair Color</Text>
              <Text className="font-medium text-white">{talentInfo?.hairColor || 'N/A'}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-300">Age</Text>
              <Text className="font-medium text-white">{talentInfo?.age || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Physical Measurements */}
        <View className="">
          <Text className="mb-4 text-xl font-bold text-white">Physical Measurements</Text>
          <View className="rounded-lg p-4">
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Height</Text>
              <Text className="font-medium text-white">{talentInfo?.height || 'N/A'} cm</Text>
            </View>
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Chest</Text>
              <Text className="font-medium text-white">{talentInfo?.chest || 'N/A'} cm</Text>
            </View>
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Waist</Text>
              <Text className="font-medium text-white">{talentInfo?.waist || 'N/A'} cm</Text>
            </View>
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Hip</Text>
              <Text className="font-medium text-white">{talentInfo?.hip || 'N/A'} cm</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-300">Shoes</Text>
              <Text className="font-medium text-white">{talentInfo?.shoes || 'N/A'} EU</Text>
            </View>
          </View>
        </View>

        {/* Background Information */}
        <View className=" ">
          <Text className="mb-4 text-xl font-bold text-white">Background</Text>
          <View className="rounded-lg  p-4">
            <View className="mb-3 flex-row justify-between border-b border-gray-700 pb-3">
              <Text className="text-gray-300">Ethnicity</Text>
              <Text className="font-medium text-white">{talentInfo?.ethnic || 'N/A'}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-300">Region</Text>
              <Text className="font-medium text-white">{talentInfo?.region || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Professional Experience */}
        <View className=" ">
          <Text className="mb-4 text-xl font-bold text-white">Professional Experience</Text>
            <View className="rounded-lg  p-4">
            <Text className="leading-6 text-white">
              {talentInfo?.experience || 'No experience listed'}
            </Text>
          </View>
        </View>

        {/* Portfolio Snapshots */}
        {(talentInfo?.snapshotHalfBody || talentInfo?.snapshotFullBody) && (
          <View className=" ">
            <Text className="mb-4 text-xl font-bold text-white">Portfolio Snapshots</Text>
            <View className="flex-row gap-3">
              {talentInfo?.snapshotHalfBody && (
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
              {talentInfo?.snapshotFullBody && (
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
