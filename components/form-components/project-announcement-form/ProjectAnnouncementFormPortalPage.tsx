import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { FormPage } from '@/components/custom/form-page';
import { createProjectAnnouncement } from '@/api/apiservice/project_announcement_api';
import { getRolesByProjectId } from '~/api/apiservice/role_api';

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type LevelOption = {
  value: number;
  label: string;
  description: string;
  color: string;
};

function getLevelOptions(stages: string[]): LevelOption[] {
  const formattedStages = stages.map((stage) => capitalize(stage));

  return [
    {
      value: -1,
      label: 'Everyone',
      description: 'All applicants across stages can view this announcement.',
      color: '#bbf7d0',
    },
    {
      value: 0,
      label: 'None',
      description: 'Hide this announcement from this role.',
      color: '#fecaca',
    },
    ...formattedStages.map((stage, index) => ({
      value: index + 1,
      label: stage,
      description: `Applicants in ${stage} and later stages can view.`,
      color: '#bfdbfe',
    })),
  ];
}

function getSelectedProcessesSummary(level: number, stages: string[]): string {
  if (level === -1) {
    return 'Everyone';
  }
  if (level === 0) {
    return 'No access';
  }

  const index = Math.max(0, level - 1);
  const visibleStages = stages.slice(index);
  if (visibleStages.length === 0) {
    return 'Current and future stages';
  }
  return visibleStages.map((stage) => capitalize(stage)).join(', ');
}

