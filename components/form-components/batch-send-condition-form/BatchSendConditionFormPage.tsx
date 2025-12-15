import React, { useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Formik } from 'formik';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { FormPage } from '@/components/custom/form-page';
import { DateTimePickerInput } from '~/components/form-components/DateTimePickerInput';
import { RoleScheduleListInputs } from '~/components/form-components/role-form/RoleScheduleListInputs';
import { SingleWheelPickerInput } from '~/components/form-components/SingleWheelPickerInput';
import { parseDateTime } from '@/lib/datetime';
import { searchJobContracts, createBatchContractConditions } from '@/api/apiservice/jobContracts_api';

// Helper function to get primary condition (latest condition)
const getPrimaryCondition = (conditions: any[]) => {
  if (!conditions || conditions.length === 0) return null;
  if (conditions.length === 1) return conditions[0];
  const sortedConditions = [...conditions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return sortedConditions[0];
};

const formatCurrency = (amount: number, currency: string) => {
  const validCurrency = currency && currency.length === 3 ? currency : 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency,
    }).format(amount || 0);
  } catch (error) {
    return `$${(amount || 0).toFixed(2)}`;
  }
};

const getInitialActivityScheduleLists = () => {
  return [
    {
      title: 'Job Activity',
      type: 'job',
      schedules: [
        {
          id: Date.now() + Math.random(),
          location: '',
          fromTime: null,
          toTime: null,
        },
      ],
      remarks: '',
    },
  ];
};

const initialBatchConditionsValues = {
  paymentBasis: '',
  paymentAmount: 0,
  paymentAmountOt: 0,
  paymentAdditional: 0,
  paymentCurrency: 'HKD',
  termsAndConditions: '',
  paymentDate: undefined,
  usageRights: '',
  remarks: '',
  activityScheduleLists: getInitialActivityScheduleLists(),
};

const calculateTotalTimeFromForm = (activityScheduleLists: any[]) => {
  if (!activityScheduleLists || !Array.isArray(activityScheduleLists)) {
    return 0;
  }
  let totalTime = 0;
  activityScheduleLists.forEach((activity) => {
    if (activity.schedules && Array.isArray(activity.schedules)) {
      activity.schedules.forEach((schedule: any) => {
        if (schedule.fromTime && schedule.toTime) {
          const fromTime: any = new Date(schedule.fromTime);
          const toTime: any = new Date(schedule.toTime);
          totalTime += toTime - fromTime;
        }
      });
    }
  });
  return totalTime / (1000 * 60 * 60); // Convert milliseconds to hours
};

