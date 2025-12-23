import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';

interface UserInfoFormPortalProps {
  userProfileData: any;
  isLoading?: boolean;
}

export interface ProfileFormValues {
  profilePic?: string | null;
  username: string;
  name: string;
  bio: string;
  category: string[];
}

export const UserInfoFormPortal = React.memo(function UserInfoFormPortal({ userProfileData, isLoading = false }: UserInfoFormPortalProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const userInfo = userProfileData?.userInfo;
  const soleUser = userProfileData?.soleUser;
  const username = soleUser?.username || '';
  const soleUserId = soleUser?.id || '';

  // Don't render if data not loaded
  if (!userInfo) return null;

  const handleOpen = () => {
    // Prevent multiple navigations
    if (isNavigating) {
      return;
    }

    setIsNavigating(true);

    const params: Record<string, string> = {
      formType: 'userInfo',
      soleUserId,
      username: username || '',
    };

    if (userInfo?.profilePic) params.profilePic = userInfo.profilePic;
    if (userInfo?.name) params.name = userInfo.name;
    if (userInfo?.bio) params.bio = userInfo.bio;
    if (userInfo?.category) params.category = userInfo.category;

    router.push({
      pathname: '/(protected)/form/[formType]' as any,
      params,
    });

    // Reset navigation state after a delay to allow navigation to complete
    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
  };

  return (
    <TouchableOpacity
      onPress={handleOpen}
      disabled={isLoading || isNavigating}
      className="rounded-lg bg-gray-700 px-4 py-2">
      <Text className="text-center font-semibold text-white">Edit Profile</Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.userProfileData === nextProps.userProfileData
  );
});
