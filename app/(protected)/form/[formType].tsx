import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ProjectInfoFormPage from '~/components/form-components/project-form/ProjectInfoFormPage';
import UserInfoFormPage from '~/components/form-components/userInfo-form/UserInfoFormPage';
import RoleFormPage from '@/components/form-components/role-form/RoleFormPage';
import TalentInfoFormPage from '~/components/form-components/talent-form/TalentInfoFormPage';
import SendOfferFormPage from '~/components/form-components/send-offer-form/SendOfferFormPage';
import BatchSendConditionFormPage from '~/components/form-components/batch-send-condition-form/BatchSendConditionFormPage';
import JobApplyFormPage from '~/components/form-components/job-apply-form/JobApplyFormPage';

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
    case 'batchSendCondition':
      return <BatchSendConditionFormPage />;
    case 'jobApply':
      return <JobApplyFormPage />;
    default:
      return null;
  }
}

