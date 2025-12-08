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
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobContractsById, markAsReadByTalent } from '@/api/apiservice/jobContracts_api';
import { formatDateTime } from '@/utils/time-converts';
import { ChevronLeft } from 'lucide-react-native';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { useCallback, useEffect, useMemo } from 'react';

export default function MyContractDetailPage({ scrollHandler }: { scrollHandler?: (event: any) => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const contractId = id ? parseInt(id as string, 10) : null;
  const queryClient = useQueryClient();

  const {
    data: contractData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => getJobContractsById(contractId!),
    enabled: !!contractId && !isNaN(contractId),
    staleTime: 30 * 1000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => markAsReadByTalent(id),
    onSuccess: () => {
      // Invalidate contract queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
      queryClient.invalidateQueries({ queryKey: ['jobContracts'] });
    },
  });

  // Get latest condition
  const latestCondition = useMemo(() => {
    if (!contractData?.jobContract?.conditions?.length) return null;
    const sortedConditions = [...contractData.jobContract.conditions].sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sortedConditions[0];
  }, [contractData?.jobContract?.conditions]);

  // Mark as read when viewing if not already read
  const handleMarkAsRead = useCallback(() => {
    if (
      contractId &&
      latestCondition &&
      !latestCondition.readByTalent &&
      !markAsReadMutation.isPending
    ) {
      markAsReadMutation.mutate(contractId);
    }
  }, [contractId, latestCondition?.readByTalent, markAsReadMutation]);

  useEffect(() => {
    if (
      latestCondition &&
      !latestCondition.readByTalent &&
      contractId &&
      !markAsReadMutation.isPending &&
      !markAsReadMutation.isSuccess
    ) {
      handleMarkAsRead();
    }
  }, [
    latestCondition,
    contractId,
    markAsReadMutation.isPending,
    markAsReadMutation.isSuccess,
    handleMarkAsRead,
  ]);

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

  if (!contractId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No contract ID provided</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const contract = contractData.jobContract;
  const statusColor = getStatusColor(contract.contractStatus);

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

  const calculateTotalHours = (schedules: any[]) => {
    if (!schedules || schedules.length === 0) return 0;
    return schedules.reduce((acc, schedule) => {
      if (schedule.fromTime && schedule.toTime) {
        const fromTime = new Date(schedule.fromTime).getTime();
        const toTime = new Date(schedule.toTime).getTime();
        const hours = (toTime - fromTime) / (1000 * 60 * 60);
        return acc + hours;
      }
      return acc;
    }, 0);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <CollapsibleHeader
          title={contract ? `Contract #${contract.id}` : 'Contract'}
          headerLeft={
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              className="p-2 flex items-center justify-center"
            >
              <ChevronLeft color="#93c5fd" size={24} />
            </TouchableOpacity>
          }
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
        />
        <ScrollView
          style={styles.scrollView}
          onScroll={scrollHandler || onScroll}
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
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contract ID:</Text>
              <Text style={styles.infoValue}>#{contract.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role:</Text>
              <Text style={styles.infoValue}>{contract.roleTitle || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Project:</Text>
              <Text style={styles.infoValue}>{contract.projectName || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Project ID:</Text>
              <Text style={styles.infoValue}>#{contract.projectId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role ID:</Text>
              <Text style={styles.infoValue}>#{contract.roleId}</Text>
            </View>
            {contract.createdAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created:</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(contract.createdAt)}
                </Text>
              </View>
            )}
            {contract.updatedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Updated:</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(contract.updatedAt)}
                </Text>
              </View>
            )}
          </View>

          {/* Latest Condition */}
          {latestCondition && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Latest Condition</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={styles.infoValue}>
                  {latestCondition.conditionStatus || 'Pending'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment Amount:</Text>
                <Text style={styles.infoValue}>
                  {formatCurrency(
                    latestCondition.paymentAmount,
                    latestCondition.paymentCurrency
                  )}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment Basis:</Text>
                <Text style={styles.infoValue}>
                  {latestCondition.paymentBasis || 'N/A'}
                </Text>
              </View>
              {latestCondition.paymentDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payment Date:</Text>
                  <Text style={styles.infoValue}>
                    {formatDateTime(latestCondition.paymentDate)}
                  </Text>
                </View>
              )}
              {latestCondition.schedules && latestCondition.schedules.length > 0 && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Job Hours:</Text>
                    <Text style={styles.infoValue}>
                      {calculateTotalHours(latestCondition.schedules).toFixed(1)} hours
                    </Text>
                  </View>
                  <View style={styles.scheduleSection}>
                    <Text style={styles.scheduleTitle}>Schedules:</Text>
                    {latestCondition.schedules.map((schedule: any, index: number) => (
                      <View key={schedule.id || index} style={styles.scheduleItem}>
                        <Text style={styles.scheduleText}>
                          {formatDateTime(schedule.fromTime)} - {formatDateTime(schedule.toTime)}
                        </Text>
                        {schedule.location && (
                          <Text style={styles.scheduleLocation}>{schedule.location}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </>
              )}
              {latestCondition.termsAndConditions && (
                <View style={styles.termsSection}>
                  <Text style={styles.termsTitle}>Terms & Conditions:</Text>
                  <Text style={styles.termsText}>
                    {latestCondition.termsAndConditions}
                  </Text>
                </View>
              )}
              {latestCondition.usageRights && (
                <View style={styles.termsSection}>
                  <Text style={styles.termsTitle}>Usage Rights:</Text>
                  <Text style={styles.termsText}>
                    {latestCondition.usageRights}
                  </Text>
                </View>
              )}
            </View>
          )}

          {contract.remarks && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Remarks</Text>
              <Text style={styles.remarksText}>{contract.remarks}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#9ca3af',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  scheduleSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  scheduleItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  scheduleLocation: {
    fontSize: 12,
    color: '#9ca3af',
  },
  termsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  remarksText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
});

