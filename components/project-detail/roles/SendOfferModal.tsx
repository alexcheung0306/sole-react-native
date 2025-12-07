import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormModal } from '@/components/custom/form-modal';
import { PrimaryButton } from '@/components/custom/primary-button';
import { createJobContractWithConditions } from '@/api/apiservice/jobContracts_api';
import { updateApplicantProcessById } from '@/api/apiservice/applicant_api';
import { parseDateTime } from '@/lib/datetime';

type SendOfferModalProps = {
  applicant: any;
  projectData: any;
  roleWithSchedules: any;
};

type OfferFormState = {
  paymentAmount: string;
  paymentAmountOt: string;
  paymentAdditional: string;
  paymentDate: string;
  remarks: string;
};

const toNumber = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export function SendOfferModal({ applicant, projectData, roleWithSchedules }: SendOfferModalProps) {
  const queryClient = useQueryClient();
  const jobApplicant = applicant?.jobApplicant || applicant || {};
  const role = roleWithSchedules?.role || {};

  const [formState, setFormState] = useState<OfferFormState>({
    paymentAmount: jobApplicant?.quotePrice ? String(jobApplicant.quotePrice) : '',
    paymentAmountOt: jobApplicant?.otQuotePrice ? String(jobApplicant.otQuotePrice) : '',
    paymentAdditional: '0',
    paymentDate: '',
    remarks: '',
  });

  const handleChange = (field: keyof OfferFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const totalJobHours = useMemo(() => {
    const activities = roleWithSchedules?.activities ?? [];
    return activities
      .filter((activity: any) => activity?.type === 'job')
      .flatMap((activity: any) => activity?.schedules ?? [])
      .reduce((total: number, schedule: any) => {
        const fromTime = schedule?.fromTime ? parseDateTime(String(schedule.fromTime)) : null;
        const toTime = schedule?.toTime ? parseDateTime(String(schedule.toTime)) : null;
        if (!fromTime || !toTime) return total;
        const duration = (toTime.getTime() - fromTime.getTime()) / (1000 * 60 * 60);
        return duration > 0 ? total + duration : total;
      }, 0);
  }, [roleWithSchedules?.activities]);

  const jobSchedules = useMemo(() => {
    const activities = roleWithSchedules?.activities ?? [];
    return activities
      .filter((activity: any) => activity?.type === 'job')
      .flatMap((activity: any) => activity?.schedules ?? []);
  }, [roleWithSchedules?.activities]);

  const offerMutation = useMutation({
    mutationFn: async () => {
      const paymentBasis = role?.paymentBasis || jobApplicant?.paymentBasis || 'On Project';
      const payload = {
        projectId: projectData?.id,
        roleId: role?.id,
        clientId: projectData?.soleUserId,
        talentId: jobApplicant?.soleUserId,
        jobApplicantId: jobApplicant?.id,
        projectName: projectData?.projectName || projectData?.title,
        roleTitle: role?.roleTitle,
        remarks: formState.remarks || jobApplicant?.remarks || '',
        contractStatus: 'offered',
        conditions: [
          {
            paymentBasis,
            paymentAmount: toNumber(formState.paymentAmount),
            paymentAmountOt: toNumber(formState.paymentAmountOt),
            paymentAdditional: toNumber(formState.paymentAdditional),
            paymentCurrency: 'HKD',
            paymentDate: formState.paymentDate,
            schedules: jobSchedules.map((s: any) => ({
              location: s?.location,
              fromTime: s?.fromTime,
              toTime: s?.toTime,
            })),
          },
        ],
      };

      await createJobContractWithConditions(payload as any);

      // Update applicant status/process to offered
      const updatePayload = {
        id: jobApplicant?.id,
        soleUserId: jobApplicant?.soleUserId ?? null,
        roleId: jobApplicant?.roleId ?? role?.id ?? null,
        projectId: jobApplicant?.projectId ?? projectData?.id ?? null,
        paymentBasis: jobApplicant?.paymentBasis ?? paymentBasis,
        quotePrice: jobApplicant?.quotePrice ?? null,
        otQuotePrice: jobApplicant?.otQuotePrice ?? null,
        skills: jobApplicant?.skills ?? null,
        answer: jobApplicant?.answer ?? null,
        applicationStatus: 'offered',
        applicationProcess: 'offer',
      };
      await updateApplicantProcessById(updatePayload, jobApplicant?.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swipe-role-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['role-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['jobContracts'] });
      queryClient.invalidateQueries({ queryKey: ['jobContracts', projectData?.id] });
    },
  });

  const isSubmitDisabled =
    !formState.paymentAmount ||
    toNumber(formState.paymentAmount) <= 0 ||
    (role?.otPayment && toNumber(formState.paymentAmountOt) <= 0);

  return (
    <FormModal
      trigger={({ open }) => (
        <PrimaryButton className="w-full bg-blue-500" onPress={open}>
          Send Offer
        </PrimaryButton>
      )}
      title="Send Offer"
      submitButtonText="Send Offer"
      isSubmitting={offerMutation.isPending}
      hasErrors={isSubmitDisabled}
      onSubmit={() => offerMutation.mutate()}
      contentClassName="max-h-[80vh]">
      {() => (
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
            <Text className="text-sm font-semibold text-white">Total Job Hours</Text>
            <Text className="text-lg font-bold text-white">
              {totalJobHours.toFixed(1)} {totalJobHours === 1 ? 'hour' : 'hours'}
            </Text>
          </View>

          <View className="mt-4 gap-3">
            <View className="gap-2">
              <Text className="text-sm font-semibold text-white">
                {role?.paymentBasis === 'Hourly Rate' ? 'Finalize Hourly Rate (HKD)' : 'Finalize Project Rate (HKD)'}
              </Text>
              <TextInput
                value={formState.paymentAmount}
                onChangeText={(text) => handleChange('paymentAmount', text.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                placeholder="Enter payment"
                placeholderTextColor="rgba(255,255,255,0.6)"
                className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-white">Finalize OT Payment / Hour (HKD)</Text>
              <TextInput
                value={formState.paymentAmountOt}
                onChangeText={(text) => handleChange('paymentAmountOt', text.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                placeholder="Enter OT payment"
                placeholderTextColor="rgba(255,255,255,0.6)"
                className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-white">Additional Payment (HKD)</Text>
              <TextInput
                value={formState.paymentAdditional}
                onChangeText={(text) => handleChange('paymentAdditional', text.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                placeholder="Optional"
                placeholderTextColor="rgba(255,255,255,0.6)"
                className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-white">Payment Date (ISO or yyyy-MM-dd)</Text>
              <TextInput
                value={formState.paymentDate}
                onChangeText={(text) => handleChange('paymentDate', text)}
                placeholder="2025-08-27T10:00:00.000+08:00"
                placeholderTextColor="rgba(255,255,255,0.6)"
                className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-white">Remarks</Text>
              <TextInput
                value={formState.remarks}
                onChangeText={(text) => handleChange('remarks', text)}
                placeholder="Optional remarks"
                placeholderTextColor="rgba(255,255,255,0.6)"
                className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white"
                multiline
              />
            </View>

            <View className="gap-2 rounded-2xl border border-white/10 bg-zinc-900/60 p-3">
              <Text className="text-sm font-semibold text-white">Finalized Schedules</Text>
              {jobSchedules.length === 0 ? (
                <Text className="text-xs text-white/70">No job schedules found for this role.</Text>
              ) : (
                jobSchedules.map((s: any, idx: number) => (
                  <View key={`schedule-${idx}`} className="rounded-xl border border-white/10 bg-zinc-800/60 px-3 py-2">
                    {s?.location ? (
                      <Text className="text-sm text-white">{s.location}</Text>
                    ) : null}
                    <Text className="text-xs text-white/80">
                      {s?.fromTime} - {s?.toTime}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </FormModal>
  );
}
