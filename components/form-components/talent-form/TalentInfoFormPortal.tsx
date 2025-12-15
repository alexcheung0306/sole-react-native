import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Edit2 } from 'lucide-react-native';
import { router } from 'expo-router';

interface TalentInfoFormPortalProps {
  userProfileData: any;
  talentLevel: number | null;
  talentInfo: any;
}

export interface TalentFormValues {
  talentName: string;
  gender: string;
  eyeColor: string;
  hairColor: string;
  age: string;
  height: string;
  chest: string;
  waist: string;
  hip: string;
  shoes: string;
  ethnic: string;
  region: string;
  experience: string;
  snapshotHalfBody?: string | null;
  snapshotFullBody?: string | null;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other'];
const EYE_COLOR_OPTIONS = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber'];
const HAIR_COLOR_OPTIONS = ['Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White', 'Other'];
const ETHNIC_OPTIONS = [
  'Asian',
  'Caucasian',
  'African',
  'Hispanic',
  'Middle Eastern',
  'Pacific Islander',
  'Mixed',
];

export function TalentInfoFormPortal({ userProfileData, talentLevel, talentInfo }: TalentInfoFormPortalProps) {
  const soleUserId = userProfileData?.userInfo?.soleUserId;

  // Handle talent level logic (matching web pattern)
  if (talentLevel === null) {
    return (
      <View className="items-center p-4">
        <Text className="mb-4 text-center text-black-400">
          Please set your account type in settings first
        </Text>
        <TouchableOpacity
          className="rounded-lg bg-gray-700 px-6 py-3"
          onPress={() => {
            Alert.alert('Info', 'Please set your account type in settings');
          }}>
          <Text className="font-semibold text-white">Go to Account Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleOpen = () => {
    const params: Record<string, string> = {
      formType: 'talentInfo',
      soleUserId: soleUserId || '',
      talentLevel: String(talentLevel),
    };

    if (talentInfo) {
      if (talentInfo.talentName) params.talentName = talentInfo.talentName;
      if (talentInfo.gender) params.gender = talentInfo.gender;
      if (talentInfo.eyeColor) params.eyeColor = talentInfo.eyeColor;
      if (talentInfo.hairColor) params.hairColor = talentInfo.hairColor;
      if (talentInfo.age) params.age = String(talentInfo.age);
      if (talentInfo.height) params.height = String(talentInfo.height);
      if (talentInfo.chest) params.chest = String(talentInfo.chest);
      if (talentInfo.waist) params.waist = String(talentInfo.waist);
      if (talentInfo.hip) params.hip = String(talentInfo.hip);
      if (talentInfo.shoes) params.shoes = String(talentInfo.shoes);
      if (talentInfo.ethnic) params.ethnic = talentInfo.ethnic;
      if (talentInfo.region) params.region = talentInfo.region;
      if (talentInfo.experience) params.experience = talentInfo.experience;
      if (talentInfo.snapshotHalfBody) params.snapshotHalfBody = talentInfo.snapshotHalfBody;
      if (talentInfo.snapshotFullBody) params.snapshotFullBody = talentInfo.snapshotFullBody;
    }

    router.push({
      pathname: '/(protected)/form/[formType]' as any,
      params,
    });
  };

  return (
    <>
      {talentLevel === 0 ? (
        <View className="items-center">
          <TouchableOpacity
            className="w-full mb-6 flex-row items-center justify-center 
            rounded-lg bg-white px-4 py-2 text-black shadow-md"
            onPress={handleOpen}>
            <Text className="font-semibold text-black">Create Talent Profile</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="items-center px-2">
          <TouchableOpacity
            className="w-full mb-6 flex-row items-center justify-center 
            rounded-lg bg-white px-4 py-2 text-black shadow-md"
            onPress={handleOpen}>
            <Edit2 size={18} color="#000000" style={{ marginRight: 8 }} />
            <Text className="font-semibold">Edit Talent Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
