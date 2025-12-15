import React from 'react';
import { Plus, Pencil } from 'lucide-react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/custom/primary-button';

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
  // Handle both old format (fetchedValues directly) and new format (roleWithSchedules with nested role)
  const roleData = fetchedValues?.role ? fetchedValues.role : fetchedValues;
  const activitiesData = fetchedValues?.activities ? fetchedValues.activities : [];

  const handleOpen = () => {
    const params: Record<string, string> = {
      formType: 'role',
      projectId: String(projectId),
      method,
    };

    if (roleId) params.roleId = String(roleId);

    // Add all role fields if editing
    if (roleData) {
      if (roleData.roleTitle) params.roleTitle = roleData.roleTitle;
      if (roleData.roleDescription) params.roleDescription = roleData.roleDescription;
      if (roleData.paymentBasis) params.paymentBasis = roleData.paymentBasis;
      if (roleData.budget) params.budget = String(roleData.budget);
      if (roleData.talentNumbers) params.talentNumbers = String(roleData.talentNumbers);
      if (roleData.displayBudgetTo) params.displayBudgetTo = roleData.displayBudgetTo;
      if (roleData.talentsQuote !== undefined) params.talentsQuote = String(roleData.talentsQuote);
      if (roleData.otPayment !== undefined) params.otPayment = String(roleData.otPayment);
      if (roleData.questions) params.questions = roleData.questions;
      if (roleData.requiredGender) params.requiredGender = roleData.requiredGender;
      if (roleData.ageMin) params.ageMin = String(roleData.ageMin);
      if (roleData.ageMax) params.ageMax = String(roleData.ageMax);
      if (roleData.heightMin) params.heightMin = String(roleData.heightMin);
      if (roleData.heightMax) params.heightMax = String(roleData.heightMax);
      if (roleData.category) params.category = roleData.category;
      if (roleData.requiredEthnicGroup) params.requiredEthnicGroup = roleData.requiredEthnicGroup;
      if (roleData.skills) params.skills = roleData.skills;
    }

    // Serialize activityScheduleLists to JSON string
    if (activitiesData.length > 0) {
      params.activityScheduleLists = JSON.stringify(activitiesData);
    }

    router.push({
      pathname: '/(protected)/form/[formType]' as any,
      params,
    });
  };

  return (
    <PrimaryButton
      variant={method === 'POST' ? 'create' : 'edit'}
      disabled={isDisabled}
      icon={
        method === 'POST' ? (
          <Plus size={20} color="#000000" />
        ) : (
          <Pencil size={20} color="#000000" />
        )
      }
      onPress={handleOpen}
      className="w-full">
      {method === 'POST' ? 'New Role' : `Edit Role ${roleId}`}
    </PrimaryButton>
  );
}
