import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Camera, User as UserIcon } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Formik, Form } from 'formik';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { CategorySelector } from './CategorySelector';
import { updateUserInfoBySoleUserId } from '~/api/apiservice/userInfo_api';
import { updateSoleUserByClerkId, getSoleUserByClerkId } from '~/api/apiservice';
import {
  validateUsername,
  validateName,
  validateBio,
} from '~/lib/validations/userInfo-validations';

interface ProfileEditModalProps {
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

export function ProfileEditModal({ userProfileData, isLoading = false }: ProfileEditModalProps) {
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useUser();

  const userInfo = userProfileData?.userInfo;
  const soleUser = userProfileData?.soleUser;
  const username = soleUser?.username || '';
  const soleUserId = soleUser?.id || '';

  console.log('soleUserx', soleUser);

  // Get initial category array from userInfo
  const initialCategories = userInfo?.category
    ? userInfo.category.split(',').filter((c: string) => c.trim())
    : [];

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);

  // Update selectedCategories when userInfo changes
  React.useEffect(() => {
    if (userInfo?.category) {
      const cats = userInfo.category.split(',').filter((c: string) => c.trim());
      setSelectedCategories(cats);
    }
  }, [userInfo?.category]);

  // Compute initial values using the actual data
  const getInitialValues = (): ProfileFormValues => {
    const values = {
      profilePic: userInfo?.profilePic || '',
      username: soleUser?.username || '',
      name: userInfo?.name || '',
      bio: userInfo?.bio || '',
      category: userInfo?.category
        ? userInfo.category.split(',').filter((c: string) => c.trim())
        : [],
    };

    // Debug logging
    console.log('=== ProfileEditModal Initial Values ===');
    console.log('soleUser:', soleUser);
    console.log('userInfo:', userInfo);
    console.log('Computed initialValues:', values);

    return values;
  };

  const initialValues = getInitialValues();

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
        setShowEditProfileModal(false);

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

