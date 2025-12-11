import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Camera, User as UserIcon, Plus } from 'lucide-react-native';
import { Formik, useFormikContext } from 'formik';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useIsFocused } from '@react-navigation/native';
import { CategoriesCard } from '@/components/form-components/CategoriesCard';
import { FormModal } from '../custom/form-modal';
import { updateUserInfoBySoleUserId } from '~/api/apiservice/userInfo_api';
import { updateSoleUserByClerkId, getSoleUserByClerkId } from '~/api/apiservice';
import { useCameraContext } from '~/context/CameraContext';
import {
  validateUsername,
  validateName,
  validateBio,
} from '~/lib/validations/userInfo-validations';

interface UserInfoFormProps {
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

// Helper component to handle effects that need Formik context
function UserInfoFormEffects({
  isFocused,
  isWaitingForCamera,
  selectedMedia,
  setIsWaitingForCamera,
  isModalOpen,
  userInfo,
  user,
  setSelectedCategories,
}: {
  isFocused: boolean;
  isWaitingForCamera: boolean;
  selectedMedia: any[];
  setIsWaitingForCamera: (value: boolean) => void;
  isModalOpen: boolean;
  userInfo: any;
  user: any;
  setSelectedCategories: (categories: string[]) => void;
}) {
  const { values, setFieldValue } = useFormikContext<ProfileFormValues>();
  const hasSyncedOnOpenRef = React.useRef(false);

  // Effect to update profilePic when selectedMedia changes (returned from camera)
  // Track the first media item's URI to detect changes
  const selectedMediaUri = selectedMedia.length > 0 ? selectedMedia[0]?.uri : null;

  useEffect(() => {
    console.log('[UserInfoForm] Effect triggered:', {
      isFocused,
      isWaitingForCamera,
      selectedMediaLength: selectedMedia.length,
      selectedMediaUri,
      currentProfilePic: values.profilePic,
    });

    if (isFocused && isWaitingForCamera && selectedMediaUri) {
      console.log('[UserInfoForm] Camera returned, setting profilePic to:', selectedMediaUri);
      console.log('[UserInfoForm] Current profilePic value:', values.profilePic);
      if (selectedMediaUri !== values.profilePic) {
        console.log('[UserInfoForm] Updating profilePic from', values.profilePic, 'to', selectedMediaUri);
        setFieldValue('profilePic', selectedMediaUri);
        setIsWaitingForCamera(false); // Reset flag
      } else {
        console.log('[UserInfoForm] URI unchanged, skipping update');
        setIsWaitingForCamera(false);
      }
    } else if (isWaitingForCamera && !selectedMediaUri) {
      console.log('[UserInfoForm] Waiting for camera but no media yet');
    }
  }, [isFocused, isWaitingForCamera, selectedMediaUri, values.profilePic]); // Track URI directly to detect changes

  // Reset sync flag when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      hasSyncedOnOpenRef.current = false;
    }
  }, [isModalOpen]);

  // Sync Formik values when modal opens to ensure initial values are set
  // Only sync ONCE when modal first opens, and only if we're NOT waiting for camera
  // Also don't sync if current value is a local file URI (from camera) - preserve user's new selection
  useEffect(() => {
    if (isModalOpen && !isWaitingForCamera && !hasSyncedOnOpenRef.current) {
      const currentProfilePic = userInfo?.profilePic || user?.imageUrl || null;
      const isLocalFile = values.profilePic?.startsWith('file://');

      console.log('[UserInfoForm] Sync effect check:', {
        isModalOpen,
        isWaitingForCamera,
        hasSynced: hasSyncedOnOpenRef.current,
        currentProfilePic,
        valuesProfilePic: values.profilePic,
        isLocalFile,
      });

      // Don't overwrite if:
      // 1. Current value is a local file (from camera) - user just selected a new image
      // 2. Current value matches the server value - already in sync
      if (isLocalFile) {
        console.log('[UserInfoForm] Skipping sync - preserving local file selection:', values.profilePic);
        hasSyncedOnOpenRef.current = true; // Mark as synced to prevent future overwrites
      } else if (currentProfilePic && currentProfilePic !== values.profilePic) {
        console.log('[UserInfoForm] Syncing profilePic on modal open:', currentProfilePic);
        setFieldValue('profilePic', currentProfilePic);
        hasSyncedOnOpenRef.current = true;
      } else if (currentProfilePic === values.profilePic) {
        // Already in sync, just mark as synced
        console.log('[UserInfoForm] Already in sync, marking as synced');
        hasSyncedOnOpenRef.current = true;
      }
    }
  }, [isModalOpen, isWaitingForCamera, userInfo?.profilePic, user?.imageUrl, values.profilePic]); // Added isWaitingForCamera to prevent overwrite

  // Sync selectedCategories with Formik values when modal opens
  useEffect(() => {
    if (values.category && values.category.length > 0) {
      setSelectedCategories(values.category);
    }
  }, [values.category, setSelectedCategories]);

  return null;
}

