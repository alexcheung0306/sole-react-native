import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Dimensions, Text, View, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { useSoleUserContext } from "~/context/SoleUserContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { searchApplicants, updateApplicantProcessById } from "@/api/apiservice/applicant_api";
import { getRolesByProjectId } from "@/api/apiservice/role_api";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, X, Filter } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getStatusColor } from "@/utils/get-status-color";
import { getUserProfileByUsername } from "@/api/apiservice/soleUser_api";
import SwipeCard from "~/components/project-detail/roles/SwipeCard";
import CollapseDrawer from "@/components/custom/collapse-drawer";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function RoleCandidatesSwipeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTab, setCurrentTab] = useState('talent-profile');
  const [exitingIndex, setExitingIndex] = useState<number | null>(null); // keeps the swiped-away card mounted for animation
  const [highlightedAction, setHighlightedAction] = useState<'shortlist' | 'invite' | 'reject' | null>(null);
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);
  const [statusFilterSelection, setStatusFilterSelection] = useState<string[]>([]);
  const [exhausted, setExhausted] = useState(false);
  const toggleStatusFilter = useCallback((id: string) => {
    setStatusFilterSelection((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);
  const clearStatusFilter = useCallback(() => {
    setStatusFilterSelection([]);
    setShowStatusDrawer(false);
  }, []);

  // Store a stable copy of candidates when we first load them
  // This prevents the array from changing during swipe session
  const [stableCandidates, setStableCandidates] = useState<any[]>([]);
  const stableCandidatesInitializedRef = useRef(false);

  const { projectId, roleId, process, initialIndex, initialApplicantId } = useLocalSearchParams<{
    projectId?: string;
    roleId?: string;
    process?: string;
    initialIndex?: string;
    initialApplicantId?: string;
  }>();

  // Fetch candidates
  const candidateQueryString = useMemo(() => {
    if (!roleId || !process) return '';
    const params = new URLSearchParams();
    params.append('roleId', String(roleId));
    params.append('applicationProcess', String(process));
    params.append('pageNumber', '1');
    params.append('pageSize', '100'); // Get all candidates for swipe
    return params.toString();
  }, [roleId, process]);

  const {
    data: candidatesResponse,
    isLoading: isLoadingCandidates,
  } = useQuery({
    queryKey: ['swipe-role-candidates', roleId, candidateQueryString],
    queryFn: () => searchApplicants(candidateQueryString),
    enabled: Boolean(roleId && process),
    staleTime: 0, // always stale so re-open refetches
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const candidates = useMemo(() => {
    if (!candidatesResponse) return [];
    return candidatesResponse?.data ?? candidatesResponse?.content ?? candidatesResponse ?? [];
  }, [candidatesResponse]);

  const initialIndexParam = useMemo(() => {
    const parsed = initialIndex ? Number(initialIndex) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }, [initialIndex]);

  const initialApplicantIdParam = useMemo(() => {
    const parsed = initialApplicantId ? Number(initialApplicantId) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }, [initialApplicantId]);

  const applyInitialOrder = useCallback((list: any[]) => {
    if (!Array.isArray(list) || list.length === 0) return [];

    let targetIndex = -1;
    if (initialApplicantIdParam !== null) {
      targetIndex = list.findIndex((c: any) => {
        const applicantId = c?.jobApplicant?.id || c?.id;
        return applicantId === initialApplicantIdParam;
      });
    }

    if (targetIndex < 0 && initialIndexParam !== null) {
      targetIndex = Math.min(Math.max(initialIndexParam, 0), list.length - 1);
    }

    if (targetIndex > 0) {
      return [...list.slice(targetIndex), ...list.slice(0, targetIndex)];
    }

    return list;
  }, [initialApplicantIdParam, initialIndexParam]);

  // Reset stable candidates and index when route params change (new navigation)
  useEffect(() => {
    setStableCandidates([]);
    setCurrentIndex(0);
    stableCandidatesInitializedRef.current = false;
  }, [roleId, process]);

  // On focus, ensure we refetch and reset local swipe state
  useFocusEffect(
    useCallback(() => {
      setStableCandidates([]);
      setCurrentIndex(0);
      stableCandidatesInitializedRef.current = false;
      queryClient.invalidateQueries({ queryKey: ['swipe-role-candidates'] });
      return undefined;
    }, [queryClient])
  );

  // Store a stable copy of candidates when we first load them
  // This prevents the array from changing during swipe session when queries are invalidated
  useEffect(() => {
    // Only set stable candidates once when candidates first load (after reset or initial load)
    if (candidates.length > 0 && !stableCandidatesInitializedRef.current) {
      const reordered = applyInitialOrder([...candidates]);
      setStableCandidates(reordered); // Create a copy to ensure it's stable
      stableCandidatesInitializedRef.current = true;
    }
  }, [candidates, applyInitialOrder]); // depend on candidates array and reorder fn

  // Use stable candidates for the swipe session
  // Fall back to candidates if stableCandidates is not set yet (during initial load)
  // This ensures we always show all candidates when first navigating to the screen
  const orderedCandidates = stableCandidates.length > 0 ? stableCandidates : applyInitialOrder(candidates);

  const swipeCandidates = useMemo(() => {
    if (!statusFilterSelection.length) return orderedCandidates;
    return orderedCandidates.filter((c: any) => {
      const status = c?.jobApplicant?.applicationStatus || 'applied';
      return statusFilterSelection.includes(status);
    });
  }, [orderedCandidates, statusFilterSelection]);

  // Fetch role data
  const { data: rolesWithSchedules = [] } = useQuery({
    queryKey: ['project-roles', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await getRolesByProjectId(Number(projectId));
      return response ?? [];
    },
    enabled: Boolean(projectId),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const roleWithSchedules = useMemo(() => {
    if (!roleId || !Array.isArray(rolesWithSchedules)) return null;
    return rolesWithSchedules.find((r: any) => r?.role?.id === Number(roleId)) || null;
  }, [rolesWithSchedules, roleId]);

  const currentProcess = process || 'applied';

  // Current candidate (the one on top) from filtered list
  const currentCandidate = currentIndex >= 0 && currentIndex < swipeCandidates.length ? swipeCandidates[currentIndex] : null;

  // Current candidate data
  const applicant = currentCandidate?.jobApplicant ?? {};
  const userInfo = currentCandidate?.userInfo ?? {};
  const username = currentCandidate?.username || userInfo?.username || 'unknown';
  const statusColor = getStatusColor(applicant?.applicationStatus || 'applied');

  // Extract activities
  const activities = roleWithSchedules?.activities || [];
  const sessionActivities = Array.isArray(activities)
    ? activities
        .filter((activity: any) => activity?.type !== 'job')
        .map((activity: any) => activity?.title)
        .filter(Boolean)
    : [];

  // Allowed status filters based on current process (mirror ManageCandidates)
  const statusFilterOptions = useMemo(() => {
    if (currentProcess === 'applied') {
      return [{ id: 'applied', label: 'Applied' }];
    }
    if (currentProcess === 'shortlisted') {
      return [{ id: 'shortlisted', label: 'Shortlisted' }];
    }
    if (currentProcess === 'offered') {
      return [{ id: 'offered', label: 'Offered' }];
    }
    const isMappedSession = sessionActivities.includes(currentProcess);
    if (isMappedSession) {
      return [
        { id: 'invited', label: 'Invited' },
        { id: 'accepted', label: 'Accepted' },
        { id: 'rejected', label: 'Rejected' },
      ];
    }
    return [];
  }, [currentProcess, sessionActivities]);

  // Ensure selected statuses are valid for current process
  useEffect(() => {
    const allowedIds = new Set(statusFilterOptions.map((o) => o.id));
    setStatusFilterSelection((prev) => {
      const next = prev.filter((id) => allowedIds.has(id));
      // Avoid triggering state updates if nothing changed
      if (next.length === prev.length && next.every((id, idx) => id === prev[idx])) {
        return prev;
      }
      return next;
    });
  }, [statusFilterOptions]);

  // Get available actions
  const getAvailableActions = useMemo(() => {
    if (currentProcess === 'shortlisted' || currentProcess === 'offered') {
      return [];
    }
    if (currentProcess === 'applied') {
      const actions = sessionActivities.length > 0 ? [...sessionActivities] : [];
      actions.push('shortlisted');
      return actions;
    } else if (sessionActivities.includes(currentProcess)) {
      const currentIndex = sessionActivities.indexOf(currentProcess);
      const remainingSessions = sessionActivities.slice(currentIndex + 1);
      const actions = [...remainingSessions];
      actions.push('shortlisted');
      return actions;
    }
    if (applicant?.applicationStatus === 'applied' || applicant?.applicationProcess === 'applied') {
      return ['shortlisted'];
    }
    return [];
  }, [currentProcess, sessionActivities, applicant?.applicationStatus, applicant?.applicationProcess]);

  // Get second candidate (the one right behind the top card)
  const secondCandidate = currentIndex + 1 < swipeCandidates.length ? swipeCandidates[currentIndex + 1] : null;
  const secondApplicant = secondCandidate?.jobApplicant ?? {};
  const secondUserInfo = secondCandidate?.userInfo ?? {};
  const secondUsername = secondCandidate?.username || secondUserInfo?.username || 'unknown';

  // Fetch talent profile for current candidate
  const { data: currentTalentProfileData, isLoading: isLoadingCurrentTalentProfile } = useQuery({
    queryKey: ['talent-profile', username],
    queryFn: () => getUserProfileByUsername(username),
    enabled: Boolean(username && username !== 'unknown' && currentCandidate),
    staleTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Fetch talent profile for second candidate
  const { data: secondTalentProfileData, isLoading: isLoadingSecondTalentProfile } = useQuery({
    queryKey: ['talent-profile', secondUsername],
    queryFn: () => getUserProfileByUsername(secondUsername),
    enabled: Boolean(secondUsername && secondUsername !== 'unknown' && secondCandidate),
    staleTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Gradient opacity values (shared across all cards)
  const rejectGradientOpacity = useSharedValue(0);
  const rightActionOpacities = useSharedValue([0, 0, 0, 0, 0]);
  const availableActionsCount = useSharedValue(0);

  // Shared values for worklet-safe access
  const currentIndexShared = useSharedValue(currentIndex);
  const currentProcessShared = useSharedValue(currentProcess);

  // When status filters change, start from the first visible candidate
  useEffect(() => {
    if (swipeCandidates.length > 0) {
      setCurrentIndex(0);
      currentIndexShared.value = 0;
      setExitingIndex(null);
      setExhausted(false);
    }
  }, [statusFilterSelection, swipeCandidates.length, currentIndexShared]);

  // Reset exhausted flag when new candidates arrive
  useEffect(() => {
    if (swipeCandidates.length > 0) {
      setExhausted(false);
    }
  }, [swipeCandidates.length]);

  // Refs
  const availableActionsRef = useRef<string[]>([]);
  const currentApplicantRef = useRef<any>(null);
  const currentProcessRef = useRef<string>(currentProcess);
  const mutationMutateRef = useRef<((variables: any) => void) | null>(null);
  const queryClientRef = useRef(queryClient);
  const handleNextCandidateRef = useRef<(() => void) | null>(null);
  const projectIdRef = useRef(projectId);
  const roleIdRef = useRef(roleId);
  const currentIndexRef = useRef(currentIndex);
  const isMovingToNextRef = useRef(false); // Guard to prevent multiple calls

  // Update refs
  useEffect(() => {
    availableActionsCount.value = getAvailableActions.length;
    availableActionsRef.current = getAvailableActions;
  }, [getAvailableActions, availableActionsCount]);

  useEffect(() => {
    if (currentCandidate) {
      currentApplicantRef.current = currentCandidate?.jobApplicant;
    }
  }, [currentCandidate]);

  useEffect(() => {
    currentProcessRef.current = currentProcess;
    currentProcessShared.value = currentProcess;
  }, [currentProcess, currentProcessShared]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    currentIndexShared.value = currentIndex;
    // Reset the guard when index changes (card has moved)
    isMovingToNextRef.current = false;
  }, [currentIndex, currentIndexShared]);

  useEffect(() => {
    projectIdRef.current = projectId;
    roleIdRef.current = roleId;
  }, [projectId, roleId]);

  // Reset gradient values when candidate changes
  useEffect(() => {
    if (currentCandidate) {
      rejectGradientOpacity.value = 0;
      rightActionOpacities.value = [0, 0, 0, 0, 0];
      setHighlightedAction(null);
      setCurrentTab('talent-profile');
    }
  }, [currentIndex, currentCandidate]);

  // Clear exiting index if we overshoot or navigate past the last card
  useEffect(() => {
    if (currentIndex >= swipeCandidates.length) {
      setExitingIndex(null);
    }
  }, [currentIndex, swipeCandidates.length]);

  // Mutation for updating applicant status
  const updateApplicantMutation = useMutation({
    mutationFn: async ({
      applicantId,
      status,
      process: processParam,
    }: {
      applicantId: number;
      status: string;
      process?: string;
    }) => {
      const applicationProcess = processParam || (status === 'rejected' ? 'rejected' : currentProcessRef.current);
      const applicantData = currentApplicantRef.current;

      const updateValues: any = {
        id: applicantData?.id || applicantId,
        soleUserId: applicantData?.soleUserId || null,
        roleId: applicantData?.roleId || (roleIdRef.current ? Number(roleIdRef.current) : null),
        projectId: projectIdRef.current ? Number(projectIdRef.current) : applicantData?.projectId || null,
        paymentBasis: applicantData?.paymentBasis || null,
        quotePrice: applicantData?.quotePrice || null,
        otQuotePrice: applicantData?.otQuotePrice || null,
        skills: applicantData?.skills || null,
        answer: applicantData?.answer || null,
        applicationStatus: status,
        applicationProcess: applicationProcess,
      };

      return updateApplicantProcessById(updateValues, applicantId);
    },
    onSuccess: () => {
      // Don't move to next card here - let the animation completion handle it
      // Invalidate queries after a delay to ensure the card has animated away
      // and we've moved to the next index
      setTimeout(() => {
        queryClientRef.current?.invalidateQueries({ queryKey: ['role-candidates'] });
        queryClientRef.current?.invalidateQueries({ queryKey: ['role-process-counts'] });
      }, 1500); // Delay to ensure swipe animation and index update complete
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to execute action. Please try again.', [{ text: 'OK' }]);
    },
  });

  useEffect(() => {
    mutationMutateRef.current = updateApplicantMutation.mutate;
    queryClientRef.current = queryClient;
  }, [updateApplicantMutation.mutate, queryClient]);

  // Handle card swipe completion - move to next card
  const handleCardSwipeComplete = useCallback(() => {
    // Prevent multiple calls
    if (isMovingToNextRef.current) {
      return;
    }

    isMovingToNextRef.current = true;

    // Use a function to get the latest state
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;

      // Use stable candidates - they don't change during swipe session
      if (nextIndex >= swipeCandidates.length) {
        // No more candidates - stop advancing and show exhausted state
        setExhausted(true);
        isMovingToNextRef.current = false;
        return swipeCandidates.length; // point past last to trigger empty view
      }

      // Update the shared value
      currentIndexShared.value = nextIndex;

      // Reset the guard immediately to allow the next swipe
      isMovingToNextRef.current = false;

      return nextIndex;
    });
  }, [swipeCandidates.length, router, currentIndexShared]);

  useEffect(() => {
    handleNextCandidateRef.current = handleCardSwipeComplete;
  }, [handleCardSwipeComplete]);

  // Execute swipe actions
  const executeSwipeRightAction = useCallback((actionIndex: number) => {
    const actions = availableActionsRef.current;
    if (actionIndex >= 0 && actionIndex < actions.length) {
      const action = actions[actionIndex];
      const applicantId = currentApplicantRef.current?.id;
      if (!applicantId) return;

      const isSessionAction = sessionActivities.includes(action);
      const status =
        action === 'shortlisted'
          ? 'shortlisted'
          : isSessionAction
            ? 'invited'
            : applicant?.applicationStatus || 'applied';
      const process = action === 'shortlisted' ? 'shortlisted' : action;

      mutationMutateRef.current?.({
        applicantId,
        status,
        process,
      });

    }
  }, []);

  const executeSwipeLeftReject = useCallback(() => {
    const applicantId = currentApplicantRef.current?.id;
    if (!applicantId) return;

    mutationMutateRef.current?.({
      applicantId,
      status: 'rejected',
      process: 'rejected',
    });
  }, []);

  // Animated style for cards below (stacked effect)
  const getStackedCardStyle = useCallback((index: number) => {
    const distanceFromTop = index - currentIndex;

    if (distanceFromTop < 0) {
      // Allow the most recently swiped card to stay visible for its exit animation
      if (exitingIndex !== null && index === exitingIndex) {
        return { scale: 1, zIndex: swipeCandidates.length + 12, opacity: 1 };
      }
      // Cards further above - hide
      return { scale: 0, zIndex: 0, opacity: 0 };
    } else if (distanceFromTop === 0) {
      // Top card
      return { scale: 1, zIndex: swipeCandidates.length + 10, opacity: 1 };
    } else if (distanceFromTop === 1) {
      // Second card (right behind top) - should be visible
      return { scale: 0.95, zIndex: swipeCandidates.length + 9, opacity: 1 };
    } else {
      // Cards further below - scale down progressively
      const scale = Math.max(0.95 - (distanceFromTop - 1) * 0.02, 0.85);
      const zIndex = swipeCandidates.length + 9 - distanceFromTop;
      return { scale, zIndex, opacity: 1 };
    }
  }, [currentIndex, swipeCandidates.length, exitingIndex]);

  const rejectGradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(rejectGradientOpacity.value, { duration: 140 }),
  }));

  const rejectTextAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(rejectGradientOpacity.value > 0.3 ? 1 : rejectGradientOpacity.value * 2, { duration: 140 }),
  }));

  const tabs = [
    { id: 'talent-profile', label: 'Talent Profile' },
    { id: 'application', label: 'Application Details' },
    { id: 'actions', label: 'Actions' },
  ];

  const getActionColor = (action: string): [string, string] => {
    if (action === 'shortlisted') return ['rgba(34, 197, 94, 1)', 'rgba(34, 197, 94, 0)'];
    return ['rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 0)'];
  };

  const getActionLabel = (action: string) => {
    if (action === 'shortlisted') return 'Shortlist';
    return action;
  };

  const ActionRow = useCallback(({ action, index, actionCount }: { action: string; index: number; actionCount: number }) => {
    const gradientAnimatedStyle = useAnimatedStyle(() => ({
      opacity: withTiming(rightActionOpacities.value[index] || 0, { duration: 140 }),
    }));

    const textAnimatedStyle = useAnimatedStyle(() => {
      const val = rightActionOpacities.value[index] || 0;
      return {
        opacity: val > 0.3 ? 1 : val * 2,
      };
    });

    const [startColor, endColor] = getActionColor(action);
    const actionHeight = SCREEN_HEIGHT / Math.max(actionCount, 1);
    const actionTop = actionHeight * index;

    return (
      <Animated.View
        key={action}
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: actionTop,
            height: actionHeight,
            width: SCREEN_WIDTH,
            zIndex: 9999,
            pointerEvents: 'none',
          },
          gradientAnimatedStyle,
        ]}>
        <LinearGradient
          colors={[startColor, endColor]}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 0.7, y: 0.5 }}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 40 }}>
          <Animated.Text
            style={[
              {
                fontSize: 24,
                fontWeight: 'bold',
                color: '#fff',
              },
              textAnimatedStyle,
            ]}>
            {getActionLabel(action).toUpperCase()}
          </Animated.Text>
        </LinearGradient>
      </Animated.View>
    );
  }, [getActionColor, getActionLabel, rightActionOpacities]);

  // Check if currentIndex is out of bounds
  // Adjust it to stay within bounds
  // This must be before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    if (swipeCandidates.length > 0 && currentIndex >= swipeCandidates.length) {
      // If we've swiped past all candidates, go back
      router.back();
    } else if (swipeCandidates.length > 0 && currentIndex < 0) {
      // If index is negative, reset to 0
      setCurrentIndex(0);
    }
  }, [swipeCandidates.length, currentIndex, router]);

  if (isLoadingCandidates) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const displayIndex = swipeCandidates.length
    ? Math.min(currentIndex, swipeCandidates.length - 1)
    : 0;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>


      <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-lg font-semibold text-white">
            {swipeCandidates.length ? displayIndex + 1 : 0} / {swipeCandidates.length}
          </Text>
          <TouchableOpacity onPress={() => setShowStatusDrawer(true)} className="p-2">
            <Filter size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {swipeCandidates.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-white">{exhausted ? 'No more candidates' : 'No candidates found'}</Text>
          </View>
        ) : (
          <>
            {/* Action Gradients - Screen Level - Full Screen with Highest Z-Index */}
            {/* Reject Gradient (Left) */}
            {currentCandidate && currentProcess !== 'offered' && (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT,
                    zIndex: 9999,
                    pointerEvents: 'none',
                  },
                  rejectGradientAnimatedStyle,
                ]}>
                <LinearGradient
                  colors={['rgba(239, 68, 68, 1)', 'rgba(239, 68, 68, 0)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 0.3, y: 0.5 }}
                  style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 40 }}>
                  <Animated.Text
                    style={[
                      {
                        fontSize: 32,
                        fontWeight: 'bold',
                        color: '#fff',
                      },
                      rejectTextAnimatedStyle,
                    ]}>
                    REJECT
                  </Animated.Text>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Action Gradients (Right) - Full Screen */}
            {currentCandidate && getAvailableActions.map((action, index) => (
              <ActionRow
                key={action}
                action={action}
                index={index}
                actionCount={getAvailableActions.length}
              />
            ))}

            {/* Card Stack Container */}
            <View className="flex-1" style={{ paddingHorizontal: 20 }}>
              {swipeCandidates
                // keep the exiting card plus the next two to reduce churn
                .slice(
                  exitingIndex !== null && exitingIndex === currentIndex - 1 ? exitingIndex : currentIndex,
                  currentIndex + 3
                )
                .map((candidate: any, renderOffset: number) => {
                  const index = (exitingIndex !== null && exitingIndex === currentIndex - 1 ? exitingIndex : currentIndex) + renderOffset;
                  const isTopCard = index === currentIndex;
                  const isSecondCard = index === currentIndex + 1;
                  const isExiting = exitingIndex === index;
                  const stackedStyle = getStackedCardStyle(index);

                  // Use appropriate data based on card position
                  const talentProfileData = isTopCard ? currentTalentProfileData : (isSecondCard ? secondTalentProfileData : null);
                  const isLoadingProfile = isTopCard ? isLoadingCurrentTalentProfile : (isSecondCard ? isLoadingSecondTalentProfile : false);

                  return (
                    <SwipeCard
                      key={`candidate-${candidate?.jobApplicant?.id || index}`}
                      candidate={candidate}
                      index={index}
                      isTopCard={isTopCard}
                      isSecondCard={isSecondCard}
                      stackedStyle={stackedStyle}
                      talentProfileData={talentProfileData}
                      isLoadingProfile={isLoadingProfile}
                      currentTab={currentTab}
                      onTabChange={setCurrentTab}
                      tabs={tabs.map(tab => ({ id: tab.id, label: tab.label }))}
                      projectId={projectId ? Number(projectId) : undefined}
                      roleId={roleId ? Number(roleId) : undefined}
                      roleWithSchedules={roleWithSchedules}
                      availableActions={getAvailableActions}
                      currentProcess={currentProcess}
                      onSwipeComplete={handleCardSwipeComplete}
                      onSwipeStartExit={() => setExitingIndex(currentIndex)}
                      onExitAnimationEnd={(finishedIndex) => {
                        if (exitingIndex === finishedIndex) {
                          setExitingIndex(null);
                        }
                      }}
                      onSwipeAction={executeSwipeRightAction}
                      onSwipeReject={executeSwipeLeftReject}
                      onHighlightAction={setHighlightedAction}
                      rejectGradientOpacity={rejectGradientOpacity}
                      rightActionOpacities={rightActionOpacities}
                      availableActionsCount={availableActionsCount}
                      currentIndexShared={currentIndexShared}
                      currentProcessShared={currentProcessShared}
                      isExiting={isExiting}
                    />
                  );
                })}
            </View>
          </>
        )}

        {/* Status Filter Drawer */}
        <CollapseDrawer
          showDrawer={showStatusDrawer}
          setShowDrawer={setShowStatusDrawer}
          title="Filter by application status">
          <View className="p-5 gap-4">
            <Text className="text-sm font-semibold text-white/80">Application Status</Text>
            <View className="gap-3">
              {statusFilterOptions.map((option) => {
                const isSelected = statusFilterSelection.includes(option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    className={`flex-row items-center justify-between rounded-2xl border px-4 py-3 ${isSelected ? 'border-white/30 bg-white/10' : 'border-white/10 bg-white/5'
                      }`}
                    activeOpacity={0.85}
                    onPress={() => toggleStatusFilter(option.id)}>
                    <Text className="text-sm font-semibold text-white">{option.label}</Text>
                    {isSelected ? (
                      <View className="rounded-full bg-blue-500/20 px-2 py-1">
                        <Text className="text-xs font-bold text-blue-200">ON</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="mt-4 flex-row gap-3">
              <TouchableOpacity
                className="flex-1 items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-4 py-3"
                activeOpacity={0.85}
                onPress={clearStatusFilter}>
                <Text className="text-sm font-semibold text-white">Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 items-center justify-center rounded-2xl border border-blue-500/40 bg-blue-500/15 px-4 py-3"
                activeOpacity={0.85}
                onPress={() => setShowStatusDrawer(false)}>
                <Text className="text-sm font-semibold text-blue-200">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CollapseDrawer>
      </View>
    </GestureHandlerRootView>
  );
}
