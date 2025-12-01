import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ShieldCheck, ShieldX, Trash2, Pencil } from 'lucide-react-native';

import { updateProject, deleteProjectById } from '@/api/apiservice/project_api';
import CollapseDrawer from '~/components/custom/collapse-drawer';
import ProjectInfoFormModal from '../../projects/ProjectInfoFormModal';

interface ProjectInfoActionsDrawerProps {
  project: any;
  soleUserId: string;
  open: boolean;
  onOpenChange: (value: boolean) => void;
}

export function ProjectInfoActionsDrawer({
  project,
  soleUserId,
  open,
  onOpenChange,
}: ProjectInfoActionsDrawerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const invalidateProjectQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['project-detail', project?.id, soleUserId] });
    queryClient.invalidateQueries({ queryKey: ['project', project?.id] });
    queryClient.invalidateQueries({ queryKey: ['manageProjects'] });
    queryClient.invalidateQueries({ queryKey: ['rolesWithSchedules', project?.id] });
    queryClient.invalidateQueries({ queryKey: ['project-roles', project?.id] });
  };

  const handleTogglePrivacy = async () => {
    if (!project?.id) {
      return;
    }
    setIsToggling(true);
    try {
      await updateProject(project.id, soleUserId, {
        projectName: project?.projectName ?? '',
        projectDescription: project?.projectDescription ?? '',
        usage: project?.usage ?? '',
        remarks: project?.remarks ?? '',
        status: project?.status ?? 'Draft',
        isPrivate: !project?.isPrivate,
      });
      invalidateProjectQueries();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to toggle project privacy', error);
      Alert.alert('Update failed', 'We could not update the project privacy. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete project',
      'This action will permanently delete the project and all related data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!project?.id) {
              return;
            }
            setIsDeleting(true);
            try {
              await deleteProjectById(project.id);
              // Close drawer first
              onOpenChange(false);
              // Remove queries for the deleted project from cache to prevent refetch errors
              queryClient.removeQueries({ queryKey: ['project-detail', project.id, soleUserId] });
              queryClient.removeQueries({ queryKey: ['project', project.id] });
              queryClient.removeQueries({ queryKey: ['project-roles', project.id] });
              queryClient.removeQueries({ queryKey: ['rolesWithSchedules', project.id] });
              queryClient.removeQueries({ queryKey: ['project-contracts', project.id] });
              // Only invalidate the manageProjects query to refresh the list
              queryClient.invalidateQueries({ queryKey: ['manageProjects'] });
              // Navigate away immediately - using replace to avoid back navigation issues
              router.back();
            } catch (error) {
              console.error('Failed to delete project', error);
              Alert.alert('Delete failed', 'We could not delete the project. Please try again.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const ActionRow = ({
    icon,
    title,
    subtitle,
    onPress,
    loading,
    danger,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
    loading?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      className={`flex-row items-center gap-4 rounded-2xl border px-4 py-3 ${
        danger ? 'border-rose-500/30 bg-rose-500/5' : 'border-white/10 bg-white/5'
      }`}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={loading}>
      <View className={`rounded-full p-2 ${danger ? 'bg-rose-500/20' : 'bg-blue-500/20'}`}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className={`text-sm font-semibold ${danger ? 'text-rose-100' : 'text-white'}`}>
          {title}
        </Text>
        <Text className="text-xs text-white/70">{subtitle}</Text>
      </View>
      {loading ? <ActivityIndicator color={danger ? '#fecaca' : '#bfdbfe'} /> : null}
    </TouchableOpacity>
  );

  return (
    <CollapseDrawer
      showDrawer={open}
      setShowDrawer={onOpenChange}
      title="Project actions">
      <View className="gap-4 px-5 pb-6">
        <Text className="text-sm text-white/80">
          Configure privacy or delete the project. Deletions are permanent.
        </Text>

        <View className="gap-3">
          {/* Make project public or private */}
          <ActionRow
            icon={
              project?.isPrivate ? (
                <ShieldX color="#fecaca" size={20} />
              ) : (
                <ShieldCheck color="#bbf7d0" size={20} />
              )
            }
            title={project?.isPrivate ? 'Make project public' : 'Make project private'}
            subtitle={
              project?.isPrivate
                ? 'Anyone with access can view this project once public.'
                : 'Restrict visibility to invited collaborators only.'
            }
            onPress={() => {
              handleTogglePrivacy();
            }}
            loading={isToggling}
          />

          {/* ---------------------------------------Edit project details--------------------------------------- */}
          {project?.status === 'Draft' ? (
            <ProjectInfoFormModal
              method="PUT"
              initValues={project}
              renderTrigger={({ open }) => (
                <ActionRow
                  icon={<Pencil color="#bfdbfe" size={20} />}
                  title="Edit project details"
                  subtitle="Update the project name, description, image, or privacy."
                  onPress={open}
                />
              )}
            />
          ) : null}

          {/* ---------------------------------------Delete project--------------------------------------- */}
          <ActionRow
            icon={<Trash2 color="#fecaca" size={20} />}
            title="Delete project"
            subtitle="Remove this project and all associated data permanently."
            onPress={() => {
              onOpenChange(false);
              confirmDelete();
            }}
            loading={isDeleting}
            danger
          />
        </View>
      </View>
    </CollapseDrawer>
  );
}
