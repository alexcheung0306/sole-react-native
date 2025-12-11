import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { useQuery } from '@tanstack/react-query';
import { getJobContractsById } from '@/api/apiservice/jobContracts_api';
import { formatDateTime } from '@/utils/time-converts';
import { ChevronLeft } from 'lucide-react-native';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import AlterContractStatusModal from '@/components/projects/AlterContractStatusModal';
import { getUserInfoWithUsernameBySoleUserId } from '@/api/apiservice/userInfo_api';
import { getRoleById } from '@/api/apiservice/role_api';
import ContractClientInfo from '~/components/project-detail/contracts/ContractClientInfo';
import ContractTalentInfo from '~/components/project-detail/contracts/ContractTalentInfo';
import ContractConditionDetail from '~/components/project-detail/contracts/ContractConditionDetail';

export default function ContractDetailPage({
  scrollHandler,
}: {
  scrollHandler: (event: any) => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
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

  const contract = contractData?.jobContract;
  const roleId = contract?.roleId;
  const clientId = contract?.clientId;
  const talentId = contract?.talentId;

  // Fetch role data
  const { data: roleData } = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => getRoleById(roleId!),
    enabled: !!roleId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch client data
  const { data: clientData } = useQuery({
    queryKey: ['clientInfoWithUsername', clientId],
    queryFn: () => getUserInfoWithUsernameBySoleUserId(String(clientId!)),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch talent data
  const { data: talentData } = useQuery({
    queryKey: ['talentInfoWithUsername', talentId],
    queryFn: () => getUserInfoWithUsernameBySoleUserId(String(talentId!)),
    enabled: !!talentId,
    staleTime: 1000 * 60 * 5,
  });

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      Pending: '#f59e0b',
      Activated: '#10b981',
      Completed: '#3b82f6',
      Paid: '#8b5cf6',
      Cancelled: '#ef4444',
      Accepted: '#10b981',
      Rejected: '#ef4444',
    };
    return colorMap[status] || '#6b7280';
  };

  // Separate latest and past conditions
  const { latestCondition, pastConditions } = useMemo(() => {
    if (!contract?.conditions || contract.conditions.length === 0) {
      return { latestCondition: null, pastConditions: [] };
    }

    const sortedConditions = [...contract.conditions].sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const latest = sortedConditions[0];
    const past = sortedConditions
      .slice(1)
      .sort(
        (a: any, b: any) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      );

    return {
      latestCondition: latest,
      pastConditions: past,
    };
  }, [contract?.conditions]);

  const talentName = useMemo(
    () =>
      contractData?.userInfo?.name ||
      contractData?.talentInfo?.talentName ||
      contractData?.username ||
      'N/A',
    [contractData]
  );

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

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-black p-6">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-400 mt-3 text-sm">Loading contract...</Text>
      </View>
    );
  }

  if (error || !contractData || !contract) {
    return (
      <View className="flex-1 justify-center items-center bg-black p-6">
        <Text className="text-red-400 text-lg font-semibold mb-5">
          Error loading contract
        </Text>
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-lg"
          onPress={() =>
            router.replace('/(protected)/(client)/projects/manage-contracts')
          }>
          <Text className="text-white text-base font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = getStatusColor(contract.contractStatus);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title={
            contractData?.jobContract
              ? `Contract #${contractData.jobContract.id}`
              : 'Contract'
          }
          headerLeft={
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              className="p-2 flex items-center justify-center">
              <ChevronLeft color="#93c5fd" size={24} />
            </TouchableOpacity>
          }
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
        />
        <ScrollView
          className="flex-1"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 20,
            paddingHorizontal: 20,
          }}>
          {/* Chips Row */}
          <View className="flex-row flex-wrap gap-2 mb-6">
            <View className="bg-zinc-800/50 px-3 py-1.5 rounded-full border border-white/10">
              <Text className="text-xs text-white">Contract ID: {contract.id || 'N/A'}</Text>
            </View>
            <View
              className="px-3 py-1.5 rounded-full border"
              style={{
                backgroundColor: statusColor + '33',
                borderColor: statusColor,
              }}>
              <Text style={{ color: statusColor }} className="text-xs font-semibold">
                Status: {contract.contractStatus || 'N/A'}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-zinc-800/50 px-3 py-1.5 rounded-full border border-white/10"
              onPress={() => {
                router.push({
                  pathname: '/(protected)/(client)/projects/project-detail',
                  params: { id: contract.projectId },
                });
              }}>
              <Text className="text-xs text-white">
                Project #{contract.projectId} - {contract.projectName || 'N/A'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-zinc-800/50 px-3 py-1.5 rounded-full border border-white/10"
              onPress={() => {
                router.push({
                  pathname: '/(protected)/(client)/projects/project-detail',
                  params: {
                    id: contract.projectId,
                    tab: 'project-roles',
                    roleId: String(contract.roleId),
                  },
                });
              }}>
              <Text className="text-xs text-white">
                Role #{contract.roleId} - {contract.roleTitle || 'N/A'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Client Information */}
          <ContractClientInfo clientData={clientData} />

          {/* Talent Information */}
          <ContractTalentInfo
            talentData={talentData}
            talentName={talentName}
            contractData={contractData}
          />

          {/* Latest Condition Card */}
          {latestCondition && (
            <View className="mb-4">
              <Text className="text-lg font-bold text-white mb-3">Latest Condition</Text>
              <ContractConditionDetail
                condition={latestCondition}
                isLatest={true}
                contractId={contractId}
                clientId={String(contract?.clientId || '')}
                getStatusColor={getStatusColor}
                formatCurrency={formatCurrency}
                calculateTotalHours={calculateTotalHours}
                calculateEstimatedTotal={calculateEstimatedTotal}
              />
            </View>
          )}

          {/* Past Conditions */}
          {pastConditions.length > 0 && (
            <View className="mb-4">
              <Text className="text-lg font-bold text-white mb-3">
                Past Conditions ({pastConditions.length})
              </Text>
              <View className="gap-2">
                {pastConditions.map((condition: any) => (
                  <ContractConditionDetail
                    key={condition.id}
                    condition={condition}
                    isLatest={false}
                    contractId={contractId}
                    clientId={String(contract?.clientId || '')}
                    getStatusColor={getStatusColor}
                    formatCurrency={formatCurrency}
                    calculateTotalHours={calculateTotalHours}
                    calculateEstimatedTotal={calculateEstimatedTotal}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Actions based on status */}
          <View className="mt-4 gap-3">
            {contract.contractStatus === 'Pending' && latestCondition && (
              <>
                {latestCondition.conditionStatus === 'Accepted' && (
                  <>
                    <TouchableOpacity
                      className="bg-green-500 py-3.5 px-5 rounded-lg items-center"
                      onPress={() =>
                        router.push({
                          pathname: '/(protected)/(client)/projects/activate-contract',
                          params: { id: contractId },
                        })
                      }>
                      <Text className="text-white text-base font-semibold">
                        Activate Contract
                      </Text>
                    </TouchableOpacity>
                    <AlterContractStatusModal contractId={contractId} options="cancelled" />
                  </>
                )}
                {latestCondition.conditionStatus === 'Rejected' && (
                  <AlterContractStatusModal contractId={contractId} options="cancelled" />
                )}
                {latestCondition.conditionStatus === 'Pending' && (
                  <>
                    <Text className="text-gray-400 text-sm text-center mb-2">
                      Waiting for talent to respond to the offer.
                    </Text>
                    <AlterContractStatusModal contractId={contractId} options="cancelled" />
                  </>
                )}
              </>
            )}

            {contract.contractStatus === 'Activated' && (
              <AlterContractStatusModal contractId={contractId} options="completed" />
            )}

            {contract.contractStatus === 'Completed' && (
              <AlterContractStatusModal contractId={contractId} options="paid" />
            )}

            {contract.contractStatus === 'Cancelled' && (
              <Text className="text-red-400 text-sm text-center">
                Contract Cancelled by Client.
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}
