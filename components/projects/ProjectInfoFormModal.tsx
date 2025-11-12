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

export default function ProjectInfoFormModal({
  method,
  initValues,
}: ProjectInfoFormModalProps) {
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
      Alert.alert(
        'Success',
        `Project ${method === 'POST' ? 'created' : 'updated'} successfully`
      );
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
        className={`flex-row items-center justify-center gap-2 py-3 px-4 rounded-lg mb-4 ${
          method === 'POST' ? 'bg-white/20 border border-white' : 'bg-purple-600'
        }`}
        onPress={() => setIsOpen(true)}
      >
        {method === 'POST' ? (
          <Plus color="#ffffff" size={20} />
        ) : (
          <Pencil color="#ffffff" size={20} />
        )}
        <Text className="text-white text-base font-semibold">
          {method === 'POST' ? 'Create New Project' : 'Edit Project'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-black/70 justify-end"
        >
          <View className="bg-gray-900 rounded-t-3xl max-h-[90%] border-t border-white/10">
            {/* Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-white/10">
              <Text className="text-xl font-bold text-white">
                {method === 'POST' ? 'Create New Project' : 'Edit Project'}
              </Text>
              <TouchableOpacity onPress={handleClose} className="p-1">
                <X color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              className="p-5"
              showsVerticalScrollIndicator={false}
            >
              {/* Project Image */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-white mb-2">Project Image</Text>
                <TouchableOpacity
                  className="w-full aspect-video rounded-xl overflow-hidden bg-gray-800/60 border border-white/10"
                  onPress={pickImage}
                >
                  {formData.projectImage ? (
                    <Image
                      source={{ uri: formData.projectImage }}
                      className="w-full h-full"
                    />
                  ) : (
                    <View className="flex-1 justify-center items-center">
                      <Plus color="#6b7280" size={32} />
                      <Text className="text-gray-500 text-sm mt-2">Add Image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Private Toggle */}
              <TouchableOpacity
                className="flex-row justify-between items-center mb-5"
                onPress={() =>
                  setFormData({ ...formData, isPrivate: !formData.isPrivate })
                }
              >
                <Text className="text-sm font-semibold text-white">Private Project</Text>
                <View
                  className={`w-[52px] h-7 rounded-full p-0.5 justify-center ${
                    formData.isPrivate ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                >
                  <View
                    className={`w-6 h-6 rounded-full bg-white ${
                      formData.isPrivate ? 'self-end' : 'self-start'
                    }`}
                  />
                </View>
              </TouchableOpacity>

              {/* Project Name */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-white mb-2">
                  Project Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-gray-800/60 border border-white/10 rounded-lg p-3 text-white text-base"
                  value={formData.projectName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, projectName: text })
                  }
                  placeholder="Enter project name"
                  placeholderTextColor="#6b7280"
                />
              </View>

              {/* Project Description */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-white mb-2">
                  Project Description <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-gray-800/60 border border-white/10 rounded-lg p-3 text-white text-base min-h-[80px]"
                  style={{ textAlignVertical: 'top' }}
                  value={formData.projectDescription}
                  onChangeText={(text) =>
                    setFormData({ ...formData, projectDescription: text })
                  }
                  placeholder="Enter project description"
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Usage */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-white mb-2">Usage</Text>
                <TextInput
                  className="bg-gray-800/60 border border-white/10 rounded-lg p-3 text-white text-base min-h-[80px]"
                  style={{ textAlignVertical: 'top' }}
                  value={formData.usage}
                  onChangeText={(text) =>
                    setFormData({ ...formData, usage: text })
                  }
                  placeholder="Enter usage details"
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Remarks */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-white mb-2">Remarks</Text>
                <TextInput
                  className="bg-gray-800/60 border border-white/10 rounded-lg p-3 text-white text-base min-h-[80px]"
                  style={{ textAlignVertical: 'top' }}
                  value={formData.remarks}
                  onChangeText={(text) =>
                    setFormData({ ...formData, remarks: text })
                  }
                  placeholder="Enter remarks"
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View className="flex-row gap-3 p-5 border-t border-white/10">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-lg items-center bg-red-500/20 border border-red-500"
                onPress={handleClose}
              >
                <Text className="text-red-500 text-base font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-lg items-center bg-blue-500"
                onPress={handleSubmit}
                disabled={projectMutation.isPending}
              >
                <Text className="text-white text-base font-semibold">
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

