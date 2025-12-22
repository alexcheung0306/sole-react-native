import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { Camera, Plus } from 'lucide-react-native';
import { FormPage } from '@/components/custom/form-page';
import { Image as ExpoImage } from 'expo-image';
import { Formik } from 'formik';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { useCameraContext } from '~/context/CameraContext';
import { SingleWheelPickerInput } from '~/components/form-components/SingleWheelPickerInput';
import { ethnicGroups } from '~/components/form-components/options-to-use';

import {
  updateTalentInfoWithComcardBySoleUserId,
  createTalentInfoWithComcard,
} from '~/api/apiservice/talentInfo_api';
import { getUserProfileByUsername } from '~/api/apiservice/soleUser_api';
import { updateTalentLevelBySoleUserId } from '~/api/apiservice';
import { TalentFormValues } from '~/components/form-components/talent-form/TalentInfoFormPortal';
import { ComcardTemplate } from '~/components/form-components/talent-form/ComcardTemplate';
import { ComcardTemplatePdf } from '~/components/form-components/talent-form/ComcardTemplatePdf';

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Other', label: 'Other' },
];
const EYE_COLOR_OPTIONS = [
  { value: 'Brown', label: 'Brown' },
  { value: 'Blue', label: 'Blue' },
  { value: 'Green', label: 'Green' },
  { value: 'Hazel', label: 'Hazel' },
  { value: 'Gray', label: 'Gray' },
  { value: 'Amber', label: 'Amber' },
];
const HAIR_COLOR_OPTIONS = [
  { value: 'Black', label: 'Black' },
  { value: 'Brown', label: 'Brown' },
  { value: 'Blonde', label: 'Blonde' },
  { value: 'Red', label: 'Red' },
  { value: 'Gray', label: 'Gray' },
  { value: 'White', label: 'White' },
  { value: 'Other', label: 'Other' },
];
// Flatten ethnicGroups for wheel picker - combine all specific ethnic groups with category info
const ETHNIC_OPTIONS = ethnicGroups.flatMap((category) =>
  category.groups.map((group) => ({
    value: group.key,
    label: group.label,
    category: category.category,
  }))
);

// Temporarily remove EthnicitySelector to fix syntax error

