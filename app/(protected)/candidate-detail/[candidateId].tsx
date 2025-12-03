import { Stack, useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { useQuery } from '@tanstack/react-query';
import { searchApplicants } from '@/api/apiservice/applicant_api';
import { CustomTabs } from '@/components/custom/custom-tabs';

// Status color mapping
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    applied: '#3b82f6',
    shortlisted: '#facc15',
    offered: '#f97316',
    accepted: '#10b981',
    rejected: '#ef4444',
  };
  return colorMap[status.toLowerCase()] || '#6b7280';
};

export default function CandidateDetailPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { soleUserId } = useSoleUserContext();

  const candidateId = params.candidateId as string | undefined;
  const roleId = params.roleId as string | undefined;
  const projectId = params.projectId as string | undefined;

  const [currentTab, setCurrentTab] = useState('talent-profile');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Fetch candidate data
  const { data: candidatesResponse, isLoading } = useQuery({
    queryKey: ['candidate-detail', roleId, candidateId],
    queryFn: async () => {
      if (!roleId) return null;
      const params = new URLSearchParams();
      params.append('roleId', roleId);
      params.append('pageNumber', '1');
      params.append('pageSize', '100');
      return searchApplicants(params.toString());
    },
    enabled: !!roleId,
  });

  const candidateResults = candidatesResponse?.data ?? candidatesResponse?.content ?? candidatesResponse ?? [];
  const candidate = candidateResults.find((item: any) => item?.jobApplicant?.id?.toString() === candidateId);

  const applicant = candidate?.jobApplicant ?? {};
  const userInfo = candidate?.userInfo ?? {};
  const username = candidate?.username || userInfo?.username || 'unknown';
  const statusColor = getStatusColor(applicant?.applicationStatus || 'applied');

  const tabs = [
    { id: 'talent-profile', label: 'Talent Profile' },
    { id: 'application', label: 'Application Details' },
    { id: 'actions', label: 'Actions' },
  ];

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-900">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-white/60">Loading candidate details...</Text>
      </View>
    );
  }

  if (!candidate) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-900 px-4">
        <Text className="text-lg font-semibold text-white mb-2">Candidate not found</Text>
        <Text className="text-sm text-white/60 text-center mb-4">
          The candidate you're looking for doesn't exist or has been removed.
        </Text>
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-full"
          onPress={() => router.back()}>
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-900" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-white flex-1 text-center">
          Candidate Details
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Candidate Header Card */}
        <View className="mx-4 mt-4 rounded-2xl border border-white/10 bg-zinc-800 p-4">
          <View className="flex-row items-center gap-4">
            <Image
              source={{
                uri: candidate?.comcardFirstPic || userInfo?.profilePic || undefined,
              }}
              className="w-20 h-20 rounded-full bg-zinc-700"
            />
            <View className="flex-1">
              <Text className="text-lg font-semibold text-white">
                {userInfo?.name || 'Unnamed candidate'}
              </Text>
              <Text className="text-sm text-white/60">@{username}</Text>
              <View
                className="mt-2 px-3 py-1 rounded-full self-start"
                style={{ backgroundColor: statusColor + '33' }}>
                <Text className="text-xs font-semibold" style={{ color: statusColor }}>
                  {applicant?.applicationStatus || 'applied'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="mt-4 px-4">
          <CustomTabs
            tabs={tabs}
            value={currentTab}
            onValueChange={setCurrentTab}
          />
        </View>

        {/* Tab Content */}
        <View className="px-4 pb-8">
          {currentTab === 'talent-profile' && (
            <View className="mt-4 rounded-2xl border border-white/10 bg-zinc-800 p-4">
              <Text className="text-base font-semibold text-white mb-2">Talent Profile</Text>
              <Text className="text-sm text-white/60">
                Profile information will be displayed here.
              </Text>
            </View>
          )}

          {currentTab === 'application' && (
            <View className="mt-4 rounded-2xl border border-white/10 bg-zinc-800 p-4">
              <Text className="text-base font-semibold text-white mb-4">Application Details</Text>
              
              <View className="gap-3">
                <View className="gap-1">
                  <Text className="text-xs text-white/60 uppercase">Application Status</Text>
                  <Text className="text-sm text-white">{applicant?.applicationStatus || 'N/A'}</Text>
                </View>
                
                <View className="gap-1">
                  <Text className="text-xs text-white/60 uppercase">Application Process</Text>
                  <Text className="text-sm text-white">{applicant?.applicationProcess || 'N/A'}</Text>
                </View>

                <View className="gap-1">
                  <Text className="text-xs text-white/60 uppercase">Quote Price</Text>
                  <Text className="text-sm text-white">
                    ${applicant?.quotePrice || applicant?.otQuotePrice || 'N/A'}
                  </Text>
                </View>

                <View className="gap-1">
                  <Text className="text-xs text-white/60 uppercase">Payment Basis</Text>
                  <Text className="text-sm text-white">{applicant?.paymentBasis || 'N/A'}</Text>
                </View>

                <View className="gap-1">
                  <Text className="text-xs text-white/60 uppercase">Skills</Text>
                  <Text className="text-sm text-white">{applicant?.skills || 'N/A'}</Text>
                </View>

                <View className="gap-1">
                  <Text className="text-xs text-white/60 uppercase">Answer</Text>
                  <Text className="text-sm text-white">{applicant?.answer || 'N/A'}</Text>
                </View>

                <View className="gap-1">
                  <Text className="text-xs text-white/60 uppercase">Applied Date</Text>
                  <Text className="text-sm text-white">
                    {applicant?.createdAt
                      ? new Date(applicant.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </Text>
                </View>

                <View className="gap-1">
                  <Text className="text-xs text-white/60 uppercase">Last Updated</Text>
                  <Text className="text-sm text-white">
                    {applicant?.updatedAt
                      ? new Date(applicant.updatedAt).toLocaleDateString()
                      : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {currentTab === 'actions' && (
            <View className="mt-4 rounded-2xl border border-white/10 bg-zinc-800 p-4">
              <Text className="text-base font-semibold text-white mb-2">Actions</Text>
              <Text className="text-sm text-white/60">
                Actions to manage this candidate will be displayed here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

