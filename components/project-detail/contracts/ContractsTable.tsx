import { router } from 'expo-router';
import { ScrollView, View, TouchableOpacity, Text, Image, Alert } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Badge } from '~/components/ui/badge';
import { getStatusColor } from '~/utils/get-status-color';

// Parse payment amount string like "HK$100.00 (On Project)" into currency, amount, and basis
const parsePaymentAmount = (paymentString: string) => {
  if (!paymentString || paymentString === 'No Amount') {
    return { currency: '', amount: '', basis: '' };
  }

  // Match pattern: Currency$Amount (Basis)
  // Example: "HK$100.00 (On Project)" or "USD$50.00 (Hourly Rate)"
  const match = paymentString.match(/^([A-Z]{2,3})\$?([\d,]+\.?\d*)\s*\((.+)\)$/);

  if (match) {
    return {
      currency: match[1], // "HK" or "HKD"
      amount: match[2].replace(/,/g, ''), // "100.00" (remove commas)
      basis: match[3], // "On Project"
    };
  }

  // Fallback: try to extract parts manually
  const currencyMatch = paymentString.match(/^([A-Z]{2,3})/);
  const amountMatch = paymentString.match(/([\d,]+\.?\d*)/);
  const basisMatch = paymentString.match(/\((.+)\)/);

  return {
    currency: currencyMatch ? currencyMatch[1] : '',
    amount: amountMatch ? amountMatch[1].replace(/,/g, '') : '',
    basis: basisMatch ? basisMatch[1] : '',
  };
};

// Get status color

export default function ContractsTable({
  viewMode,
  selectedContracts,
  disabledContractIds,
  tableRows,
  handleSelectAll,
  setSelectedContracts,
  onDeleteContract,
}: {
  viewMode: string;
  selectedContracts: any;
  disabledContractIds: string[];
  tableRows: any[];
  handleSelectAll: () => void;
  setSelectedContracts: (contracts: any) => void;
  onDeleteContract?: (contractId: number) => void;
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

  const allSelected =
    selectedContracts.size > 0 &&
    selectedContracts.size ===
      tableRows.filter((row: any) => !disabledContractIds.includes(row.key)).length;

  return (
    <View className="mt-4">
      {/* Select All Header (only in select mode) */}
      {viewMode === 'select' && tableRows.length > 0 && (
        <TouchableOpacity
          className="mb-3 flex-row items-center gap-3 rounded-xl bg-gray-100 px-4 py-3"
          onPress={handleSelectAll}>
          <View
            className={`h-5 w-5 items-center justify-center rounded border-2 ${
              allSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
            }`}>
            {allSelected && <Text className="text-xs font-bold text-white/70">✓</Text>}
          </View>
          <Text className="text-sm font-semibold text-white/70">
            Select All (
            {tableRows.filter((row: any) => !disabledContractIds.includes(row.key)).length}{' '}
            selectable)
          </Text>
        </TouchableOpacity>
      )}

      {/* Contracts Cards */}
      {tableRows.length === 0 ? (
        <View className="items-center gap-2 py-12">
          <Text className="text-base font-semibold text-white/70">No contracts found</Text>
          <Text className="px-4 text-center text-sm text-white/70">
            Adjust your filters or create new contracts to see them listed here.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
          {tableRows.map((row: any) => {
            const isSelected = selectedContracts.has(row.key);
            const isDisabled = disabledContractIds.includes(row.key);
            const contractStatus = row.contract?.contractStatus || 'N/A';
            const paymentAmount = row.paymentAmount;
            const { currency, amount, basis } = parsePaymentAmount(paymentAmount);
            const statusColor = getStatusColor(contractStatus);
            const conditionStatusColor = getStatusColor(row.latestConditionStatus);
            const comcardFirstPic = row.contractWithProfile?.comcardFirstPic;

            const handleDelete = () => {
              Alert.alert(
                'Cancel/Delete Contract',
                `Are you sure you want to cancel Contract #${row.contract?.id}? This will mark it as Cancelled (dev mode: effectively deleted).`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      if (onDeleteContract && row.contract?.id) {
                        onDeleteContract(row.contract.id);
                      }
                    },
                  },
                ]
              );
            };

            return (
              <View key={row.key} className="relative">
                <TouchableOpacity
                  activeOpacity={0.7}
                  className={`flex-row gap-3 rounded-2xl border bg-zinc-800 p-4 ${
                    isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700/50'
                  }`}
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
                {/* Checkbox (only in select mode) */}
                {viewMode === 'select' && !isDisabled && (
                  <View className="justify-start pt-1">
                    <View
                      className={`h-5 w-5 items-center justify-center rounded border-2 ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-zinc-500'
                      }`}>
                      {isSelected && <Text className="text-xs font-bold text-white">✓</Text>}
                    </View>
                  </View>
                )}

                {/* Image Section with Talent Name and Status */}
                <View className="items-center gap-2">
                  {/* Comcard First Pic */}
                  {comcardFirstPic ? (
                    <View className="h-24 w-24 overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-700/50">
                      <Image
                        key={row.key}
                        source={{ uri: comcardFirstPic }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View className="h-24 w-24 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-700/30">
                      <Text className="text-xs text-white/30">No Image</Text>
                    </View>
                  )}

                  {/* Talent Name with @ prefix */}
                  <Text className="text-center text-sm font-semibold text-white">
                    @{row.talentName}
                  </Text>

                  {/* Status Badges */}
                  <View className="items-center gap-1.5">
                    <View
                      className="rounded-md px-2 py-0.5"
                      style={{ backgroundColor: `${statusColor}20` }}>
                      <Text className="text-xs font-semibold" style={{ color: statusColor }}>
                       Contract Status: {contractStatus}
                      </Text>
                    </View>
                    <View
                      className="rounded-md px-2 py-0.5"
                      style={{ backgroundColor: `${conditionStatusColor}20` }}>
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: conditionStatusColor }}>
                        Condition Status: {row.latestConditionStatus}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Card Content */}
                <View className="flex-1 gap-2">
                  {/* Header Row */}
                  <View className="flex-1">
                    <Text className="mb-1 text-xs font-bold text-white">
                      Contract #{row.contract?.id} • Role #{row.contract.roleId}
                    </Text>
                    {row.contract?.roleTitle && (
                      <Text className="mb-2 text-sm text-white/60">
                        {row.contract.roleTitle} 
                      </Text>
                    )}
                  </View>

                  {/* Payment Info */}
                  {currency && amount && (
                    <View className="flex-row items-center gap-2">
                      {/* <Text className="text-sm text-white/60">Payment:</Text> */}
                      <Text className="text-sm font-semibold text-white">
                        {currency} {amount}
                      </Text>
                      {basis && <Text className="text-xs text-white/50">({basis})</Text>}
                    </View>
                  )}

                  {/* Last Update */}
                  <View className="border-t border-white/10 pt-2">
                    <Text className="text-[11px] text-white/50">
                      Last updated: {row.lastUpdate}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Dev Delete Button */}
              {__DEV__ && onDeleteContract && (
                <TouchableOpacity
                  onPress={handleDelete}
                  className="absolute top-2 right-2 rounded-lg bg-red-500/20 p-2 border border-red-500/50"
                  activeOpacity={0.7}>
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