export default function TalentInfoFormPortalPage() {
  const queryClient = useQueryClient();
  const { soleUser } = useSoleUserContext();
  const { selectedMedia, clearMedia } = useCameraContext();
  const isFocused = useIsFocused();
  const [isWaitingForCamera, setIsWaitingForCamera] = useState(false);
  const [currentSnapshotField, setCurrentSnapshotField] = useState<'halfBody' | 'fullBody' | null>(
    null
  );
  const [currentComcardPhotoIndex, setCurrentComcardPhotoIndex] = useState<number | null>(null);
  const [fetchedTalentData, setFetchedTalentData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
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
    // Comcard related parameters
    configId?: string;
    talentNameColor?: string;
    comcardId?: string;
    length?: string;
  }>();

  const soleUserId = params.soleUserId || '';
  const talentLevel = params.talentLevel ? Number(params.talentLevel) : null;
  const method = talentLevel !== null && talentLevel > 0 ? 'PUT' : 'POST';

  console.log('TalentInfoFormPage - params:', { soleUserId, talentLevel: params.talentLevel, method });

  // Fetch talent data for edit forms
  useEffect(() => {
    const fetchTalentData = async () => {
      if (method === 'PUT' && soleUser?.username) {
        setIsLoadingData(true);
        try {
          const data = await getUserProfileByUsername(soleUser.username);
          console.log('Fetched user profile data for edit form:', data);
          setFetchedTalentData(data);
        } catch (error) {
          console.error('Error fetching user profile data:', error);
        } finally {
          setIsLoadingData(false);
        }
      }
    };

    fetchTalentData();
  }, [method, soleUser?.username]);

  // Extract comcard and talent info from fetched data
  const comcard = fetchedTalentData?.comcardWithPhotosResponse;
  const talentInfo = fetchedTalentData?.talentInfo;


  // Function to get photo config from comcard data
  const getPhotoConfig = () => {
    const length = comcard?.length || 5;
    const emptyPhotos = Array(length).fill(null);

    if (comcard?.comcardPhotoList && comcard.comcardPhotoList.length > 0) {
      // Replace empty photos at specific indices based on displayOrder
      comcard.comcardPhotoList.forEach((photo: any) => {
        if (
          photo.displayOrder !== null &&
          photo.displayOrder !== undefined &&
          photo.displayOrder < length
        ) {
          emptyPhotos[photo.displayOrder] = photo.photoUrl;
        }
      });
    }

    console.log('getPhotoConfig result:', emptyPhotos);
    return emptyPhotos;
  };

  const initialValues: TalentFormValues = {
    talentName: talentInfo?.talentName || params.talentName || '',
    gender: talentInfo?.gender || params.gender || '',
    eyeColor: talentInfo?.eyeColor || params.eyeColor || '',
    hairColor: talentInfo?.hairColor || params.hairColor || '',
    age: talentInfo?.age?.toString() || params.age || '',
    height: talentInfo?.height?.toString() || params.height || '',
    chest: talentInfo?.chest?.toString() || params.chest || '',
    waist: talentInfo?.waist?.toString() || params.waist || '',
    hip: talentInfo?.hip?.toString() || params.hip || '',
    shoes: talentInfo?.shoes?.toString() || params.shoes || '',
    ethnic: talentInfo?.ethnic || params.ethnic || '',
    region: talentInfo?.region || params.region || '',
    experience: talentInfo?.experience || params.experience || '',
    snapshotHalfBody: talentInfo?.snapshotHalfBody || params.snapshotHalfBody || null,
    snapshotFullBody: talentInfo?.snapshotFullBody || params.snapshotFullBody || null,
    // Comcard related initial values
    configId: comcard?.configId || (params.configId ? Number(params.configId) : 1),
    talentNameColor: comcard?.talentNameColor || params.talentNameColor || 'black',
    photoConfig: method === 'PUT' ? getPhotoConfig() : [],
    pdf: '',
    length: comcard?.length || (params.length ? Number(params.length) : 5),
    soleUserId: params.soleUserId || '',
    comcardId: comcard?.id?.toString() || params.comcardId || '',
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
      ...(values.comcardId ? { id: values.comcardId } : {}),
      configId: String(values.configId),
      photoConfig: values.photoConfig,
      isActive: 'true',
      soleUserId: values.soleUserId || '',
      pdf: values.pdf || '',
      bucket: 'comcards',
      comcardImageName: values.soleUserId || '',
      length: values.length,
      talentNameColor: values.talentNameColor || 'black',
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

  const pageTitle = method === 'POST' ? 'Create Talent Profile' : 'Edit Talent Profile';

  return (
    <Formik
      key={`talent-form-${params.soleUserId || 'new'}-${fetchedTalentData ? 'loaded' : 'loading'}`}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      enableReinitialize
      validateOnMount={false}
      validateOnChange={true}>
      {({ values, setFieldValue, errors, touched, setFieldTouched, submitForm, isSubmitting }) => {
        // Effect to update snapshots and comcard photos when selectedMedia changes (returned from camera)
        useEffect(() => {
          if (isFocused && isWaitingForCamera && selectedMedia.length > 0) {
            const mediaItem = selectedMedia[0];

            if (currentSnapshotField) {
              console.log(`Setting ${currentSnapshotField} snapshot image to:`, mediaItem.uri);
              const fieldName =
                currentSnapshotField === 'halfBody' ? 'snapshotHalfBody' : 'snapshotFullBody';
              setFieldValue(fieldName, mediaItem.uri);
              setCurrentSnapshotField(null);
            } else if (currentComcardPhotoIndex !== null) {
              console.log(
                `Setting comcard photo at index ${currentComcardPhotoIndex} to:`,
                mediaItem.uri
              );
              const updatedPhotoConfig = [...(values.photoConfig || [])];
              updatedPhotoConfig[currentComcardPhotoIndex] = mediaItem.uri;
              setFieldValue('photoConfig', updatedPhotoConfig);
              setCurrentComcardPhotoIndex(null);
            }

            setIsWaitingForCamera(false);
          }
        }, [
          isFocused,
          isWaitingForCamera,
          selectedMedia,
          currentSnapshotField,
          currentComcardPhotoIndex,
          values.photoConfig,
          setFieldValue,
        ]);

        // Show loading indicator while fetching data for edit forms
        if (isLoadingData) {
          return (
            <FormPage
              title={pageTitle}
              submitButtonText="Loading..."
              isSubmitting={true}
              hasErrors={false}
              onSubmit={() => {}}
              headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
              contentClassName="flex-1">
              <View className="flex-1 items-center justify-center">
                <Text className="text-white">Loading talent information...</Text>
              </View>
            </FormPage>
          );
        }

        // Validate required fields
        const talentNameError = !values.talentName?.trim();
        const genderError = !values.gender;
        const eyeColorError = !values.eyeColor;
        const hairColorError = !values.hairColor;
        const ethnicError = !values.ethnic;
        const snapshotHalfBodyError = !values.snapshotHalfBody;
        const snapshotFullBodyError = !values.snapshotFullBody;
        const hasErrors =
          talentNameError ||
          genderError ||
          eyeColorError ||
          hairColorError ||
          ethnicError ||
          snapshotHalfBodyError ||
          snapshotFullBodyError;


          console.log('values', values);
        return (
          <FormPage
            title={pageTitle}
            submitButtonText={isSubmitting ? 'Saving...' : method === 'POST' ? 'Create' : 'Save'}
            isSubmitting={isSubmitting}
            hasErrors={hasErrors}
            onSubmit={submitForm}
            headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
            contentClassName="flex-1">
            <ScrollView
              className="flex-1 px-4"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={{ paddingBottom: 100 }}>
              {/* Comcard Template */}
              <Text className="mb-4 mt-6 text-xl font-bold text-white">Comcard Design</Text>
              <ComcardTemplate
                values={values}
                setFieldValue={setFieldValue}
                onPhotoPress={(index) => {
                  clearMedia();
                  setCurrentComcardPhotoIndex(index);
                  setIsWaitingForCamera(true);
                  router.push({
                    pathname: '/(protected)/camera' as any,
                    params: {
                      functionParam: 'userProfile',
                      multipleSelection: 'false',
                      aspectRatio: '4:5',
                    },
                  });
                }}
              />

              {/* PDF Generation - Hidden component that generates PDF */}
              <ComcardTemplatePdf
                values={values}
                setFieldValue={setFieldValue}
                hasErrors={hasErrors}
              />

              {/* Personal Information */}
              <Text className="mb-4 text-xl font-bold text-white">Personal Information</Text>

              {/* Talent Name */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Talent Name</Text>
                  <Text className="text-red-500">*</Text>
                </View>
                <TextInput
                  className="rounded-lg border border-white/20 bg-zinc-800 px-4 py-3 text-white"
                  placeholder="Enter talent name"
                  placeholderTextColor="#9ca3af"
                  value={values.talentName}
                  onChangeText={(text) => setFieldValue('talentName', text)}
                  onBlur={() => setFieldTouched('talentName', true)}
                />
                {touched.talentName && talentNameError && (
                  <Text className="mt-1 text-sm text-red-400">Talent name is required</Text>
                )}
              </View>
              {/* Gender */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Gender</Text>
                  <Text className="text-red-500">*</Text>
                </View>
                <SingleWheelPickerInput
                  title="Gender"
                  value={values.gender || null}
                  options={GENDER_OPTIONS}
                  onChange={(value: string) => {
                    setFieldValue('gender', value);
                    setFieldTouched('gender', true);
                  }}
                />
                {touched.gender && genderError && (
                  <Text className="mt-1 text-sm text-red-400">Gender is required</Text>
                )}
              </View>
              {/* Eye Color */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Eye Color</Text>
                  <Text className="text-red-500">*</Text>
                </View>
                <SingleWheelPickerInput
                  title="Eye Color"
                  value={values.eyeColor || null}
                  options={EYE_COLOR_OPTIONS}
                  onChange={(value: string) => {
                    setFieldValue('eyeColor', value);
                    setFieldTouched('eyeColor', true);
                  }}
                />
                {touched.eyeColor && eyeColorError && (
                  <Text className="mt-1 text-sm text-red-400">Eye color is required</Text>
                )}
              </View>
              {/* Hair Color */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Hair Color</Text>
                  <Text className="text-red-500">*</Text>
                </View>
                <SingleWheelPickerInput
                  title="Hair Color"
                  value={values.hairColor || null}
                  options={HAIR_COLOR_OPTIONS}
                  onChange={(value: string) => {
                    setFieldValue('hairColor', value);
                    setFieldTouched('hairColor', true);
                  }}
                />
                {touched.hairColor && hairColorError && (
                  <Text className="mt-1 text-sm text-red-400">Hair color is required</Text>
                )}
              </View>

              {/* Physical Measurements */}
              <Text className="mb-4 mt-6 text-xl font-bold text-white">Physical Measurements</Text>

              {/* Age */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Age</Text>
                </View>
                <TextInput
                  className="rounded-lg border border-white/20 bg-zinc-800 px-4 py-3 text-white"
                  placeholder="Enter age"
                  placeholderTextColor="#9ca3af"
                  value={values.age}
                  onChangeText={(text) => {
                    // Only allow digits
                    const numericText = text.replace(/[^0-9]/g, '');
                    setFieldValue('age', numericText);
                  }}
                  onBlur={() => setFieldTouched('age', true)}
                  keyboardType="numeric"
                />
              </View>
              {/* Height */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Height (cm)</Text>
                </View>
                <TextInput
                  className="rounded-lg border border-white/20 bg-zinc-800 px-4 py-3 text-white"
                  placeholder="Enter height in cm"
                  placeholderTextColor="#9ca3af"
                  value={values.height}
                  onChangeText={(text) => {
                    // Allow digits and one decimal point
                    const decimalText = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                    setFieldValue('height', decimalText);
                  }}
                  onBlur={() => setFieldTouched('height', true)}
                  keyboardType="decimal-pad"
                />
              </View>
              {/* Chest */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Chest (cm)</Text>
                </View>
                <TextInput
                  className="rounded-lg border border-white/20 bg-zinc-800 px-4 py-3 text-white"
                  placeholder="Enter chest measurement"
                  placeholderTextColor="#9ca3af"
                  value={values.chest}
                  onChangeText={(text) => {
                    // Allow digits and one decimal point
                    const decimalText = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                    setFieldValue('chest', decimalText);
                  }}
                  onBlur={() => setFieldTouched('chest', true)}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Waist */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Waist (cm)</Text>
                </View>
                <TextInput
                  className="rounded-lg border border-white/20 bg-zinc-800 px-4 py-3 text-white"
                  placeholder="Enter waist measurement"
                  placeholderTextColor="#9ca3af"
                  value={values.waist}
                  onChangeText={(text) => {
                    // Allow digits and one decimal point
                    const decimalText = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                    setFieldValue('waist', decimalText);
                  }}
                  onBlur={() => setFieldTouched('waist', true)}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Hip */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Hip (cm)</Text>
                </View>
                <TextInput
                  className="rounded-lg border border-white/20 bg-zinc-800 px-4 py-3 text-white"
                  placeholder="Enter hip measurement"
                  placeholderTextColor="#9ca3af"
                  value={values.hip}
                  onChangeText={(text) => {
                    // Allow digits and one decimal point
                    const decimalText = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                    setFieldValue('hip', decimalText);
                  }}
                  onBlur={() => setFieldTouched('hip', true)}
                  keyboardType="decimal-pad"
                />
              </View>
              {/* Shoes */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Shoes (EU Size)</Text>
                </View>
                <TextInput
                  className="rounded-lg border border-white/20 bg-zinc-800 px-4 py-3 text-white"
                  placeholder="Enter shoe size"
                  placeholderTextColor="#9ca3af"
                  value={values.shoes}
                  onChangeText={(text) => {
                    // Only allow digits
                    const numericText = text.replace(/[^0-9]/g, '');
                    setFieldValue('shoes', numericText);
                  }}
                  onBlur={() => setFieldTouched('shoes', true)}
                  keyboardType="numeric"
                />
              </View>

              {/* Background Information */}
              <Text className="mb-4 mt-6 text-xl font-bold text-white">Background</Text>
              {/* Ethnicity */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Ethnicity</Text>
                  <Text className="text-red-500">*</Text>
                </View>
                <SingleWheelPickerInput
                  title="Ethnicity"
                  value={values.ethnic || null}
                  options={ETHNIC_OPTIONS}
                  onChange={(value: string) => {
                    setFieldValue('ethnic', value);
                    setFieldTouched('ethnic', true);
                  }}
                />
                {touched.ethnic && ethnicError && (
                  <Text className="mt-1 text-sm text-red-400">Ethnicity is required</Text>
                )}
              </View>
              {/* Region */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Region</Text>
                </View>
                <TextInput
                  className="rounded-lg border border-white/20 bg-zinc-800 px-4 py-3 text-white"
                  placeholder="Enter region (e.g., North America)"
                  placeholderTextColor="#9ca3af"
                  value={values.region}
                  onChangeText={(text) => setFieldValue('region', text)}
                  onBlur={() => setFieldTouched('region', true)}
                />
              </View>

              {/* Professional Experience */}
              <Text className="mb-4 mt-6 text-xl font-bold text-white">
                Professional Experience
              </Text>
              {/* Experience */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Experience</Text>
                </View>
                <TextInput
                  className="min-h-[80px] rounded-lg border border-white/20 bg-zinc-800 px-4 py-3 text-white"
                  placeholder="Describe your professional experience..."
                  placeholderTextColor="#9ca3af"
                  value={values.experience}
                  onChangeText={(text) => setFieldValue('experience', text)}
                  onBlur={() => setFieldTouched('experience', true)}
                  multiline
                  textAlignVertical="top"
                  numberOfLines={6}
                />
              </View>

              {/* Portfolio Snapshots */}
              <Text className="mb-4 mt-6 text-xl font-bold text-white">Portfolio Snapshots</Text>
              {/* Half-Body Snapshot */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Half-Body Snapshot</Text>
                  <Text className="text-red-500">*</Text>
                </View>
                <TouchableOpacity
                  className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/20 bg-zinc-800"
                  onPress={() => {
                    clearMedia();
                    setCurrentSnapshotField('halfBody');
                    setIsWaitingForCamera(true);
                    router.push({
                      pathname: '/(protected)/camera' as any,
                      params: {
                        functionParam: 'userProfile',
                        multipleSelection: 'false',
                        aspectRatio: '4:5',
                      },
                    });
                  }}>
                  {values.snapshotHalfBody ? (
                    <Image
                      key={values.snapshotHalfBody}
                      source={{ uri: values.snapshotHalfBody }}
                      className="h-full w-full"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Plus color="#6b7280" size={32} />
                      <Text className="mt-2 text-sm text-gray-500">Add Half-Body Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {touched.snapshotHalfBody && snapshotHalfBodyError && (
                  <Text className="mt-1 text-sm text-red-400">Half-body snapshot is required</Text>
                )}
              </View>

              {/* Full-Body Snapshot */}
              <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Text className="text-white">Full-Body Snapshot</Text>
                  <Text className="text-red-500">*</Text>
                </View>
                <TouchableOpacity
                  className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/20 bg-zinc-800"
                  onPress={() => {
                    clearMedia();
                    setCurrentSnapshotField('fullBody');
                    setIsWaitingForCamera(true);
                    router.push({
                      pathname: '/(protected)/camera' as any,
                      params: {
                        functionParam: 'userProfile',
                        multipleSelection: 'false',
                        aspectRatio: '4:5',
                      },
                    });
                  }}>
                  {values.snapshotFullBody ? (
                    <Image
                      key={values.snapshotFullBody}
                      source={{ uri: values.snapshotFullBody }}
                      className="h-full w-full"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Plus color="#6b7280" size={32} />
                      <Text className="mt-2 text-sm text-gray-500">Add Full-Body Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {touched.snapshotFullBody && snapshotFullBodyError && (
                  <Text className="mt-1 text-sm text-red-400">Full-body snapshot is required</Text>
                )}
              </View>
            </ScrollView>
          </FormPage>
        );
      }}
    </Formik>
  );
}
