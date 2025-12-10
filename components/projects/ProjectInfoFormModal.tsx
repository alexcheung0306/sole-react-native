import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Pencil, Plus } from 'lucide-react-native';
import { Formik } from 'formik';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { createProject, updateProject } from '@/api/apiservice/project_api';
import { FormModal } from '@/components/custom/form-modal';
import { PrimaryButton } from '../custom/primary-button';
import { useCreatePostContext } from '@/context/CreatePostContext';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

interface ProjectInfoFormModalProps {
  method: 'POST' | 'PUT';
  initValues?: any;
  triggerClassName?: string;
  renderTrigger?: (helpers: {
    open: () => void;
    close: () => void;
    isOpen: boolean;
  }) => React.ReactNode;
}

export interface ProjectFormValues {
  projectImage?: string | null;
  isPrivate: boolean;
  projectName: string;
  projectDescription: string;
  usage: string;
  remarks: string;
  status: string;
}

export default function ProjectInfoFormModal({
  method,
  initValues,
  triggerClassName,
  renderTrigger,
}: ProjectInfoFormModalProps) {
  const { soleUserId } = useSoleUserContext();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const { selectedMedia, clearMedia } = useCreatePostContext();
  const isFocused = useIsFocused();
  const [isWaitingForCamera, setIsWaitingForCamera] = useState(false);

  // Compute initial values using the actual data - memoized to prevent excessive renders
  const initialValues = useMemo((): ProjectFormValues => {
    return {
      projectImage: initValues?.projectImage || null,
      isPrivate: initValues?.isPrivate ?? false,
      projectName: initValues?.projectName ?? '',
      projectDescription: initValues?.projectDescription ?? '',
      usage: initValues?.usage ?? '',
      remarks: initValues?.remarks ?? '',
      status: initValues?.status || 'Draft',
    };
  }, [initValues]);

  // To solve the Formik update issue, we can lift the state of the image or use a ref.
  // We'll update the form field directly inside Formik when selectedMedia changes.

  // React Query mutations
  const projectMutation = useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      if (method === 'POST') {
        return await createProject(soleUserId, values);
      } else {
        if (!initValues?.id) throw new Error('Project ID not found');
        return await updateProject(initValues.id, soleUserId, values);
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
      // Ensure all string fields are explicitly strings (Formik should handle this, but be defensive)
      const submitValues: ProjectFormValues = {
        projectImage: values.projectImage || null,
        isPrivate: values.isPrivate ?? false,
        projectName: String(values.projectName || ''),
        projectDescription: String(values.projectDescription || ''),
        usage: String(values.usage ?? ''),
        remarks: String(values.remarks ?? ''),
        status: String(values.status || 'Draft'),
      };

      console.log('[ProjectInfoFormModal] Submitting values:', {
        projectName: submitValues.projectName,
        projectDescription: submitValues.projectDescription,
        usage: submitValues.usage,
        usageType: typeof submitValues.usage,
        remarks: submitValues.remarks,
        remarksType: typeof submitValues.remarks,
        isPrivate: submitValues.isPrivate,
        status: submitValues.status,
      });

      // Execute mutation
      const result = await projectMutation.mutateAsync(submitValues);

      if (result) {
        // Invalidate and refetch project data after mutation succeeds
        queryClient.invalidateQueries({ queryKey: ['manageProjects'] });

        if (initValues?.id) {
          // Force refetch to ensure we have the latest data from server
          await queryClient.refetchQueries({
            queryKey: ['project-detail', initValues.id, soleUserId],
          });
          queryClient.invalidateQueries({ queryKey: ['project', initValues.id] });
        }

        Alert.alert('Success', `Project ${method === 'POST' ? 'created' : 'updated'} successfully`);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to save project changes');
    }
  };
 
  const modalTitle = method === 'POST' ? 'Create New Project' : 'Edit Project';
  const projectId = initValues?.id;

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
        resetForm,
        submitForm,
        isSubmitting,
      }) => {
        // Effect to update projectImage when selectedMedia changes (returned from camera)
        useEffect(() => {
          if (isFocused && isWaitingForCamera && selectedMedia.length > 0) {
            const mediaItem = selectedMedia[0];
            console.log('Setting projectImage to:', mediaItem.uri);
            setFieldValue('projectImage', mediaItem.uri);
            setIsWaitingForCamera(false); // Reset flag
          }
        }, [isFocused, isWaitingForCamera, selectedMedia]); // Removed setFieldValue from dependency array to avoid loops

        // Validate required fields
        const projectNameError = !values.projectName?.trim();
        const projectDescriptionError = !values.projectDescription?.trim();
        const hasErrors = projectNameError || projectDescriptionError;

        const submitButtonText = isSubmitting ? 'Saving...' : method === 'POST' ? 'Create' : 'Save';

        console.log('values.projectImage', values.projectImage);

        return (
          <>
            <FormModal
              open={isOpen}
              onOpenChange={setIsOpen}
              title={modalTitle}
              submitButtonText={submitButtonText}
              isSubmitting={isSubmitting}
              hasErrors={hasErrors}
              onSubmit={submitForm}
              onReset={resetForm}
              onClose={() => {
                resetForm();
              }}
              trigger={
                renderTrigger
                  ? (helpers) =>
                      renderTrigger({
                        open: helpers.open,
                        close: helpers.close,
                        isOpen: helpers.isOpen,
                      })
                  : (helpers) => (
                      <PrimaryButton
                        variant={method === 'POST' ? 'create' : 'edit'}
                        disabled={false}
                        icon={
                          method === 'POST' ? (
                            <Plus size={20} color="#000000" />
                          ) : (
                            <Pencil size={20} color="#000000" />
                          )
                        }
                        onPress={helpers.open}>
                        {method === 'POST' ? 'Create New Project' : 'Edit Project'}
                      </PrimaryButton>
                    )
              }
              headerClassName="flex-row items-center justify-between border-b border-white/10 px-4 pb-3 pt-12"
              contentClassName="p-5">
              {(close) => (
                <>
                  {/* Project Image */}
                  <View className="mb-5">
                    <Text className="mb-2 text-sm font-semibold text-white">Project Image</Text>
                    <TouchableOpacity
                      className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-gray-800/60"
                      onPress={() => {
                        clearMedia(); // Clear previous selection to ensure we wait for new one
                        setIsWaitingForCamera(true); // Signal that we are waiting for a return
                        router.push({
                          pathname: '/(protected)/camera' as any,
                          params: { functionParam: 'project', multipleSelection: 'false' },
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
                    className="mb-5 flex-row items-center justify-between"
                    activeOpacity={1}
                    onPress={() => setFieldValue('isPrivate', !values.isPrivate)}>
                    <Text className="text-sm font-semibold text-white">Private Project</Text>
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
                  <View className="mb-5">
                    <Text className="mb-2 text-sm font-semibold text-white">
                      Project Name <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className="rounded-lg border border-white/10 bg-gray-800/60 p-3 text-base text-white"
                      value={values.projectName}
                      onChangeText={(text) => {
                        setFieldValue('projectName', text);
                        setFieldTouched('projectName', true);
                      }}
                      placeholder="Enter project name"
                      placeholderTextColor="#6b7280"
                    />
                    {touched.projectName && projectNameError && (
                      <Text className="mt-1 text-xs text-red-500">Project name is required</Text>
                    )}
                  </View>

                  {/* Project Description */}
                  <View className="mb-5">
                    <Text className="mb-2 text-sm font-semibold text-white">
                      Project Description <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className="min-h-[80px] rounded-lg border border-white/10 bg-gray-800/60 p-3 text-base text-white"
                      style={{ textAlignVertical: 'top' }}
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
                      <Text className="mt-1 text-xs text-red-500">
                        Project description is required
                      </Text>
                    )}
                  </View>

                  {/* Usage */}
                  <View className="mb-5">
                    <Text className="mb-2 text-sm font-semibold text-white">Usage</Text>
                    <TextInput
                      className="min-h-[80px] rounded-lg border border-white/10 bg-gray-800/60 p-3 text-base text-white"
                      style={{ textAlignVertical: 'top' }}
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
                  <View className="mb-5">
                    <Text className="mb-2 text-sm font-semibold text-white">Remarks</Text>
                    <TextInput
                      className="min-h-[80px] rounded-lg border border-white/10 bg-gray-800/60 p-3 text-base text-white"
                      style={{ textAlignVertical: 'top' }}
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
                </>
              )}
            </FormModal>
 
          </>
        );
      }}
    </Formik>
  );
}
