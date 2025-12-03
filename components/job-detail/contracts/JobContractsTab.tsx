import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getStatusColorObject } from '@/utils/get-status-color';

type JobContractsTabProps = {
  contracts: any[];
  isLoading: boolean;
};

export function JobContractsTab({ contracts, isLoading }: JobContractsTabProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="items-center justify-center py-20">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-400 mt-3 text-sm">Loading contracts...</Text>
      </View>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <View className="items-center justify-center py-20 rounded-2xl border border-white/10 bg-zinc-800">
        <Text className="text-lg font-semibold text-white mb-2">No contracts yet</Text>
        <Text className="text-sm text-white/70 text-center px-4">
          No contracts have been created for this job yet.
        </Text>
      </View>
    );
  }

  const renderContract = ({ item }: { item: any }) => {
    const contract = item?.jobContract ?? item;
    const statusColor = getStatusColorObject(contract?.contractStatus);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(protected)/contract-detail/${contract?.id}` as any)}
        className="bg-zinc-800/60 rounded-2xl p-4 mb-3 border border-white/10"
        activeOpacity={0.7}>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-bold text-white">Contract #{contract?.id}</Text>
          <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: statusColor.bg }}>
            <Text className="text-xs font-semibold" style={{ color: statusColor.text }}>
              {contract?.contractStatus || 'Pending'}
            </Text>
          </View>
        </View>
        <Text className="text-sm text-gray-300 mb-1">{contract?.roleTitle || 'Unnamed Role'}</Text>
        {contract?.talentName && (
          <Text className="text-xs text-gray-400">Talent: {contract.talentName}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="gap-4 px-2">
      <View className="rounded-2xl border border-white/10 bg-zinc-800 p-5">
        <View className="mb-4">
          <Text className="text-lg font-semibold text-white mb-1">Your Contracts</Text>
          <Text className="text-sm text-white/70">
            View and manage your contracts for this job.
          </Text>
        </View>
        <FlatList
          data={contracts}
          keyExtractor={(item) => `contract-${item?.jobContract?.id ?? item?.id}`}
          renderItem={renderContract}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 12 }}
        />
      </View>
    </View>
  );
}


