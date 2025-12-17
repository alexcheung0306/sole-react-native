import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, TouchableOpacity, View, Dimensions, RefreshControl, Text } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { router, Stack, useLocalSearchParams, usePathname } from 'expo-router';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileQueries } from '~/hooks/useProfileQueries';
import { Grid, User, Briefcase } from 'lucide-react-native';
import TalentProfile from '~/components/talent-profile/TalentProfile';
import UserPosts from '~/components/profile/UserPosts';
import JobHistory from '~/components/profile/JobHistory';
import ProfileSettings from '~/components/profile/profile-settings';
import { UserInfo } from '~/components/profile/userInfo';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3;

type TabKey = 'posts' | 'talent' | 'jobs';

export default function ProfileScreen() {
  const [imageSize, setImageSize] = useState(Dimensions.get('window').width / 3);
  const [profileTab, setProfileTab] = useState<TabKey>('posts');
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const params = useLocalSearchParams<{ username?: string }>();
  const pathname = usePathname();

  // Get username from params, or fallback to current user's username (for swipeable container)
  const username = params.username || user?.username;

  // Check if viewing own profile
  const isOwnProfile = user?.username === username;

  // Check if we're in a profile route (vs. swipable container)
  const isProfileRoute = pathname.includes('/profile/');

  // Get viewer user ID safely
  const viewerUserId = user?.id;

  // Use custom hook for profile queries
  const {
    userProfileData,
    profileLoading,
    isRefetchingProfile,
    profileError,
    refetchProfile,
    userPostsData,
    posts,
    userFetchNextPage,
    userHasNextPage,
    userIsFetchingNextPage,
    userIsLoading,
    isRefetchingPosts,
    userIsError,
    userError,
    refetchPosts,
    onRefresh,
    isRefreshing,
  } = useProfileQueries(username as string, viewerUserId as string | undefined, true);

  const userInfo = userProfileData?.userInfo;
  const talentInfo = userProfileData?.talentInfo;
  const talentLevel = userProfileData?.talentLevel || null;

  // Profile error state
  if (profileError && !profileLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-black">
          <CollapsibleHeader
            title={isOwnProfile ? 'User Profile' : `@${username}`}
            headerLeft={
              isProfileRoute ? (
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
            <Text className="mb-4 text-center text-red-400">Failed to load profile</Text>
            <Text className="mb-4 text-center text-sm text-gray-400">
              {profileError?.message || 'Please try again'}
            </Text>
            <TouchableOpacity
              onPress={onRefresh}
              className="rounded-lg bg-blue-500 px-6 py-3"
              disabled={isRefreshing}>
              <Text className="font-semibold text-white">
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
          title={isOwnProfile ? 'Talent Profile' : `@${username}`}
          headerLeft={
            isProfileRoute && !isOwnProfile ? (
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

        <ScrollView
          className="flex-1 bg-black"
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 50,
            paddingBottom: insets.bottom + 80,
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
          {/* Profile Header - Instagram Style */}
          <UserInfo
            userPostsData={userPostsData}
            username={username || ''}
            userProfileData={userProfileData}
          />

          {/* Tab Navigation */}
          <View className="border-t border-gray-800">
            <View className="flex-row">
              <TouchableOpacity
                activeOpacity={1}
                className={`flex-1 items-center border-b-2 py-3 ${
                  profileTab === 'posts' ? 'border-white' : 'border-transparent'
                }`}
                onPress={() => setProfileTab('posts')}>
                <Grid size={24} color={profileTab === 'posts' ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={1}
                className={`flex-1 items-center border-b-2 py-3 ${
                  profileTab === 'talent' ? 'border-white' : 'border-transparent'
                }`}
                onPress={() => setProfileTab('talent')}>
                <User size={24} color={profileTab === 'talent' ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={1}
                className={`flex-1 items-center border-b-2 py-3 ${
                  profileTab === 'jobs' ? 'border-white' : 'border-transparent'
                }`}
                onPress={() => setProfileTab('jobs')}>
                <Briefcase size={24} color={profileTab === 'jobs' ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Content */}
          <View className="flex-1" style={{ minHeight: 400 }}>
            {profileTab === 'posts' ? (
              <UserPosts
                userIsLoading={userIsLoading}
                userIsError={userIsError}
                userError={userError}
                posts={posts}
                userHasNextPage={userHasNextPage}
                userIsFetchingNextPage={userIsFetchingNextPage}
                userFetchNextPage={userFetchNextPage}
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
              />
            ) : profileTab === 'talent' ? (
              <TalentProfile
                userProfileData={userProfileData}
                talentLevel={talentLevel as unknown as number}
                talentInfo={talentInfo}
                isOwnProfile={isOwnProfile}
              />
            ) : profileTab === 'jobs' ? (
              <JobHistory />
            ) : null}
          </View>
        </ScrollView>
      </View>
    </>
  );
}
