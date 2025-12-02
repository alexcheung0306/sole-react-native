import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react-native';
import { PrimaryButton } from '@/components/custom/primary-button';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { publishProject } from '@/api/apiservice/project_api';

interface PublishProjectButtonProps {
  projectData: any;
  isDisable: boolean;
  onSuccess?: () => void;
}

export function PublishProjectButton({
  projectData,
  isDisable,
  onSuccess,
}: PublishProjectButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [applicationDeadline, setApplicationDeadline] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');

  // Log when isDisable prop changes
  React.useEffect(() => {
    console.log('=== PublishProjectButton: isDisable changed ===', isDisable);
  }, [isDisable]);

  const projectId = projectData?.id || projectData?.project?.id;

  const publishMutation = useMutation({
    mutationFn: async (formData: { applicationDeadline: string }) => {
      return await publishProject(projectId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manageProjects'] });
      queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] });
      setIsOpen(false);
      setApplicationDeadline(null);
      setDateError('');
      if (onSuccess) {
        onSuccess();
      } else {
        router.replace('/(protected)/(client)/projects/manage-projects');
      }
    },
    onError: (error) => {
      console.error('Error publishing project:', error);
      setDateError('Failed to publish project. Please try again.');
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleOpen = () => {
    setIsOpen(true);
    setDateError('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setApplicationDeadline('');
    setDateError('');
  };

  const handlePublish = () => {
    if (!applicationDeadline || applicationDeadline.trim() === '') {
      setDateError('Please enter an application deadline');
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(applicationDeadline)) {
      setDateError('Please enter a valid date (YYYY-MM-DD)');
      return;
    }

    // Validate that the date is in the future
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const selectedDate = new Date(applicationDeadline);
    selectedDate.setHours(0, 0, 0, 0);

    if (isNaN(selectedDate.getTime())) {
      setDateError('Please enter a valid date');
      return;
    }

    if (selectedDate <= now) {
      setDateError('Application deadline must be in the future');
      return;
    }

    setIsLoading(true);
    setDateError('');
    publishMutation.mutate({
      applicationDeadline: new Date(applicationDeadline).toISOString(),
    });
  };

  const hasError = !applicationDeadline || dateError !== '';

  return (
    <View className="w-full px-2">
      <PrimaryButton
        variant="create"
        disabled={isDisable}
        icon={<Upload size={20} color="#000000" />}
        onPress={handleOpen}
        className="w-full">
        Publish Project
      </PrimaryButton>

      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="lg">Confirm Publish Project {projectId}</Heading>
            <ModalCloseButton>
              <Text>✕</Text>
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <VStack space="md">
              <Text className="text-sm text-white/80">
                Set Application Deadline before publishing
              </Text>

              <FormControl isInvalid={dateError !== ''} isRequired>
                <FormControlLabel>
                  <FormControlLabelText>Application Deadline</FormControlLabelText>
                </FormControlLabel>
                <Input className="border-white/20 bg-zinc-800">
                  <InputField
                    placeholder="YYYY-MM-DD"
                    value={applicationDeadline}
                    onChangeText={(text) => {
                      setApplicationDeadline(text);
                      setDateError('');
                    }}
                    keyboardType="default"
                  />
                </Input>
                {dateError !== '' && (
                  <Text className="mt-1 text-xs text-red-400">{dateError}</Text>
                )}
                <Text className="mt-1 text-xs text-white/60">
                  Format: YYYY-MM-DD (e.g., 2024-12-31)
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack space="md" className="w-full">
              <Button
                action="secondary"
                variant="outline"
                onPress={handleClose}
                className="flex-1">
                <ButtonText>Cancel</ButtonText>
              </Button>
              <Button
                action="primary"
                onPress={handlePublish}
                isDisabled={hasError || isLoading}
                className="flex-1">
                <ButtonText>{isLoading ? 'Publishing...' : 'Confirm'}</ButtonText>
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </View>
  );
}

