import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ProjectInfoFormPage from '@/components/projects/ProjectInfoFormPage';
import UserInfoFormPage from '@/components/profile/UserInfoFormPage';
import RoleFormPage from '@/components/form-components/role-form/RoleFormPage';
import TalentInfoFormPage from '@/components/talent-profile/TalentInfoFormPage';
import SendOfferFormPage from '@/components/project-detail/roles/SendOfferFormPage';

export default function FormPage() {
  const { formType } = useLocalSearchParams<{ formType: string }>();

  // Render the appropriate form based on formType
  switch (formType) {
    case 'project':
      return <ProjectInfoFormPage />;
    case 'userInfo':
      return <UserInfoFormPage />;
    case 'role':
      return <RoleFormPage />;
    case 'talentInfo':
      return <TalentInfoFormPage />;
    case 'sendOffer':
      return <SendOfferFormPage />;
    default:
      return null;
  }
}

