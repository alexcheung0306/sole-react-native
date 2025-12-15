import {
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Gift, UserCheck, AlertCircle } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getUserProfileByUsername,
  activateTalentProfileWithReferralCode,
} from '~/api/apiservice/soleUser_api';
import TalentProfile from '~/components/talent-profile/TalentProfile';

export default function TalentAccountScreen() {
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const { soleUserId, soleUser } = useSoleUserContext();
  const username = soleUser?.username;
  const [refreshing, setRefreshing] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const {
    data: userProfileData,
    isLoading: userProfileIsLoading,
    error: userProfileError,
    refetch,
  } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      if (!username || typeof username !== 'string') {
        throw new Error('Username not found');
      }
      const result = await getUserProfileByUsername(username);
      return result;
    },
    enabled: !!username && username !== undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const talentLevel =
    userProfileData?.talentLevel !== null && userProfileData?.talentLevel !== undefined
      ? typeof userProfileData.talentLevel === 'string'
        ? parseInt(userProfileData.talentLevel)
        : userProfileData.talentLevel
      : null;
  const talentInfo = userProfileData?.talentInfo;
  const isOwnProfile = true; // This is always the user's own profile

  const activateMutation = useMutation({
    mutationFn: (code: string) => activateTalentProfileWithReferralCode(soleUserId!, code),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['soleUser'] });
      if (soleUser?.username) {
        queryClient.invalidateQueries({ queryKey: ['userProfile', soleUser.username] });
      }
      Alert.alert(
        'Talent Profile Activated!',
        data.message || 'Your talent profile has been activated.',
        [{ text: 'OK', onPress: () => refetch() }],
      );
      setReferralCode('');
      setError('');
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to activate talent profile');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleActivate = () => {
    if (!referralCode.trim()) {
      setError('Please enter a referral code');
      return;
    }
    if (!soleUserId) {
      setError('User not found. Please try again.');
      return;
    }
    setError('');
    activateMutation.mutate(referralCode.trim());
  };

  return (
    <>
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          headerLeft={
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              className="flex items-center justify-center p-2">
              <ChevronLeft color="#93c5fd" size={24} />
            </TouchableOpacity>
          }
          title={'Talent Account'}
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
          headerRight={null}
          isScrollCollapsible={false}
        />
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{
            paddingTop: insets.top + 70, // Increased for header space
            paddingBottom: insets.bottom + 80,
          }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#93c5fd"
            />
          }>
          {userProfileIsLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#93c5fd" />
              <Text className="mt-4 text-gray-400">Loading profile...</Text>
            </View>
          ) : userProfileError ? (
            <View className="flex-1 items-center justify-center px-4 py-20">
              <Text className="mb-4 text-center text-red-400">
                Error loading profile. Please try again.
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                className="rounded-lg bg-zinc-700 px-6 py-3">
                <Text className="font-semibold text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : talentLevel === null ? (
            <View className="min-h-[400px] items-center justify-center">
              <View className="w-full max-w-md">
                {/* Header */}
                <View className="mb-8 items-center">
                  <View className="mb-4 rounded-full bg-blue-900/20 p-3">
                    <Gift size={32} color="#93c5fd" />
                  </View>
                  <Text className="mb-2 text-center text-2xl font-bold text-white">
                    Activate Talent Profile
                  </Text>
                  <Text className="text-center text-sm leading-6 text-gray-400">
                    Enter your referral code to unlock your talent profile and start showcasing your
                    skills.
                  </Text>
                </View>

                {/* Form */}
                <View className="space-y-4">
                  <View>
                    <TextInput
                      className="font-mono w-full rounded-lg border border-gray-700 bg-zinc-900 px-4 py-4 text-center tracking-wider text-white"
                      placeholder="Enter your referral code"
                      placeholderTextColor="#9ca3af"
                      value={referralCode}
                      onChangeText={(v) => {
                        setReferralCode(v);
                        if (error) setError('');
                      }}
                      editable={!activateMutation.isPending}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {error ? (
                      <View className="mt-2 flex-row items-center gap-2">
                        <AlertCircle size={16} color="#ef4444" />
                        <Text className="text-sm text-red-400">{error}</Text>
                      </View>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    className="w-full flex-row items-center justify-center gap-2 rounded-lg bg-zinc-700 px-6 py-4"
                    onPress={handleActivate}
                    disabled={activateMutation.isPending || !referralCode.trim()}
                    activeOpacity={0.8}>
                    {activateMutation.isPending ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text className="font-semibold text-white">Activating...</Text>
                      </>
                    ) : (
                      <>
                        <UserCheck size={16} color="#fff" />
                        <Text className="font-semibold text-white">Activate Talent Profile</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Help Text */}
                <View className="mt-6">
                  <Text className="text-center text-xs text-gray-500">
                    Don't have a referral code?
                  </Text>
                  <Text className="text-center text-xs text-gray-500">
                    Contact our support team to get one.
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="px-4">
              <TalentProfile
                talentLevel={talentLevel ?? 0}
                talentInfo={talentInfo}
                isOwnProfile={isOwnProfile}
                userProfileData={userProfileData}
                scrollEnabled={false}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}