export const UserInfoForm = React.memo(function UserInfoForm({ userProfileData, isLoading = false }: UserInfoFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWaitingForCamera, setIsWaitingForCamera] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useUser();
  const { selectedMedia, clearMedia } = useCameraContext();
  const isFocused = useIsFocused();

  const userInfo = userProfileData?.userInfo;
  const soleUser = userProfileData?.soleUser;
  const username = soleUser?.username || '';
  const soleUserId = soleUser?.id || '';

  // Get initial category array from userInfo
  const initialCategories = useMemo(() => {
    return userInfo?.category
      ? userInfo.category.split(',').filter((c: string) => c.trim())
      : [];
  }, [userInfo?.category]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);

  // Update selectedCategories when userInfo changes
  React.useEffect(() => {
    if (userInfo?.category) {
      const cats = userInfo.category.split(',').filter((c: string) => c.trim());
      setSelectedCategories(cats);
    }
  }, [userInfo?.category]);

  // Compute initial values using useMemo to prevent recalculation on every render
  const initialValues = useMemo((): ProfileFormValues => {
    const values = {
      profilePic: userInfo?.profilePic || user?.imageUrl || null,
      username: soleUser?.username || '',
      name: userInfo?.name || '',
      bio: userInfo?.bio || '',
      category: userInfo?.category
        ? userInfo.category.split(',').filter((c: string) => c.trim())
        : [],
    };

    // Debug logging - only in development
    if (__DEV__) {
      console.log('=== UserInfoForm Initial Values ===');
      console.log('soleUser:', soleUser);
      console.log('userInfo:', userInfo);
      console.log('user?.imageUrl:', user?.imageUrl);
      console.log('Computed initialValues:', values);
      console.log('profilePic value:', values.profilePic);
    }

    return values;
  }, [soleUser, userInfo, user?.imageUrl]);

  // Log soleUser only in development and only when it changes
  React.useEffect(() => {
    if (__DEV__) {
      console.log('soleUserx', soleUser);
    }
  }, [soleUser]);

  // React Query mutations matching web pattern
  const updateUserInfoMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!soleUserId) throw new Error('User ID not found');

      const userInfoSubmitValues = {
        ...values,
        profilePic: values.profilePic || userInfo?.profilePic,
        category: selectedCategories.join(','),
        soleUserId,
      };

      return await updateUserInfoBySoleUserId(soleUserId, userInfoSubmitValues);
    },
    onSuccess: () => {
      console.log('User Info updated successfully');
    },
    onError: (error) => {
      console.error('Error updating User Info:', error);
      Alert.alert('Error', 'Failed to update user information');
    },
  });

  const updateSoleUserMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user?.id) throw new Error('Clerk user not found');

      // Get current SoleUser data to preserve existing fields
      const currentSoleUser = await getSoleUserByClerkId(user.id);

      // Preserve existing SoleUser fields and only update the username
      const soleUserSubmitValues = {
        clerkId: user.id,
        username: values.username,
        // Preserve existing fields from current SoleUser data
        ...(currentSoleUser && {
          email: currentSoleUser.email,
          talentLevel: currentSoleUser.talentLevel,
          clientLevel: currentSoleUser.clientLevel,
          image: currentSoleUser.image,
        }),
      };

      return await updateSoleUserByClerkId(user.id, soleUserSubmitValues);
    },
    onSuccess: () => {
      console.log('Sole User updated successfully');
    },
    onError: (error) => {
      console.error('Error updating Sole User:', error);
      Alert.alert('Error', 'Failed to update username');
    },
  });

  const handleSubmit = async (values: ProfileFormValues) => {
    try {
      const usernameChanged = values.username !== username;

      // Execute mutations in parallel (matching web pattern)
      const [userInfoUpdate, soleUserUpdate] = await Promise.all([
        updateUserInfoMutation.mutateAsync(values),
        updateSoleUserMutation.mutateAsync(values),
      ]);

      if (userInfoUpdate && soleUserUpdate) {
        // Invalidate and refetch user profile data after both mutations succeed
        queryClient.invalidateQueries({ queryKey: ['userProfile', username] });
        queryClient.invalidateQueries({ queryKey: ['profilePagePosts', username] });

        if (usernameChanged) {
          // If username changed, invalidate new username queries and navigate
          queryClient.invalidateQueries({ queryKey: ['userProfile', values.username] });
          queryClient.invalidateQueries({ queryKey: ['profilePagePosts', values.username] });
        }

        // Update Clerk profile
        try {
          await user?.update({
            username: values.username,
          });

          // TODO: Handle profile picture upload to Clerk if needed
          // This requires converting the image to a blob which is complex in RN

          console.log('Clerk profile updated successfully');
        } catch (error) {
          console.log('Clerk update error:', error);
        }

        Alert.alert('Success', 'Profile updated successfully');
        setIsModalOpen(false);

        // Navigate to new profile if username changed
        if (usernameChanged) {
          router.replace(`/(protected)/(user)/user/${values.username}` as any);
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to save profile changes');
    }
  };


  // Don't render if data not loaded
  if (!userInfo) return null;

  return (
    <Formik
      key={`profile-edit-${username}`}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      enableReinitialize
      validateOnMount={false}
      validateOnChange={true}>
      {({
        values,
        setFieldValue,
        errors,
        touched,
        setFieldTouched,
        resetForm,
        submitForm,
        isSubmitting,
      }) => {
        // Effects are now handled in UserInfoFormEffects component
        // Validate all fields
        const usernameError = validateUsername(values.username);
        const nameError = validateName(values.name);
        const bioError = validateBio(values.bio);
        const hasErrors = !!(usernameError || nameError || bioError);

        console.log('values.profilePic', values.profilePic);
        return (
          <>
            <UserInfoFormEffects
              isFocused={isFocused}
              isWaitingForCamera={isWaitingForCamera}
              selectedMedia={selectedMedia}
              setIsWaitingForCamera={setIsWaitingForCamera}
              isModalOpen={isModalOpen}
              userInfo={userInfo}
              user={user}
              setSelectedCategories={setSelectedCategories}
            />
            <FormModal
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
              title="Edit Profile"
              triggerText="Edit Profile"
              submitButtonText="Save"
              isSubmitting={isSubmitting}
              hasErrors={hasErrors}
              isLoading={isLoading}
              onSubmit={submitForm}
              onReset={resetForm}
              onClose={() => {
                resetForm();
              }}>
              {(close) => (
                <>
                  {/* Profile Picture */}
                  <View className="mb-4">
                    <Text className="mb-2 text-white">Profile Picture</Text>
                    <TouchableOpacity
                      onPress={() => {
                        clearMedia(); // Clear previous selection to ensure we wait for new one
                        setIsWaitingForCamera(true); // Signal that we are waiting for a return
                        router.push({
                          pathname: '/(protected)/camera' as any,
                          params: {
                            functionParam: 'userProfile',
                            multipleSelection: 'false',
                            aspectRatio: '1:1',
                            mask: "circle"
                          },
                        });
                      }}
                      className="h-24 w-24 self-center overflow-hidden rounded-full border-2 border-white/20 bg-zinc-800">
                      {values.profilePic && values.profilePic.trim() ? (
                        <Image
                          key={values.profilePic}
                          source={{ uri: values.profilePic }}
                          className="h-full w-full"
                        />
                      ) : (
                        <View className="h-full w-full items-center justify-center">
                          <UserIcon size={32} color="#6b7280" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Form Fields */}
                  <View className="px-4">
                    {/* Username */}
                    <View className="mb-4">
                      <View className="mb-2 flex-row items-center gap-2">
                        <Text className="text-white">Username</Text>
                        <Text className="text-red-500">*</Text>
                      </View>
                      <TextInput
                        className="rounded-lg border border-white/20 bg-zinc-800 p-3 text-white"
                        value={values.username}
                        onChangeText={(text) => {
                          setFieldValue('username', text);
                          setFieldTouched('username', true);
                        }}
                        placeholder="Enter username"
                        placeholderTextColor="#6b7280"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {touched.username && usernameError && (
                        <Text className="mt-1 text-sm text-red-400">{usernameError}</Text>
                      )}
                    </View>

                    {/* Name */}
                    <View className="mb-4">
                      <View className="mb-2 flex-row items-center gap-2">
                        <Text className="text-white">Name</Text>
                        <Text className="text-red-500">*</Text>
                      </View>
                      <TextInput
                        className="rounded-lg border border-white/20 bg-zinc-800 p-3 text-white"
                        value={values.name}
                        onChangeText={(text) => {
                          setFieldValue('name', text);
                          setFieldTouched('name', true);
                        }}
                        placeholder="Enter your name"
                        placeholderTextColor="#6b7280"
                      />
                      {touched.name && nameError && (
                        <Text className="mt-1 text-sm text-red-400">{nameError}</Text>
                      )}
                    </View>

                    {/* Bio */}
                    <View className="mb-4">
                      <Text className="mb-2 text-white">Bio</Text>
                      <TextInput
                        className="min-h-[80px] rounded-lg border border-white/20 bg-zinc-800 p-3 text-white"
                        style={{ textAlignVertical: 'top', color: '#ffffff' }}
                        value={values.bio}
                        onChangeText={(text) => {
                          setFieldValue('bio', text);
                          setFieldTouched('bio', true);
                        }}
                        placeholder="Tell us about yourself..."
                        placeholderTextColor="#6b7280"
                        multiline
                        numberOfLines={4}
                      />
                      {touched.bio && bioError && (
                        <Text className="mt-1 text-sm text-red-400">{bioError}</Text>
                      )}
                      <Text className="mt-1 text-xs text-gray-500">
                        {values.bio.length}/500 characters
                      </Text>
                    </View>

                    {/* Categories */}
                    <CategoriesCard
                      values={values}
                      setFieldValue={setFieldValue}
                      selectedCategories={selectedCategories}
                      setSelecedCategories={setSelectedCategories}
                      maxSelections={5}
                    />
                  </View>
                </>
              )}
            </FormModal>
          </>
        );
      }}
    </Formik>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.userProfileData === nextProps.userProfileData
  );
});
