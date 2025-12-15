import { useLocalSearchParams } from 'expo-router';
import ProjectInfoFormPage from '~/components/form-components/project-form/ProjectInfoFormPage';
import RoleFormPage from '~/components/form-components/role-form/RoleFormPage';
import SendOfferFormPage from '~/components/form-components/send-offer-form/SendOfferFormPage';
import BatchSendConditionFormPage from '~/components/form-components/batch-send-condition-form/BatchSendConditionFormPage';
import JobApplyFormPage from '~/components/form-components/job-apply-form/JobApplyFormPage';
import TalentInfoFormPortalPage from '~/components/form-components/talent-form/TalentInfoFormPage';
import UserInfoFormPortalPage from '~/components/form-components/userInfo-form/UserInfoFormPage';
import ProjectAnnouncementFormPortalPage from '~/components/form-components/project-announcement-form/ProjectAnnouncementFormPortalPage';

export default function FormPage() {
  const { formType } = useLocalSearchParams<{ formType: string }>();

  // Render the appropriate form based on formType
  switch (formType) {
    case 'project':
      return <ProjectInfoFormPage />;
    case 'userInfo':
      return <UserInfoFormPortalPage />;
    case 'role':
      return <RoleFormPage />;
    case 'talentInfo':
      return <TalentInfoFormPortalPage />;
    case 'sendOffer':
      return <SendOfferFormPage />;
    case 'batchSendCondition':
      return <BatchSendConditionFormPage />;
    case 'jobApply':
      return <JobApplyFormPage />;
    case 'projectAnnouncement':
      return <ProjectAnnouncementFormPortalPage />;
    default:
      return null;
  }
}

