import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '~/context/NavigationContext';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfileByUsername } from '~/api/apiservice/soleUser_api';
import { searchPosts } from '~/api/apiservice/post_api';
import { updateUserInfoBySoleUserId } from '~/api/apiservice/userInfo_api';
import { updateSoleUserByClerkId, getSoleUserByClerkId } from '~/api/apiservice';
import { updateTalentInfoWithComcardBySoleUserId } from '~/api/apiservice/talentInfo_api';
import {
  Grid,
  User,
  Briefcase,
} from 'lucide-react-native';
import { ProfileEditModal, ProfileFormValues } from '~/components/profile/ProfileEditModal';
import { TalentInfoEditModal, TalentFormValues } from '~/components/profile/TalentInfoEditModal';
import FollowList from '~/components/follow/follow-list';
import TalentProfile from '~/components/profile/TalentProfile';
import UserPosts from '~/components/profile/UserPosts';
import JobHistory from '~/components/profile/JobHistory';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3;

type TabKey = 'posts' | 'talent' | 'jobs';

export default function ClientProfileScreen() {
  const [imageSize, setImageSize] = useState(Dimensions.get('window').width / 3);
  const [profileTab, setProfileTab] = useState<TabKey>('posts');
  const [isUser, setIsUser] = useState(false);
  const [isTalent, setIsTalent] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showEditTalentModal, setShowEditTalentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { signOut } = useAuth();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { currentMode } = useNavigation();
  const queryClient = useQueryClient();

  // Check if viewing own profile
  const isOwnProfile = user?.username === username;

  // Fetch user profile data from API
  const {
    data: userProfileData,
    isLoading: profileLoading,
    error: profileError,
    refetch,
  } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      if (!username || typeof username !== 'string') {
        throw new Error('Username not found');
      }
      const result = await getUserProfileByUsername(username);

      // Check if viewing own profile
      if (user?.username === username) {
        setIsUser(true);
      } else {
        setIsUser(false);
      }

      // Check if user has talent profile
      if (result.talentLevel) {
        setIsTalent(true);
      } else {
        setIsTalent(false);
      }

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

  // Mutation for updating user_info
  const updateUserInfoMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const soleUserId = userProfileData?.userInfo?.soleUserId;
      if (!soleUserId) throw new Error('User ID not found');

      const userInfoValues = {
        ...values,
        profilePic: values.profilePic || userInfo?.profilePic,
        category: values.category.join(','),
        soleUserId,
      };

      return await updateUserInfoBySoleUserId(soleUserId, userInfoValues);
    },
  });

  // Mutation for updating sole_user
  const updateSoleUserMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user?.id) throw new Error('Clerk ID not found');

      const currentSoleUser = await getSoleUserByClerkId(user.id);

      const soleUserValues = {
        clerkId: user.id,
        username: values.username,
        email: currentSoleUser?.email || user.primaryEmailAddress?.emailAddress,
        talentLevel: currentSoleUser?.talentLevel,
        clientLevel: currentSoleUser?.clientLevel,
        image: values.profilePic || currentSoleUser?.image,
      };

      return await updateSoleUserByClerkId(user.id, soleUserValues);
    },
  });

  // Mutation for updating talent_info
  const updateTalentInfoMutation = useMutation({
    mutationFn: async (values: TalentFormValues) => {
      const soleUserId = userProfileData?.userInfo?.soleUserId;
      if (!soleUserId) throw new Error('User ID not found');

      const talentData = {
        talentName: values.talentName,
        gender: values.gender,
        eyeColor: values.eyeColor,
        hairColor: values.hairColor,
        age: values.age,
        height: values.height,
        chest: values.chest,
        waist: values.waist,
        hip: values.hip,
        shoes: values.shoes,
        ethnic: values.ethnic,
        region: values.region,
        experience: values.experience,
        bucket: 'talentinformation',
        soleUserId: soleUserId,
        snapshotHalfBody: values.snapshotHalfBody,
        snapshotFullBody: values.snapshotFullBody,
      };

      const comcardData = {
        id: userProfileData?.comcard?.id,
        configId: '1',
        photoConfig: [],
        isActive: 'true',
        soleUserId: soleUserId,
        pdf: '',
        bucket: 'comcards',
        comcardImageName: soleUserId,
        length: 5,
        talentNameColor: 'black',
      };

      return await updateTalentInfoWithComcardBySoleUserId({
        soleUserId,
        talentData,
        comcardData,
      });
    },
  });

  // Handle profile save
  const handleProfileSave = async (values: ProfileFormValues) => {
    try {
      const usernameChanged = values.username !== username;

      await Promise.all([
        updateUserInfoMutation.mutateAsync(values),
        updateSoleUserMutation.mutateAsync(values),
      ]);

      if (user) {
        try {
          await user.update({
            username: values.username,
          });
        } catch (clerkError) {
          console.error('Clerk update error:', clerkError);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['userProfile', username] });
      queryClient.invalidateQueries({ queryKey: ['profilePagePosts', username] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', values.username] });
      queryClient.invalidateQueries({ queryKey: ['profilePagePosts', values.username] });

      Alert.alert('Success', 'Profile updated successfully');

      // If username changed, redirect to new profile URL
      if (usernameChanged) {
        router.replace(`/(protected)/(user)/user/${values.username}` as any);
      } else {
        refetch();
      }
    } catch (error) {
      console.error('Profile save error:', error);
      throw error;
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/sign-in' as any);
          } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  // Handle talent info save
  const handleTalentInfoSave = async (values: TalentFormValues) => {
    try {
      await updateTalentInfoMutation.mutateAsync(values);

      queryClient.invalidateQueries({ queryKey: ['userProfile', username] });

      Alert.alert('Success', 'Talent profile updated successfully');
      refetch();
    } catch (error) {
      console.error('Talent info save error:', error);
      throw error;
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  // Flatten posts from all pages
  const posts = userPostsData?.pages.flatMap((page) => page.data) ?? [];
  const totalPosts = userPostsData?.pages[0]?.total ?? 0;

  const userInfo = userProfileData?.userInfo;
  const talentInfo = userProfileData?.talentInfo;
  const profileBio = userInfo?.bio || 'No bio available';
  const profilePic = userInfo?.profilePic || user?.imageUrl;
  const talentLevel = userProfileData?.talentLevel || null;

  // Parse categories from CSV
  const categoryValue = typeof userInfo?.category === 'string' ? userInfo.category.split(',') : [];
  const filteredCategoryChips = categoryValue.filter((item: string) => item !== '');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title={isOwnProfile ? 'Client Profile' : `@${username}`}
          headerLeft={
            !isOwnProfile ? (
              <TouchableOpacity onPress={handleBackPress} style={{ padding: 8 }}>
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
                <TouchableOpacity style={{ padding: 8 }} onPress={() => setShowSettingsModal(true)}>
                  <Ionicons name="ellipsis-horizontal-outline" size={24} color="#fff" />
                </TouchableOpacity>
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
          <View className="px-4 py-4">
            {/* User Info Row */}
            <View className="mb-4 flex-row items-center">
              {/* Avatar */}
              <View className="mr-4">
                {profilePic ? (
                  <ExpoImage
                    source={{ uri: profilePic }}
                    className="h-20 w-20 rounded-full border-2 border-gray-600"
                  />
                ) : (
                  <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-gray-600 bg-gray-700">
                    <User size={32} color="#9ca3af" />
                  </View>
                )}
              </View>

              {/* Stats */}
              <View className="flex-1 flex-row justify-around">
                <View className="items-center">
                  <Text className="text-lg font-bold text-white">{totalPosts}</Text>
                  <Text className="text-sm text-gray-400">Posts</Text>
                </View>
                <FollowList username={username || ''} isLoading={profileLoading} type="follower" />
                <FollowList username={username || ''} isLoading={profileLoading} type="following" />
              </View>
            </View>

            {/* Name and Bio */}
            <View className="mb-4">
              <Text className="mb-1 text-sm font-semibold text-white">
                {userInfo?.name || user?.firstName || 'Unknown User'}
              </Text>
              <Text className="mb-2 text-sm text-white">{profileBio}</Text>

              {/* Category Chips */}
              {filteredCategoryChips.length > 0 && (
                <View className="mb-3 flex-row flex-wrap">
                  {filteredCategoryChips.map((category: string, index: number) => (
                    <View key={index} className="mb-1 mr-2 rounded-full bg-gray-700 px-3 py-1">
                      <Text className="text-xs text-white">{category.trim()}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              {isOwnProfile ? (
                <ProfileEditModal
                  visible={showEditProfileModal}
                  onClose={() => setShowEditProfileModal(false)}
                  onSave={handleProfileSave}
                  initialValues={{
                    profilePic: userInfo?.profilePic || user?.imageUrl || '',
                    username: username || '',
                    name: userInfo?.name || user?.firstName || '',
                    bio: userInfo?.bio || '',
                    category: filteredCategoryChips || [],
                  }}
                  isLoading={updateUserInfoMutation.isPending || updateSoleUserMutation.isPending}
                />
              ) : (
                <View className="flex-row gap-2">
                  <TouchableOpacity className="flex-1 rounded-lg bg-gray-700 px-4 py-2">
                    <Text className="text-center font-semibold text-white">Follow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 rounded-lg bg-gray-700 px-4 py-2">
                    <Text className="text-center font-semibold text-white">Message</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

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
                talentInfo={talentInfo}
                isOwnProfile={isOwnProfile}
                setShowEditTalentModal={setShowEditTalentModal}
              />
            ) : profileTab === 'jobs' ? (
              <JobHistory />
            ) : null}
          </View>
        </ScrollView>

        {/* Talent Info Edit Modal */}
        {isTalent && (
          <TalentInfoEditModal
            visible={showEditTalentModal}
            onClose={() => setShowEditTalentModal(false)}
            onSave={handleTalentInfoSave}
            initialValues={{
              talentName: talentInfo?.talentName || '',
              gender: talentInfo?.gender || '',
              eyeColor: talentInfo?.eyeColor || '',
              hairColor: talentInfo?.hairColor || '',
              age: talentInfo?.age?.toString() || '',
              height: talentInfo?.height?.toString() || '',
              chest: talentInfo?.chest?.toString() || '',
              waist: talentInfo?.waist?.toString() || '',
              hip: talentInfo?.hip?.toString() || '',
              shoes: talentInfo?.shoes?.toString() || '',
              ethnic: talentInfo?.ethnic || '',
              region: talentInfo?.region || '',
              experience: talentInfo?.experience || '',
              snapshotHalfBody: talentInfo?.snapshotHalfBody,
              snapshotFullBody: talentInfo?.snapshotFullBody,
            }}
          />
        )}

        {/* Settings Modal */}
        <Modal
          visible={showSettingsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSettingsModal(false)}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'flex-end',
            }}
            activeOpacity={1}
            onPress={() => setShowSettingsModal(false)}>
            <View
              style={{
                backgroundColor: '#1f2937',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: insets.bottom,
              }}
              onStartShouldSetResponder={() => true}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: '#6b7280',
                  borderRadius: 2,
                  alignSelf: 'center',
                  marginTop: 12,
                  marginBottom: 8,
                }}
              />
              <TouchableOpacity
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: '#374151',
                }}
                onPress={() => {
                  setShowSettingsModal(false);
                  // Add settings functionality here
                }}>
                <Text style={{ color: '#ffffff', fontSize: 16 }}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: '#374151',
                }}
                onPress={() => {
                  setShowSettingsModal(false);
                  // Add help functionality here
                }}>
                <Text style={{ color: '#ffffff', fontSize: 16 }}>Help & Support</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                }}
                onPress={() => {
                  setShowSettingsModal(false);
                  handleSignOut();
                }}>
                <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '600' }}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </>
  );
}
