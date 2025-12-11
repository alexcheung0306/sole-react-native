import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Formik } from 'formik';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { updateContractCondition } from '@/api/apiservice/jobContracts_api';
import { FormModal } from '@/components/custom/form-modal';
import { RoleScheduleListInputs } from '@/components/form-components/role-form/RoleScheduleListInputs';
import { SingleWheelPickerInput } from '@/components/form-components/SingleWheelPickerInput';
import { DateTimePickerInput } from '@/components/form-components/DateTimePickerInput';
import { parseDateTime } from '@/lib/datetime';
import { Pencil } from 'lucide-react-native';
import { PrimaryButton } from '@/components/custom/primary-button';

interface EditContractConditionFormModalProps {
  condition: any;
  contractId: number;
  clientId: string;
}

export default function EditContractConditionFormModal({
  condition,
  contractId,
  clientId,
}: EditContractConditionFormModalProps) {
  const { soleUserId } = useSoleUserContext();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Check if user can edit (must be client and condition status must be pending)
  const canEdit =
    String(soleUserId) === String(clientId) &&
    condition.conditionStatus?.toLowerCase() === 'pending';

  // Debug logging
  console.log('EditContractConditionFormModal - canEdit:', canEdit);
  console.log('EditContractConditionFormModal - soleUserId:', soleUserId);
  console.log('EditContractConditionFormModal - clientId:', clientId);
  console.log('EditContractConditionFormModal - conditionStatus:', condition.conditionStatus);

  const paymentBasisOptions = [
    { value: 'Hourly Rate', label: 'Hourly Rate' },
    { value: 'On Project', label: 'Project Rate' },
  ];

  const currencyOptions = [{ value: 'HKD', label: 'HKD' }];

  const initialValues = useMemo(() => {
    return {
      usageRights: condition.usageRights || '',
      paymentBasis: condition.paymentBasis || '',
      paymentAmount: condition.paymentAmount || 0,
      paymentAmountOt: condition.paymentAmountOt || 0,
      paymentAdditional: condition.paymentAdditional || 0,
      paymentCurrency: condition.paymentCurrency || 'HKD',
      paymentDate: condition.paymentDate || undefined,
      termsAndConditions: condition.termsAndConditions || '',
      activityScheduleLists: [
        {
          title: 'Job Schedule',
          type: 'job',
          schedules:
            condition.schedules?.map((schedule: any) => ({
              id: schedule.id,
              location: schedule.location || '',
              fromTime: schedule.fromTime,
              toTime: schedule.toTime,
            })) || [],
          remarks: '',
        },
      ],
    };
  }, [condition]);

  const updateConditionMutation = useMutation({
    mutationFn: async (values: any) => {
      const schedules =
        values.activityScheduleLists
          ?.filter((activity: any) => activity.type === 'job')
          ?.flatMap((activity: any) =>
            activity.schedules
              .filter((schedule: any) => schedule.fromTime && schedule.toTime)
              .map((schedule: any) => {
                let fromTime = null;
                let toTime = null;

                try {
                  if (schedule.fromTime) {
                    const parsedFromTime = parseDateTime(schedule.fromTime);
                    fromTime = parsedFromTime ? parsedFromTime.toISOString() : null;
                  }
                  if (schedule.toTime) {
                    const parsedToTime = parseDateTime(schedule.toTime);
                    toTime = parsedToTime ? parsedToTime.toISOString() : null;
                  }
                } catch (error) {
                  console.error('Error parsing schedule times:', error);
                }

                return {
                  id: schedule.id || undefined,
                  location: schedule.location || '',
                  fromTime,
                  toTime,
                  jobContractConditionId: condition.id,
                  createdAt: schedule.createdAt || new Date().toISOString(),
                };
              })
          ) || [];

      let paymentDate = null;
      if (values.paymentDate) {
        try {
          const parsedDate = parseDateTime(values.paymentDate);
          paymentDate = parsedDate ? parsedDate.toISOString() : null;
        } catch (error) {
          console.error('Error parsing payment date:', error);
        }
      }

      const conditionUpdate: any = {
        id: condition.id,
        jobContractId: condition.jobContractId,
        usageRights: values.usageRights,
        paymentBasis: values.paymentBasis,
        paymentAmount: values.paymentAmount,
        paymentAmountOt: values.paymentAmountOt || 0,
        paymentAdditional: values.paymentAdditional || 0,
        paymentCurrency: values.paymentCurrency,
        paymentDate: paymentDate || null,
        termsAndConditions: values.termsAndConditions,
        conditionStatus: condition.conditionStatus,
        readByTalent: condition.readByTalent,
        readByClient: condition.readByClient,
        createdAt: condition.createdAt,
        updatedAt: condition.updatedAt,
        schedules: schedules,
      };

      return updateContractCondition(condition.id, conditionUpdate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['manageContracts'] });
      Alert.alert('Success', 'Contract condition updated successfully');
      setIsOpen(false);
    },
    onError: (error) => {
      console.error('Error updating contract condition:', error);
      Alert.alert('Error', 'Failed to update contract condition. Please try again.');
    },
  });

  return (
    <Formik
      key={`edit-condition-${condition.id}`}
      initialValues={initialValues}
      enableReinitialize
      onSubmit={async (values) => {
        await updateConditionMutation.mutateAsync(values);
      }}>
      {({
        values,
        setFieldValue,
        errors,
        touched,
        setFieldTouched,
        resetForm,
        submitForm,
        isSubmitting,
      }) => {
        const hasErrors =
          !values.usageRights?.trim() ||
          !values.paymentBasis ||
          !values.paymentAmount ||
          !values.paymentCurrency;

        return (
          <FormModal
            open={isOpen}
            onOpenChange={setIsOpen}
            title="Edit Contract Condition"
            submitButtonText={isSubmitting ? 'Updating...' : 'Update Condition'}
            isSubmitting={isSubmitting}
            hasErrors={hasErrors}
            onSubmit={submitForm}
            onReset={resetForm}
            onClose={() => {
              resetForm();
            }}
            trigger={(helpers) => (
              <PrimaryButton
                variant="edit"
                disabled={!canEdit}
                icon={<Pencil size={20} color="#000000" />}
                onPress={canEdit ? helpers.open : () => {}}>
                Edit Condition
              </PrimaryButton>
            )}
            headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
            contentClassName="flex-1 px-4">
            {(close) => (
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="gap-6 pb-4">
                  {/* Job Schedules */}
                  <View className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <Text className="mb-4 text-base font-medium text-white">Job Schedules</Text>
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
                      fillSchedulesLater={false}
                      isFinal={true}
                    />
                  </View>

                  {/* Payment Information */}
                  <View className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <Text className="mb-4 text-base font-medium text-white">Payment Details</Text>
                    <View className="gap-4">
                      <View className="flex-row gap-3">
                        <View className="flex-1">
                          <SingleWheelPickerInput
                            title="Payment Basis"
                            value={values.paymentBasis || null}
                            options={paymentBasisOptions}
                            onChange={(value: string) => {
                              setFieldValue('paymentBasis', value);
                              setFieldTouched('paymentBasis', true);
                            }}
                          />
                        </View>
                        <View className="flex-1">
                          <SingleWheelPickerInput
                            title="Currency"
                            value={values.paymentCurrency || null}
                            options={currencyOptions}
                            onChange={(value: string) => {
                              setFieldValue('paymentCurrency', value);
                              setFieldTouched('paymentCurrency', true);
                            }}
                          />
                        </View>
                      </View>

                      <View className="flex-row gap-3">
                        <View className="flex-1">
                          <View className="mb-2 flex-row items-center gap-1">
                            <Text className="text-white">
                              {values.paymentBasis === 'Hourly Rate'
                                ? 'Hourly Rate (HKD)'
                                : 'On Project Rate (HKD)'}
                            </Text>
                            <Text className="text-red-500">*</Text>
                          </View>
                          <TextInput
                            className="rounded-xl border border-slate-400/40 bg-slate-900/65 px-3.5 py-3 text-sm text-gray-50"
                            value={String(values.paymentAmount || '')}
                            onChangeText={(text) => {
                              const numValue = parseFloat(text) || 0;
                              setFieldValue('paymentAmount', numValue);
                              setFieldTouched('paymentAmount', true);
                            }}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#6b7280"
                          />
                        </View>

                        <View className="flex-1">
                          <Text className="mb-2 text-white">Overtime Amount</Text>
                          <TextInput
                            className="rounded-xl border border-slate-400/40 bg-slate-900/65 px-3.5 py-3 text-sm text-gray-50"
                            value={String(values.paymentAmountOt || '')}
                            onChangeText={(text) => {
                              const numValue = parseFloat(text) || 0;
                              setFieldValue('paymentAmountOt', numValue);
                              setFieldTouched('paymentAmountOt', true);
                            }}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#6b7280"
                          />
                        </View>

                        <View className="flex-1">
                          <Text className="mb-2 text-white">Additional Amount</Text>
                          <TextInput
                            className="rounded-xl border border-slate-400/40 bg-slate-900/65 px-3.5 py-3 text-sm text-gray-50"
                            value={String(values.paymentAdditional || '')}
                            onChangeText={(text) => {
                              const numValue = parseFloat(text) || 0;
                              setFieldValue('paymentAdditional', numValue);
                              setFieldTouched('paymentAdditional', true);
                            }}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#6b7280"
                          />
                        </View>
                      </View>

                      <View>
                        <View className="mb-2 flex-row items-center gap-1">
                          <Text className="text-white">Payment Date</Text>
                          <Text className="text-red-500">*</Text>
                        </View>
                        <DateTimePickerInput
                          label="Payment Date"
                          value={values.paymentDate || ''}
                          onChange={(value: string) => {
                            setFieldValue('paymentDate', value);
                            setFieldTouched('paymentDate', true);
                          }}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Terms and Conditions */}
                  <View className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <Text className="mb-4 text-base font-medium text-white">
                      Terms & Conditions
                    </Text>
                    <View className="gap-4">
                      <View>
                        <Text className="mb-2 text-white">Terms & Conditions</Text>
                        <TextInput
                          className="min-h-[100px] rounded-xl border border-slate-400/40 bg-slate-900/65 px-3.5 py-3 text-sm text-gray-50"
                          style={{ textAlignVertical: 'top' }}
                          value={values.termsAndConditions}
                          onChangeText={(text) => {
                            setFieldValue('termsAndConditions', text);
                            setFieldTouched('termsAndConditions', true);
                          }}
                          multiline
                          numberOfLines={4}
                          placeholder="Enter terms and conditions"
                          placeholderTextColor="#6b7280"
                        />
                      </View>

                      <View>
                        <View className="mb-2 flex-row items-center gap-1">
                          <Text className="text-white">Usage Rights</Text>
                          <Text className="text-red-500">*</Text>
                        </View>
                        <TextInput
                          className="rounded-xl border border-slate-400/40 bg-slate-900/65 px-3.5 py-3 text-sm text-gray-50"
                          value={values.usageRights}
                          onChangeText={(text) => {
                            setFieldValue('usageRights', text);
                            setFieldTouched('usageRights', true);
                          }}
                          placeholder="Enter usage rights"
                          placeholderTextColor="#6b7280"
                        />
                        {touched.usageRights && !values.usageRights?.trim() && (
                          <Text className="mt-1 text-sm text-red-400">
                            Usage rights is required
                          </Text>
                        )}
                      </View>
                    </View>
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

