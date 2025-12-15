import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { ScrollView, TouchableOpacity, View, RefreshControl, Text } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getUserProfileByUsername } from '~/api/apiservice/soleUser_api';
import { searchPosts } from '~/api/apiservice/post_api';
import ProfileSettings from '~/components/profile/profile-settings';
import ClientProfessionalProfile from '~/components/client/ClientProfessionalProfile';

export default function ClientProfileScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const params = useLocalSearchParams<{ username?: string }>();
  
  // Get username from params, or fallback to current user's username (for swipeable container)
  const username = params.username || user?.username;

  // Check if viewing own profile
  const isOwnProfile = user?.username === username;

  // Fetch user profile data from API
  const {
    data: userProfileData,
    isLoading: profileLoading,
    isRefetching: isRefetchingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      if (!username || typeof username !== 'string') {
        throw new Error('Username not found');
      }
      const result = await getUserProfileByUsername(username);

      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!username,
    refetchOnWindowFocus: false,
  });

  // Fetch user posts with infinite scroll
  const {
    data: userPostsData,
    fetchNextPage: userFetchNextPage,
    hasNextPage: userHasNextPage,
    isFetchingNextPage: userIsFetchingNextPage,
    isLoading: userIsLoading,
    isRefetching: isRefetchingPosts,
    isError: userIsError,
    error: userError,
    refetch: refetchPosts,
  } = useInfiniteQuery({
    queryKey: ['profilePagePosts', username],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await searchPosts({
        soleUserId: userProfileData?.userInfo?.soleUserId,
        content: '',
        pageNo: pageParam,
        pageSize: 9, // 3x3 grid
        orderBy: 'createdAt',
        orderSeq: 'desc',
      });
      return response;
    },
    enabled: !!userProfileData?.userInfo?.soleUserId,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length - 1;
      const loadedItems = allPages.reduce((sum, page) => sum + page.data.length, 0);
      // Check if there are more items to load
      if (loadedItems < lastPage.total) {
        return currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  const userInfo = userProfileData?.userInfo;

  // Pull to refresh
  const onRefresh = useCallback(() => {
    refetchProfile();
    refetchPosts();
  }, [refetchProfile, refetchPosts]);

  const isRefreshing = isRefetchingProfile || isRefetchingPosts;

  // Loading state
  if (profileLoading && !userProfileData) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-black">
          <CollapsibleHeader
            title={isOwnProfile ? 'Client Profile' : `@${username}`}
            headerLeft={
              !isOwnProfile ? (
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
              ) : undefined
            }
            animatedStyle={animatedHeaderStyle}
            onHeightChange={handleHeightChange}
            isDark={true}
          />
          <View className="flex-1 items-center justify-center">
            <Text className="text-white">Loading profile...</Text>
          </View>
        </View>
      </>
    );
  }

  // Profile error state
  if (profileError && !profileLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-black">
          <CollapsibleHeader
            title={isOwnProfile ? 'Talent Profile' : `@${username}`}
            headerLeft={
              !isOwnProfile ? (
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
              ) : undefined
            }
            animatedStyle={animatedHeaderStyle}
            onHeightChange={handleHeightChange}
            isDark={true}
          />
          <ScrollView
            className="flex-1 bg-black"
            contentContainerStyle={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing || false}
                onRefresh={onRefresh}
                tintColor="#3b82f6"
                colors={['#3b82f6']}
                progressViewOffset={insets.top + 50}
              />
            }>
            <Text className="text-red-400 text-center mb-4">
              Failed to load profile
            </Text>
            <Text className="text-gray-400 text-center mb-4 text-sm">
              {profileError?.message || 'Please try again'}
            </Text>
            <TouchableOpacity
              onPress={onRefresh}
              className="bg-blue-500 px-6 py-3 rounded-lg"
              disabled={isRefreshing}>
              <Text className="text-white font-semibold">
                {isRefreshing ? 'Refreshing...' : 'Retry'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title={isOwnProfile ? 'Client Profile' : `@${username}`}
          headerLeft={
            !isOwnProfile ? (
              <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            ) : undefined
          }
          headerRight={
            isOwnProfile ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  style={{ padding: 8 }}
                  onPress={() => {
                    console.log('Notifications pressed');
                  }}>
                  <Ionicons name="notifications-outline" size={24} color="#fff" />
                </TouchableOpacity>

                <ProfileSettings />
              </View>
            ) : undefined
          }
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
        />

        <ClientProfessionalProfile
          userProfileData={userProfileData}
          userPostsData={userPostsData}
          username={username || undefined}
          isOwnProfile={isOwnProfile}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          userIsLoading={userIsLoading}
          userIsError={userIsError}
          userError={userError}
          userHasNextPage={userHasNextPage}
          userIsFetchingNextPage={userIsFetchingNextPage}
          userFetchNextPage={userFetchNextPage}
          onScroll={onScroll}
          topPadding={insets.top + 50}
          bottomPadding={insets.bottom + 80}
        />
      </View>
    </>
  );
}
