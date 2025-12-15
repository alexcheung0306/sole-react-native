import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/custom/primary-button';
import { useSoleUserContext } from '@/context/SoleUserContext';

type SendOfferFormPortalProps = {
  applicant: any;
  projectData: any;
  roleWithSchedules: any;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SendOfferFormPortal({ applicant, projectData, roleWithSchedules, onSuccess, open, onOpenChange }: SendOfferFormPortalProps) {
  const { soleUserId: currentUserSoleUserId } = useSoleUserContext();
  const jobApplicant = applicant?.jobApplicant || applicant || {};
  const role = roleWithSchedules?.role || {};

  // Initialize activityScheduleLists from role's job schedules
  const initialActivityScheduleLists = useMemo(() => {
    const activities = roleWithSchedules?.activities ?? [];
    const jobActivities = activities.filter((activity: any) => activity?.type === 'job');

    if (jobActivities.length === 0) {
      return [
        {
          title: '',
          type: 'job',
          schedules: [],
          remarks: '',
        },
      ];
    }

    return jobActivities.map((activity: any) => ({
      title: activity?.title || '',
      type: activity?.type || 'job',
      schedules: (activity?.schedules || []).map((schedule: any, idx: number) => ({
        id: schedule?.id || Date.now() + idx,
        location: schedule?.location || '',
        fromTime: schedule?.fromTime || '',
        toTime: schedule?.toTime || '',
      })),
      remarks: activity?.remarks || '',
    }));
  }, [roleWithSchedules?.activities]);

  const paymentBasis = role?.paymentBasis || jobApplicant?.paymentBasis || 'On Project';
  const initialConditions = [
    {
      usageRights: projectData?.usage || '',
      paymentBasis: paymentBasis,
      paymentAmount: jobApplicant?.quotePrice || role?.budget || 0,
      paymentAmountOt: role?.otPayment
        ? (role?.budget ? role.budget * 1.5 : jobApplicant?.otQuotePrice || 0)
        : jobApplicant?.otQuotePrice || 0,
      paymentAdditional: 0,
      paymentCurrency: 'HKD',
      termsAndConditions: '',
      readByTalent: false,
      readByClient: false,
      paymentDate: projectData?.applicationDeadline || undefined,
      schedules: [],
    },
  ];

  const handleOpen = () => {
    const params: Record<string, string> = {
      formType: 'sendOffer',
    };

    if (projectData?.id) params.projectId = String(projectData.id);
    if (role?.id) params.roleId = String(role.id);
    if (projectData?.soleUserId) params.clientId = projectData.soleUserId;
    if (currentUserSoleUserId) params.clientId = currentUserSoleUserId;
    if (jobApplicant?.soleUserId) params.talentId = jobApplicant.soleUserId;
    if (jobApplicant?.id) params.jobApplicantId = String(jobApplicant.id);
    if (projectData?.projectName || projectData?.title) params.projectName = projectData.projectName || projectData.title;
    if (role?.roleTitle) params.roleTitle = role.roleTitle;
    if (paymentBasis) params.paymentBasis = paymentBasis;
    if (jobApplicant?.quotePrice) params.quotePrice = String(jobApplicant.quotePrice);
    if (jobApplicant?.otQuotePrice) params.otQuotePrice = String(jobApplicant.otQuotePrice);
    if (role?.otPayment !== undefined) params.otPayment = String(role.otPayment);
    if (role?.budget) params.budget = String(role.budget);
    if (projectData?.usage) params.usage = projectData.usage;
    if (projectData?.applicationDeadline) params.applicationDeadline = projectData.applicationDeadline;

    // Serialize complex data to JSON strings
    params.activityScheduleLists = JSON.stringify(initialActivityScheduleLists);
    params.conditions = JSON.stringify(initialConditions);

    router.push({
      pathname: '/(protected)/form/[formType]' as any,
      params,
    });
  };

  // If controlled (open prop provided), handle it differently
  React.useEffect(() => {
    if (open === true) {
      handleOpen();
      // Close the controlled modal after navigation
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // If uncontrolled, show trigger button
  if (open === undefined) {
    return (
      <PrimaryButton className="w-full bg-blue-500" onPress={handleOpen}>
        Send Offer
      </PrimaryButton>
    );
  }

  return null;
}
