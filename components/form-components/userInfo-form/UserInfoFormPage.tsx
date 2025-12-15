import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { User as UserIcon } from 'lucide-react-native';
import { Formik, useFormikContext } from 'formik';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useIsFocused } from '@react-navigation/native';
import { CategoriesCard } from '@/components/form-components/CategoriesCard';
import { FormPage } from '@/components/custom/form-page';
import { updateUserInfoBySoleUserId } from '~/api/apiservice/userInfo_api';
import { updateSoleUserByClerkId, getSoleUserByClerkId } from '~/api/apiservice';
import { useCameraContext } from '~/context/CameraContext';
import {
  validateUsername,
  validateName,
  validateBio,
} from '~/lib/validations/userInfo-validations';
import { ProfileFormValues } from '~/components/form-components/userInfo-form/UserInfoFormPortal';

// Helper component to handle effects that need Formik context
function UserInfoFormPortalEffects({
  isFocused,
  isWaitingForCamera,
  selectedMedia,
  setIsWaitingForCamera,
  userInfo,
  user,
  setSelectedCategories,
}: {
  isFocused: boolean;
  isWaitingForCamera: boolean;
  selectedMedia: any[];
  setIsWaitingForCamera: (value: boolean) => void;
  userInfo: any;
  user: any;
  setSelectedCategories: (categories: string[]) => void;
}) {
  const { values, setFieldValue } = useFormikContext<ProfileFormValues>();

  // Effect to update profilePic when selectedMedia changes (returned from camera)
  const selectedMediaUri = selectedMedia.length > 0 ? selectedMedia[0]?.uri : null;

  useEffect(() => {
    if (isFocused && isWaitingForCamera && selectedMediaUri) {
      if (selectedMediaUri !== values.profilePic) {
        setFieldValue('profilePic', selectedMediaUri);
        setIsWaitingForCamera(false);
      } else {
        setIsWaitingForCamera(false);
      }
    }
  }, [isFocused, isWaitingForCamera, selectedMediaUri, values.profilePic]);

  // Sync selectedCategories with Formik values
  useEffect(() => {
    if (values.category && values.category.length > 0) {
      setSelectedCategories(values.category);
    }
  }, [values.category, setSelectedCategories]);

  return null;
}

export default function UserInfoFormPortalPage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { selectedMedia, clearMedia } = useCameraContext();
  const isFocused = useIsFocused();
  const [isWaitingForCamera, setIsWaitingForCamera] = useState(false);
  const params = useLocalSearchParams<{
    soleUserId?: string;
    username?: string;
    profilePic?: string;
    name?: string;
    bio?: string;
    category?: string;
  }>();

  const soleUserId = params.soleUserId || '';
  const username = params.username || '';

  // Parse category from string to array
  const initialCategories = useMemo(() => {
    return params.category
      ? params.category.split(',').filter((c: string) => c.trim())
      : [];
  }, [params.category]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);

  // Compute initial values from params
  const initialValues = useMemo((): ProfileFormValues => {
    return {
      profilePic: params.profilePic || user?.imageUrl || null,
      username: params.username || '',
      name: params.name || '',
      bio: params.bio || '',
      category: initialCategories,
    };
  }, [params, user?.imageUrl, initialCategories]);

  // React Query mutations
  const updateUserInfoMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!soleUserId) throw new Error('User ID not found');

      const userInfoSubmitValues = {
        ...values,
        profilePic: values.profilePic || params.profilePic,
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

      const currentSoleUser = await getSoleUserByClerkId(user.id);

      const soleUserSubmitValues = {
        clerkId: user.id,
        username: values.username,
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

      const [userInfoUpdate, soleUserUpdate] = await Promise.all([
        updateUserInfoMutation.mutateAsync(values),
        updateSoleUserMutation.mutateAsync(values),
      ]);

      if (userInfoUpdate && soleUserUpdate) {
        queryClient.invalidateQueries({ queryKey: ['userProfile', username] });
        queryClient.invalidateQueries({ queryKey: ['profilePagePosts', username] });

        if (usernameChanged) {
          queryClient.invalidateQueries({ queryKey: ['userProfile', values.username] });
          queryClient.invalidateQueries({ queryKey: ['profilePagePosts', values.username] });
        }

        try {
          await user?.update({
            username: values.username,
          });
          console.log('Clerk profile updated successfully');
        } catch (error) {
          console.log('Clerk update error:', error);
        }

        Alert.alert('Success', 'Profile updated successfully');
        router.back();

        if (usernameChanged) {
          router.replace(`/(protected)/(user)/user/${values.username}` as any);
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to save profile changes');
    }
  };

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
        submitForm,
        isSubmitting,
      }) => {
        // Validate all fields
        const usernameError = validateUsername(values.username);
        const nameError = validateName(values.name);
        const bioError = validateBio(values.bio);
        const hasErrors = !!(usernameError || nameError || bioError);

        return (
          <>
            <UserInfoFormPortalEffects
              isFocused={isFocused}
              isWaitingForCamera={isWaitingForCamera}
              selectedMedia={selectedMedia}
              setIsWaitingForCamera={setIsWaitingForCamera}
              userInfo={{ profilePic: params.profilePic, category: params.category }}
              user={user}
              setSelectedCategories={setSelectedCategories}
            />
            <FormPage
              title="Edit Profile"
              submitButtonText="Save"
              isSubmitting={isSubmitting}
              hasErrors={hasErrors}
              onSubmit={submitForm}
              headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
              contentClassName="flex-1 px-4">
              {/* Profile Picture */}
              <View className="mb-4">
                <Text className="mb-2 text-white">Profile Picture</Text>
                <TouchableOpacity
                  onPress={() => {
                    clearMedia();
                    setIsWaitingForCamera(true);
                    router.push({
                      pathname: '/(protected)/camera' as any,
                      params: {
                        functionParam: 'userProfile',
                        multipleSelection: 'false',
                        aspectRatio: '1:1',
                        mask: 'circle',
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
            </FormPage>
          </>
        );
      }}
    </Formik>
  );
}

