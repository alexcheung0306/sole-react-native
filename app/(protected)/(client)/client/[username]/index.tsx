import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Dimensions, Alert, Modal, RefreshControl } from 'react-native';
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
import { Grid, User, Briefcase } from 'lucide-react-native';
import { Image } from 'expo-image';
import { UserInfoForm, ProfileFormValues } from '~/components/profile/UserInfo-form';
import { TalentInfoForm, TalentFormValues } from '~/components/talent-profile/TalentInfo-form';
import FollowList from '~/components/follow/follow-list';
import TalentProfile from '~/components/talent-profile/TalentProfile';
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
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { currentMode } = useNavigation();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['profilePagePosts', username] }),
      ]);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
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
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
        />
        <ScrollView
          className="flex-1 bg-black"
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="rgb(255, 255, 255)"
              colors={['rgb(255, 255, 255)']}
            />
          }
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 20,
          }}>
          <View className="px-4 py-4">
            <Text className="text-white text-lg">Client Profile Content</Text>
            <Text className="text-gray-400 mt-2">Username: {username}</Text>
            {/* Add more profile content here */}
          </View>
        </ScrollView>
      </View>
    </>
  );
}
