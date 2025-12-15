import React, { useMemo } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik } from 'formik';
import { router, useLocalSearchParams } from 'expo-router';
import { FormPage } from '@/components/custom/form-page';
import { createJobContractWithConditions } from '@/api/apiservice/jobContracts_api';
import { updateApplicantProcessById } from '@/api/apiservice/applicant_api';
import { parseDateTime, formatDisplayDateTime } from '@/lib/datetime';
import { DateTimePickerInput } from '@/components/form-components/DateTimePickerInput';
import { RoleScheduleListInputs } from '@/components/form-components/role-form/RoleScheduleListInputs';
import { useSoleUserContext } from '@/context/SoleUserContext';

const toNumber = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export default function SendOfferFormPage() {
  const queryClient = useQueryClient();
  const { soleUserId: currentUserSoleUserId } = useSoleUserContext();
  const params = useLocalSearchParams<{
    formType: string;
    projectId?: string;
    roleId?: string;
    clientId?: string;
    talentId?: string;
    jobApplicantId?: string;
    projectName?: string;
    roleTitle?: string;
    paymentBasis?: string;
    quotePrice?: string;
    otQuotePrice?: string;
    otPayment?: string;
    budget?: string;
    usage?: string;
    applicationDeadline?: string;
    activityScheduleLists?: string;
    conditions?: string;
  }>();

  // Parse complex data from JSON strings
  let parsedActivityScheduleLists: any[] = [];
  if (params.activityScheduleLists) {
    try {
      parsedActivityScheduleLists = JSON.parse(params.activityScheduleLists);
    } catch (e) {
      console.error('Failed to parse activityScheduleLists:', e);
    }
  }

  let parsedConditions: any[] = [];
  if (params.conditions) {
    try {
      parsedConditions = JSON.parse(params.conditions);
    } catch (e) {
      console.error('Failed to parse conditions:', e);
    }
  }

  // Initialize activityScheduleLists
  const initialActivityScheduleLists = useMemo(() => {
    if (parsedActivityScheduleLists.length > 0) {
      return parsedActivityScheduleLists;
    }
    return [
      {
        title: '',
        type: 'job',
        schedules: [],
        remarks: '',
      },
    ];
  }, [parsedActivityScheduleLists]);

  // Initialize conditions
  const paymentBasis = params.paymentBasis || 'On Project';
  const initialConditions = parsedConditions.length > 0
    ? parsedConditions
    : [
        {
          usageRights: params.usage || '',
          paymentBasis: paymentBasis,
          paymentAmount: params.quotePrice ? Number(params.quotePrice) : (params.budget ? Number(params.budget) : 0),
          paymentAmountOt: params.otPayment === 'true'
            ? (params.budget ? Number(params.budget) * 1.5 : (params.otQuotePrice ? Number(params.otQuotePrice) : 0))
            : (params.otQuotePrice ? Number(params.otQuotePrice) : 0),
          paymentAdditional: 0,
          paymentCurrency: 'HKD',
          termsAndConditions: '',
          readByTalent: false,
          readByClient: false,
          paymentDate: params.applicationDeadline || undefined,
          schedules: [],
        },
      ];

  const initialValues = {
    projectId: params.projectId ? Number(params.projectId) : undefined,
    roleId: params.roleId ? Number(params.roleId) : undefined,
    clientId: params.clientId || currentUserSoleUserId,
    talentId: params.talentId,
    jobApplicantId: params.jobApplicantId ? Number(params.jobApplicantId) : undefined,
    projectName: params.projectName || 'Untitled Project',
    roleTitle: params.roleTitle || 'Untitled Role',
    contractStatus: 'Pending',
    activityScheduleLists: initialActivityScheduleLists,
    remarks: '',
    conditions: initialConditions,
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
      return baseAmount * totalJobHours + additionalAmount;
    } else {
      return baseAmount + additionalAmount;
    }
  };

  const offerMutation = useMutation({
    mutationFn: async (values: any) => {
      const transformedValues = {
        ...values,
        id: undefined,
        conditions: values.conditions.map((condition: any) => {
          const transformedSchedules = values.activityScheduleLists
            ?.filter((activity: any) => activity.type === 'job')
            ?.flatMap((activity: any) =>
              activity.schedules.map((schedule: any) => {
                let fromTime = schedule?.fromTime || null;
                let toTime = schedule?.toTime || null;
                
                if (fromTime) {
                  try {
                    const fromDate = parseDateTime(String(fromTime));
                    if (fromDate && !isNaN(fromDate.getTime())) {
                      fromTime = fromDate.toISOString();
                    }
                  } catch (e) {
                    try {
                      const date = new Date(fromTime);
                      if (!isNaN(date.getTime())) {
                        fromTime = date.toISOString();
                      }
                    } catch {
                      // Keep as-is
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
                      // Keep as-is
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
                // Keep as-is
              }
            }
          }

          return {
            ...condition,
            id: undefined,
            paymentDate: paymentDateISO,
            schedules: transformedSchedules,
            conditionStatus: 'Pending',
          };
        }),
      };

      const payload = {
        ...transformedValues,
        contractStatus: 'Pending',
      };

      let result;
      try {
        result = await createJobContractWithConditions(payload as any);
        console.log('Job contract created successfully:', result);
      } catch (error: any) {
        console.error('Failed to create job contract:', error);
        throw error;
      }

      if (result && params.jobApplicantId) {
        const updatePayload = {
          id: Number(params.jobApplicantId),
          soleUserId: params.talentId ?? null,
          roleId: params.roleId ? Number(params.roleId) : null,
          projectId: params.projectId ? Number(params.projectId) : null,
          paymentBasis: paymentBasis,
          quotePrice: params.quotePrice ? Number(params.quotePrice) : null,
          otQuotePrice: params.otQuotePrice ? Number(params.otQuotePrice) : null,
          skills: null,
          answer: null,
          applicationStatus: 'offered',
          applicationProcess: 'offered',
        };
        await updateApplicantProcessById(updatePayload, Number(params.jobApplicantId));
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
      if (params.projectId) {
        queryClient.invalidateQueries({ queryKey: ['jobContracts', params.projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['role-process-counts'] });
      if (params.roleId) {
        queryClient.invalidateQueries({ queryKey: ['role-process-counts', params.roleId] });
      }
      
      router.back();
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

    if (!condition.paymentAmount || toNumber(condition.paymentAmount) <= 0) {
      errors['conditions.0.paymentAmount'] = 'Payment amount is required and must be greater than 0';
    }
    
    if (!condition.paymentDate || String(condition.paymentDate).trim() === '') {
      errors['conditions.0.paymentDate'] = 'Payment date is required';
    }
    
    if (params.otPayment === 'true' && (!condition.paymentAmountOt || toNumber(condition.paymentAmountOt) <= 0)) {
      errors['conditions.0.paymentAmountOt'] = 'OT payment is required when OT payment is enabled';
    }
    
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
          <FormPage
            title="Send Offer"
            submitButtonText="Send"
            isSubmitting={offerMutation.isPending}
            hasErrors={hasErrors}
            onSubmit={submitForm}
            headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
            contentClassName="flex-1">
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
                    defaultValue={params.applicationDeadline}
                    defaultDateLabel={
                      params.applicationDeadline
                        ? `Use application deadline: ${formatDisplayDateTime(params.applicationDeadline)}`
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
          </FormPage>
        );
      }}
    </Formik>
  );
}

