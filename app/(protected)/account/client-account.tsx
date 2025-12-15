import {
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Gift, Building2, AlertCircle } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserProfileByUsername,
  activateClientProfileWithReferralCode,
} from '~/api/apiservice/soleUser_api';

export default function ClientAccountScreen() {
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const { soleUserId, soleUser } = useSoleUserContext();
  const username = soleUser?.username;
  const queryClient = useQueryClient();
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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

  const isClient =
    userProfileData?.soleUser?.clientLevel !== null &&
    userProfileData?.soleUser?.clientLevel !== undefined;

  // React Query mutation for activating client profile
  const activateMutation = useMutation({
    mutationFn: (referralCode: string) => {
      console.log('Activating client profile with:', {
        soleUserId,
        referralCode,
      });
      return activateClientProfileWithReferralCode(soleUserId!, referralCode);
    },
    onSuccess: (data) => {
      console.log('Client activation successful:', data);

      // Invalidate and refetch user profile queries
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['soleUser'] });

      // Also invalidate specific user profile if we have username
      if (soleUser?.username) {
        queryClient.invalidateQueries({
          queryKey: ['userProfile', soleUser.username],
        });
      }

      Alert.alert(
        'Client Account Activated!',
        data.message || 'Your client account has been successfully activated.',
        [{ text: 'OK', onPress: () => refetch() }]
      );

      // Clear the form
      setReferralCode('');
      setError('');
    },
    onError: (error: Error) => {
      console.error('Client activation failed:', error);
      const errorMessage = error.message || 'Failed to activate client account';
      setError(errorMessage);
      Alert.alert('Activation Failed', errorMessage);
    },
  });

  const handleSubmit = () => {
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

  const handleInputChange = (value: string) => {
    setReferralCode(value);
    if (error) setError('');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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
          title={'Client Account'}
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
              <Text className="mt-4 text-gray-400">Loading...</Text>
            </View>
          ) : !isClient ? (
            <View className="min-h-[400px] items-center justify-center">
              <View className="w-full max-w-md">
                {/* Header */}
                <View className="mb-8 items-center">
                  <View className="mb-4 rounded-full bg-blue-900/20 p-3">
                    <Gift size={32} color="#93c5fd" />
                  </View>
                  <Text className="mb-2 text-center text-2xl font-bold text-white">
                    Activate Client Account
                  </Text>
                  <Text className="text-center text-sm leading-6 text-gray-400">
                    Enter your referral code to unlock your client account and start hiring talent
                    for your projects
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
                      onChangeText={handleInputChange}
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
                    onPress={handleSubmit}
                    disabled={activateMutation.isPending || !referralCode.trim()}
                    activeOpacity={0.8}>
                    {activateMutation.isPending ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text className="font-semibold text-white">Activating...</Text>
                      </>
                    ) : (
                      <>
                        <Building2 size={16} color="#fff" />
                        <Text className="font-semibold text-white">Activate Client Account</Text>
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
            <View className="min-h-[400px] items-center justify-center px-4">
              <View className="items-center">
                <View className="mb-4 rounded-full bg-green-900/20 p-4">
                  <Building2 size={32} color="#22c55e" />
                </View>
                <Text className="mb-4 text-center text-2xl font-bold text-white">
                  Client Account Already Activated
                </Text>
                <Text className="text-center leading-6 text-gray-400">
                  Your client account is ready to use. You can now hire talent for your projects.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}