export default function BatchSendConditionFormPage() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    projectId?: string;
    selectedContractIds?: string;
  }>();

  const projectId = params.projectId ? parseInt(params.projectId) : undefined;
  const selectedContractIds = params.selectedContractIds
    ? params.selectedContractIds.split(',').filter((id) => id.trim() !== '')
    : [];

  // Fetch contracts for the project
  const searchQueryString = useMemo(() => {
    if (!projectId) return '';
    const urlParams = new URLSearchParams();
    urlParams.append('projectId', String(projectId));
    urlParams.append('pageNo', '0');
    urlParams.append('pageSize', '1000'); // Get all contracts
    urlParams.append('orderBy', 'createdAt');
    urlParams.append('orderSeq', 'desc');
    return urlParams.toString();
  }, [projectId]);

  const { data: contractsResponse } = useQuery({
    queryKey: ['project-contracts-search', projectId, searchQueryString],
    queryFn: () => searchJobContracts(searchQueryString),
    enabled: Boolean(projectId && searchQueryString),
  });

  const contracts = useMemo(() => {
    if (contractsResponse) {
      return contractsResponse?.content ?? contractsResponse?.data ?? [];
    }
    return [];
  }, [contractsResponse]);

  const selectedContractsData = useMemo(() => {
    return contracts.filter((contractWithProfile: any) => {
      const contract = contractWithProfile?.jobContract ?? contractWithProfile;
      return selectedContractIds.includes(contract?.id?.toString());
    });
  }, [contracts, selectedContractIds]);

  const batchCreateConditionsMutation = useMutation({
    mutationFn: async (batchRequest: {
      contractIds: number[];
      conditionData: any;
      remarks?: string;
    }) => createBatchContractConditions(batchRequest),
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-contracts-search', projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['manageContracts'] });
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
      Alert.alert('Success', 'Contract conditions created successfully');
      router.back();
    },
    onError: (error) => {
      console.error('Error batch creating contract conditions:', error);
      Alert.alert('Error', 'Failed to create contract conditions');
    },
  });

  const handleBatchConditionsSubmit = async (values: any) => {
    try {
      if (selectedContractIds.length === 0) {
        Alert.alert('Error', 'No contracts selected');
        return;
      }

      const schedules =
        values.activityScheduleLists
          ?.filter((activity: any) => activity.type === 'job')
          ?.flatMap((activity: any) =>
            activity.schedules
              .filter((schedule: any) => schedule.fromTime && schedule.toTime)
              .map((schedule: any) => {
                let fromTime = null;
                let toTime = null;

                // Parse and convert fromTime to ISO format
                if (schedule.fromTime) {
                  try {
                    const fromDate = parseDateTime(String(schedule.fromTime));
                    if (fromDate && !isNaN(fromDate.getTime())) {
                      fromTime = fromDate.toISOString();
                    } else {
                      const date = new Date(schedule.fromTime);
                      if (!isNaN(date.getTime())) {
                        fromTime = date.toISOString();
                      }
                    }
                  } catch (e) {
                    // Skip invalid date
                  }
                }

                // Parse and convert toTime to ISO format
                if (schedule.toTime) {
                  try {
                    const toDate = parseDateTime(String(schedule.toTime));
                    if (toDate && !isNaN(toDate.getTime())) {
                      toTime = toDate.toISOString();
                    } else {
                      const date = new Date(schedule.toTime);
                      if (!isNaN(date.getTime())) {
                        toTime = date.toISOString();
                      }
                    }
                  } catch (e) {
                    // Skip invalid date
                  }
                }

                // Only include schedule if both times are valid
                if (fromTime && toTime) {
                  return {
                    location: schedule.location || '',
                    fromTime: fromTime,
                    toTime: toTime,
                  };
                }
                return null;
              })
              .filter((schedule: any) => schedule !== null)
          ) || [];

      // Convert paymentDate to ISO format
      let paymentDateISO = null;
      if (values.paymentDate) {
        try {
          const paymentDateParsed = parseDateTime(String(values.paymentDate));
          if (paymentDateParsed && !isNaN(paymentDateParsed.getTime())) {
            paymentDateISO = paymentDateParsed.toISOString();
          } else {
            const date = new Date(values.paymentDate);
            if (!isNaN(date.getTime())) {
              paymentDateISO = date.toISOString();
            }
          }
        } catch (e) {
          // Keep as null if parsing fails
        }
      }

      const conditionData = {
        usageRights: values.usageRights,
        paymentBasis: values.paymentBasis,
        paymentAmount: values.paymentAmount,
        paymentAmountOt: values.paymentAmountOt || 0,
        paymentAdditional: values.paymentAdditional || 0,
        paymentCurrency: values.paymentCurrency,
        paymentDate: paymentDateISO,
        termsAndConditions: values.termsAndConditions,
        schedules: schedules,
      };

      const batchRequest = {
        contractIds: selectedContractIds.map((id) => parseInt(id)),
        conditionData: conditionData,
        remarks: values.remarks,
      };

      batchCreateConditionsMutation.mutate(batchRequest);
    } catch (error) {
      console.error('Error batch creating contracts:', error);
      Alert.alert('Error', 'Failed to create contract conditions');
    }
  };

  const paymentBasisOptions = [
    { value: 'Hourly Rate', label: 'Hourly Rate' },
    { value: 'On Project', label: 'Project Rate' },
  ];

  const currencyOptions = [{ value: 'HKD', label: 'HKD' }];

  return (
    <Formik
      initialValues={initialBatchConditionsValues}
      onSubmit={handleBatchConditionsSubmit}
      enableReinitialize>
      {({ values, setFieldValue, submitForm, touched, setFieldTouched, errors }) => {
        const totalWorkingHours = calculateTotalTimeFromForm(values.activityScheduleLists);

        return (
          <FormPage
            title="Batch Create Contract Conditions"
            submitButtonText={`Create Conditions for ${selectedContractIds.length} Contract${selectedContractIds.length !== 1 ? 's' : ''}`}
            isSubmitting={batchCreateConditionsMutation.isPending}
            hasErrors={selectedContractIds.length === 0}
            onSubmit={submitForm}
            headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
            contentClassName="flex-1 px-4">
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <View className="p-4 gap-5">
                {/* Selected Contracts Display */}
                <View className="mb-2">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-base font-semibold text-gray-50">Selected Contracts</Text>
                    <View className="bg-blue-500 rounded-xl px-2.5 py-1">
                      <Text className="text-white text-xs font-semibold">{selectedContractIds.length} selected</Text>
                    </View>
                  </View>

                  {selectedContractIds.length === 0 ? (
                    <View className="p-6 items-center bg-zinc-800/50 rounded-xl">
                      <Text className="text-gray-200 text-sm font-semibold mb-1">No contracts selected</Text>
                      <Text className="text-slate-400/70 text-xs text-center">
                        Enable "Batch Update Conditions" mode and select contracts from the table
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      className="max-h-[200px]"
                      showsVerticalScrollIndicator={false}>
                      {selectedContractsData.map((contractWithProfile: any) => {
                        const contract = contractWithProfile?.jobContract ?? contractWithProfile;
                        const latestCondition = getPrimaryCondition(contract?.conditions || []);
                        const talentName =
                          contractWithProfile?.userInfo?.name ||
                          contractWithProfile?.talentInfo?.talentName ||
                          contractWithProfile?.username ||
                          'Unknown User';

                        return (
                          <View key={contract?.id} className="flex-row justify-between items-start p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-2">
                            <View className="flex-1">
                              <Text className="text-gray-50 text-sm font-semibold mb-1">{talentName}</Text>
                              <Text className="text-slate-400/80 text-xs mb-2">
                                {contract?.roleTitle || 'N/A'} • #{contract?.roleId}
                              </Text>
                              <View className="flex-row items-center gap-2 flex-wrap">
                                <View className="bg-green-500 rounded-md px-2 py-0.5">
                                  <Text className="text-white text-[11px] font-semibold">
                                    {contract?.contractStatus}
                                  </Text>
                                </View>
                                {latestCondition && (
                                  <Text className="text-slate-400/70 text-[11px]">
                                    Current:{' '}
                                    {formatCurrency(
                                      latestCondition.paymentAmount,
                                      latestCondition.paymentCurrency
                                    )}{' '}
                                    ({latestCondition.paymentBasis})
                                  </Text>
                                )}
                              </View>
                            </View>
                            <Text className="text-slate-400/50 text-[11px]">ID: #{contract?.id}</Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>

                {/* Form Fields */}
                <View className="gap-4">
                  <Text className="text-base font-semibold text-gray-50 mb-3">New Contract Conditions</Text>

                  {/* Payment Details */}
                  <View className="bg-zinc-800/50 rounded-xl p-4 gap-4">
                    <Text className="text-sm font-semibold text-gray-50 mb-1">Payment Details</Text>

                    <View className="flex-row gap-3">
                      <View className="flex-1 mb-2">
                        <SingleWheelPickerInput
                          title="Payment Basis"
                          value={values.paymentBasis}
                          onChange={(value) => setFieldValue('paymentBasis', value)}
                          options={paymentBasisOptions}
                          placeholder="Select payment basis"
                        />
                      </View>

                      <View className="flex-1 mb-2">
                        <SingleWheelPickerInput
                          title="Currency"
                          value={values.paymentCurrency}
                          onChange={(value) => setFieldValue('paymentCurrency', value)}
                          options={currencyOptions}
                          placeholder="Select currency"
                        />
                      </View>
                    </View>

                    <View className="flex-1 mb-2">
                      <Text className="text-gray-200 text-[13px] font-medium mb-2">
                        {values.paymentBasis === 'Hourly Rate'
                          ? 'Hourly Rate (HKD)'
                          : 'Project Rate (HKD)'}
                        <Text className="text-red-500"> *</Text>
                      </Text>
                      <TextInput
                        value={values.paymentAmount ? String(values.paymentAmount) : ''}
                        onChangeText={(text) =>
                          setFieldValue('paymentAmount', Number(text.replace(/[^0-9.]/g, '')))
                        }
                        keyboardType="numeric"
                        placeholder="Enter payment"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        className="rounded-xl border border-slate-400/40 px-3.5 py-3 text-gray-50 bg-slate-900/65 text-sm"
                      />
                    </View>

                    <View className="flex-1 mb-2">
                      <Text className="text-gray-200 text-[13px] font-medium mb-2">Overtime Payment/Hour (HKD)</Text>
                      <TextInput
                        value={values.paymentAmountOt ? String(values.paymentAmountOt) : ''}
                        onChangeText={(text) =>
                          setFieldValue('paymentAmountOt', Number(text.replace(/[^0-9.]/g, '')))
                        }
                        keyboardType="numeric"
                        placeholder="Optional"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        className="rounded-xl border border-slate-400/40 px-3.5 py-3 text-gray-50 bg-slate-900/65 text-sm"
                      />
                    </View>

                    <View className="flex-1 mb-2">
                      <Text className="text-gray-200 text-[13px] font-medium mb-2">Additional Payment (HKD)</Text>
                      <TextInput
                        value={values.paymentAdditional ? String(values.paymentAdditional) : ''}
                        onChangeText={(text) =>
                          setFieldValue('paymentAdditional', Number(text.replace(/[^0-9.]/g, '')))
                        }
                        keyboardType="numeric"
                        placeholder="Optional"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        className="rounded-xl border border-slate-400/40 px-3.5 py-3 text-gray-50 bg-slate-900/65 text-sm"
                      />
                    </View>

                    <View className="flex-1 mb-2">
                      <DateTimePickerInput
                        value={values.paymentDate || ''}
                        onChange={(value) => setFieldValue('paymentDate', value)}
                        label="Payment Date"
                        placeholder="Select payment date"
                        errorMessagePrefix="Payment date"
                      />
                    </View>
                  </View>

                  {/* Schedule & Activities */}
                  <View className="bg-zinc-800/50 rounded-xl p-4 gap-4">
                    <Text className="text-sm font-semibold text-gray-50 mb-1">Schedule & Activities</Text>
                    <RoleScheduleListInputs
                      values={values}
                      setFieldValue={setFieldValue}
                      setValues={(newValues) => {
                        Object.keys(newValues).forEach((key) => {
                          setFieldValue(key, newValues[key]);
                        });
                      }}
                      touched={touched}
                      setFieldTouched={setFieldTouched}
                      onFillLater={() => {}}
                      fillSchedulesLater={false}
                      isFinal={true}
                    />
                  </View>

                  {/* Payment Calculation Display */}
                  {totalWorkingHours > 0 && (
                    <View className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30 gap-2">
                      <Text className="text-sm font-semibold text-blue-500 mb-1">Payment Calculation</Text>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-slate-400/80 text-[13px]">Total Working Hours:</Text>
                        <Text className="text-blue-500 text-[13px] font-semibold">
                          {totalWorkingHours.toFixed(2)} hours
                        </Text>
                      </View>
                      {values.paymentAmount > 0 && (
                        <>
                          <View className="flex-row justify-between items-center">
                            <Text className="text-slate-400/80 text-[13px]">Payment Rate:</Text>
                            <Text className="text-blue-500 text-[13px] font-semibold">
                              ${values.paymentAmount} {values.paymentCurrency}/hour
                            </Text>
                          </View>
                          <View className="flex-row justify-between items-center">
                            <Text className="text-slate-400/80 text-[13px]">Base Payment:</Text>
                            <Text className="text-blue-500 text-[13px] font-semibold">
                              ${(values.paymentAmount * totalWorkingHours).toFixed(2)}{' '}
                              {values.paymentCurrency}
                            </Text>
                          </View>
                          {values.paymentAdditional > 0 && (
                            <View className="flex-row justify-between items-center">
                              <Text className="text-slate-400/80 text-[13px]">Additional Payment:</Text>
                              <Text className="text-blue-500 text-[13px] font-semibold">
                                ${values.paymentAdditional.toFixed(2)} {values.paymentCurrency}
                              </Text>
                            </View>
                          )}
                          <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-blue-500/30">
                            <Text className="text-gray-200 text-[15px] font-semibold">Estimated Total:</Text>
                            <Text className="text-green-500 text-lg font-bold">
                              $
                              {(
                                values.paymentAmount * totalWorkingHours +
                                (values.paymentAdditional || 0)
                              ).toFixed(2)}{' '}
                              {values.paymentCurrency}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  )}

                  {/* Terms & Conditions */}
                  <View className="bg-zinc-800/50 rounded-xl p-4 gap-4">
                    <Text className="text-sm font-semibold text-gray-50 mb-1">Terms & Conditions</Text>

                    <View className="flex-1 mb-2">
                      <Text className="text-gray-200 text-[13px] font-medium mb-2">Usage Rights</Text>
                      <TextInput
                        value={values.usageRights}
                        onChangeText={(text) => setFieldValue('usageRights', text)}
                        placeholder="Optional"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        className="rounded-xl border border-slate-400/40 px-3.5 py-3 text-gray-50 bg-slate-900/65 text-sm min-h-[80px]"
                        style={{ textAlignVertical: 'top' }}
                        multiline
                        numberOfLines={3}
                      />
                    </View>

                    <View className="flex-1 mb-2">
                      <Text className="text-gray-200 text-[13px] font-medium mb-2">Terms and Conditions</Text>
                      <TextInput
                        value={values.termsAndConditions}
                        onChangeText={(text) => setFieldValue('termsAndConditions', text)}
                        placeholder="Optional"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        className="rounded-xl border border-slate-400/40 px-3.5 py-3 text-gray-50 bg-slate-900/65 text-sm min-h-[80px]"
                        style={{ textAlignVertical: 'top' }}
                        multiline
                        numberOfLines={4}
                      />
                    </View>

                    <View className="flex-1 mb-2">
                      <Text className="text-gray-200 text-[13px] font-medium mb-2">Remarks</Text>
                      <TextInput
                        value={values.remarks}
                        onChangeText={(text) => setFieldValue('remarks', text)}
                        placeholder="Optional"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        className="rounded-xl border border-slate-400/40 px-3.5 py-3 text-gray-50 bg-slate-900/65 text-sm min-h-[80px]"
                        style={{ textAlignVertical: 'top' }}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </FormPage>
        );
      }}
    </Formik>
  );
}
