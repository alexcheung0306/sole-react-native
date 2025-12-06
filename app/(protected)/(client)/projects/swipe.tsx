import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Dimensions, Text, View, ActivityIndicator, TouchableOpacity, Alert, ScrollView, Image } from "react-native";
import { useSoleUserContext } from "~/context/SoleUserContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { searchApplicants, updateApplicantProcessById } from "@/api/apiservice/applicant_api";
import { getRolesByProjectId } from "@/api/apiservice/role_api";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { ChevronLeft, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomTabs } from "@/components/custom/custom-tabs";
import { getStatusColor } from "@/utils/get-status-color";
import TalentProfile from "~/components/talent-profile/TalentProfile";
import { ApplicationDetail } from "~/components/project-detail/roles/ApplicationDetail";
import { ActionToCandidates } from "~/components/project-detail/roles/ActionToCandidates";
import { getUserProfileByUsername } from "@/api/apiservice/soleUser_api";
import SwipeCard from "~/components/project-detail/roles/SwipeCard";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const ACTION_AREA_WIDTH = 180;

export default function RoleCandidatesSwipeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { soleUserId } = useSoleUserContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTab, setCurrentTab] = useState('talent-profile');
  const [highlightedAction, setHighlightedAction] = useState<'shortlist' | 'invite' | 'reject' | null>(null);
  
  // Store a stable copy of candidates when we first load them
  // This prevents the array from changing during swipe session
  const [stableCandidates, setStableCandidates] = useState<any[]>([]);

  const { projectId, roleId, process } = useLocalSearchParams<{
    projectId?: string;
    roleId?: string;
    process?: string;
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
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const candidates = useMemo(() => {
    if (!candidatesResponse) return [];
    return candidatesResponse?.data ?? candidatesResponse?.content ?? candidatesResponse ?? [];
  }, [candidatesResponse]);

  // Store a stable copy of candidates when we first load them
  // This prevents the array from changing during swipe session when queries are invalidated
  useEffect(() => {
    if (candidates.length > 0 && stableCandidates.length === 0) {
      // Only set stable candidates on initial load
      setStableCandidates(candidates);
    }
  }, [candidates, stableCandidates.length]);

  // Use stable candidates for the swipe session
  const swipeCandidates = stableCandidates.length > 0 ? stableCandidates : candidates;

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

  // Current candidate (the one on top)
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
        // No more candidates, go back
        setTimeout(() => {
          isMovingToNextRef.current = false;
          router.back();
        }, 100);
        return prevIndex; // Don't update index, we're going back
      }

      // Update the shared value
      currentIndexShared.value = nextIndex;
      
      // Reset the guard after a short delay to allow the next swipe
      setTimeout(() => {
        isMovingToNextRef.current = false;
      }, 300);
      
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

      const status = action === 'shortlisted' ? 'shortlisted' : applicant?.applicationStatus || 'applied';
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
      // Cards above (swiped away) - should not be visible
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
  }, [currentIndex, swipeCandidates.length]);

  const rejectGradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: rejectGradientOpacity.value,
  }));

  const rejectTextAnimatedStyle = useAnimatedStyle(() => ({
    opacity: rejectGradientOpacity.value > 0.3 ? 1 : rejectGradientOpacity.value * 2,
  }));

  // Right action gradient styles (up to 5)
  const rightAction0GradientStyle = useAnimatedStyle(() => ({
    opacity: rightActionOpacities.value[0] || 0,
  }));
  const rightAction1GradientStyle = useAnimatedStyle(() => ({
    opacity: rightActionOpacities.value[1] || 0,
  }));
  const rightAction2GradientStyle = useAnimatedStyle(() => ({
    opacity: rightActionOpacities.value[2] || 0,
  }));
  const rightAction3GradientStyle = useAnimatedStyle(() => ({
    opacity: rightActionOpacities.value[3] || 0,
  }));
  const rightAction4GradientStyle = useAnimatedStyle(() => ({
    opacity: rightActionOpacities.value[4] || 0,
  }));

  const rightActionTextStyles = [
    useAnimatedStyle(() => ({
      opacity: (rightActionOpacities.value[0] || 0) > 0.3 ? 1 : (rightActionOpacities.value[0] || 0) * 2,
    })),
    useAnimatedStyle(() => ({
      opacity: (rightActionOpacities.value[1] || 0) > 0.3 ? 1 : (rightActionOpacities.value[1] || 0) * 2,
    })),
    useAnimatedStyle(() => ({
      opacity: (rightActionOpacities.value[2] || 0) > 0.3 ? 1 : (rightActionOpacities.value[2] || 0) * 2,
    })),
    useAnimatedStyle(() => ({
      opacity: (rightActionOpacities.value[3] || 0) > 0.3 ? 1 : (rightActionOpacities.value[3] || 0) * 2,
    })),
    useAnimatedStyle(() => ({
      opacity: (rightActionOpacities.value[4] || 0) > 0.3 ? 1 : (rightActionOpacities.value[4] || 0) * 2,
    })),
  ];

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

  if (swipeCandidates.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">No candidates found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 rounded-lg bg-blue-500 px-4 py-2">
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentCandidate) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">No candidates found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 rounded-lg bg-blue-500 px-4 py-2">
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-lg font-semibold text-white">
            {currentIndex + 1} / {swipeCandidates.length}
          </Text>
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Action Gradients - Screen Level */}
        {/* Reject Gradient (Left) */}
        {currentCandidate && currentProcess !== 'offered' && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                top: insets.top + 60,
                bottom: 0,
                width: SCREEN_WIDTH,
                zIndex: 5,
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

        {/* Action Gradients (Right) */}
        {currentCandidate && getAvailableActions.map((action, index) => {
          if (index >= 5) return null;
          const [startColor, endColor] = getActionColor(action);
          const availableHeight = SCREEN_HEIGHT - insets.top - 60;
          const actionHeight = availableHeight / Math.max(getAvailableActions.length, 1);
          const actionTop = insets.top + 60 + (actionHeight * index);

          return (
            <Animated.View
              key={action}
              style={[
                {
                  position: 'absolute',
                  right: 0,
                  top: actionTop,
                  height: actionHeight,
                  width: SCREEN_WIDTH,
                  zIndex: 5,
                  pointerEvents: 'none',
                },
                index === 0 ? rightAction0GradientStyle :
                index === 1 ? rightAction1GradientStyle :
                index === 2 ? rightAction2GradientStyle :
                index === 3 ? rightAction3GradientStyle :
                rightAction4GradientStyle,
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
                    rightActionTextStyles[index],
                  ]}>
                  {getActionLabel(action).toUpperCase()}
                </Animated.Text>
              </LinearGradient>
            </Animated.View>
          );
        })}

        {/* Card Stack Container */}
        <View className="flex-1" style={{ paddingHorizontal: 20 }}>
          {/* Render all cards in stack */}
          {swipeCandidates.map((candidate: any, index: number) => {
            // Only render cards that are at or after currentIndex
            if (index < currentIndex) {
              return null;
            }
            
            const isTopCard = index === currentIndex;
            const isSecondCard = index === currentIndex + 1;
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
                availableActions={getAvailableActions}
                currentProcess={currentProcess}
                onSwipeComplete={handleCardSwipeComplete}
                onSwipeAction={executeSwipeRightAction}
                onSwipeReject={executeSwipeLeftReject}
                onHighlightAction={setHighlightedAction}
                rejectGradientOpacity={rejectGradientOpacity}
                rightActionOpacities={rightActionOpacities}
                availableActionsCount={availableActionsCount}
                currentIndexShared={currentIndexShared}
                currentProcessShared={currentProcessShared}
              />
            );
          })}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
