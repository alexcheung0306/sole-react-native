import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Camera } from 'lucide-react-native';
import { FormPage } from '@/components/custom/form-page';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Formik } from 'formik';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useSoleUserContext } from '~/context/SoleUserContext';
import {
  updateTalentInfoWithComcardBySoleUserId,
  createTalentInfoWithComcard,
} from '~/api/apiservice/talentInfo_api';
import { updateTalentLevelBySoleUserId } from '~/api/apiservice';
import {
  validateTalentName,
  validateGender,
  validateEyeColor,
  validateHairColor,
  validateAge,
  validateHeight,
  validateChest,
  validateWaist,
  validateHip,
  validateShoes,
  validateEthnic,
  validateRegion,
} from '~/lib/validations/talentInfo-validations';
import { validateImageField } from '~/lib/validations/form-field-validations';
import { TalentFormValues } from './TalentInfo-form';

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

export default function TalentInfoFormPage() {
  const queryClient = useQueryClient();
  const { soleUser } = useSoleUserContext();
  const params = useLocalSearchParams<{
    formType: string;
    soleUserId?: string;
    talentLevel?: string;
    talentName?: string;
    gender?: string;
    eyeColor?: string;
    hairColor?: string;
    age?: string;
    height?: string;
    chest?: string;
    waist?: string;
    hip?: string;
    shoes?: string;
    ethnic?: string;
    region?: string;
    experience?: string;
    snapshotHalfBody?: string;
    snapshotFullBody?: string;
  }>();

  const soleUserId = params.soleUserId || '';
  const talentLevel = params.talentLevel ? Number(params.talentLevel) : null;
  const method = talentLevel !== null && talentLevel > 0 ? 'PUT' : 'POST';

  const initialValues: TalentFormValues = {
    talentName: params.talentName || '',
    gender: params.gender || '',
    eyeColor: params.eyeColor || '',
    hairColor: params.hairColor || '',
    age: params.age || '',
    height: params.height || '',
    chest: params.chest || '',
    waist: params.waist || '',
    hip: params.hip || '',
    shoes: params.shoes || '',
    ethnic: params.ethnic || '',
    region: params.region || '',
    experience: params.experience || '',
    snapshotHalfBody: params.snapshotHalfBody || null,
    snapshotFullBody: params.snapshotFullBody || null,
  };

  const handleSubmit = async (values: TalentFormValues) => {
    const talentData = {
      talentName: values.talentName || '',
      gender: values.gender || '',
      eyeColor: values.eyeColor || '',
      hairColor: values.hairColor || '',
      age: values.age || null,
      height: values.height || null,
      chest: values.chest || null,
      waist: values.waist || null,
      hip: values.hip || null,
      shoes: values.shoes || null,
      ethnic: values.ethnic || '',
      region: values.region || '',
      experience: values.experience || '',
      bucket: 'talentinformation',
      soleUserId: soleUserId || '',
      snapshotHalfBody: values.snapshotHalfBody || '',
      snapshotFullBody: values.snapshotFullBody || '',
    };

    const comcardData = {
      configId: '1',
      photoConfig: [],
      isActive: 'true',
      soleUserId: soleUserId || '',
      pdf: '',
      bucket: 'comcards',
      comcardImageName: soleUserId || '',
      length: 5,
      talentNameColor: 'black',
    };

    try {
      if (method === 'PUT') {
        const talentProfileResult = await updateTalentInfoWithComcardBySoleUserId({
          soleUserId,
          talentData,
          comcardData,
        });

        if (talentProfileResult) {
          Alert.alert('Success', 'Talent profile updated successfully');
          queryClient.invalidateQueries({ queryKey: ['userProfile', soleUser?.username] });
          router.back();
        }
      } else if (method === 'POST') {
        const talentProfileAndComcardResult = await createTalentInfoWithComcard(
          soleUserId,
          talentData,
          comcardData
        );

        if (talentProfileAndComcardResult) {
          try {
            const talentLevelResult = await updateTalentLevelBySoleUserId(soleUserId, {
              talentLevel: '1',
            });
            console.log('Talent level updated:', talentLevelResult);
          } catch (error) {
            console.error('Error updating talent level:', error);
          }

          Alert.alert('Success', 'Talent profile created successfully');
          queryClient.invalidateQueries({ queryKey: ['userProfile', soleUser?.username] });
          router.back();
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Failed to submit talent profile');
    }
  };

  const pickImage = async (type: 'halfBody' | 'fullBody', setFieldValue: any) => {
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
        console.log(`${type} image selected:`, result.assets[0].uri);
        const fieldName = type === 'halfBody' ? 'snapshotHalfBody' : 'snapshotFullBody';
        setFieldValue(fieldName, result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const renderField = (
    label: string,
    key: keyof TalentFormValues,
    placeholder: string,
    value: any,
    setFieldValue: any,
    setFieldTouched: any,
    touched: any,
    validator?: (val: string) => string | undefined,
    keyboardType: 'default' | 'numeric' | 'decimal-pad' = 'default'
  ) => {
    const error = touched[key] && validator ? validator(value) : undefined;

    return (
      <View className="mb-4">
        <View className="mb-2 flex-row items-center gap-2">
          <Text className="text-white">{label}</Text>
          <Text className="text-red-500">*</Text>
        </View>
        <TextInput
          className="rounded-lg border border-white/20 bg-zinc-800 p-3 text-white"
          value={value?.toString() || ''}
          onChangeText={(text) => {
            setFieldValue(key, text);
            setFieldTouched(key, true);
          }}
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          keyboardType={keyboardType}
        />
        {error && <Text className="mt-1 text-sm text-red-400">{error}</Text>}
      </View>
    );
  };

  const renderSelectField = (
    label: string,
    key: keyof TalentFormValues,
    options: string[],
    value: any,
    setFieldValue: any,
    setFieldTouched: any,
    touched: any,
    validator?: (val: string) => string | undefined
  ) => {
    const error = touched[key] && validator ? validator(value) : undefined;

    return (
      <View className="mb-4">
        <View className="mb-2 flex-row items-center gap-2">
          <Text className="text-white">{label}</Text>
          <Text className="text-red-500">*</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => {
                setFieldValue(key, option);
                setFieldTouched(key, true);
              }}
              className={`mr-2 rounded-full border px-4 py-2 ${
                value === option ? 'border-blue-500 bg-blue-500' : 'border-white/20 bg-zinc-800'
              }`}>
              <Text
                className={`text-sm ${
                  value === option ? 'font-semibold text-white' : 'text-gray-400'
                }`}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {error && <Text className="mt-1 text-sm text-red-400">{error}</Text>}
      </View>
    );
  };

  const renderImagePicker = (
    label: string,
    type: 'halfBody' | 'fullBody',
    imageUri: string | null | undefined,
    setFieldValue: any,
    touched: any,
    validator?: (val: any, fieldname: string) => string | null
  ) => {
    const fieldName = type === 'halfBody' ? 'snapshotHalfBody' : 'snapshotFullBody';
    const error = touched[fieldName] && validator ? validator(imageUri, label) : null;

    return (
      <View className="mb-4">
        <View className="mb-2 flex-row items-center gap-2">
          <Text className="text-white">{label}</Text>
          <Text className="text-red-500">*</Text>
        </View>
        <TouchableOpacity
          onPress={() => pickImage(type, setFieldValue)}
          className="overflow-hidden rounded-lg border border-white/20 bg-zinc-800"
          style={{ height: 200 }}>
          {imageUri ? (
            <ExpoImage source={{ uri: imageUri }} className="h-full w-full" contentFit="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Camera size={32} color="#6b7280" />
              <Text className="mt-2 text-sm text-gray-400">Tap to upload</Text>
            </View>
          )}
        </TouchableOpacity>
        {error && <Text className="mt-1 text-sm text-red-400">{error}</Text>}
      </View>
    );
  };

  const modalTitle = method === 'PUT' ? 'Edit Talent Profile' : 'Create Talent Profile';

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit} enableReinitialize>
      {({
        values,
        setFieldValue,
        setFieldTouched,
        touched,
        submitForm,
        isSubmitting,
      }) => {
        const talentInfoHasErrors = [
          validateTalentName(values.talentName),
          validateGender(values.gender),
          validateEyeColor(values.eyeColor),
          validateHairColor(values.hairColor),
          validateAge(values.age),
          validateHeight(values.height),
          validateChest(values.chest),
          validateWaist(values.waist),
          validateHip(values.hip),
          validateShoes(values.shoes),
          validateEthnic(values.ethnic),
          validateRegion(values.region),
          validateImageField(values.snapshotHalfBody, 'Half Body Photo'),
          validateImageField(values.snapshotFullBody, 'Full Body Photo'),
        ].some((error) => error);

        return (
          <FormPage
            title={modalTitle}
            submitButtonText={talentInfoHasErrors ? 'Invalid' : 'Save'}
            isSubmitting={isSubmitting}
            hasErrors={talentInfoHasErrors}
            onSubmit={submitForm}
            headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
            contentClassName="flex-1">
            <ScrollView
              className="flex-1 px-4"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={{ paddingBottom: 100 }}>
              {/* Personal Information */}
              <Text className="mb-4 text-xl font-bold text-white">Personal Information</Text>
              {renderField(
                'Talent Name',
                'talentName',
                'Enter talent name',
                values.talentName,
                setFieldValue,
                setFieldTouched,
                touched,
                validateTalentName
              )}
              {renderSelectField(
                'Gender',
                'gender',
                GENDER_OPTIONS,
                values.gender,
                setFieldValue,
                setFieldTouched,
                touched,
                validateGender
              )}
              {renderSelectField(
                'Eye Color',
                'eyeColor',
                EYE_COLOR_OPTIONS,
                values.eyeColor,
                setFieldValue,
                setFieldTouched,
                touched,
                validateEyeColor
              )}
              {renderSelectField(
                'Hair Color',
                'hairColor',
                HAIR_COLOR_OPTIONS,
                values.hairColor,
                setFieldValue,
                setFieldTouched,
                touched,
                validateHairColor
              )}

              {/* Physical Measurements */}
              <Text className="mb-4 mt-6 text-xl font-bold text-white">
                Physical Measurements
              </Text>
              {renderField(
                'Age',
                'age',
                'Enter age',
                values.age,
                setFieldValue,
                setFieldTouched,
                touched,
                validateAge,
                'numeric'
              )}
              {renderField(
                'Height (cm)',
                'height',
                'Enter height in cm',
                values.height,
                setFieldValue,
                setFieldTouched,
                touched,
                validateHeight,
                'decimal-pad'
              )}
              {renderField(
                'Chest (cm)',
                'chest',
                'Enter chest measurement',
                values.chest,
                setFieldValue,
                setFieldTouched,
                touched,
                validateChest,
                'decimal-pad'
              )}
              {renderField(
                'Waist (cm)',
                'waist',
                'Enter waist measurement',
                values.waist,
                setFieldValue,
                setFieldTouched,
                touched,
                validateWaist,
                'decimal-pad'
              )}
              {renderField(
                'Hip (cm)',
                'hip',
                'Enter hip measurement',
                values.hip,
                setFieldValue,
                setFieldTouched,
                touched,
                validateHip,
                'decimal-pad'
              )}
              {renderField(
                'Shoes (EU Size)',
                'shoes',
                'Enter shoe size',
                values.shoes,
                setFieldValue,
                setFieldTouched,
                touched,
                validateShoes,
                'numeric'
              )}

              {/* Background Information */}
              <Text className="mb-4 mt-6 text-xl font-bold text-white">Background</Text>
              {renderSelectField(
                'Ethnicity',
                'ethnic',
                ETHNIC_OPTIONS,
                values.ethnic,
                setFieldValue,
                setFieldTouched,
                touched,
                validateEthnic
              )}
              {renderField(
                'Region',
                'region',
                'Enter region (e.g., North America)',
                values.region,
                setFieldValue,
                setFieldTouched,
                touched,
                validateRegion
              )}

              {/* Professional Experience */}
              <Text className="mb-4 mt-6 text-xl font-bold text-white">
                Professional Experience
              </Text>
              <View className="mb-4">
                <Text className="mb-2 text-white">Experience</Text>
                <TextInput
                  className="min-h-[80px] rounded-lg border border-white/20 bg-zinc-800 p-3 text-white"
                  style={{ textAlignVertical: 'top', color: '#ffffff' }}
                  value={values.experience}
                  onChangeText={(text) => setFieldValue('experience', text)}
                  placeholder="Describe your professional experience..."
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={6}
                />
              </View>

              {/* Portfolio Snapshots */}
              <Text className="mb-4 mt-6 text-xl font-bold text-white">
                Portfolio Snapshots
              </Text>
              {renderImagePicker(
                'Half-Body Snapshot',
                'halfBody',
                values.snapshotHalfBody,
                setFieldValue,
                touched,
                validateImageField
              )}
              {renderImagePicker(
                'Full-Body Snapshot',
                'fullBody',
                values.snapshotFullBody,
                setFieldValue,
                touched,
                validateImageField
              )}
            </ScrollView>
          </FormPage>
        );
      }}
    </Formik>
  );
}

