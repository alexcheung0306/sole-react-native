import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Calendar, Clock } from 'lucide-react-native';
import { PrimaryButton } from '@/components/custom/primary-button';
import { Button, ButtonText } from '@/components/ui/button';
import CollapseDrawer from '@/components/custom/collapse-drawer';
import DatePicker from 'react-native-date-picker';
import { parseDateTime, formatDateTime, formatDisplayDateTime } from '@/lib/datetime';
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerInitialDate, setPickerInitialDate] = useState<Date>(new Date());

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
      setApplicationDeadline('');
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
    // Set initial date to tomorrow if no deadline is set
    if (!applicationDeadline) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      setPickerInitialDate(tomorrow);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setApplicationDeadline('');
    setDateError('');
    setShowDatePicker(false);
  };

  const openDateTimePicker = () => {
    // Parse existing deadline or use tomorrow as default
    let initialDate = new Date();
    if (applicationDeadline) {
      const parsed = parseDateTime(applicationDeadline);
      if (parsed && !isNaN(parsed.getTime())) {
        initialDate = parsed;
      } else {
        initialDate.setDate(initialDate.getDate() + 1);
        initialDate.setHours(12, 0, 0, 0);
      }
    } else {
      initialDate.setDate(initialDate.getDate() + 1);
      initialDate.setHours(12, 0, 0, 0);
    }
    setPickerInitialDate(initialDate);
    setShowDatePicker(true);
  };

  const handleDateTimeConfirm = (date: Date) => {
    // Validate that the date is in the future
    const now = new Date();
    if (date <= now) {
      setDateError('Application deadline must be in the future');
      setShowDatePicker(false);
      return;
    }
    
    const formatted = formatDateTime(date);
    setApplicationDeadline(formatted);
    setDateError('');
    setShowDatePicker(false);
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
              <View>
                <Text className="mb-2 text-sm font-semibold text-white">Application Deadline *</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={openDateTimePicker}
                  className="flex-row items-center justify-between rounded-2xl border border-white/20 bg-zinc-600 p-3">
                  <View className="flex-row items-center gap-2">
                    <Calendar size={16} color="#ffffff" />
                    <Text className="text-white">
                      {applicationDeadline
                        ? formatDisplayDateTime(applicationDeadline, 'Select deadline')
                        : 'Select deadline'}
                    </Text>
                  </View>
                  <Clock size={16} color="#ffffff" />
                </TouchableOpacity>
                {dateError !== '' && (
                  <Text className="mt-1 text-xs text-red-400">{dateError}</Text>
                )}
                {!dateError && applicationDeadline && (
                  <Text className="mt-1 text-xs text-white/60">
                    Selected: {formatDisplayDateTime(applicationDeadline)}
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View className="mt-4 flex-row gap-3">
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
                  <ButtonText>{isLoading ? 'Publishing...' : 'Publish Project'}</ButtonText>
                </Button>
              </View>
            </View>
          </ScrollView>
        </View>
      </CollapseDrawer>

      {/* Date/Time Picker */}
      <DatePicker
        modal
        open={showDatePicker}
        date={pickerInitialDate}
        mode="datetime"
        minimumDate={new Date()}
        onConfirm={handleDateTimeConfirm}
        onCancel={() => {
          setShowDatePicker(false);
        }}
        minuteInterval={5}
        theme="dark"
        locale="en"
        title="Select Application Deadline"
      />
    </View>
  );
}

