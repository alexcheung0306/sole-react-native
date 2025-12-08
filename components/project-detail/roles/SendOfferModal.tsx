import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormModal } from '@/components/custom/form-modal';
import { PrimaryButton } from '@/components/custom/primary-button';
import { createJobContractWithConditions } from '@/api/apiservice/jobContracts_api';
import { updateApplicantProcessById } from '@/api/apiservice/applicant_api';
import { parseDateTime, formatDisplayDateTime } from '@/lib/datetime';
import { DateTimePickerInput } from '@/components/form-components/DateTimePickerInput';
import { RoleScheduleListInputs } from '@/components/form-components/role-form/RoleScheduleListInputs';

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
  activityScheduleLists: any[];
};

const toNumber = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export function SendOfferModal({ applicant, projectData, roleWithSchedules }: SendOfferModalProps) {
  const queryClient = useQueryClient();
  const jobApplicant = applicant?.jobApplicant || applicant || {};
  const role = roleWithSchedules?.role || {};

  // Initialize activityScheduleLists from role's job schedules
  const initialActivityScheduleLists = useMemo(() => {
    const activities = roleWithSchedules?.activities ?? [];
    const jobActivities = activities.filter((activity: any) => activity?.type === 'job');

    if (jobActivities.length === 0) {
      // If no job activities exist, create an empty one
      return [
        {
          title: '',
          type: 'job',
          schedules: [],
          remarks: '',
        },
      ];
    }

    // Convert job activities to the format expected by RoleScheduleListInputs
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

  const [formState, setFormState] = useState<OfferFormState>({
    paymentAmount: jobApplicant?.quotePrice ? String(jobApplicant.quotePrice) : '',
    paymentAmountOt: jobApplicant?.otQuotePrice ? String(jobApplicant.otQuotePrice) : '',
    paymentAdditional: '0',
    paymentDate: projectData?.applicationDeadline || '',
    remarks: '',
    activityScheduleLists: initialActivityScheduleLists,
  });

  const [dateError, setDateError] = useState<string>('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Update activityScheduleLists when roleWithSchedules changes
  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      activityScheduleLists: initialActivityScheduleLists,
    }));
  }, [initialActivityScheduleLists]);

  const handleChange = (field: keyof OfferFormState, value: string | any[]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Formik-like helpers for RoleScheduleListInputs
  const setFieldValue = (field: string, value: any) => {
    if (field === 'activityScheduleLists') {
      setFormState((prev) => ({ ...prev, activityScheduleLists: value }));
    }
  };

  const setValues = (newValues: any) => {
    if (newValues.activityScheduleLists) {
      setFormState((prev) => ({ ...prev, activityScheduleLists: newValues.activityScheduleLists }));
    }
  };

  const setFieldTouched = (field: string, isTouched: boolean) => {
    setTouched((prev) => ({ ...prev, [field]: isTouched }));
  };

  // Calculate total job hours from form state (activityScheduleLists)
  const totalJobHours = useMemo(() => {
    if (!formState.activityScheduleLists || !Array.isArray(formState.activityScheduleLists)) {
      return 0;
    }

    let totalTime = 0;

    formState.activityScheduleLists.forEach((activity: any) => {
      if (activity?.type === 'job' && activity?.schedules && Array.isArray(activity.schedules)) {
        activity.schedules.forEach((schedule: any) => {
          if (schedule?.fromTime && schedule?.toTime) {
            try {
              const fromTime = parseDateTime(String(schedule.fromTime));
              const toTime = parseDateTime(String(schedule.toTime));
              if (fromTime && toTime) {
                const durationMs = toTime.getTime() - fromTime.getTime();
                if (durationMs > 0) {
                  totalTime += durationMs;
                }
              }
            } catch (error) {
              // If parsing fails, try using Date directly as fallback
              try {
                const fromTime = new Date(schedule.fromTime).getTime();
                const toTime = new Date(schedule.toTime).getTime();
                if (!isNaN(fromTime) && !isNaN(toTime) && toTime > fromTime) {
                  totalTime += toTime - fromTime;
                }
              } catch {
                // Skip invalid schedule
              }
            }
          }
        });
      }
    });

    return totalTime / (1000 * 60 * 60); // Convert milliseconds to hours
  }, [formState.activityScheduleLists]);

  // Extract job schedules from form state for the mutation
  const jobSchedules = useMemo(() => {
    return formState.activityScheduleLists
      .filter((activity: any) => activity?.type === 'job')
      .flatMap((activity: any) => activity?.schedules ?? []);
  }, [formState.activityScheduleLists]);

  // Calculate estimated payment
  const estimatedPayment = useMemo(() => {
    const paymentBasis = role?.paymentBasis || jobApplicant?.paymentBasis || 'On Project';
    const baseAmount = toNumber(formState.paymentAmount);
    const additionalAmount = toNumber(formState.paymentAdditional);

    if (paymentBasis === 'Hourly Rate') {
      // For hourly rate: base amount * total hours + additional
      return baseAmount * totalJobHours + additionalAmount;
    } else {
      // For project rate: base amount + additional
      return baseAmount + additionalAmount;
    }
  }, [formState.paymentAmount, formState.paymentAdditional, totalJobHours, role?.paymentBasis, jobApplicant?.paymentBasis]);

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
      submitButtonText="Send"
      isSubmitting={offerMutation.isPending}
      hasErrors={isSubmitDisabled}
      onSubmit={() => offerMutation.mutate()}
      contentClassName="max-h-[80vh]">
      {() => (
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Payment Details */}
          <View className="mt-4 gap-3">
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-white">
                  {role?.paymentBasis === 'Hourly Rate'
                    ? 'Finalize Hourly Rate (HKD)'
                    : 'Finalize Project Rate (HKD)'}
                </Text>
                <View
                  className={`rounded-full px-3 py-1 ${
                    (role?.paymentBasis || jobApplicant?.paymentBasis) === 'Hourly Rate'
                      ? 'bg-blue-500/20 border border-blue-500/50'
                      : 'bg-green-500/20 border border-green-500/50'
                  }`}>
                  <Text
                    className={`text-xs font-semibold ${
                      (role?.paymentBasis || jobApplicant?.paymentBasis) === 'Hourly Rate'
                        ? 'text-blue-400'
                        : 'text-green-400'
                    }`}>
                    {role?.paymentBasis || jobApplicant?.paymentBasis || 'On Project'}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center rounded-xl border border-white/10 bg-zinc-900/70">
                <Text className="px-4 text-white text-base font-semibold">$</Text>
                <TextInput
                  value={formState.paymentAmount}
                  onChangeText={(text) => handleChange('paymentAmount', text.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                  placeholder="Enter payment"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  className="flex-1 py-3 pr-4 text-white"
                />
              </View>
            </View>

            {/* Finalize OT Payment / Hour */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-white">
                Finalize OT Payment / Hour (HKD)
              </Text>
              <View className="flex-row items-center rounded-xl border border-white/10 bg-zinc-900/70">
                <Text className="px-4 text-white text-base font-semibold">$</Text>
                <TextInput
                  value={formState.paymentAmountOt}
                  onChangeText={(text) =>
                    handleChange('paymentAmountOt', text.replace(/[^0-9.]/g, ''))
                  }
                  keyboardType="numeric"
                  placeholder="Enter OT payment"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  className="flex-1 py-3 pr-4 text-white"
                />
              </View>
            </View>

            {/* Additional Payment */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-white">Additional Payment (HKD)</Text>
              <View className="flex-row items-center rounded-xl border border-white/10 bg-zinc-900/70">
                <Text className="px-4 text-white text-base font-semibold">$</Text>
                <TextInput
                  value={formState.paymentAdditional}
                  onChangeText={(text) =>
                    handleChange('paymentAdditional', text.replace(/[^0-9.]/g, ''))
                  }
                  keyboardType="numeric"
                  placeholder="Optional"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  className="flex-1 py-3 pr-4 text-white"
                />
              </View>
            </View>


            {/* Remarks */}
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

            {/* Finalized Schedules */}
            <View className="mt-4 gap-2">
              <Text className="text-sm font-semibold text-white">Finalized Schedules</Text>
              <RoleScheduleListInputs
                values={formState}
                setFieldValue={setFieldValue}
                setValues={setValues}
                touched={touched}
                setFieldTouched={setFieldTouched}
                onFillLater={() => {}}
                fillSchedulesLater={false}
                isFinal={true}
                isSendOffer={true}
              />
            </View>

            {/* Total Job Hours */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-white">Total Job Hours</Text>
              <View className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
                <Text className="text-lg font-bold text-white">
                  {totalJobHours.toFixed(1)} {totalJobHours === 1 ? 'hour' : 'hours'}
                </Text>
              </View>
            </View>

            {/* Estimated Payment */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-white">Estimated Payment</Text>
              <View className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
                <Text className="text-lg font-bold text-white">
                  ${estimatedPayment.toFixed(2)} HKD
                </Text>
              </View>
            </View>

            
            {/* Payment Date */}
            <DateTimePickerInput
              value={formState.paymentDate}
              onChange={(value) => handleChange('paymentDate', value)}
              label="Payment Date"
              placeholder="Select payment date"
              errorMessagePrefix="Payment date"
              defaultValue={projectData?.applicationDeadline}
              defaultDateLabel={
                projectData?.applicationDeadline
                  ? `Use application deadline: ${formatDisplayDateTime(projectData.applicationDeadline)}`
                  : undefined
              }
              error={dateError}
              onErrorChange={setDateError}
            />
          </View>
        </ScrollView>
      )}
    </FormModal>
  );
}
