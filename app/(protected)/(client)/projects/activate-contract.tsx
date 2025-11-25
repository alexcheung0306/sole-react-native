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
import { useQuery } from '@tanstack/react-query';
import { getJobContractsById } from '@/api/apiservice/jobContracts_api';
import { formatDateTime } from '@/utils/time-converts';
import { ChevronLeft } from 'lucide-react-native';
import AlterContractStatusModal from '@/components/projects/AlterContractStatusModal';

export default function ActivateContractPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { handleScroll } = useHeaderContext();
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
    staleTime: 5 * 60 * 1000,
  });

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

  const calculateEstimatedTotal = (condition: any) => {
    const baseAmount = condition.paymentAmount || 0;
    const additionalAmount = condition.paymentAdditional || 0;

    if (condition.paymentBasis === 'Hourly Rate') {
      const totalHours = calculateTotalHours(condition.schedules || []);
      return baseAmount * totalHours + additionalAmount;
    } else {
      return baseAmount + additionalAmount;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

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
  const latestCondition = contract.conditions?.length
    ? [...contract.conditions].sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
    : null;

  if (!latestCondition) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No condition data found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalHours = calculateTotalHours(latestCondition.schedules || []);
  const estimatedTotal = calculateEstimatedTotal(latestCondition);

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
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButtonContainer}
            onPress={() => router.back()}
          >
            <ChevronLeft color="#3b82f6" size={20} />
            <Text style={styles.backLinkText}>Back to Contract</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Activate Contract</Text>
            <Text style={styles.subtitle}>
              Review payment details before activating
            </Text>
          </View>

          {/* Payment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>

            <View style={styles.divider} />

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Job Hours:</Text>
              <Text style={styles.paymentValue}>
                {totalHours.toFixed(1)} hours
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Basis:</Text>
              <Text style={styles.paymentValue}>
                {latestCondition.paymentBasis}
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Currency:</Text>
              <Text style={styles.paymentValue}>
                {latestCondition.paymentCurrency}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Amount:</Text>
              <Text style={[styles.paymentValue, styles.greenText]}>
                {formatCurrency(
                  latestCondition.paymentAmount,
                  latestCondition.paymentCurrency
                )}
              </Text>
            </View>

            {latestCondition.paymentAmountOt > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Overtime Per Hour:</Text>
                <Text style={[styles.paymentValue, styles.yellowText]}>
                  {formatCurrency(
                    latestCondition.paymentAmountOt,
                    latestCondition.paymentCurrency
                  )}
                </Text>
              </View>
            )}

            {latestCondition.paymentAdditional > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Additional:</Text>
                <Text style={[styles.paymentValue, styles.greenText]}>
                  {formatCurrency(
                    latestCondition.paymentAdditional,
                    latestCondition.paymentCurrency
                  )}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, styles.boldText]}>
                Estimated Total Payment:
              </Text>
              <Text style={[styles.paymentValue, styles.greenText, styles.boldText]}>
                {formatCurrency(
                  estimatedTotal,
                  latestCondition.paymentCurrency
                )}
              </Text>
            </View>

            {latestCondition.paymentDate && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payment Date:</Text>
                <Text style={styles.paymentValue}>
                  {formatDateTime(latestCondition.paymentDate)}
                </Text>
              </View>
            )}
          </View>

          {/* Activate Button */}
          <AlterContractStatusModal
            contractId={contractId}
            options="activated"
            onSuccess={() => router.back()}
          />
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
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backLinkText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  section: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  paymentValue: {
    fontSize: 16,
    color: '#ffffff',
  },
  greenText: {
    color: '#10b981',
  },
  yellowText: {
    color: '#f59e0b',
  },
  boldText: {
    fontWeight: '700',
    fontSize: 16,
  },
});

