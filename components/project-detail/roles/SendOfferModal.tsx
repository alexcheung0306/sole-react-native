import React, { useMemo } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik } from 'formik';
import { FormModal } from '@/components/custom/form-modal';
import { PrimaryButton } from '@/components/custom/primary-button';
import { createJobContractWithConditions } from '@/api/apiservice/jobContracts_api';
import { updateApplicantProcessById } from '@/api/apiservice/applicant_api';
import { parseDateTime, formatDisplayDateTime } from '@/lib/datetime';
import { DateTimePickerInput } from '@/components/form-components/DateTimePickerInput';
import { RoleScheduleListInputs } from '@/components/form-components/role-form/RoleScheduleListInputs';
import { useSoleUserContext } from '@/context/SoleUserContext';

type SendOfferModalProps = {
  applicant: any;
  projectData: any;
  roleWithSchedules: any;
  onSuccess?: () => void;
};

const toNumber = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export function SendOfferModal({ applicant, projectData, roleWithSchedules, onSuccess }: SendOfferModalProps) {
  const queryClient = useQueryClient();
  const { soleUserId: currentUserSoleUserId } = useSoleUserContext();
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

  // Initial form values - matching web version structure with conditions[0]
  const paymentBasis = role?.paymentBasis || jobApplicant?.paymentBasis || 'On Project';
  const initialValues = {
    projectId: projectData?.id,
    roleId: role?.id,
    clientId: projectData?.soleUserId || currentUserSoleUserId,
    talentId: jobApplicant?.soleUserId,
    jobApplicantId: jobApplicant?.id,
    projectName: projectData?.projectName || projectData?.title || role?.roleTitle || 'Untitled Project',
    roleTitle: role?.roleTitle || 'Untitled Role',
    contractStatus: 'offered',
    activityScheduleLists: initialActivityScheduleLists,
    remarks: '',
    conditions: [
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
    ],
  };

  // Calculate total job hours from activityScheduleLists
  const calculateTotalJobHours = (activityScheduleLists: any[]) => {
    if (!activityScheduleLists || !Array.isArray(activityScheduleLists)) {
      return 0;
    }

    let totalTime = 0;

    activityScheduleLists.forEach((activity: any) => {
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
  };

  // Calculate estimated payment
  const calculateEstimatedPayment = (values: any) => {
    const condition = values.conditions?.[0];
    if (!condition) return 0;
    
    const paymentBasis = condition.paymentBasis || 'On Project';
    const baseAmount = toNumber(condition.paymentAmount);
    const additionalAmount = toNumber(condition.paymentAdditional);
    const totalJobHours = calculateTotalJobHours(values.activityScheduleLists);

    if (paymentBasis === 'Hourly Rate') {
      // For hourly rate: base amount * total hours + additional
      return baseAmount * totalJobHours + additionalAmount;
    } else {
      // For project rate: base amount + additional
      return baseAmount + additionalAmount;
    }
  };

  const offerMutation = useMutation({
    mutationFn: async (values: any) => {
      // Transform the data to match backend expectations (matching web version)
      const transformedValues = {
        ...values,
        id: undefined,
        conditions: values.conditions.map((condition: any) => {
          // Transform schedules from activityScheduleLists
          const transformedSchedules = values.activityScheduleLists
            ?.filter((activity: any) => activity.type === 'job')
            ?.flatMap((activity: any) =>
              activity.schedules.map((schedule: any) => {
                // Convert dates to ISO strings
                let fromTime = schedule?.fromTime || null;
                let toTime = schedule?.toTime || null;
                
                if (fromTime) {
                  try {
                    const fromDate = parseDateTime(String(fromTime));
                    if (fromDate && !isNaN(fromDate.getTime())) {
                      fromTime = fromDate.toISOString();
                    }
                  } catch (e) {
                    // If parsing fails, try Date directly
                    try {
                      const date = new Date(fromTime);
                      if (!isNaN(date.getTime())) {
                        fromTime = date.toISOString();
                      }
                    } catch {
                      // Keep as-is if all parsing fails
                    }
                  }
                }
                
                if (toTime) {
                  try {
                    const toDate = parseDateTime(String(toTime));
                    if (toDate && !isNaN(toDate.getTime())) {
                      toTime = toDate.toISOString();
                    }
                  } catch (e) {
                    try {
                      const date = new Date(toTime);
                      if (!isNaN(date.getTime())) {
                        toTime = date.toISOString();
                      }
                    } catch {
                      // Keep as-is if all parsing fails
                    }
                  }
                }
                
                return {
                  ...schedule,
                  id: undefined,
                  fromTime: fromTime,
                  toTime: toTime,
                };
              })
            ) || [];

          // Convert paymentDate to ISO format
          let paymentDateISO = condition.paymentDate;
          if (paymentDateISO) {
            try {
              const paymentDateParsed = parseDateTime(String(paymentDateISO));
              if (paymentDateParsed && !isNaN(paymentDateParsed.getTime())) {
                paymentDateISO = paymentDateParsed.toISOString();
              }
            } catch (e) {
              try {
                const date = new Date(paymentDateISO);
                if (!isNaN(date.getTime())) {
                  paymentDateISO = date.toISOString();
                }
              } catch {
                // Keep as-is if parsing fails
              }
            }
          }

          return {
            ...condition,
            id: undefined,
            paymentDate: paymentDateISO,
            schedules: transformedSchedules,
          };
        }),
      };

      // Build the payload matching the web version structure
      const payload = {
        ...transformedValues,
        contractStatus: 'offered',
      };

      // Create the job contract first
      let result;
      try {
        result = await createJobContractWithConditions(payload as any);
        console.log('Job contract created successfully:', result);
      } catch (error: any) {
        console.error('Failed to create job contract:', error);
        console.error('Error details:', {
          message: error?.message,
          stack: error?.stack,
          payload: JSON.stringify(payload, null, 2),
        });
        throw error;
      }

      // Only update applicant status/process after contract is successfully created
      if (result) {
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
          applicationProcess: 'offered',
        };
        await updateApplicantProcessById(updatePayload, jobApplicant?.id);
        console.log('Applicant status updated to offered');
      } else {
        throw new Error('Failed to create job contract');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swipe-role-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['role-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['jobContracts'] });
      queryClient.invalidateQueries({ queryKey: ['jobContracts', projectData?.id] });
      // Invalidate process counts to update breadcrumb counts
      queryClient.invalidateQueries({ queryKey: ['role-process-counts'] });
      queryClient.invalidateQueries({ queryKey: ['role-process-counts', role?.id] });
      
      // Close swipe screen after successful submission
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error('Error creating job contract with conditions:', error);
    },
  });

  // Validation function
  const validateForm = (values: any) => {
    const errors: any = {};
    const condition = values.conditions?.[0];

    if (!condition) {
      errors.conditions = 'At least one condition is required';
      return errors;
    }

    // Required: paymentAmount must be present and > 0
    if (!condition.paymentAmount || toNumber(condition.paymentAmount) <= 0) {
      errors['conditions.0.paymentAmount'] = 'Payment amount is required and must be greater than 0';
    }
    
    // Required: paymentDate must be present
    if (!condition.paymentDate || String(condition.paymentDate).trim() === '') {
      errors['conditions.0.paymentDate'] = 'Payment date is required';
    }
    
    // Required: OT payment if role has OT payment enabled
    if (role?.otPayment && (!condition.paymentAmountOt || toNumber(condition.paymentAmountOt) <= 0)) {
      errors['conditions.0.paymentAmountOt'] = 'OT payment is required when OT payment is enabled';
    }
    
    // Check if schedules are valid (at least one schedule with valid times)
    const hasValidSchedules = values.activityScheduleLists
      .filter((activity: any) => activity.type === 'job')
      .some((activity: any) =>
        (activity.schedules || []).some((schedule: any) =>
          schedule?.fromTime && schedule?.toTime
        )
      );
    
    if (!hasValidSchedules) {
      errors.activityScheduleLists = 'At least one valid schedule is required';
    }

    return errors;
  };

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize={true}
      validate={validateForm}
      onSubmit={(values) => {
        offerMutation.mutate(values);
      }}>
      {({ values, setFieldValue, setValues, submitForm, resetForm, touched, setFieldTouched, errors }) => {
        const totalJobHours = calculateTotalJobHours(values.activityScheduleLists);
        const estimatedPayment = calculateEstimatedPayment(values);
        const hasErrors = Object.keys(errors).length > 0;

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
            hasErrors={hasErrors}
            onSubmit={submitForm}
            onReset={resetForm}
            headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
            contentClassName="flex-1">
            {() => (
              <ScrollView
                className="flex-1 px-4"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Payment Details */}
                <View className="mt-4 gap-4">
                  <View className="mb-4">
                    <View className="mb-2 flex-row items-center gap-2">
                      <Text className="text-white">
                        {values.conditions?.[0]?.paymentBasis === 'Hourly Rate'
                          ? 'Finalize Hourly Rate (HKD)'
                          : 'Finalize Project Rate (HKD)'}
                      </Text>
                      <Text className="text-red-500">*</Text>
                      <View
                        className={`rounded-full px-3 py-1 ${
                          values.conditions?.[0]?.paymentBasis === 'Hourly Rate'
                            ? 'bg-blue-500/20 border border-blue-500/50'
                            : 'bg-green-500/20 border border-green-500/50'
                        }`}>
                        <Text
                          className={`text-xs font-semibold ${
                            values.conditions?.[0]?.paymentBasis === 'Hourly Rate'
                              ? 'text-blue-400'
                              : 'text-green-400'
                          }`}>
                          {values.conditions?.[0]?.paymentBasis || 'On Project'}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center rounded-lg border border-white/20 bg-zinc-800">
                      <Text className="px-4 text-white text-base font-semibold">$</Text>
                      <TextInput
                        value={values.conditions?.[0]?.paymentAmount ? String(values.conditions[0].paymentAmount) : ''}
                        onChangeText={(text) => setFieldValue('conditions.0.paymentAmount', toNumber(text.replace(/[^0-9.]/g, '')))}
                        keyboardType="numeric"
                        placeholder="Enter payment"
                        placeholderTextColor="#6b7280"
                        className="flex-1 py-3 pr-4 text-white"
                      />
                    </View>
                    {(touched as any)['conditions.0.paymentAmount'] && (errors as any)['conditions.0.paymentAmount'] && (
                      <Text className="mt-1 text-sm text-red-400">
                        {typeof (errors as any)['conditions.0.paymentAmount'] === 'string' ? (errors as any)['conditions.0.paymentAmount'] : 'Invalid payment amount'}
                      </Text>
                    )}
                  </View>

                  {/* Finalize OT Payment / Hour */}
                  <View className="mb-4">
                    <Text className="mb-2 text-white">
                      Finalize OT Payment / Hour (HKD)
                    </Text>
                    <View className="flex-row items-center rounded-lg border border-white/20 bg-zinc-800">
                      <Text className="px-4 text-white text-base font-semibold">$</Text>
                      <TextInput
                        value={values.conditions?.[0]?.paymentAmountOt ? String(values.conditions[0].paymentAmountOt) : ''}
                        onChangeText={(text) =>
                          setFieldValue('conditions.0.paymentAmountOt', toNumber(text.replace(/[^0-9.]/g, '')))
                        }
                        keyboardType="numeric"
                        placeholder="Enter OT payment"
                        placeholderTextColor="#6b7280"
                        className="flex-1 py-3 pr-4 text-white"
                      />
                    </View>
                    {(touched as any)['conditions.0.paymentAmountOt'] && (errors as any)['conditions.0.paymentAmountOt'] && (
                      <Text className="mt-1 text-sm text-red-400">
                        {typeof (errors as any)['conditions.0.paymentAmountOt'] === 'string' ? (errors as any)['conditions.0.paymentAmountOt'] : 'Invalid OT payment amount'}
                      </Text>
                    )}
                  </View>

                  {/* Additional Payment */}
                  <View className="mb-4">
                    <Text className="mb-2 text-white">Additional Payment (HKD)</Text>
                    <View className="flex-row items-center rounded-lg border border-white/20 bg-zinc-800">
                      <Text className="px-4 text-white text-base font-semibold">$</Text>
                      <TextInput
                        value={values.conditions?.[0]?.paymentAdditional ? String(values.conditions[0].paymentAdditional) : '0'}
                        onChangeText={(text) =>
                          setFieldValue('conditions.0.paymentAdditional', toNumber(text.replace(/[^0-9.]/g, '')))
                        }
                        keyboardType="numeric"
                        placeholder="Optional"
                        placeholderTextColor="#6b7280"
                        className="flex-1 py-3 pr-4 text-white"
                      />
                    </View>
                  </View>

                  {/* Remarks */}
                  <View className="mb-4">
                    <Text className="mb-2 text-white">Remarks</Text>
                    <TextInput
                      value={values.remarks}
                      onChangeText={(text) => setFieldValue('remarks', text)}
                      placeholder="Optional remarks"
                      placeholderTextColor="#6b7280"
                      className="min-h-[80px] rounded-lg border border-white/20 bg-zinc-800 p-3 text-white"
                      style={{ textAlignVertical: 'top', color: '#ffffff' }}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  {/* Finalized Schedules */}
                  <View className="mb-4">
                    <Text className="mb-2 text-white">Finalized Schedules</Text>
                    <RoleScheduleListInputs
                      values={values}
                      setFieldValue={setFieldValue}
                      setValues={setValues}
                      touched={touched}
                      setFieldTouched={setFieldTouched}
                      onFillLater={() => {}}
                      fillSchedulesLater={false}
                      isFinal={true}
                      isSendOffer={true}
                    />
                    {touched.activityScheduleLists && errors.activityScheduleLists && (
                      <Text className="mt-1 text-sm text-red-400">
                        {typeof errors.activityScheduleLists === 'string' ? errors.activityScheduleLists : 'Invalid schedules'}
                      </Text>
                    )}
                  </View>

                  {/* Total Job Hours */}
                  <View className="mb-4">
                    <Text className="mb-2 text-white">Total Job Hours</Text>
                    <View className="rounded-lg border border-white/20 bg-zinc-800 p-4">
                      <Text className="text-lg font-bold text-white">
                        {totalJobHours.toFixed(1)} {totalJobHours === 1 ? 'hour' : 'hours'}
                      </Text>
                    </View>
                  </View>

                  {/* Estimated Payment */}
                  <View className="mb-4">
                    <Text className="mb-2 text-white">Estimated Payment</Text>
                    <View className="rounded-lg border border-white/20 bg-zinc-800 p-4">
                      <Text className="text-lg font-bold text-white">
                        ${estimatedPayment.toFixed(2)} HKD
                      </Text>
                    </View>
                  </View>

                  {/* Payment Date */}
                  <View className="mb-4">
                    <View className="mb-2 flex-row items-center gap-2">
                      <Text className="text-white">Payment Date</Text>
                      <Text className="text-red-500">*</Text>
                    </View>
                    <DateTimePickerInput
                      value={values.conditions?.[0]?.paymentDate || ''}
                      onChange={(value) => setFieldValue('conditions.0.paymentDate', value)}
                      label=""
                      placeholder="Select payment date"
                      errorMessagePrefix="Payment date"
                      defaultValue={projectData?.applicationDeadline}
                      defaultDateLabel={
                        projectData?.applicationDeadline
                          ? `Use application deadline: ${formatDisplayDateTime(projectData.applicationDeadline)}`
                          : undefined
                      }
                      error={typeof (errors as any)['conditions.0.paymentDate'] === 'string' ? (errors as any)['conditions.0.paymentDate'] : undefined}
                      onErrorChange={(error) => {
                        if (error) {
                          setFieldTouched('conditions.0.paymentDate', true);
                        }
                      }}
                    />
                  </View>
                </View>
              </ScrollView>
            )}
          </FormModal>
        );
      }}
    </Formik>
  );
}
