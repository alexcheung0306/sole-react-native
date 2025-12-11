import { router } from 'expo-router';
import { ScrollView, View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function ContractsTable({
  viewMode,
  selectedContracts,
  disabledContractIds,
  tableRows,
  handleSelectAll,
  setSelectedContracts,
}: {
  viewMode: string;
  selectedContracts: any;
  disabledContractIds: string[];
  tableRows: any[];
  handleSelectAll: () => void;
  setSelectedContracts: (contracts: any) => void;
}) {
  const toggleContractSelection = (contractId: string) => {
    if (disabledContractIds.includes(contractId)) return;

    setSelectedContracts((prev: any) => {
      const next = new Set(prev);
      if (next.has(contractId)) {
        next.delete(contractId);
      } else {
        next.add(contractId);
      }
      return next;
    });
  };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.tableContainer}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          {viewMode === 'select' && (
            <TouchableOpacity style={styles.checkboxHeader} onPress={handleSelectAll}>
              <View
                style={[
                  styles.checkbox,
                  selectedContracts.size > 0 &&
                    selectedContracts.size ===
                      tableRows.filter((row: any) => !disabledContractIds.includes(row.key))
                        .length &&
                    styles.checkboxChecked,
                ]}>
                {selectedContracts.size > 0 &&
                  selectedContracts.size ===
                    tableRows.filter((row: any) => !disabledContractIds.includes(row.key))
                      .length && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          )}
          <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Contract ID</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Role Title</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Talent</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Payment</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Latest Condition</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Last Update</Text>
        </View>

        {/* Table Body */}
        {tableRows.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No contracts found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Adjust your filters or create new contracts to see them listed here.
            </Text>
          </View>
        ) : (
          tableRows.map((row: any) => {
            const isSelected = selectedContracts.has(row.key);
            const isDisabled = disabledContractIds.includes(row.key);
            const contractStatus = row.contract?.contractStatus || 'N/A';

            return (
              <TouchableOpacity
                key={row.key}
                style={[
                  styles.tableRow,
                  isSelected && styles.tableRowSelected,
                  isDisabled && styles.tableRowDisabled,
                ]}
                onPress={() => {
                  if (viewMode === 'select' && !isDisabled) {
                    toggleContractSelection(row.key);
                  } else {
                    router.push({
                      pathname: '/(protected)/(client)/projects/contract-detail',
                      params: { id: row.key },
                    });
                  }
                }}
                disabled={isDisabled && viewMode === 'select'}>
                {viewMode === 'select' && (
                  <View style={styles.checkboxCell}>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxChecked,
                        isDisabled && styles.checkboxDisabled,
                      ]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </View>
                )}
                <Text style={[styles.tableCell, { flex: 0.8 }]}>#{row.contract?.id}</Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>
                  {row.contract?.roleTitle || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]} numberOfLines={1}>
                  {row.talentName}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                  {row.paymentAmount}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>
                  {row.latestConditionStatus}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{row.lastUpdate}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
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
    marginBottom: 16,
  },
  batchSendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
