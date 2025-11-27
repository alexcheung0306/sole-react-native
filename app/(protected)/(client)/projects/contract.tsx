import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderContext } from '@/context/HeaderContext';
import { useProjectScrollHeader } from './_layout';
import { useQuery } from '@tanstack/react-query';
import { getJobContractsById } from '@/api/apiservice/jobContracts_api';
import { formatDateTime } from '@/utils/time-converts';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect } from 'react';
import AlterContractStatusModal from '@/components/projects/AlterContractStatusModal';

export default function ContractDetailPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setTitle, setHeaderLeft } = useHeaderContext();
  const { handleScroll } = useProjectScrollHeader();
  const { id } = useLocalSearchParams();

  const contractId = parseInt(id as string);

  const {
    data: contractData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => getJobContractsById(contractId),
    enabled: !!contractId,
    staleTime: 30 * 1000,
  });

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      Pending: '#f59e0b',
      Activated: '#10b981',
      Completed: '#3b82f6',
      Paid: '#8b5cf6',
      Cancelled: '#ef4444',
    };
    return colorMap[status] || '#6b7280';
  };

  // Update header title and left button when contract data loads
  useEffect(() => {
    if (contractData?.jobContract) {
      const contract = contractData.jobContract;
      setTitle(`Contract #${contract.id}`);
      setHeaderLeft(
        <TouchableOpacity
          onPress={() =>
            router.replace('/(protected)/(client)/projects/manage-contracts')
          }
          activeOpacity={0.85}
          className="p-2 flex items-center justify-center"
        >
          <ChevronLeft color="#93c5fd" size={24} />
        </TouchableOpacity>
      );
    }
  }, [contractData, setTitle, setHeaderLeft, router]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading contract...</Text>
      </View>
    );
  }

  if (error || !contractData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading contract</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.replace('/(protected)/(client)/projects/manage-contracts')
          }
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const contract = contractData.jobContract;
  const latestCondition = contract.conditions?.length
    ? [...contract.conditions].sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
    : null;

  const statusColor = getStatusColor(contract.contractStatus);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 20,
            paddingHorizontal: 24,
          }}
        >
          {/* Status Badge */}
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + '33' },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {contract.contractStatus}
              </Text>
            </View>
          </View>

          {/* Contract Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contract Information</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Contract ID:</Text>
              <Text style={styles.infoValue}>#{contract.id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Project:</Text>
              <Text style={styles.infoValue}>{contract.projectName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Role:</Text>
              <Text style={styles.infoValue}>{contract.roleTitle}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoValue}>
                {formatDateTime(contract.createdAt)}
              </Text>
            </View>
            {contract.remarks && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Remarks:</Text>
                <Text style={styles.infoValue}>{contract.remarks}</Text>
              </View>
            )}
          </View>

          {/* Latest Condition */}
          {latestCondition && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Latest Condition</Text>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={styles.infoValue}>
                  {latestCondition.conditionStatus}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Payment Basis:</Text>
                <Text style={styles.infoValue}>
                  {latestCondition.paymentBasis}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Amount:</Text>
                <Text style={styles.infoValue}>
                  {latestCondition.paymentCurrency}{' '}
                  {latestCondition.paymentAmount}
                </Text>
              </View>
              {latestCondition.usageRights && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Usage Rights:</Text>
                  <Text style={styles.infoValue}>
                    {latestCondition.usageRights}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Actions based on status */}
          <View style={styles.actionsSection}>
            {contract.contractStatus === 'Pending' &&
              latestCondition?.conditionStatus === 'Accepted' && (
                <>
                  <TouchableOpacity
                    style={styles.activateButton}
                    onPress={() =>
                      router.push({
                        pathname:
                          '/(protected)/(client)/projects/activate-contract',
                        params: { id: contractId },
                      })
                    }
                  >
                    <Text style={styles.activateButtonText}>
                      Activate Contract
                    </Text>
                  </TouchableOpacity>
                  <AlterContractStatusModal
                    contractId={contractId}
                    options="cancelled"
                  />
                </>
              )}

            {contract.contractStatus === 'Activated' && (
              <AlterContractStatusModal
                contractId={contractId}
                options="completed"
              />
            )}

            {contract.contractStatus === 'Completed' && (
              <AlterContractStatusModal
                contractId={contractId}
                options="paid"
              />
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 24,
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  badgeContainer: {
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  actionsSection: {
    marginTop: 8,
  },
  activateButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  activateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

