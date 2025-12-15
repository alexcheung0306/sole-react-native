import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Formik } from 'formik';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { createProject, updateProject } from '@/api/apiservice/project_api';
import { FormPage } from '@/components/custom/form-page';
import { useCameraContext } from '~/context/CameraContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { ProjectFormValues } from './ProjectInfoFormModal';

export default function ProjectInfoFormPage() {
  const { soleUserId } = useSoleUserContext();
  const queryClient = useQueryClient();
  const { selectedMedia, clearMedia } = useCameraContext();
  const isFocused = useIsFocused();
  const [isWaitingForCamera, setIsWaitingForCamera] = useState(false);
  const params = useLocalSearchParams<{
    method?: 'POST' | 'PUT';
    projectId?: string;
    projectImage?: string;
    isPrivate?: string;
    projectName?: string;
    projectDescription?: string;
    usage?: string;
    remarks?: string;
    status?: string;
  }>();

  const method = (params.method || 'POST') as 'POST' | 'PUT';
  const projectId = params.projectId;

  // Compute initial values from params
  const initialValues = useMemo((): ProjectFormValues => {
    return {
      projectImage: params.projectImage || null,
      isPrivate: params.isPrivate === 'true',
      projectName: params.projectName || '',
      projectDescription: params.projectDescription || '',
      usage: params.usage || '',
      remarks: params.remarks || '',
      status: params.status || 'Draft',
    };
  }, [params]);

  // React Query mutations
  const projectMutation = useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      if (method === 'POST') {
        return await createProject(soleUserId, values);
      } else {
        if (!projectId) throw new Error('Project ID not found');
        return await updateProject(projectId, soleUserId, values);
      }
    },
    onSuccess: () => {
      console.log('Project updated successfully');
    },
    onError: (error) => {
      console.error('Error updating Project:', error);
      Alert.alert('Error', 'Failed to update project information');
    },
  });

  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      const submitValues: ProjectFormValues = {
        projectImage: values.projectImage || null,
        isPrivate: values.isPrivate ?? false,
        projectName: String(values.projectName || ''),
        projectDescription: String(values.projectDescription || ''),
        usage: String(values.usage ?? ''),
        remarks: String(values.remarks ?? ''),
        status: String(values.status || 'Draft'),
      };

      console.log('[ProjectInfoFormPage] Submitting values:', {
        projectName: submitValues.projectName,
        projectDescription: submitValues.projectDescription,
        usage: submitValues.usage,
        usageType: typeof submitValues.usage,
        remarks: submitValues.remarks,
        remarksType: typeof submitValues.remarks,
        isPrivate: submitValues.isPrivate,
        status: submitValues.status,
      });

      const result = await projectMutation.mutateAsync(submitValues);

      if (result) {
        queryClient.invalidateQueries({ queryKey: ['manageProjects'] });

        if (projectId) {
          await queryClient.refetchQueries({
            queryKey: ['project-detail', projectId, soleUserId],
          });
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        }

        Alert.alert('Success', `Project ${method === 'POST' ? 'created' : 'updated'} successfully`);
        router.back();
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to save project changes');
    }
  };

  const pageTitle = method === 'POST' ? 'Create New Project' : 'Edit Project';

  return (
    <Formik
      key={`project-form-${projectId || 'new'}`}
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
        // Effect to update projectImage when selectedMedia changes (returned from camera)
        useEffect(() => {
          if (isFocused && isWaitingForCamera && selectedMedia.length > 0) {
            const mediaItem = selectedMedia[0];
            console.log('Setting projectImage to:', mediaItem.uri);
            setFieldValue('projectImage', mediaItem.uri);
            setIsWaitingForCamera(false);
          }
        }, [isFocused, isWaitingForCamera, selectedMedia]);

        // Validate required fields
        const projectNameError = !values.projectName?.trim();
        const projectDescriptionError = !values.projectDescription?.trim();
        const hasErrors = projectNameError || projectDescriptionError;

        const submitButtonText = isSubmitting ? 'Saving...' : method === 'POST' ? 'Create' : 'Save';

        return (
          <FormPage
            title={pageTitle}
            submitButtonText={submitButtonText}
            isSubmitting={isSubmitting}
            hasErrors={hasErrors}
            onSubmit={submitForm}
            headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
            contentClassName="flex-1 px-4">
            {/* Project Image */}
            <View className="mb-4">
              <Text className="mb-2 text-white">Project Image</Text>
              <TouchableOpacity
                className="aspect-video w-full overflow-hidden rounded-xl border border-white/20 bg-zinc-800"
                onPress={() => {
                  clearMedia();
                  setIsWaitingForCamera(true);
                  router.push({
                    pathname: '/(protected)/camera' as any,
                    params: {
                      functionParam: 'project',
                      multipleSelection: 'false',
                      aspectRatio: '16:9',
                    },
                  });
                }}>
                {values.projectImage ? (
                  <Image
                    key={values.projectImage}
                    source={{ uri: values.projectImage }}
                    className="h-full w-full"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Plus color="#6b7280" size={32} />
                    <Text className="mt-2 text-sm text-gray-500">Add Image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Private Toggle */}
            <TouchableOpacity
              className="mb-4 flex-row items-center justify-between"
              activeOpacity={1}
              onPress={() => setFieldValue('isPrivate', !values.isPrivate)}>
              <Text className="text-white">Private Project</Text>
              <View
                className={`h-7 w-[52px] justify-center rounded-full p-0.5 ${
                  values.isPrivate ? 'bg-blue-500' : 'bg-gray-700'
                }`}>
                <View
                  className={`h-6 w-6 rounded-full bg-gray-300 ${
                    values.isPrivate ? 'self-end' : 'self-start'
                  }`}
                />
              </View>
            </TouchableOpacity>

            {/* Project Name */}
            <View className="mb-4">
              <View className="mb-2 flex-row items-center gap-2">
                <Text className="text-white">Project Name</Text>
                <Text className="text-red-500">*</Text>
              </View>
              <TextInput
                className="rounded-lg border border-white/20 bg-zinc-800 p-3 text-white"
                value={values.projectName}
                onChangeText={(text) => {
                  setFieldValue('projectName', text);
                  setFieldTouched('projectName', true);
                }}
                placeholder="Enter project name"
                placeholderTextColor="#6b7280"
              />
              {touched.projectName && projectNameError && (
                <Text className="mt-1 text-sm text-red-400">Project name is required</Text>
              )}
            </View>

            {/* Project Description */}
            <View className="mb-4">
              <View className="mb-2 flex-row items-center gap-2">
                <Text className="text-white">Project Description</Text>
                <Text className="text-red-500">*</Text>
              </View>
              <TextInput
                className="min-h-[80px] rounded-lg border border-white/20 bg-zinc-800 p-3 text-white"
                style={{ textAlignVertical: 'top', color: '#ffffff' }}
                value={values.projectDescription}
                onChangeText={(text) => {
                  setFieldValue('projectDescription', text);
                  setFieldTouched('projectDescription', true);
                }}
                placeholder="Enter project description"
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={4}
              />
              {touched.projectDescription && projectDescriptionError && (
                <Text className="mt-1 text-sm text-red-400">
                  Project description is required
                </Text>
              )}
            </View>

            {/* Usage */}
            <View className="mb-4">
              <Text className="mb-2 text-white">Usage</Text>
              <TextInput
                className="min-h-[80px] rounded-lg border border-white/20 bg-zinc-800 p-3 text-white"
                style={{ textAlignVertical: 'top', color: '#ffffff' }}
                value={values.usage}
                onChangeText={(text) => {
                  setFieldValue('usage', text);
                  setFieldTouched('usage', true);
                }}
                placeholder="Enter usage details"
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Remarks */}
            <View className="mb-4">
              <Text className="mb-2 text-white">Remarks</Text>
              <TextInput
                className="min-h-[80px] rounded-lg border border-white/20 bg-zinc-800 p-3 text-white"
                style={{ textAlignVertical: 'top', color: '#ffffff' }}
                value={values.remarks}
                onChangeText={(text) => {
                  setFieldValue('remarks', text);
                  setFieldTouched('remarks', true);
                }}
                placeholder="Enter remarks"
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={3}
              />
            </View>
          </FormPage>
        );
      }}
    </Formik>
  );
}