export default function ProjectAnnouncementFormPortalPage() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    projectId?: string;
    soleUserId?: string;
    projectStatus?: string;
  }>();

  const projectId = params.projectId ? parseInt(params.projectId) : undefined;
  const soleUserId = params.soleUserId || undefined;
  const projectStatus = params.projectStatus || 'Draft';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audiences, setAudiences] = useState<Record<number, number>>({});

  // Fetch roles
  const { data: rolesWithSchedules = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['jobRoles', projectId],
    queryFn: () => getRolesByProjectId(projectId!),
    enabled: Boolean(projectId),
  });

  const roleAudiences = useMemo(() => {
    return rolesWithSchedules
      .map((entry: any) => {
        const roleId = entry?.role?.id;
        if (!roleId) {
          return null;
        }

        const baseStages = ['invited', 'applied'];
        const activityStages = Array.isArray(entry?.activities)
          ? entry.activities
              .filter((activity: any) => Boolean(activity?.title))
              .map((activity: any) => activity.title as string)
          : [];
        const trailingStages = ['shortlisted', 'offered'];
        const stages = Array.from(new Set([...baseStages, ...activityStages, ...trailingStages]));

        return {
          roleId,
          title: entry?.role?.roleTitle || 'Untitled role',
          description: entry?.role?.roleDescription as string | undefined,
          stages,
        };
      })
      .filter(Boolean) as Array<{
      roleId: number;
      title: string;
      description?: string;
      stages: string[];
    }>;
  }, [rolesWithSchedules]);

  const canCreateAnnouncement = projectStatus !== 'Draft' && roleAudiences.length > 0;

  useEffect(() => {
    setAudiences((prev) => {
      const next: Record<number, number> = {};
      roleAudiences.forEach((role) => {
        next[role.roleId] = prev[role.roleId] ?? 0;
      });
      return next;
    });
  }, [roleAudiences]);

  const createMutation = useMutation({
    mutationFn: createProjectAnnouncement,
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-announcements', projectId] });
      }
      Alert.alert('Success', 'Announcement created successfully');
      router.back();
    },
    onError: (error) => {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement');
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    const receiverPayload = roleAudiences.map((role) => ({
      roleId: role.roleId,
      roleTitle: role.title,
      viewLevel: audiences[role.roleId] ?? 0,
    }));

    const hasAudience = receiverPayload.some((receiver) => receiver.viewLevel !== 0);

    if (!hasAudience) {
      Alert.alert('Error', 'Please select at least one role audience');
      return;
    }

    if (!projectId || !soleUserId) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    createMutation.mutate({
      projectId,
      title: title.trim(),
      senderId: soleUserId,
      receivers: receiverPayload,
      content: content.trim(),
    });
  };

  if (rolesLoading) {
    return (
      <FormPage
        title="New Announcement"
        submitButtonText="Loading..."
        hasErrors={true}
        onSubmit={() => {}}
        isLoading={true}
        headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
        contentClassName="flex-1 px-4">
        <View className="p-4">
          <Text className="text-white text-center">Loading role information...</Text>
        </View>
      </FormPage>
    );
  }

  if (!canCreateAnnouncement) {
    return (
      <FormPage
        title="New Announcement"
        submitButtonText="Cannot Create"
        hasErrors={true}
        onSubmit={() => {}}
        headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
        contentClassName="flex-1 px-4">
        <View className="p-4">
          <Text className="text-white text-center">
            {projectStatus === 'Draft'
              ? 'Project must be published to create announcements.'
              : 'No roles available for announcements.'}
          </Text>
        </View>
      </FormPage>
    );
  }

  const titleError = !title.trim();
  const contentError = !content.trim();
  const audienceError = !Object.values(audiences).some((level) => level !== 0);
  const hasErrors = titleError || contentError || audienceError;

  return (
    <FormPage
      title="New Announcement"
      submitButtonText={createMutation.isPending ? 'Publishing...' : 'Publish announcement'}
      isSubmitting={createMutation.isPending}
      hasErrors={hasErrors}
      onSubmit={handleSubmit}
      headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
      contentClassName="flex-1 px-4">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 80 }}>
        <View className="gap-5 pb-6 px-4">
          <Text className="text-sm text-white/80">
            Choose who can view this update and share the latest project details.
          </Text>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-white">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Announcement title"
              placeholderTextColor="rgba(255,255,255,0.6)"
              className="rounded-xl border border-white/15 bg-zinc-900/70 px-4 py-3 text-base text-white"
            />
            {titleError && (
              <Text className="text-xs text-rose-400">Title is required</Text>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-white">Content</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Share your update..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              className="rounded-xl border border-white/15 bg-zinc-900/70 px-4 py-3 text-base text-white"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            {contentError && (
              <Text className="text-xs text-rose-400">Content is required</Text>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-white">Audience access</Text>
            <Text className="text-sm text-white/80">
              Choose the visibility level for each role. Set at least one role to a level other
              than "None".
            </Text>
            {audienceError && (
              <Text className="text-xs text-rose-400">Please select at least one role audience</Text>
            )}
          </View>

          <View className="gap-4">
            {roleAudiences.map((role) => {
              const currentLevel = audiences[role.roleId] ?? 0;
              const levelOptions = getLevelOptions(role.stages);
              const selectedSummary = getSelectedProcessesSummary(currentLevel, role.stages);
              return (
                <View
                  key={role.roleId}
                  className="rounded-2xl border border-white/15 bg-zinc-900/70 p-4">
                  <TouchableOpacity
                    className="flex-row items-center justify-between gap-3"
                    onPress={() =>
                      setAudiences((prev) => ({
                        ...prev,
                        [role.roleId]: (prev[role.roleId] ?? 0) === 0 ? -1 : 0,
                      }))
                    }>
                    <View className="flex-1 gap-1">
                      <Text className="text-base font-semibold text-white">{role.title}</Text>
                      {role.description ? (
                        <Text className="text-sm text-white/70">
                          {role.description.slice(0, 90)}
                          {role.description.length > 90 ? '…' : ''}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        currentLevel !== 0
                          ? 'border-emerald-400/40 bg-emerald-500/25 text-emerald-50'
                          : 'border-white/30 bg-white/10 text-white'
                      }`}>
                      <Text>{currentLevel !== 0 ? 'Included' : 'Excluded'}</Text>
                    </View>
                  </TouchableOpacity>

                  <View className="mt-4 space-y-3">
                    {levelOptions.map((option) => {
                      const isActive = currentLevel === option.value;
                      const activeStyle = isActive
                        ? {
                            borderColor: option.color,
                            backgroundColor: option.color + '1A',
                          }
                        : undefined;
                      const activeLabelStyle = isActive ? { color: option.color } : null;

                      return (
                        <TouchableOpacity
                          key={`${role.roleId}-${option.value}`}
                          className="flex-row items-center justify-between rounded-xl border border-white/10 px-4 py-3"
                          style={activeStyle}
                          onPress={() =>
                            setAudiences((prev) => ({
                              ...prev,
                              [role.roleId]: option.value,
                            }))
                          }>
                          <View className="flex-1">
                            <Text
                              className="text-sm font-semibold text-white"
                              style={activeLabelStyle}>
                              {option.label}
                            </Text>
                            <Text className="text-xs text-white/70">{option.description}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View className="mt-4 gap-1">
                    <Text className="text-xs font-medium text-white/70">Visible to:</Text>
                    <Text className="text-sm text-white">{selectedSummary}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </FormPage>
  );
}
