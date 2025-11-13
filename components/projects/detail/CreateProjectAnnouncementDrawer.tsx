import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createProjectAnnouncement } from '@/api/apiservice/project_announcement_api';
import { CollapseDrawer } from '~/components/custom/collapse-drawer';
import { PlusIcon } from 'lucide-react-native';

type CreateProjectAnnouncementDrawerProps = {
  projectId: number;
  soleUserId: string;
  projectStatus: string;
  rolesWithSchedules: any[];
};

export function CreateProjectAnnouncementDrawer({
  projectId,
  soleUserId,
  projectStatus,
  rolesWithSchedules,
}: CreateProjectAnnouncementDrawerProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audiences, setAudiences] = useState<Record<number, number>>({});

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
      queryClient.invalidateQueries({ queryKey: ['project-announcements', projectId] });
      setTitle('');
      setContent('');
      setAudiences({});
    },
  });

  if (!canCreateAnnouncement) {
    return null;
  }

  const handleSubmit = (close: () => void) => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    const receiverPayload = roleAudiences.map((role) => ({
      roleId: role.roleId,
      roleTitle: role.title,
      viewLevel: audiences[role.roleId] ?? 0,
    }));

    const hasAudience = receiverPayload.some((receiver) => receiver.viewLevel !== 0);

    if (!hasAudience) {
      return;
    }

    createMutation.mutate(
      {
        projectId,
        title: title.trim(),
        senderId: soleUserId,
        receivers: receiverPayload,
        content: content.trim(),
      },
      {
        onSuccess: () => {
          close();
        },
      }
    );
  };

  return (
    <CollapseDrawer
      trigger={({ open }) => (
        <TouchableOpacity
          className="flex-row items-center justify-center rounded-xl bg-white px-4 py-2.5 text-black"
          activeOpacity={0.85}
          onPress={open}>
          <PlusIcon className="h-4 w-4" />
          <Text className="text-sm font-semibold">Create Project Announcement</Text>
        </TouchableOpacity>
      )}
      content={(close) => (
        <ScrollView className="max-h-[80vh]">
          <View className="gap-5 pb-6">
            <View className="gap-1">
              <Text className="text-lg font-semibold text-white">New Announcement</Text>
              <Text className="text-sm text-white/80">
                Choose who can view this update and share the latest project details.
              </Text>
            </View>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Announcement title"
              placeholderTextColor="rgba(255,255,255,0.6)"
              className="rounded-xl border border-white/15 bg-zinc-900/70 px-4 py-3 text-base text-white"
            />

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

            <View className="gap-2">
              <Text className="text-sm font-semibold text-white">Audience access</Text>
              <Text className="text-sm text-white/80">
                Choose the visibility level for each role. Set at least one role to a level other
                than "None".
              </Text>
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

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-xl border border-white/20 bg-zinc-900/80 px-4 py-3"
                onPress={() => {
                  setTitle('');
                  setContent('');
                  setAudiences({});
                  close();
                }}>
                <Text className="text-center text-sm font-semibold text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-xl bg-blue-500 px-4 py-3"
                onPress={() => handleSubmit(close)}
                disabled={createMutation.isPending}>
                <Text className="text-center text-sm font-semibold text-white">
                  {createMutation.isPending ? 'Publishing...' : 'Publish announcement'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    />
  );
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

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
