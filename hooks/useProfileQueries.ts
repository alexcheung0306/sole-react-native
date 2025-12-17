import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getUserProfileByUsername } from '~/api/apiservice/soleUser_api';
import { searchPosts } from '~/api/apiservice/post_api';

export function useProfileQueries(userIdentifier: string | undefined, viewerUserId?: string | null, includeProfileData = true) {
  // Fetch user profile data (optional)
  const {
    data: userProfileData,
    isLoading: profileLoading,
    isRefetching: isRefetchingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['userProfile', userIdentifier],
    queryFn: async () => {
      if (!userIdentifier || typeof userIdentifier !== 'string') {
        throw new Error('User identifier not found');
      }
      const result = await getUserProfileByUsername(userIdentifier);
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: includeProfileData && !!userIdentifier,
    refetchOnWindowFocus: false,
  });

  // Get userId from profile data or use directly if provided
  const targetUserId = userProfileData?.userInfo?.soleUserId || userIdentifier;

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
    queryKey: ['profilePagePosts', userIdentifier],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await searchPosts({
        soleUserId: targetUserId,
        viewerUserId: viewerUserId as string,
        content: '',
        pageNo: pageParam,
        pageSize: 10, // Default page size
        orderBy: 'createdAt',
        orderSeq: 'desc',
      });
      return response;
    },
    enabled: !!targetUserId,
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

  // Flatten posts
  const posts = userPostsData?.pages.flatMap((page) => page.data) ?? [];

  // Pull to refresh
  const onRefresh = () => {
    if (includeProfileData) refetchProfile();
    refetchPosts();
  };

  const isRefreshing = (includeProfileData ? isRefetchingProfile : false) || isRefetchingPosts;

  return {
    // Profile data (only included if requested)
    ...(includeProfileData && {
      userProfileData,
      profileLoading,
      isRefetchingProfile,
      profileError,
      refetchProfile,
    }),

    // Posts data
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

    // Combined utilities
    onRefresh,
    isRefreshing,
  };
}
