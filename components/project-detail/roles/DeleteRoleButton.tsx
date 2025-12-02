import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react-native';
import { deleteRoleById } from '@/api/apiservice/role_api';

type DeleteRoleButtonProps = {
  projectId: number;
  roleIdToDelete: number;
  setCurrentRole: (index: number) => void;
  refetchRoles: () => void;
};

export function DeleteRoleButton({
  projectId,
  roleIdToDelete,
  setCurrentRole,
  refetchRoles,
}: DeleteRoleButtonProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const roleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      return await deleteRoleById(roleId);
    },
    onSuccess: async () => {
      // Invalidate project data queries
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-detail'] }); // Invalidates all project-detail queries
      queryClient.invalidateQueries({ queryKey: ['manageProjects'] });
      // Refetch role-related queries immediately (this will update roleCount and jobNotReadyCount)
      await queryClient.refetchQueries({ queryKey: ['project-roles', projectId] });
      queryClient.invalidateQueries({ queryKey: ['rolesWithSchedules', projectId] });
      // Invalidate contract queries (may depend on roles)
      queryClient.invalidateQueries({ queryKey: ['project-contracts', projectId] });
      refetchRoles();
      // Reset to first role after deletion
      setCurrentRole(0);
    },
    onError: (error) => {
      console.error('Error deleting role:', error);
      Alert.alert('Delete failed', 'We could not delete the role. Please try again.');
    },
  });

  const handleDeleteRoleById = async (roleId: number) => {
    setIsDeleting(true);
    try {
      await roleMutation.mutateAsync(roleId);
    } catch (error) {
      console.error('Error deleting role:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete Role ${roleIdToDelete}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteRoleById(roleIdToDelete),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      className="flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-rose-600/90 px-4 py-2.5"
      onPress={confirmDelete}
      disabled={isDeleting}
      activeOpacity={0.85}>
      {isDeleting ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <Trash2 size={18} color="#ffffff" />
      )}
      <Text className="text-sm font-semibold text-white">
        {isDeleting ? 'Deleting...' : 'Delete Role'}
      </Text>
    </TouchableOpacity>
  );
}

