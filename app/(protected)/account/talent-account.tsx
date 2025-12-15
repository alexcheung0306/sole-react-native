import {
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { useQuery } from '@tanstack/react-query';
import { getUserProfileByUsername } from '~/api/apiservice/soleUser_api';
import TalentProfile from '~/components/talent-profile/TalentProfile';

export default function TalentAccountScreen() {
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const { soleUserId, soleUser } = useSoleUserContext();
  const username = soleUser?.username;
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

  const talentLevel =
    userProfileData?.talentLevel !== null && userProfileData?.talentLevel !== undefined
      ? typeof userProfileData.talentLevel === 'string'
        ? parseInt(userProfileData.talentLevel)
        : userProfileData.talentLevel
      : null;
  const talentInfo = userProfileData?.talentInfo;
  const isOwnProfile = true; // This is always the user's own profile

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
          ) : talentLevel === 0 ? (
            <View className="px-4">
              <TalentProfile
                talentLevel={talentLevel ?? 0}
                talentInfo={talentInfo}
                isOwnProfile={isOwnProfile}
                userProfileData={userProfileData}
                scrollEnabled={false}
              />
            </View>
          ):null}
        </ScrollView>
      </View>
    </>
  );
}
