import { Formik } from 'formik';
import { useMemo, useState } from 'react';
import { View, TouchableOpacity, ScrollView, TextInput, Text, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { FormModal } from '~/components/custom/form-modal';
import { DateTimePickerInput } from '~/components/form-components/DateTimePickerInput';
import { RoleScheduleListInputs } from '~/components/form-components/role-form/RoleScheduleListInputs';
import { SingleWheelPickerInput } from '~/components/form-components/SingleWheelPickerInput';

export default function BatchSendConditionFormModal({
  contracts,
  selectedContractIds,
  batchCreateConditionsMutation,
  getPrimaryCondition,
  formatCurrency,
}: {
  selectedContractIds: string[];
  contracts: any[];
  batchCreateConditionsMutation: any;
  getPrimaryCondition: (conditions: any[]) => any;
  formatCurrency: (amount: number, currency: string) => string;
}) {
  const paymentBasisOptions = [
    { value: 'Hourly Rate', label: 'Hourly Rate' },
    { value: 'On Project', label: 'Project Rate' },
  ];

  const currencyOptions = [{ value: 'HKD', label: 'HKD' }];

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
  const [showBatchConditionsModal, setShowBatchConditionsModal] = useState(false);
  const selectedContractsData = useMemo(() => {
    return contracts.filter((contractWithProfile: any) => {
      const contract = contractWithProfile?.jobContract ?? contractWithProfile;
      return selectedContractIds.includes(contract?.id?.toString());
    });
  }, [contracts, selectedContractIds]);

  const handleBatchConditionsSubmit = async (values: any) => {
    try {
      if (selectedContractIds.length === 0) {
        return;
      }

      const schedules =
        values.activityScheduleLists
          ?.filter((activity: any) => activity.type === 'job')
          ?.flatMap((activity: any) =>
            activity.schedules.map((schedule: any) => ({
              location: schedule.location || '',
              fromTime: schedule.fromTime ? new Date(schedule.fromTime).toISOString() : null,
              toTime: schedule.toTime ? new Date(schedule.toTime).toISOString() : null,
            }))
          ) || [];

      const conditionData = {
        usageRights: values.usageRights,
        paymentBasis: values.paymentBasis,
        paymentAmount: values.paymentAmount,
        paymentAmountOt: values.paymentAmountOt || 0,
        paymentAdditional: values.paymentAdditional || 0,
        paymentCurrency: values.paymentCurrency,
        paymentDate: values.paymentDate || null,
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
    }
  };
  return (
    <>
      {/* Batch Send Button */}
      <View style={styles.batchActionsContainer}>
        <TouchableOpacity
          style={styles.batchSendButton}
          onPress={() => setShowBatchConditionsModal(true)}>
          <ChevronRight size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <Formik
        initialValues={initialBatchConditionsValues}
        onSubmit={handleBatchConditionsSubmit}
        enableReinitialize>
        {({ values, setFieldValue, submitForm, touched, setFieldTouched, errors }) => {
          const totalWorkingHours = calculateTotalTimeFromForm(values.activityScheduleLists);

          return (
            <FormModal
              open={showBatchConditionsModal}
              onOpenChange={setShowBatchConditionsModal}
              title="Batch Create Contract Conditions"
              submitButtonText={`Create Conditions for ${selectedContractIds.length} Contract${selectedContractIds.length !== 1 ? 's' : ''}`}
              isSubmitting={batchCreateConditionsMutation.isPending}
              onSubmit={submitForm}
              showTrigger={false}>
              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                <View style={styles.modalContentInner}>
                  {/* Selected Contracts Display */}
                  <View style={styles.selectedContractsSection}>
                    <View style={styles.selectedContractsHeader}>
                      <Text style={styles.sectionTitleSmall}>Selected Contracts</Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{selectedContractIds.length} selected</Text>
                      </View>
                    </View>

                    {selectedContractIds.length === 0 ? (
                      <View style={styles.emptyContractsCard}>
                        <Text style={styles.emptyContractsText}>No contracts selected</Text>
                        <Text style={styles.emptyContractsSubtext}>
                          Enable "Batch Update Conditions" mode and select contracts from the table
                        </Text>
                      </View>
                    ) : (
                      <ScrollView
                        style={styles.selectedContractsList}
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
                            <View key={contract?.id} style={styles.contractCard}>
                              <View style={styles.contractCardContent}>
                                <Text style={styles.contractCardTitle}>{talentName}</Text>
                                <Text style={styles.contractCardMeta}>
                                  {contract?.roleTitle || 'N/A'} • #{contract?.roleId}
                                </Text>
                                <View style={styles.contractCardStatusRow}>
                                  <View style={styles.statusBadge}>
                                    <Text style={styles.statusBadgeText}>
                                      {contract?.contractStatus}
                                    </Text>
                                  </View>
                                  {latestCondition && (
                                    <Text style={styles.contractCardPayment}>
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
                              <Text style={styles.contractCardId}>ID: #{contract?.id}</Text>
                            </View>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>

                  {/* Form Fields */}
                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitleSmall}>New Contract Conditions</Text>

                    {/* Payment Details */}
                    <View style={styles.formCard}>
                      <Text style={styles.formCardTitle}>Payment Details</Text>

                      <View style={styles.formRow}>
                        <View style={styles.formField}>
                          <SingleWheelPickerInput
                            title="Payment Basis"
                            value={values.paymentBasis}
                            onChange={(value) => setFieldValue('paymentBasis', value)}
                            options={paymentBasisOptions}
                            placeholder="Select payment basis"
                          />
                        </View>

                        <View style={styles.formField}>
                          <SingleWheelPickerInput
                            title="Currency"
                            value={values.paymentCurrency}
                            onChange={(value) => setFieldValue('paymentCurrency', value)}
                            options={currencyOptions}
                            placeholder="Select currency"
                          />
                        </View>
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.label}>
                          {values.paymentBasis === 'Hourly Rate'
                            ? 'Hourly Rate (HKD)'
                            : 'Project Rate (HKD)'}
                          <Text style={styles.required}> *</Text>
                        </Text>
                        <TextInput
                          value={values.paymentAmount ? String(values.paymentAmount) : ''}
                          onChangeText={(text) =>
                            setFieldValue('paymentAmount', Number(text.replace(/[^0-9.]/g, '')))
                          }
                          keyboardType="numeric"
                          placeholder="Enter payment"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          style={styles.input}
                        />
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.label}>Overtime Payment/Hour (HKD)</Text>
                        <TextInput
                          value={values.paymentAmountOt ? String(values.paymentAmountOt) : ''}
                          onChangeText={(text) =>
                            setFieldValue('paymentAmountOt', Number(text.replace(/[^0-9.]/g, '')))
                          }
                          keyboardType="numeric"
                          placeholder="Optional"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          style={styles.input}
                        />
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.label}>Additional Payment (HKD)</Text>
                        <TextInput
                          value={values.paymentAdditional ? String(values.paymentAdditional) : ''}
                          onChangeText={(text) =>
                            setFieldValue('paymentAdditional', Number(text.replace(/[^0-9.]/g, '')))
                          }
                          keyboardType="numeric"
                          placeholder="Optional"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          style={styles.input}
                        />
                      </View>

                      <View style={styles.formField}>
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
                    <View style={styles.formCard}>
                      <Text style={styles.formCardTitle}>Schedule & Activities</Text>
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
                      <View style={styles.calculationCard}>
                        <Text style={styles.calculationTitle}>Payment Calculation</Text>
                        <View style={styles.calculationRow}>
                          <Text style={styles.calculationLabel}>Total Working Hours:</Text>
                          <Text style={styles.calculationValue}>
                            {totalWorkingHours.toFixed(2)} hours
                          </Text>
                        </View>
                        {values.paymentAmount > 0 && (
                          <>
                            <View style={styles.calculationRow}>
                              <Text style={styles.calculationLabel}>Payment Rate:</Text>
                              <Text style={styles.calculationValue}>
                                ${values.paymentAmount} {values.paymentCurrency}/hour
                              </Text>
                            </View>
                            <View style={styles.calculationRow}>
                              <Text style={styles.calculationLabel}>Base Payment:</Text>
                              <Text style={styles.calculationValue}>
                                ${(values.paymentAmount * totalWorkingHours).toFixed(2)}{' '}
                                {values.paymentCurrency}
                              </Text>
                            </View>
                            {values.paymentAdditional > 0 && (
                              <View style={styles.calculationRow}>
                                <Text style={styles.calculationLabel}>Additional Payment:</Text>
                                <Text style={styles.calculationValue}>
                                  ${values.paymentAdditional.toFixed(2)} {values.paymentCurrency}
                                </Text>
                              </View>
                            )}
                            <View style={[styles.calculationRow, styles.calculationTotal]}>
                              <Text style={styles.calculationTotalLabel}>Estimated Total:</Text>
                              <Text style={styles.calculationTotalValue}>
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
                    <View style={styles.formCard}>
                      <Text style={styles.formCardTitle}>Terms & Conditions</Text>

                      <View style={styles.formField}>
                        <Text style={styles.label}>Usage Rights</Text>
                        <TextInput
                          value={values.usageRights}
                          onChangeText={(text) => setFieldValue('usageRights', text)}
                          placeholder="Optional"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          style={[styles.input, styles.textArea]}
                          multiline
                          numberOfLines={3}
                        />
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.label}>Terms and Conditions</Text>
                        <TextInput
                          value={values.termsAndConditions}
                          onChangeText={(text) => setFieldValue('termsAndConditions', text)}
                          placeholder="Optional"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          style={[styles.input, styles.textArea]}
                          multiline
                          numberOfLines={4}
                        />
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.label}>Remarks</Text>
                        <TextInput
                          value={values.remarks}
                          onChangeText={(text) => setFieldValue('remarks', text)}
                          placeholder="Optional"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          style={[styles.input, styles.textArea]}
                          multiline
                          numberOfLines={3}
                        />
                      </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        batchCreateConditionsMutation.isPending && styles.submitButtonDisabled,
                      ]}
                      onPress={submitForm}
                      disabled={
                        batchCreateConditionsMutation.isPending || selectedContractIds.length === 0
                      }>
                      <Text style={styles.submitButtonText}>
                        {batchCreateConditionsMutation.isPending
                          ? 'Creating Conditions...'
                          : `Create Conditions for ${selectedContractIds.length} Contract${selectedContractIds.length !== 1 ? 's' : ''}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </FormModal>
          );
        }}
      </Formik>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 20,
  },
  sectionCard: {
    backgroundColor: 'rgba(17, 17, 17, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f9fafb',
  },
  sectionTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  batchModeContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  batchModeToggle: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    padding: 16,
  },
  batchModeToggleActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  batchModeToggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchModeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
  },
  batchModeSubtitle: {
    fontSize: 12,
    color: 'rgba(148, 163, 184, 0.7)',
    marginTop: 4,
  },
  batchModeSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  batchModeSwitchActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  batchModeSwitchDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-end',
  },
  batchActionsContainer: {
    marginBottom: 0,
  },
  batchSendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    alignItems: 'center',
  },
  batchSendButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  tableContainer: {
    marginTop: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    minWidth: 800,
  },
  tableHeaderCell: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
  },
  checkboxHeader: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 800,
  },
  tableRowSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  tableRowDisabled: {
    opacity: 0.5,
  },
  tableCell: {
    color: '#e5e7eb',
    fontSize: 13,
    paddingHorizontal: 8,
  },
  checkboxCell: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  checkboxDisabled: {
    opacity: 0.3,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 6,
    minWidth: 800,
  },
  emptyStateTitle: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateSubtitle: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  drawerContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  drawerSubtitle: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 14,
  },
  batchStatusList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  batchStatusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
  },
  batchStatusChipActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  batchStatusChipText: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '600',
  },
  batchStatusChipTextActive: {
    color: '#bfdbfe',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f9fafb',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  drawerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 16,
    gap: 20,
  },
  selectedContractsSection: {
    marginBottom: 8,
  },
  selectedContractsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedContractsList: {
    maxHeight: 200,
  },
  emptyContractsCard: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    borderRadius: 12,
  },
  emptyContractsText: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyContractsSubtext: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  contractCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 8,
  },
  contractCardContent: {
    flex: 1,
  },
  contractCardTitle: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  contractCardMeta: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 12,
    marginBottom: 8,
  },
  contractCardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    backgroundColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  contractCardPayment: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 11,
  },
  contractCardId: {
    color: 'rgba(148, 163, 184, 0.5)',
    fontSize: 11,
  },
  formSection: {
    gap: 16,
  },
  formCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  formCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 4,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
    marginBottom: 8,
  },
  label: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  calculationCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: 8,
  },
  calculationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calculationLabel: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 13,
  },
  calculationValue: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
  calculationTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.3)',
  },
  calculationTotalLabel: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
  },
  calculationTotalValue: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
