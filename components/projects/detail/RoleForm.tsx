import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil } from 'lucide-react-native';
import { CollapseDrawer } from '@/components/custom/collapse-drawer';
import { PrimaryButton } from '@/components/custom/primary-button';
import {
  createRoleWithSchedules,
  updateRoleAndSchedules,
} from '@/api/apiservice/role_api';

type RoleFormProps = {
  projectId: number;
  method: 'POST' | 'PUT';
  roleId?: number | null;
  fetchedValues?: any;
  isDisabled?: boolean;
  refetchRoles: () => void;
};

export function RoleForm({
  projectId,
  method,
  roleId = null,
  fetchedValues = null,
  isDisabled = false,
  refetchRoles,
}: RoleFormProps) {
  const queryClient = useQueryClient();

  // Handle both old format (fetchedValues directly) and new format (roleWithSchedules with nested role)
  const roleData = fetchedValues?.role ? fetchedValues.role : fetchedValues;
  const activitiesData = fetchedValues?.activities ? fetchedValues.activities : [];

  const [roleTitle, setRoleTitle] = useState(roleData?.roleTitle || '');
  const [roleDescription, setRoleDescription] = useState(roleData?.roleDescription || '');
  const [talentCount, setTalentCount] = useState(String(roleData?.talentNumbers || 1));

  const createRoleMutation = useMutation({
    mutationFn: ({ title, description, count }: { title: string; description: string; count: number }) => {
      const parsedValues = {
        projectId,
        requiredGender: 'Any',
        roleTitle: title,
        roleDescription: description,
        paymentBasis: 'Fixed',
        budget: 0,
        talentNumbers: count,
        displayBudgetTo: 'talent',
        talentsQuote: false,
        otPayment: '',
        ageMin: null,
        ageMax: null,
        heightMin: null,
        heightMax: null,
        category: [],
        requiredEthnicGroup: '',
        skills: '',
        questions: '',
        isCastingRequired: false,
        isFittingRequired: false,
        isJobScheduleReady: false,
      } as any;

      const scheduleValues = {
        activityScheduleLists: [],
      };

      return createRoleWithSchedules(parsedValues, scheduleValues);
    },
    onSuccess: () => {
      refetchRoles();
      queryClient.invalidateQueries({ queryKey: ['project-roles', projectId] });
      setRoleTitle('');
      setRoleDescription('');
      setTalentCount('1');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      title,
      description,
      count,
    }: {
      title: string;
      description: string;
      count: number;
    }) => {
      const parsedValues = {
        projectId,
        requiredGender: roleData?.requiredGender ?? 'Any',
        roleTitle: title,
        roleDescription: description,
        paymentBasis: roleData?.paymentBasis ?? 'Fixed',
        budget: roleData?.budget ?? 0,
        talentNumbers: count,
        displayBudgetTo: roleData?.displayBudgetTo ?? 'talent',
        talentsQuote: roleData?.talentsQuote ?? false,
        otPayment: roleData?.otPayment ?? '',
        ageMin: roleData?.ageMin ?? null,
        ageMax: roleData?.ageMax ?? null,
        heightMin: roleData?.heightMin ?? null,
        heightMax: roleData?.heightMax ?? null,
        category: roleData?.category ?? [],
        requiredEthnicGroup: roleData?.requiredEthnicGroup ?? '',
        skills: roleData?.skills ?? '',
        questions: roleData?.questions ?? '',
        isCastingRequired: roleData?.isCastingRequired ?? false,
        isFittingRequired: roleData?.isFittingRequired ?? false,
        isJobScheduleReady: roleData?.isJobScheduleReady ?? false,
      } as any;

      const scheduleValues = {
        activityScheduleLists: activitiesData.map((activity: any) => ({
          id: activity?.id,
          title: activity?.title,
          type: activity?.type,
          remarks: activity?.remarks ?? '',
          schedules: activity?.schedules ?? [],
        })),
      };

      return updateRoleAndSchedules(String(roleId), parsedValues, scheduleValues);
    },
    onSuccess: () => {
      refetchRoles();
      queryClient.invalidateQueries({ queryKey: ['project-roles', projectId] });
    },
  });

  const handleSubmit = (close: () => void) => {
    const count = Number(talentCount) || 1;
    if (method === 'POST') {
      createRoleMutation.mutate(
        { title: roleTitle.trim(), description: roleDescription.trim(), count },
        {
          onSuccess: () => {
            close();
          },
        }
      );
    } else {
      if (!roleId) return;
      updateRoleMutation.mutate(
        {
          title: roleTitle.trim(),
          description: roleDescription.trim(),
          count,
        },
        {
          onSuccess: () => {
            close();
          },
        }
      );
    }
  };

  const isSubmitting = createRoleMutation.isPending || updateRoleMutation.isPending;
  const hasErrors = !roleTitle.trim() || !roleDescription.trim();

  return (
    <CollapseDrawer
      trigger={({ open }) => (
        <PrimaryButton
          variant={method === 'POST' ? 'create' : 'edit'}
          disabled={isDisabled}
          icon={
            method === 'POST' ? (
              <Plus size={18} color="#000000" />
            ) : (
              <Pencil size={18} color="#000000" />
            )
          }
          onPress={open}>
          {method === 'POST' ? 'New Role' : 'Edit Role'}
        </PrimaryButton>
      )}
      header={
        <View className="flex-row items-center justify-between px-4 pb-3 pt-4">
          <Text className="text-lg font-bold text-white">
            {method === 'POST' ? 'Create Role' : 'Edit Role'}
          </Text>
        </View>
      }
      content={(close) => (
        <View className="gap-4 px-4 pb-4">
          <View>
            <Text className="mb-2 text-sm font-semibold text-white">
              Role Title <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="rounded-lg border border-white/10 bg-gray-800/60 p-3 text-base text-white"
              value={roleTitle}
              onChangeText={setRoleTitle}
              placeholder="Enter role title"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold text-white">
              Description <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="min-h-[100px] rounded-lg border border-white/10 bg-gray-800/60 p-3 text-base text-white"
              style={{ textAlignVertical: 'top' }}
              value={roleDescription}
              onChangeText={setRoleDescription}
              placeholder="Enter role description"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={4}
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold text-white">Number of Talents</Text>
            <TextInput
              className="rounded-lg border border-white/10 bg-gray-800/60 p-3 text-base text-white"
              value={talentCount}
              onChangeText={setTalentCount}
              placeholder="Enter number of talents"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
            />
          </View>
        </View>
      )}
      footer={(close) => (
        <View className="flex-row gap-3 border-t border-white/10 px-4 py-3">
          <TouchableOpacity
            className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3"
            onPress={close}>
            <Text className="text-center text-sm font-semibold text-white">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 rounded-xl px-4 py-3 ${
              hasErrors || isSubmitting ? 'bg-gray-600' : 'bg-blue-600'
            }`}
            onPress={() => handleSubmit(close)}
            disabled={hasErrors || isSubmitting}>
            <Text className="text-center text-sm font-semibold text-white">
              {isSubmitting ? 'Saving...' : method === 'POST' ? 'Create Role' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

