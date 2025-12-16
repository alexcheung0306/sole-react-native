import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Dimensions, Text, View, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { Image } from "expo-image";
import { useSoleUserContext } from "~/context/SoleUserContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { searchApplicants, updateApplicantProcessById } from "@/api/apiservice/applicant_api";
import { getRolesByProjectId } from "@/api/apiservice/role_api";
import { getProjectByID } from "@/api/apiservice/project_api";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, ChevronRight, X, Filter } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getStatusColor } from "@/utils/get-status-color";
import { getUserProfileByUsername } from "@/api/apiservice/soleUser_api";
import SwipeCard from "~/components/project-detail/roles/SwipeCard";
import CollapseDrawer from "~/components/custom/collapse-drawerV1";

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
  const [showSendOfferFormPortal, setShowSendOfferFormPortal] = useState(false);
  // Track swiped away candidates to remove them from the array
  const [swipedCandidateIds, setSwipedCandidateIds] = useState<Set<number>>(new Set());
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
  const previousFilterRef = useRef<string>('');

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
    hasNavigatedBackRef.current = false; // Reset navigation guard when route params change
    wasLastCardRef.current = false; // Reset last card tracking
  }, [roleId, process]);

  // On focus, ensure we refetch and reset local swipe state
  useFocusEffect(
    useCallback(() => {
      setStableCandidates([]);
      setCurrentIndex(0);
      stableCandidatesInitializedRef.current = false;
      hasNavigatedBackRef.current = false; // Reset navigation guard on focus
      wasLastCardRef.current = false; // Reset last card tracking
      queryClient.invalidateQueries({ queryKey: ['swipe-role-candidates'] });
      // Mark ManageCandidates queries as stale when entering swipe screen
      // They will refetch when ManageCandidates comes back into focus
      queryClient.invalidateQueries({ 
        queryKey: ['role-candidates'],
        refetchType: 'none'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['role-process-counts'],
        refetchType: 'none'
      });
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

  // Reset stable candidates when filter changes to get fresh data
  // This ensures swiped candidates don't reappear when changing filters
  useEffect(() => {
    const currentFilter = statusFilterSelection.sort().join(',');
    const previousFilter = previousFilterRef.current;
    
    // Only reset if filter actually changed
    if (currentFilter !== previousFilter) {
      previousFilterRef.current = currentFilter;
      // Reset stable candidates and refetch to get updated candidate statuses
      setStableCandidates([]);
      stableCandidatesInitializedRef.current = false;
      // Invalidate and refetch to get updated candidate statuses from backend
      queryClient.invalidateQueries({ queryKey: ['swipe-role-candidates', roleId, candidateQueryString] });
    }
  }, [statusFilterSelection, queryClient, roleId, candidateQueryString]);

  // Use stable candidates for the swipe session
  // Fall back to candidates if stableCandidates is not set yet (during initial load)
  // This ensures we always show all candidates when first navigating to the screen
  const orderedCandidates = stableCandidates.length > 0 ? stableCandidates : applyInitialOrder(candidates);

  const swipeCandidates = useMemo(() => {
    let filtered = orderedCandidates;
    
    // Filter by status if status filter is applied
    if (statusFilterSelection.length) {
      filtered = filtered.filter((c: any) => {
        const status = c?.jobApplicant?.applicationStatus || 'applied';
        return statusFilterSelection.includes(status);
      });
    }
    
    // Remove swiped away candidates
    if (swipedCandidateIds.size > 0) {
      filtered = filtered.filter((c: any) => {
        const candidateId = c?.jobApplicant?.id;
        return candidateId && !swipedCandidateIds.has(candidateId);
      });
    }
    
    return filtered;
  }, [orderedCandidates, statusFilterSelection, swipedCandidateIds]);

  // Fetch project data
  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await getProjectByID(Number(projectId));
      return response ?? null;
    },
    enabled: Boolean(projectId),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

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
    if (currentProcess === 'shortlisted') {
      return ['send offer'];
    }
    if (currentProcess === 'offered') {
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

  // Prefetch images for current and upcoming candidates (current, second, third)
  // This ensures smooth image loading when swiping
  useEffect(() => {
    const candidatesToPrefetch = [
      currentCandidate,
      secondCandidate,
      currentIndex + 2 < swipeCandidates.length ? swipeCandidates[currentIndex + 2] : null,
    ].filter(Boolean);

    candidatesToPrefetch.forEach((candidate: any) => {
      if (!candidate) return;
      
      // Get image URIs from both candidate data and talent profile data
      const imageUris = [
        candidate?.comcardFirstPic,
        candidate?.userInfo?.profilePic,
      ].filter(Boolean);

      // Also check talent profile data if available
      const candidateUsername = candidate?.username || candidate?.userInfo?.username;
      if (candidateUsername === username && currentTalentProfileData?.userInfo?.profilePic) {
        imageUris.push(currentTalentProfileData.userInfo.profilePic);
      }
      if (candidateUsername === secondUsername && secondTalentProfileData?.userInfo?.profilePic) {
        imageUris.push(secondTalentProfileData.userInfo.profilePic);
      }

      // Prefetch each unique image URI
      const uniqueUris = Array.from(new Set(imageUris));
      uniqueUris.forEach((uri: string) => {
        Image.prefetch(uri, {
          cachePolicy: 'memory-disk',
        }).catch(() => {
          // Silently fail if prefetch fails
        });
      });
    });
  }, [currentCandidate, secondCandidate, currentIndex, swipeCandidates, currentTalentProfileData, secondTalentProfileData, username, secondUsername]);

  // Gradient opacity values (shared across all cards)
  const rejectGradientOpacity = useSharedValue(0);
  const rightActionOpacities = useSharedValue([0, 0, 0, 0, 0]);
  const availableActionsCount = useSharedValue(0);
  const availableActionsShared = useSharedValue<string[]>([]);

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

  // Reset swiped candidates when filters change or when navigating to a new process
  useEffect(() => {
    setSwipedCandidateIds(new Set());
    hasNavigatedBackRef.current = false; // Reset navigation guard when filters/process change
    wasLastCardRef.current = false; // Reset last card tracking
  }, [statusFilterSelection, process]);

  // Adjust index if current index is out of bounds after filtering
  useEffect(() => {
    if (swipeCandidates.length === 0) {
      if (currentIndex !== 0) {
        setCurrentIndex(0);
        currentIndexShared.value = 0;
      }
      setExhausted(true);
    } else if (currentIndex >= swipeCandidates.length) {
      const newIndex = Math.max(0, swipeCandidates.length - 1);
      setCurrentIndex(newIndex);
      currentIndexShared.value = newIndex;
    } else if (currentIndex < 0) {
      setCurrentIndex(0);
      currentIndexShared.value = 0;
    }
  }, [swipeCandidates.length, currentIndex, currentIndexShared]);

  // Update refs to track latest values
  useEffect(() => {
    swipeCandidatesLengthRef.current = swipeCandidates.length;
  }, [swipeCandidates.length]);

  useEffect(() => {
    swipedCandidateIdsSizeRef.current = swipedCandidateIds.size;
  }, [swipedCandidateIds.size]);

  // Backup: Navigate back if array becomes empty after swiping last card
  // This handles cases where the animation callback might not fire
  useEffect(() => {
    if (wasLastCardRef.current && swipeCandidates.length === 0 && swipedCandidateIds.size > 0 && !hasNavigatedBackRef.current) {
      // Use a small delay to ensure animation has time to complete
      const timeoutId = setTimeout(() => {
        if (!hasNavigatedBackRef.current) {
          hasNavigatedBackRef.current = true;
          
          // Invalidate queries to ensure fresh data when returning
          queryClient.invalidateQueries({ 
            queryKey: ['role-candidates'],
            refetchType: 'none'
          });
          queryClient.invalidateQueries({ 
            queryKey: ['role-process-counts'],
            refetchType: 'none'
          });
          queryClient.invalidateQueries({ 
            queryKey: ['swipe-role-candidates'],
            refetchType: 'none'
          });
          
          // Navigate back to project detail
          if (projectId) {
            router.push({
              pathname: '/(protected)/(client)/projects/project-detail',
              params: { id: projectId },
            });
          } else {
            router.back();
          }
        }
      }, 500); // Wait for animation to complete (spring animation is ~300-400ms)
      
      return () => clearTimeout(timeoutId);
    }
  }, [swipeCandidates.length, swipedCandidateIds.size, queryClient, router, projectId]);

  // Handle navigation back after slide out animation finishes
  const handleExitAnimationEndWithNavigation = useCallback((finishedIndex: number) => {
    // Clear exiting index
    setExitingIndex((prevExitingIndex) => {
      if (prevExitingIndex === finishedIndex) {
        return null;
      }
      return prevExitingIndex;
    });
    
    // Check if we were swiping the last card and now the array is empty
    // Use requestAnimationFrame to ensure state updates have been processed
    requestAnimationFrame(() => {
      // Check if all candidates have been swiped out after animation completes
      // Use refs to get the latest values (callback closure might be stale)
      // Only navigate if we were on the last card, array is now empty, we've swiped candidates, and haven't navigated
      if (wasLastCardRef.current && swipeCandidatesLengthRef.current === 0 && swipedCandidateIdsSizeRef.current > 0 && !hasNavigatedBackRef.current) {
        hasNavigatedBackRef.current = true;
        
        // Invalidate queries to ensure fresh data when returning
        queryClient.invalidateQueries({ 
          queryKey: ['role-candidates'],
          refetchType: 'none'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['role-process-counts'],
          refetchType: 'none'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['swipe-role-candidates'],
          refetchType: 'none'
        });
        
        // Navigate back to project detail after animation completes
        if (projectId) {
          router.push({
            pathname: '/(protected)/(client)/projects/project-detail',
            params: { id: projectId },
          });
        } else {
          router.back();
        }
      }
    });
  }, [queryClient, router, projectId]);

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
  const hasNavigatedBackRef = useRef(false); // Guard to prevent multiple navigations
  const swipeCandidatesLengthRef = useRef(swipeCandidates.length);
  const swipedCandidateIdsSizeRef = useRef(swipedCandidateIds.size);
  const wasLastCardRef = useRef(false); // Track if we were swiping the last card

  // Update refs
  useEffect(() => {
    availableActionsCount.value = getAvailableActions.length;
    availableActionsRef.current = getAvailableActions;
    availableActionsShared.value = getAvailableActions;
  }, [getAvailableActions, availableActionsCount, availableActionsShared]);

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
      // Mark queries as stale without immediate refetch
      // This allows ManageCandidates to refetch only when it comes into focus
      queryClientRef.current?.invalidateQueries({ 
        queryKey: ['role-candidates'],
        refetchType: 'none' // Mark as stale but don't refetch immediately
      });
      queryClientRef.current?.invalidateQueries({ 
        queryKey: ['role-process-counts'],
        refetchType: 'none' // Mark as stale but don't refetch immediately
      });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to execute action. Please try again.', [{ text: 'OK' }]);
    },
  });

  useEffect(() => {
    mutationMutateRef.current = updateApplicantMutation.mutate;
    queryClientRef.current = queryClient;
  }, [updateApplicantMutation.mutate, queryClient]);

  // Handle card swipe completion - move to next card and mark as swiped
  const handleCardSwipeComplete = useCallback(() => {
    // Prevent multiple calls
    if (isMovingToNextRef.current) {
      return;
    }

    isMovingToNextRef.current = true;

    // Get current candidate before marking as swiped
    const currentApplicant = currentApplicantRef.current;
    const currentIndexValue = currentIndexRef.current;
    
    // Check if this was the last card (before marking as swiped)
    wasLastCardRef.current = swipeCandidatesLengthRef.current === 1;
    
    // Mark current candidate as swiped
    if (currentApplicant?.id) {
      setSwipedCandidateIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(currentApplicant.id);
        return newSet;
      });
    }

    // After marking as swiped, the array will be filtered
    // The index adjustment useEffect will handle bounds checking
    // We keep the same index since the next candidate will move up
    const nextIndex = currentIndexValue;
    
    // Update the shared value
    currentIndexShared.value = nextIndex;
    
    // Update state (the useEffect will adjust if needed)
    setCurrentIndex(nextIndex);

    // Reset the guard immediately to allow the next swipe
    isMovingToNextRef.current = false;
  }, [currentIndexShared]);

  // Navigate to previous candidate (circular)
  const handlePreviousCandidate = useCallback(() => {
    if (swipeCandidates.length === 0) return;
    
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex <= 0 ? swipeCandidates.length - 1 : prevIndex - 1;
      currentIndexShared.value = newIndex;
      setExhausted(false);
      return newIndex;
    });
  }, [swipeCandidates.length, currentIndexShared]);

  // Navigate to next candidate (circular)
  const handleNextCandidate = useCallback(() => {
    if (swipeCandidates.length === 0) return;
    
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex >= swipeCandidates.length - 1 ? 0 : prevIndex + 1;
      currentIndexShared.value = newIndex;
      setExhausted(false);
      return newIndex;
    });
  }, [swipeCandidates.length, currentIndexShared]);

  useEffect(() => {
    handleNextCandidateRef.current = handleCardSwipeComplete;
  }, [handleCardSwipeComplete]);

  // Execute swipe actions
  const executeSwipeRightAction = useCallback((actionIndex: number) => {
    const actions = availableActionsRef.current;
    if (actionIndex >= 0 && actionIndex < actions.length) {
      const action = actions[actionIndex];
      
      // Handle "send offer" action - open modal instead of executing
      if (action === 'send offer') {
        setShowSendOfferFormPortal(true);
        return;
      }

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
  }, [sessionActivities, applicant]);

  const executeSwipeLeftReject = useCallback(() => {
    const applicantId = currentApplicantRef.current?.id;
    if (!applicantId) return;

    mutationMutateRef.current?.({
      applicantId,
      status: 'rejected',
      process: 'rejected',
    });
  }, []);

  // Handle send offer modal close
  const handleSendOfferFormPortalClose = useCallback(() => {
    setShowSendOfferFormPortal(false);
  }, []);

  // Handle send offer success - slide card out
  const handleSendOfferSuccess = useCallback(() => {
    setShowSendOfferFormPortal(false);
    handleCardSwipeComplete();
  }, [handleCardSwipeComplete]);

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

  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'talent-profile', label: 'Talent Profile' },
      { id: 'application', label: 'Application' },
    ];
    
    // Only show Actions tab when process is 'offered'
    if (currentProcess === 'offered') {
      baseTabs.push({ id: 'actions', label: 'Actions' });
    }
    
    return baseTabs;
  }, [currentProcess]);

  // Reset to 'talent-profile' tab if current tab is 'actions' and it's no longer available
  useEffect(() => {
    if (currentTab === 'actions' && currentProcess !== 'offered') {
      setCurrentTab('talent-profile');
    }
  }, [currentProcess, currentTab]);

  const getActionColor = (action: string): [string, string] => {
    if (action === 'shortlisted') return ['rgba(34, 197, 94, 1)', 'rgba(34, 197, 94, 0)'];
    if (action === 'send offer') return ['rgba(16, 185, 129, 1)', 'rgba(16, 185, 129, 0)'];
    return ['rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 0)'];
  };

  const getActionLabel = (action: string) => {
    if (action === 'shortlisted') return 'Shortlist';
    if (action === 'send offer') return 'Send Offer';
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
          <View className="flex-1 flex-row items-center justify-center gap-4">
            <TouchableOpacity 
              onPress={handlePreviousCandidate} 
              className="p-2"
              disabled={swipeCandidates.length === 0}>
              <ChevronLeft 
                size={20} 
                color={swipeCandidates.length === 0 ? "#666" : "#fff"} 
              />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-white">
              {swipeCandidates.length ? displayIndex + 1 : 0} / {swipeCandidates.length}
            </Text>
            <TouchableOpacity 
              onPress={handleNextCandidate} 
              className="p-2"
              disabled={swipeCandidates.length === 0}>
              <ChevronRight 
                size={20} 
                color={swipeCandidates.length === 0 ? "#666" : "#fff"} 
              />
            </TouchableOpacity>
          </View>
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
            {currentCandidate && currentProcess !== 'offered' && currentProcess !== 'rejected' && (
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
                      projectData={projectData}
                      roleId={roleId ? Number(roleId) : undefined}
                      roleWithSchedules={roleWithSchedules}
                      availableActions={getAvailableActions}
                      currentProcess={currentProcess}
                      onSwipeComplete={handleCardSwipeComplete}
                      onOfferSuccess={() => router.back()}
                      onSwipeStartExit={() => setExitingIndex(currentIndex)}
                      onExitAnimationEnd={handleExitAnimationEndWithNavigation}
                      onSwipeAction={executeSwipeRightAction}
                      onSwipeReject={executeSwipeLeftReject}
                      onHighlightAction={setHighlightedAction}
                      rejectGradientOpacity={rejectGradientOpacity}
                      rightActionOpacities={rightActionOpacities}
                      availableActionsCount={availableActionsCount}
                      availableActionsShared={availableActionsShared}
                      currentIndexShared={currentIndexShared}
                      currentProcessShared={currentProcessShared}
                      isExiting={isExiting}
                      showSendOfferFormPortal={isTopCard ? showSendOfferFormPortal : false}
                      onSendOfferFormPortalClose={handleSendOfferFormPortalClose}
                      onSendOfferSuccess={handleSendOfferSuccess}
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
