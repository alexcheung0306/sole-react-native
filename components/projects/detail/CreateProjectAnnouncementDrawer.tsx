import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createProjectAnnouncement } from '@/api/apiservice/project_announcement_api';
import { CollapseDrawer } from '~/components/custom/collapse-drawer';

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
        <TouchableOpacity style={styles.primaryButton} onPress={open}>
          <Text style={styles.primaryButtonText}>Create Project Announcement</Text>
        </TouchableOpacity>
      )}
      content={(close) => (
        <ScrollView style={styles.drawerContent} contentContainerStyle={{ gap: 18 }}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>New Announcement</Text>
            <Text style={styles.drawerSubtitle}>
              Choose who can view this update and share the latest project details.
            </Text>
          </View>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Announcement title"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.input}
          />

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Share your update..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={[styles.input, styles.multilineInput]}
            multiline
            numberOfLines={6}
          />

          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>Audience access</Text>
              <Text style={styles.sectionCaption}>
                Choose the visibility level for each role. Set at least one role to a level other than "None".
              </Text>
            </View>
          </View>

          <View style={{ gap: 16 }}>
            {roleAudiences.map((role) => {
              const currentLevel = audiences[role.roleId] ?? 0;
              const levelOptions = getLevelOptions(role.stages);
              const selectedSummary = getSelectedProcessesSummary(currentLevel, role.stages);
              return (
                <View key={role.roleId} style={styles.audienceCard}>
                  <TouchableOpacity
                    style={styles.audienceHeader}
                    onPress={() =>
                      setAudiences((prev) => ({
                        ...prev,
                        [role.roleId]: (prev[role.roleId] ?? 0) === 0 ? -1 : 0,
                      }))
                    }>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.audienceTitle}>{role.title}</Text>
                      {role.description ? (
                        <Text style={styles.audienceDescription}>
                          {role.description.slice(0, 90)}
                          {role.description.length > 90 ? '…' : ''}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.audienceToggle,
                        currentLevel !== 0
                          ? styles.audienceToggleActive
                          : styles.audienceToggleInactive,
                      ]}>
                      <Text
                        style={[
                          styles.audienceToggleLabel,
                          currentLevel !== 0 ? styles.audienceToggleLabelActive : {},
                        ]}>
                        {currentLevel !== 0 ? 'Included' : 'Excluded'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.levelContainer}>
                    {levelOptions.map((option) => {
                      const isActive = currentLevel === option.value;
                      const activeStyle = isActive
                        ? {
                            borderColor: option.color,
                            backgroundColor: option.color + '1A',
                          }
                        : null;
                      const activeLabelStyle = isActive ? { color: option.color } : null;

                      return (
                        <TouchableOpacity
                          key={`${role.roleId}-${option.value}`}
                          style={[styles.levelOption, activeStyle]}
                          onPress={() =>
                            setAudiences((prev) => ({
                              ...prev,
                              [role.roleId]: option.value,
                            }))}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.levelLabel, activeLabelStyle]}>
                              {option.label}
                            </Text>
                            <Text style={styles.levelDescription}>{option.description}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.selectionSummary}>
                    <Text style={styles.selectionSummaryLabel}>Visible to:</Text>
                    <Text style={styles.selectionSummaryValue}>{selectedSummary}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.drawerActions}>
            <TouchableOpacity
              style={[styles.secondaryButton, { flex: 1 }]}
              onPress={() => {
                setTitle('');
                setContent('');
                setAudiences({});
                close();
              }}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, { flex: 1 }]}
              onPress={() => handleSubmit(close)}
              disabled={createMutation.isPending}>
              <Text style={styles.primaryButtonText}>
                {createMutation.isPending ? 'Publishing...' : 'Publish announcement'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    />
  );
}

const sharedButton = {
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 10,
};

const styles = StyleSheet.create({
  primaryButton: {
    ...sharedButton,
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    ...sharedButton,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
  },
  secondaryButtonText: {
    color: '#e5e7eb',
    fontWeight: '500',
    textAlign: 'center',
  },
  drawerContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  drawerHeader: {
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f9fafb',
  },
  drawerSubtitle: {
    color: 'rgba(229,231,235,0.65)',
    fontSize: 14,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f9fafb',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionLabel: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionCaption: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 13,
  },
  audienceCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    padding: 16,
    marginBottom: 14,
  },
  audienceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  audienceTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '600',
  },
  audienceDescription: {
    color: 'rgba(229,231,235,0.65)',
    fontSize: 13,
    marginTop: 4,
  },
  audienceToggle: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(148,163,184,0.15)',
  },
  audienceToggleActive: {
    backgroundColor: '#3b82f6',
  },
  audienceToggleInactive: {
    backgroundColor: '#52525b',
  },
  audienceToggleLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  audienceToggleLabelActive: {
    color: '#1e293b',
  },
  levelContainer: {
    marginTop: 12,
    gap: 10,
  },
  levelOption: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  levelDescription: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 12,
  },
  selectionSummary: {
    marginTop: 12,
    gap: 4,
  },
  selectionSummaryLabel: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  selectionSummaryValue: {
    color: '#f9fafb',
    fontSize: 13,
  },
  drawerActions: {
    flexDirection: 'row',
    gap: 12,
  },
});

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
      color: '#22c55e',
    },
    {
      value: 0,
      label: 'None',
      description: 'Hide this announcement from this role.',
      color: '#ef4444',
    },
    ...formattedStages.map((stage, index) => ({
      value: index + 1,
      label: stage,
      description: `Applicants in ${stage} and later stages can view.`,
      color: '#3b82f6',
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


