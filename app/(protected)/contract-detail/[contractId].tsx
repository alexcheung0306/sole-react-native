import { Stack, useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { useQuery } from '@tanstack/react-query';
import { getJobContractsById } from '@/api/apiservice/jobContracts_api';
import { formatDateTime } from '@/utils/time-converts';
import { ChevronLeft } from 'lucide-react-native';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { useState } from 'react';

export default function ContractDetailPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  
  // Handle both contractId (from route param) and id (fallback)
  const contractIdParam = (params.contractId || params.id) as string | undefined;
  const contractId = contractIdParam ? parseInt(contractIdParam, 10) : 0;
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: contractData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => getJobContractsById(contractId),
    enabled: !!contractId && !isNaN(contractId),
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

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing contract data:', error);
    } finally {
      setRefreshing(false);
    }
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

  const statusColor = getStatusColor(contract.contractStatus);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black" style={{ zIndex: 1000 }}>
        <CollapsibleHeader
          title={contractData?.jobContract ? `Contract #${contractData.jobContract.id}` : 'Contract'}
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
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: insets.bottom + 80,
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
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
});

