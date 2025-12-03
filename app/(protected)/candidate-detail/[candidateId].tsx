import { Stack, useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { useQuery } from '@tanstack/react-query';
import { searchApplicants } from '@/api/apiservice/applicant_api';
import { getUserProfileByUsername } from '@/api/apiservice/soleUser_api';
import { talentSearchJobContracts } from '@/api/apiservice/jobContracts_api';
import { CustomTabs } from '@/components/custom/custom-tabs';
import { getStatusColor } from '@/utils/get-status-color';
import TalentProfile from '~/components/talent-profile/TalentProfile';
import { ApplicationDetail } from '~/components/project-detail/roles/ApplicationDetail';
import { ActionToCandidates } from '~/components/project-detail/roles/ActionToCandidates';

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

  console.log('candidatesResponsexxxxxxxasd', candidate);

  // Fetch full user profile data (like web version does)
  const {
    data: talentProfileData,
    isLoading: isLoadingTalentProfile
  } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      if (!username || username === 'unknown' || username.trim() === '') {
        return null;
      }
      return getUserProfileByUsername(username);
    },
    enabled: !!username && username !== 'unknown' && username.trim() !== '',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Fetch contracts for this applicant (for Actions tab)
  const searchUrl = `projectId=${projectId}&orderBy=createdAt&orderSeq=desc&pageNo=0&pageSize=99`;
  const { 
    data: contractsData, 
    isLoading: isLoadingContracts 
  } = useQuery({
    queryKey: ['applicantContracts', applicant?.soleUserId, projectId],
    queryFn: async () => {
      if (!applicant?.soleUserId || !projectId) return [];
      const result = await talentSearchJobContracts(applicant.soleUserId, searchUrl);
      return result?.data || [];
    },
    enabled: !!applicant?.soleUserId && !!projectId && applicant?.applicationStatus === 'offered',
  });

  const tabs = [
    { id: 'talent-profile', label: 'Talent Profile' },
    { id: 'application', label: 'Application Details' },
    { id: 'actions', label: 'Actions' },
  ];

  if (isLoading || isLoadingTalentProfile) {
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
                uri: talentProfileData?.userInfo?.profilePic ||
                  candidate?.comcardFirstPic ||
                  userInfo?.profilePic ||
                  undefined,
              }}
              className="w-20 h-20 rounded-full bg-zinc-700"
            />
            <View className="flex-1">
              <Text className="text-lg font-semibold text-white">
                {talentProfileData?.userInfo?.name || userInfo?.name || 'Unnamed candidate'}
              </Text>
              <Text className="text-sm text-white/60">@{username}</Text>
              <View
                className="mt-2 px-3 py-1.5 rounded-full border self-start"
                style={{
                  backgroundColor: statusColor + '20',
                  borderColor: statusColor + '60',
                }}>
                <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: statusColor }}>
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
            <View className="">
              {!talentProfileData || !talentProfileData.talentInfo ? (
                <View className="py-8">
                  <Text className="text-base font-semibold text-white mb-2 text-center">
                    Profile Not Available
                  </Text>
                  <Text className="text-sm text-white/60 text-center">
                    {username === 'unknown'
                      ? "This user's profile information is not available."
                      : "Unable to load profile data for this user."}
                  </Text>
                </View>
              ) : (
                <TalentProfile
                  userProfileData={talentProfileData}
                  talentLevel={parseInt(talentProfileData?.talentLevel || '0')}
                  talentInfo={talentProfileData?.talentInfo}
                  isOwnProfile={false} />
              )}
            </View>
          )}

          {currentTab === 'application' && (
            <ApplicationDetail applicant={applicant} />
          )}

          {currentTab === 'actions' && (
            <ActionToCandidates
              applicant={candidate}
              projectData={{ id: projectId }}
              roleId={roleId ? parseInt(roleId as string) : undefined}
              contractsData={contractsData}
              isLoadingContracts={isLoadingContracts}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