  const pickImage = async (setFieldValue: any) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please grant photo library access to change profile picture'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Image selected:', result.assets[0].uri);
        setFieldValue('profilePic', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Don't render if data not loaded
  if (!userInfo) return null;

  return (
    <>
      <TouchableOpacity
        className="rounded-lg bg-gray-700 px-4 py-2"
        onPress={() => setShowEditProfileModal(true)}
        disabled={isLoading}>
        <Text className="text-center font-semibold text-white">Edit Profile</Text>
      </TouchableOpacity>

      {showEditProfileModal && (
        <Formik
          key={`profile-edit-${username}-${showEditProfileModal}`}
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
            // Sync selectedCategories with Formik values when modal opens
            React.useEffect(() => {
              if (values.category && values.category.length > 0) {
                setSelectedCategories(values.category);
              }
            }, []);

            // Validate all fields
            const usernameError = validateUsername(values.username);
            const nameError = validateName(values.name);
            const bioError = validateBio(values.bio);
            const hasErrors = !!(usernameError || nameError || bioError);
            return (
              <Modal
                visible={showEditProfileModal}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => {
                  setShowEditProfileModal(false);
                  resetForm();
                }}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  className="flex-1 bg-black">
                  {/* Header */}
                  <View className="flex-row items-center justify-between border-b border-gray-800 px-4 pb-3 pt-12">
                    <TouchableOpacity
                      onPress={() => {
                        setShowEditProfileModal(false);
                        resetForm();
                      }}
                      className="p-2">
                      <X size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text className="text-lg font-semibold text-white">Edit Profile</Text>
                    <TouchableOpacity
                      onPress={submitForm}
                      disabled={isSubmitting || hasErrors}
                      className={`p-2 ${isSubmitting || hasErrors ? 'opacity-50' : ''}`}>
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#3b82f6" />
                      ) : (
                        <Text className="font-semibold text-blue-500">Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    {/* Profile Picture */}
                    <View className="items-center py-6">
                      <TouchableOpacity
                        onPress={() => pickImage(setFieldValue)}
                        className="relative">
                        {values.profilePic ? (
                          <ExpoImage
                            source={{ uri: values.profilePic }}
                            className="h-24 w-24 rounded-full border-2 border-gray-600"
                          />
                        ) : (
                          <View className="h-24 w-24 items-center justify-center rounded-full border-2 border-gray-600 bg-gray-700">
                            <UserIcon size={32} color="#9ca3af" />
                          </View>
                        )}
                        <View className="absolute bottom-0 right-0 rounded-full bg-blue-500 p-2">
                          <Camera size={16} color="#ffffff" />
                        </View>
                      </TouchableOpacity>
                      <Text className="mt-2 text-sm text-gray-400">Tap to change photo</Text>
                    </View>

                    {/* Form Fields */}
                    <View className="px-4">
                      {/* Username */}
                      <View className="mb-4">
                        <Text className="mb-2 text-sm font-medium text-white">
                          Username <Text className="text-red-500">*</Text>
                        </Text>
                        <View className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
                          <TextInput
                            className="text-base text-white"
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
                        </View>
                        {touched.username && usernameError && (
                          <Text className="mt-1 text-xs text-red-500">{usernameError}</Text>
                        )}
                      </View>

                      {/* Name */}
                      <View className="mb-4">
                        <Text className="mb-2 text-sm font-medium text-white">
                          Name <Text className="text-red-500">*</Text>
                        </Text>
                        <View className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
                          <TextInput
                            className="text-base text-white"
                            value={values.name}
                            onChangeText={(text) => {
                              setFieldValue('name', text);
                              setFieldTouched('name', true);
                            }}
                            placeholder="Enter your name"
                            placeholderTextColor="#6b7280"
                          />
                        </View>
                        {touched.name && nameError && (
                          <Text className="mt-1 text-xs text-red-500">{nameError}</Text>
                        )}
                      </View>

                      {/* Bio */}
                      <View className="mb-4">
                        <Text className="mb-2 text-sm font-medium text-white">Bio</Text>
                        <View className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
                          <TextInput
                            className="text-base text-white"
                            value={values.bio}
                            onChangeText={(text) => {
                              setFieldValue('bio', text);
                              setFieldTouched('bio', true);
                            }}
                            placeholder="Tell us about yourself..."
                            placeholderTextColor="#6b7280"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            style={{ minHeight: 100 }}
                          />
                        </View>
                        {touched.bio && bioError && (
                          <Text className="mt-1 text-xs text-red-500">{bioError}</Text>
                        )}
                        <Text className="mt-1 text-xs text-gray-500">
                          {values.bio.length}/500 characters
                        </Text>
                      </View>

                      {/* Categories */}
                      <View className="mb-6">
                        <Text className="mb-2 text-sm font-medium text-white">
                          Categories (Max 5)
                        </Text>
                        <View className="mb-2 flex-row flex-wrap">
                          {selectedCategories.map((cat, index) => (
                            <View
                              key={index}
                              className="mb-2 mr-2 flex-row items-center rounded-full border border-blue-500 bg-blue-500/20 px-3 py-1">
                              <Text className="mr-1 text-xs text-blue-400">{cat}</Text>
                              <TouchableOpacity
                                onPress={() => {
                                  const newCategories = selectedCategories.filter(
                                    (_, i) => i !== index
                                  );
                                  setSelectedCategories(newCategories);
                                  setFieldValue('category', newCategories);
                                }}>
                                <X size={14} color="#60a5fa" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                        <TouchableOpacity
                          onPress={() => setShowCategorySelector(true)}
                          className="items-center rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
                          <Text className="font-medium text-blue-500">
                            {selectedCategories.length === 0 ? 'Add Categories' : 'Edit Categories'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>

                  {/* Category Selector Modal */}
                  <CategorySelector
                    visible={showCategorySelector}
                    onClose={() => setShowCategorySelector(false)}
                    selectedCategories={selectedCategories}
                    onSave={(categories) => {
                      setSelectedCategories(categories);
                      setFieldValue('category', categories);
                      setShowCategorySelector(false);
                    }}
                    maxSelections={5}
                  />
                </KeyboardAvoidingView>
              </Modal>
            );
          }}
        </Formik>
      )}
    </>
  );
}
