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
import { X, Camera, User as UserIcon } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

interface TalentInfoEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (values: TalentFormValues) => Promise<void>;
  initialValues: {
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
    snapshotHalfBody?: string;
    snapshotFullBody?: string;
  };
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
const ETHNIC_OPTIONS = ['Asian', 'Caucasian', 'African', 'Hispanic', 'Middle Eastern', 'Pacific Islander', 'Mixed'];

export function TalentInfoEditModal({
  visible,
  onClose,
  onSave,
  initialValues,
}: TalentInfoEditModalProps) {
  const [formValues, setFormValues] = useState<TalentFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof TalentFormValues, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (visible) {
      setFormValues(initialValues);
      setErrors({});
    }
  }, [visible]);

  const pickImage = async (type: 'halfBody' | 'fullBody') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library access to upload photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'halfBody' ? [3, 4] : [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'halfBody') {
          setFormValues({ ...formValues, snapshotHalfBody: result.assets[0].uri });
        } else {
          setFormValues({ ...formValues, snapshotFullBody: result.assets[0].uri });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TalentFormValues, string>> = {};

    // Required fields
    if (!formValues.talentName.trim()) newErrors.talentName = 'Talent name is required';
    if (!formValues.gender) newErrors.gender = 'Gender is required';
    if (!formValues.eyeColor) newErrors.eyeColor = 'Eye color is required';
    if (!formValues.hairColor) newErrors.hairColor = 'Hair color is required';
    if (!formValues.ethnic) newErrors.ethnic = 'Ethnicity is required';
    if (!formValues.region.trim()) newErrors.region = 'Region is required';

    // Number validations
    const age = parseInt(formValues.age);
    if (!formValues.age || isNaN(age)) {
      newErrors.age = 'Age is required';
    } else if (age < 16 || age > 100) {
      newErrors.age = 'Age must be between 16 and 100';
    }

    const height = parseFloat(formValues.height);
    if (!formValues.height || isNaN(height)) {
      newErrors.height = 'Height is required';
    } else if (height < 100 || height > 250) {
      newErrors.height = 'Height must be between 100 and 250 cm';
    }

    const chest = parseFloat(formValues.chest);
    if (!formValues.chest || isNaN(chest)) {
      newErrors.chest = 'Chest measurement is required';
    } else if (chest < 60 || chest > 150) {
      newErrors.chest = 'Chest must be between 60 and 150 cm';
    }

    const waist = parseFloat(formValues.waist);
    if (!formValues.waist || isNaN(waist)) {
      newErrors.waist = 'Waist measurement is required';
    } else if (waist < 50 || waist > 150) {
      newErrors.waist = 'Waist must be between 50 and 150 cm';
    }

    const hip = parseFloat(formValues.hip);
    if (!formValues.hip || isNaN(hip)) {
      newErrors.hip = 'Hip measurement is required';
    } else if (hip < 60 || hip > 150) {
      newErrors.hip = 'Hip must be between 60 and 150 cm';
    }

    const shoes = parseInt(formValues.shoes);
    if (!formValues.shoes || isNaN(shoes)) {
      newErrors.shoes = 'Shoe size is required';
    } else if (shoes < 30 || shoes > 50) {
      newErrors.shoes = 'Shoe size must be between 30 and 50';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formValues);
      onClose();
    } catch (error) {
      console.error('Error saving talent info:', error);
      Alert.alert('Error', 'Failed to save talent information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (
    label: string,
    key: keyof TalentFormValues,
    placeholder: string,
    keyboardType: 'default' | 'numeric' | 'decimal-pad' = 'default'
  ) => (
    <View className="mb-4">
      <Text className="text-white text-sm font-medium mb-2">
        {label} <Text className="text-red-500">*</Text>
      </Text>
      <View className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
        <TextInput
          className="text-white text-base"
          value={formValues[key]?.toString() || ''}
          onChangeText={(text) => setFormValues({ ...formValues, [key]: text })}
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          keyboardType={keyboardType}
        />
      </View>
      {errors[key] && (
        <Text className="text-red-500 text-xs mt-1">{errors[key]}</Text>
      )}
    </View>
  );

  const renderSelectField = (
    label: string,
    key: keyof TalentFormValues,
    options: string[]
  ) => (
    <View className="mb-4">
      <Text className="text-white text-sm font-medium mb-2">
        {label} <Text className="text-red-500">*</Text>
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => setFormValues({ ...formValues, [key]: option })}
            className={`px-4 py-2 rounded-full mr-2 border ${
              formValues[key] === option
                ? 'bg-blue-500 border-blue-500'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <Text
              className={`text-sm ${
                formValues[key] === option ? 'text-white font-semibold' : 'text-gray-400'
              }`}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {errors[key] && (
        <Text className="text-red-500 text-xs mt-1">{errors[key]}</Text>
      )}
    </View>
  );

  const renderImagePicker = (
    label: string,
    type: 'halfBody' | 'fullBody',
    imageUri?: string | null
  ) => (
    <View className="mb-4">
      <Text className="text-white text-sm font-medium mb-2">{label}</Text>
      <TouchableOpacity
        onPress={() => pickImage(type)}
        className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
        style={{ height: 200 }}
      >
        {imageUri ? (
          <ExpoImage source={{ uri: imageUri }} className="w-full h-full" contentFit="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Camera size={32} color="#6b7280" />
            <Text className="text-gray-400 text-sm mt-2">Tap to upload</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

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
          <Text className="text-white font-semibold text-lg">Edit Talent Profile</Text>
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

        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* Personal Information */}
          <Text className="text-white text-xl font-bold mb-4">Personal Information</Text>
          {renderField('Talent Name', 'talentName', 'Enter talent name')}
          {renderSelectField('Gender', 'gender', GENDER_OPTIONS)}
          {renderSelectField('Eye Color', 'eyeColor', EYE_COLOR_OPTIONS)}
          {renderSelectField('Hair Color', 'hairColor', HAIR_COLOR_OPTIONS)}

          {/* Physical Measurements */}
          <Text className="text-white text-xl font-bold mb-4 mt-6">Physical Measurements</Text>
          {renderField('Age', 'age', 'Enter age', 'numeric')}
          {renderField('Height (cm)', 'height', 'Enter height in cm', 'decimal-pad')}
          {renderField('Chest (cm)', 'chest', 'Enter chest measurement', 'decimal-pad')}
          {renderField('Waist (cm)', 'waist', 'Enter waist measurement', 'decimal-pad')}
          {renderField('Hip (cm)', 'hip', 'Enter hip measurement', 'decimal-pad')}
          {renderField('Shoes (EU Size)', 'shoes', 'Enter shoe size', 'numeric')}

          {/* Background Information */}
          <Text className="text-white text-xl font-bold mb-4 mt-6">Background</Text>
          {renderSelectField('Ethnicity', 'ethnic', ETHNIC_OPTIONS)}
          {renderField('Region', 'region', 'Enter region (e.g., North America)')}

          {/* Experience */}
          <Text className="text-white text-xl font-bold mb-4 mt-6">Professional Experience</Text>
          <View className="mb-4">
            <Text className="text-white text-sm font-medium mb-2">Experience</Text>
            <View className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
              <TextInput
                className="text-white text-base"
                value={formValues.experience}
                onChangeText={(text) => setFormValues({ ...formValues, experience: text })}
                placeholder="Describe your professional experience..."
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{ minHeight: 120 }}
              />
            </View>
          </View>

          {/* Portfolio Snapshots */}
          <Text className="text-white text-xl font-bold mb-4 mt-6">Portfolio Snapshots</Text>
          {renderImagePicker('Half-Body Snapshot', 'halfBody', formValues.snapshotHalfBody)}
          {renderImagePicker('Full-Body Snapshot', 'fullBody', formValues.snapshotFullBody)}

          {/* Spacing at bottom */}
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

