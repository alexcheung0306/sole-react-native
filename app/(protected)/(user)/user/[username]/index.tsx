import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, TouchableOpacity, View, Dimensions } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getUserProfileByUsername } from '~/api/apiservice/soleUser_api';
import { searchPosts } from '~/api/apiservice/post_api';
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
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const params = useLocalSearchParams<{ username?: string }>();
  
  // Get username from params, or fallback to current user's username (for swipeable container)
  const username = params.username || user?.username;

  // Check if viewing own profile
  const isOwnProfile = user?.username === username;

  // Fetch user profile data from API
  const {
    data: userProfileData,
    isLoading: profileLoading,
    error: profileError,
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
    isError: userIsError,
    error: userError,
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

  const posts = userPostsData?.pages.flatMap((page) => page.data) ?? [];
  const userInfo = userProfileData?.userInfo;
  const talentInfo = userProfileData?.talentInfo;
  const talentLevel = userProfileData?.talentLevel || null;

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
          translateY={headerTranslateY}
          isDark={true}
        />

        <ScrollView
          className="flex-1 bg-black"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 20,
          }}>
          {/* Profile Header - Instagram Style */}
          <UserInfo 
            userPostsData={userPostsData} 
            username={username} 
            userProfileData={userProfileData} 
          />

          {/* Tab Navigation */}
          <View className="border-t border-gray-800">
            <View className="flex-row">
              <TouchableOpacity
                className={`flex-1 items-center border-b-2 py-3 ${
                  profileTab === 'posts' ? 'border-white' : 'border-transparent'
                }`}
                onPress={() => setProfileTab('posts')}>
                <Grid size={24} color={profileTab === 'posts' ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 items-center border-b-2 py-3 ${
                  profileTab === 'talent' ? 'border-white' : 'border-transparent'
                }`}
                onPress={() => setProfileTab('talent')}>
                <User size={24} color={profileTab === 'talent' ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
              <TouchableOpacity
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
                posts={posts}
                userHasNextPage={userHasNextPage}
                userIsFetchingNextPage={userIsFetchingNextPage}
                userFetchNextPage={userFetchNextPage}
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
