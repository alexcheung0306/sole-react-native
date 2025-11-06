import React, { useState } from 'react';
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
import { X, Camera, User as UserIcon, Edit2 } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { CategorySelector } from './CategorySelector';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (values: ProfileFormValues) => Promise<void>;
  initialValues: {
    profilePic?: string;
    username: string;
    name: string;
    bio: string;
    category: string[];
  };
  isLoading?: boolean;
}

export interface ProfileFormValues {
  profilePic?: string | null;
  username: string;
  name: string;
  bio: string;
  category: string[];
}

export function ProfileEditModal({
  visible,
  onClose,
  onSave,
  initialValues,
  isLoading = false,
}: ProfileEditModalProps) {
  const [formValues, setFormValues] = useState<ProfileFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<ProfileFormValues>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (visible) {
      setFormValues(initialValues);
      setErrors({});
    }
  }, [visible, initialValues]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library access to change profile picture');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormValues({ ...formValues, profilePic: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormValues> = {};

    // Username validation
    if (!formValues.username || formValues.username.trim() === '') {
      newErrors.username = 'Username is required';
    } else if (formValues.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formValues.username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formValues.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Name validation
    if (!formValues.name || formValues.name.trim() === '') {
      newErrors.name = 'Name is required';
    } else if (formValues.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formValues.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    // Bio validation (optional, max 500)
    if (formValues.bio && formValues.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    // Category validation (max 5)
    if (formValues.category && formValues.category.length > 5) {
      newErrors.category = 'Maximum 5 categories allowed' as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formValues);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-12 pb-3 border-b border-gray-800">
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white font-semibold text-lg">Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className={`p-2 ${isSaving ? 'opacity-50' : ''}`}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Text className="text-blue-500 font-semibold">Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Profile Picture */}
          <View className="items-center py-6">
            <TouchableOpacity onPress={pickImage} className="relative">
              {formValues.profilePic ? (
                <ExpoImage
                  source={{ uri: formValues.profilePic }}
                  className="w-24 h-24 rounded-full border-2 border-gray-600"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-gray-700 border-2 border-gray-600 items-center justify-center">
                  <UserIcon size={32} color="#9ca3af" />
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
                <Camera size={16} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <Text className="text-gray-400 text-sm mt-2">Tap to change photo</Text>
          </View>

          {/* Form Fields */}
          <View className="px-4">
            {/* Username */}
            <View className="mb-4">
              <Text className="text-white text-sm font-medium mb-2">
                Username <Text className="text-red-500">*</Text>
              </Text>
              <View className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                <TextInput
                  className="text-white text-base"
                  value={formValues.username}
                  onChangeText={(text) => setFormValues({ ...formValues, username: text })}
                  placeholder="Enter username"
                  placeholderTextColor="#6b7280"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.username && (
                <Text className="text-red-500 text-xs mt-1">{errors.username}</Text>
              )}
            </View>

            {/* Name */}
            <View className="mb-4">
              <Text className="text-white text-sm font-medium mb-2">
                Name <Text className="text-red-500">*</Text>
              </Text>
              <View className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                <TextInput
                  className="text-white text-base"
                  value={formValues.name}
                  onChangeText={(text) => setFormValues({ ...formValues, name: text })}
                  placeholder="Enter your name"
                  placeholderTextColor="#6b7280"
                />
              </View>
              {errors.name && (
                <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>
              )}
            </View>

            {/* Bio */}
            <View className="mb-4">
              <Text className="text-white text-sm font-medium mb-2">Bio</Text>
              <View className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                <TextInput
                  className="text-white text-base"
                  value={formValues.bio}
                  onChangeText={(text) => setFormValues({ ...formValues, bio: text })}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={{ minHeight: 100 }}
                />
              </View>
              {errors.bio && (
                <Text className="text-red-500 text-xs mt-1">{errors.bio}</Text>
              )}
              <Text className="text-gray-500 text-xs mt-1">
                {formValues.bio.length}/500 characters
              </Text>
            </View>

            {/* Categories */}
            <View className="mb-6">
              <Text className="text-white text-sm font-medium mb-2">
                Categories (Max 5)
              </Text>
              <View className="flex-row flex-wrap mb-2">
                {formValues.category.map((cat, index) => (
                  <View
                    key={index}
                    className="bg-blue-500/20 border border-blue-500 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center"
                  >
                    <Text className="text-blue-400 text-xs mr-1">{cat}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newCategories = formValues.category.filter((_, i) => i !== index);
                        setFormValues({ ...formValues, category: newCategories });
                      }}
                    >
                      <X size={14} color="#60a5fa" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => setShowCategorySelector(true)}
                className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 items-center"
              >
                <Text className="text-blue-500 font-medium">
                  {formValues.category.length === 0 ? 'Add Categories' : 'Edit Categories'}
                </Text>
              </TouchableOpacity>
              {errors.category && (
                <Text className="text-red-500 text-xs mt-1">{errors.category as string}</Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Category Selector Modal */}
        <CategorySelector
          visible={showCategorySelector}
          onClose={() => setShowCategorySelector(false)}
          selectedCategories={formValues.category}
          onSave={(categories) => {
            setFormValues({ ...formValues, category: categories });
            setShowCategorySelector(false);
          }}
          maxSelections={5}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

