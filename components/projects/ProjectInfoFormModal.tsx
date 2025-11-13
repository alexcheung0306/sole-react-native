import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Pencil, Plus, X } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { createProject, updateProject } from '@/api/apiservice/project_api';
import * as ImagePicker from 'expo-image-picker';

interface ProjectInfoFormModalProps {
  method: 'POST' | 'PUT';
  initValues?: any;
}

export default function ProjectInfoFormModal({ method, initValues }: ProjectInfoFormModalProps) {
  const { soleUserId } = useSoleUserContext();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    projectImage: initValues?.projectImage || null,
    isPrivate: initValues?.isPrivate || false,
    projectName: initValues?.projectName || '',
    projectDescription: initValues?.projectDescription || '',
    usage: initValues?.usage || '',
    remarks: initValues?.remarks || '',
    status: initValues?.status || 'Draft',
  });

  const projectMutation = useMutation({
    mutationFn: async (values: any) => {
      if (method === 'POST') {
        return await createProject(soleUserId, values);
      } else {
        return await updateProject(initValues.id, soleUserId, values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manageProjects'] });
      if (initValues?.id) {
        queryClient.invalidateQueries({ queryKey: ['project', initValues.id] });
      }
      Alert.alert('Success', `Project ${method === 'POST' ? 'created' : 'updated'} successfully`);
      handleClose();
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to save project. Please try again.');
      console.error(error);
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, projectImage: result.assets[0].uri });
    }
  };

  const handleSubmit = () => {
    if (!formData.projectName.trim()) {
      Alert.alert('Validation Error', 'Project name is required');
      return;
    }
    if (!formData.projectDescription.trim()) {
      Alert.alert('Validation Error', 'Project description is required');
      return;
    }
    projectMutation.mutate(formData);
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormData({
      projectImage: initValues?.projectImage || null,
      isPrivate: initValues?.isPrivate || false,
      projectName: initValues?.projectName || '',
      projectDescription: initValues?.projectDescription || '',
      usage: initValues?.usage || '',
      remarks: initValues?.remarks || '',
      status: initValues?.status || 'Draft',
    });
  };

  return (
    <>
      <TouchableOpacity
        className={`mb-4 flex-row items-center justify-center gap-2 rounded-lg px-4 py-1 text-black ${
          method === 'POST' ? 'border border-white bg-white' : 'bg-purple-600'
        }`}
        onPress={() => setIsOpen(true)}>
        {method === 'POST' ? <Plus size={20} /> : <Pencil size={20} />}
        <Text className=" text-base font-semibold">
          {method === 'POST' ? 'Create New Project' : 'Edit Project'}
        </Text>
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/70">
          <View className="max-h-[90%] rounded-t-3xl border-t border-white/10 bg-gray-900">
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-white/10 p-5">
              <Text className="text-xl font-bold text-white">
                {method === 'POST' ? 'Create New Project' : 'Edit Project'}
              </Text>
              <TouchableOpacity onPress={handleClose} className="p-1">
                <X color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
              {/* Project Image */}
              <View className="mb-5">
                <Text className="mb-2 text-sm font-semibold text-white">Project Image</Text>
                <TouchableOpacity
                  className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-gray-800/60"
                  onPress={pickImage}>
                  {formData.projectImage ? (
                    <Image source={{ uri: formData.projectImage }} className="h-full w-full" />
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
                onPress={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}>
                <Text className="text-sm font-semibold text-white">Private Project</Text>
                <View
                  className={`h-7 w-[52px] justify-center rounded-full p-0.5 ${
                    formData.isPrivate ? 'bg-blue-500' : 'bg-gray-700'
                  }`}>
                  <View
                    className={`h-6 w-6 rounded-full bg-white ${
                      formData.isPrivate ? 'self-end' : 'self-start'
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
                  value={formData.projectName}
                  onChangeText={(text) => setFormData({ ...formData, projectName: text })}
                  placeholder="Enter project name"
                  placeholderTextColor="#6b7280"
                />
              </View>

              {/* Project Description */}
              <View className="mb-5">
                <Text className="mb-2 text-sm font-semibold text-white">
                  Project Description <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="min-h-[80px] rounded-lg border border-white/10 bg-gray-800/60 p-3 text-base text-white"
                  style={{ textAlignVertical: 'top' }}
                  value={formData.projectDescription}
                  onChangeText={(text) => setFormData({ ...formData, projectDescription: text })}
                  placeholder="Enter project description"
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Usage */}
              <View className="mb-5">
                <Text className="mb-2 text-sm font-semibold text-white">Usage</Text>
                <TextInput
                  className="min-h-[80px] rounded-lg border border-white/10 bg-gray-800/60 p-3 text-base text-white"
                  style={{ textAlignVertical: 'top' }}
                  value={formData.usage}
                  onChangeText={(text) => setFormData({ ...formData, usage: text })}
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
                  value={formData.remarks}
                  onChangeText={(text) => setFormData({ ...formData, remarks: text })}
                  placeholder="Enter remarks"
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View className="flex-row gap-3 border-t border-white/10 p-5">
              <TouchableOpacity
                className="flex-1 items-center rounded-lg border border-red-500 bg-red-500/20 py-3.5"
                onPress={handleClose}>
                <Text className="text-base font-semibold text-red-500">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 items-center rounded-lg bg-blue-500 py-3.5"
                onPress={handleSubmit}
                disabled={projectMutation.isPending}>
                <Text className="text-base font-semibold text-white">
                  {projectMutation.isPending
                    ? 'Saving...'
                    : method === 'POST'
                      ? 'Create Project'
                      : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
