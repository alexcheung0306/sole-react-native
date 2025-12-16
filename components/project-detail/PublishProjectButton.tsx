import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react-native';
import { PrimaryButton } from '@/components/custom/primary-button';
import { Button, ButtonText } from '@/components/ui/button';
import CollapseDrawer from '~/components/custom/collapse-drawerV1';
import { parseDateTime } from '@/lib/datetime';
import { publishProject } from '@/api/apiservice/project_api';
import { DateTimePickerInput } from '@/components/form-components/DateTimePickerInput';

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

  const projectId = projectData?.id || projectData?.project?.id;

  const publishMutation = useMutation({
    mutationFn: async (formData: { applicationDeadline: string }) => {
      return await publishProject(projectId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manageProjects'] });
      queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] });
      setIsOpen(false);
      setApplicationDeadline('');
      setDateError('');
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate back to the previous screen (projects list)
        router.back();
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
      setDateError('Please select an application deadline');
      return;
    }

    // Validate that the date is in the future
    const parsed = parseDateTime(applicationDeadline);
    if (!parsed || isNaN(parsed.getTime())) {
      setDateError('Please select a valid date and time');
      return;
    }

    const now = new Date();
    if (parsed <= now) {
      setDateError('Application deadline must be in the future');
      return;
    }

    setIsLoading(true);
    setDateError('');
    publishMutation.mutate({
      applicationDeadline: parsed.toISOString(),
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

      <CollapseDrawer
        showDrawer={isOpen}
        setShowDrawer={setIsOpen}
        title={`Publish Project #${projectId}`}>
        <View className="px-5 pb-6">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}>
            <View className="gap-4">
              <Text className="text-sm text-white/80">
                Set an application deadline before publishing. This will determine when applications for this project close.
              </Text>

              {/* Application Deadline Picker */}
              <DateTimePickerInput
                value={applicationDeadline}
                onChange={setApplicationDeadline}
                label="Application Deadline *"
                placeholder="Select deadline"
                errorMessagePrefix="Application deadline"
                error={dateError}
                onErrorChange={setDateError}
                buttonClassName="flex-row items-center justify-between rounded-2xl border border-white/20 bg-zinc-600 p-3"
              />

              {/* Action Buttons */}
              <View className="mt-4 flex-row gap-3">
                <Button
                  action="secondary"
                  variant="outline"
                  onPress={handleClose}
                  className="flex-1 rounded-2xl">
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button
                  action="primary"
                  onPress={handlePublish}
                  isDisabled={hasError || isLoading}
                  className="flex-1 rounded-2xl">
                  <ButtonText>{isLoading ? 'Publishing...' : 'Publish Project'}</ButtonText>
                </Button>
              </View>
            </View>
          </ScrollView>
        </View>
      </CollapseDrawer>
    </View>
  );
}

