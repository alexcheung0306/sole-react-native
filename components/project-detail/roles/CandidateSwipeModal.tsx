import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, X } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchApplicants } from '@/api/apiservice/applicant_api';
import { getUserProfileByUsername } from '@/api/apiservice/soleUser_api';
import { talentSearchJobContracts } from '@/api/apiservice/jobContracts_api';
import { updateApplicantProcessById } from '@/api/apiservice/applicant_api';
import { CustomTabs } from '@/components/custom/custom-tabs';
import { getStatusColor } from '@/utils/get-status-color';
import TalentProfile from '~/components/talent-profile/TalentProfile';
import { ApplicationDetail } from '~/components/project-detail/roles/ApplicationDetail';
import { ActionToCandidates } from '~/components/project-detail/roles/ActionToCandidates';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const ACTION_AREA_WIDTH = 180; // Wider detection area
const MODAL_MARGIN = 20;
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.85; // 85% of screen height

type CandidateSwipeModalProps = {
  visible: boolean;
  onClose: () => void;
  candidates: any[];
  initialIndex: number;
  roleId: string | number | undefined;
  projectId: string | number | undefined;
  currentProcess: string;
  roleWithSchedules: any;
  onCandidateUpdated: () => void;
};

export function CandidateSwipeModal({
  visible,
  onClose,
  candidates,
  initialIndex,
  roleId,
  projectId,
  currentProcess,
  roleWithSchedules,
  onCandidateUpdated,
}: CandidateSwipeModalProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentTab, setCurrentTab] = useState('talent-profile');
  const [highlightedAction, setHighlightedAction] = useState<
    'shortlist' | 'invite' | 'reject' | null
  >(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Dual-card state management
  const [onTop, setOnTop] = useState<'A' | 'B'>('A');
  const [cardAIndex, setCardAIndex] = useState(initialIndex);
  const [cardBIndex, setCardBIndex] = useState(() => {
    const next = initialIndex + 1;
    return next < candidates.length ? next : -1;
  });

  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const actionOpacity = useSharedValue(0);
  const rejectActionOpacity = useSharedValue(0);
  const shortlistScale = useSharedValue(1);
  const inviteScale = useSharedValue(1);
  const rejectScale = useSharedValue(1);
  const scrollY = useSharedValue(0);

  // Dual-card scale animations
  const cardAScale = useSharedValue(onTop === 'A' ? 1 : 0.95);
  const cardBScale = useSharedValue(onTop === 'B' ? 1 : 0.95);

  // Gradient opacity values (start at 0, appear on drag, max 1.0 when lit up)
  const rejectGradientOpacity = useSharedValue(0);

  // Consolidated action gradient opacities array (support up to 5 right-side actions)
  const rightActionOpacities = useSharedValue([0, 0, 0, 0, 0]);

  // Store available actions count for worklet access (initialize to 0, will be updated)
  const availableActionsCount = useSharedValue(0);

  // Ref to store available actions for JS context access
  const availableActionsRef = useRef<string[]>([]);

  // Ref to store current applicant for JS context access
  const currentApplicantRef = useRef<any>(null);

  // Ref to store current process for JS context access
  const currentProcessRef = useRef<string>(currentProcess);

  // Ref to store mutation function and callbacks
  const mutationMutateRef = useRef<((variables: any) => void) | null>(null);
  const queryClientRef = useRef(queryClient);
  const onCandidateUpdatedRef = useRef(onCandidateUpdated);
  const handleNextCandidateRef = useRef<(() => void) | null>(null);

  // Refs to store projectId and roleId for mutation
  const projectIdRef = useRef(projectId);
  const roleIdRef = useRef(roleId);
  
  // Ref to store onTop for worklet access
  const onTopRef = useRef<'A' | 'B'>(onTop);

  // Initialize dual-card indices when modal opens
  useEffect(() => {
    if (visible && candidates.length > 0) {
      const validInitialIndex = Math.min(initialIndex, candidates.length - 1);
      const validIndex = validInitialIndex >= 0 ? validInitialIndex : 0;
      setCurrentIndex(validIndex);
      setCardAIndex(validIndex);
      const nextIndex = validIndex + 1;
      setCardBIndex(nextIndex < candidates.length ? nextIndex : -1);
      setOnTop('A');
    } else if (!visible) {
      // Reset on close
      setOnTop('A');
    }
  }, [visible, initialIndex, candidates.length]);

  // Get candidates based on which card is on top
  // When A is on top: Card A = cardAIndex, Card B = cardBIndex
  // When B is on top: Card B = cardBIndex, Card A = cardAIndex
  const cardACandidate =
    cardAIndex >= 0 && cardAIndex < candidates.length ? candidates[cardAIndex] : null;
  const cardBCandidate =
    cardBIndex >= 0 && cardBIndex < candidates.length ? candidates[cardBIndex] : null;

  // Determine which candidate is current based on onTop
  const currentCandidate = onTop === 'A' ? cardACandidate : cardBCandidate;
  const nextCandidate = onTop === 'A' ? cardBCandidate : cardACandidate;

  // Current candidate data (the one on top)
  const applicant = currentCandidate?.jobApplicant ?? {};
  const userInfo = currentCandidate?.userInfo ?? {};
  const username = currentCandidate?.username || userInfo?.username || 'unknown';
  const statusColor = getStatusColor(applicant?.applicationStatus || 'applied');

  // Next candidate data (the one behind)
  const nextApplicant = nextCandidate?.jobApplicant ?? {};
  const nextUserInfo = nextCandidate?.userInfo ?? {};
  const nextUsername = nextCandidate?.username || nextUserInfo?.username || 'unknown';
  const nextStatusColor = getStatusColor(nextApplicant?.applicationStatus || 'applied');

  // Get actual index for display
  const actualIndex = onTop === 'A' ? cardAIndex : cardBIndex;

  // Extract activities (excluding job type)
  const activities = roleWithSchedules?.activities || [];
  const sessionActivities = Array.isArray(activities)
    ? activities
        .filter((activity: any) => activity?.type !== 'job')
        .map((activity: any) => activity?.title)
        .filter(Boolean)
    : [];

  // Helper function to determine available actions based on currentProcess
  const getAvailableActions = useMemo(() => {
    // No actions at shortlisted or offered
    if (currentProcess === 'shortlisted' || currentProcess === 'offered') {
      return [];
    }

    if (currentProcess === 'applied') {
      // At applied: show all sessions + shortlisted (shortlisted should always be at the end)
      // If no sessions, still show shortlisted
      const actions = sessionActivities.length > 0 ? [...sessionActivities] : [];
      // Always include shortlisted at the end
      actions.push('shortlisted');
      return actions;
    } else if (sessionActivities.includes(currentProcess)) {
      // At a session: show remaining sessions (after current) + shortlisted
      const currentIndex = sessionActivities.indexOf(currentProcess);
      const remainingSessions = sessionActivities.slice(currentIndex + 1);
      const actions = [...remainingSessions];
      // Always include shortlisted at the end
      actions.push('shortlisted');
      return actions;
    }
    // Default: if nothing matches, at least show shortlisted if at applied status
    if (applicant?.applicationStatus === 'applied' || applicant?.applicationProcess === 'applied') {
      return ['shortlisted'];
    }
    return [];
  }, [
    currentProcess,
    sessionActivities,
    applicant?.applicationStatus,
    applicant?.applicationProcess,
  ]);

  // Helper to get action color by action type
  const getActionColor = (action: string): [string, string] => {
    if (action === 'shortlisted') return ['rgba(34, 197, 94, 1)', 'rgba(34, 197, 94, 0)'];
    if (action === 'send-offer') return ['rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 0)'];
    // Session actions - use blue gradient
    return ['rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 0)'];
  };

  // Helper to get action label
  const getActionLabel = (action: string) => {
    if (action === 'shortlisted') return 'Shortlist';
    if (action === 'send-offer') return 'Send Offer';
    return action; // Session name
  };

  // Update available actions count and ref when actions change
  useEffect(() => {
    availableActionsCount.value = getAvailableActions.length;
    availableActionsRef.current = getAvailableActions;
  }, [getAvailableActions, availableActionsCount, visible, currentProcess]);

  // Update current applicant ref when candidate changes
  useEffect(() => {
    if (currentCandidate) {
      currentApplicantRef.current = currentCandidate?.jobApplicant;
    }
  }, [currentCandidate]);

  // Update current process ref when it changes
  useEffect(() => {
    currentProcessRef.current = currentProcess;
  }, [currentProcess]);

  // Update projectId and roleId refs when they change
  useEffect(() => {
    projectIdRef.current = projectId;
    roleIdRef.current = roleId;
  }, [projectId, roleId]);

  // Reset animation values when candidate changes
  useEffect(() => {
    if (visible && currentCandidate) {
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 1;
      actionOpacity.value = 0;
      rejectActionOpacity.value = 0;
      shortlistScale.value = 1;
      inviteScale.value = 1;
      rejectScale.value = 1;
      rejectGradientOpacity.value = 0;
      // Reset dynamic right action opacities array
      rightActionOpacities.value = [0, 0, 0, 0, 0];
      setHighlightedAction(null);
      setCurrentTab('talent-profile');
    }
  }, [currentIndex, visible, currentCandidate]);

  // Reset when modal closes, set initialIndex when modal opens
  useEffect(() => {
    if (!visible) {
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 1;
      actionOpacity.value = 0;
      rejectActionOpacity.value = 0;
      shortlistScale.value = 1;
      inviteScale.value = 1;
      rejectScale.value = 1;
      rejectGradientOpacity.value = 0;
      // Reset dynamic right action opacities array
      rightActionOpacities.value = [0, 0, 0, 0, 0];
      setHighlightedAction(null);
      // Reset card scales
      cardAScale.value = 1;
      cardBScale.value = 0.95;
    } else if (visible && candidates.length > 0) {
      // When modal opens, set to initialIndex (the clicked card's index)
      const validInitialIndex = Math.min(initialIndex, candidates.length - 1);
      setCurrentIndex(validInitialIndex >= 0 ? validInitialIndex : 0);
      // Initialize scales
      cardAScale.value = 1;
      cardBScale.value = 0.95;
    }
  }, [visible, initialIndex, candidates.length]);

  // Update onTop ref when it changes
  useEffect(() => {
    onTopRef.current = onTop;
  }, [onTop]);

  // Set card scales when onTop changes (animations are reset in handleCardSwipeComplete)
  useEffect(() => {
    // Set card scales based on which card is on top
    if (onTop === 'A') {
      cardAScale.value = 1;
      cardBScale.value = 0.95;
    } else {
      cardBScale.value = 1;
      cardAScale.value = 0.95;
    }
  }, [onTop, cardAScale, cardBScale]);

  // Get candidate data for Card A and Card B
  const cardAApplicant = cardACandidate?.jobApplicant ?? {};
  const cardAUserInfo = cardACandidate?.userInfo ?? {};
  const cardAUsername = cardACandidate?.username || cardAUserInfo?.username || 'unknown';

  const cardBApplicant = cardBCandidate?.jobApplicant ?? {};
  const cardBUserInfo = cardBCandidate?.userInfo ?? {};
  const cardBUsername = cardBCandidate?.username || cardBUserInfo?.username || 'unknown';

  // Fetch full user profile data for Card A
  const { data: cardATalentProfileData, isLoading: isLoadingCardATalentProfile } = useQuery({
    queryKey: ['userProfile', cardAUsername],
    queryFn: async () => {
      if (!cardAUsername || cardAUsername === 'unknown' || cardAUsername.trim() === '') {
        return null;
      }
      return getUserProfileByUsername(cardAUsername);
    },
    enabled:
      visible && !!cardAUsername && cardAUsername !== 'unknown' && cardAUsername.trim() !== '',
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Fetch contracts for Card A applicant
  const searchUrl = `projectId=${projectId}&orderBy=createdAt&orderSeq=desc&pageNo=0&pageSize=99`;
  const { data: cardAContractsData, isLoading: isLoadingCardAContracts } = useQuery({
    queryKey: ['applicantContracts', cardAApplicant?.soleUserId, projectId],
    queryFn: async () => {
      if (!cardAApplicant?.soleUserId || !projectId) return [];
      const result = await talentSearchJobContracts(cardAApplicant.soleUserId, searchUrl);
      return result?.data || [];
    },
    enabled:
      visible &&
      !!cardAApplicant?.soleUserId &&
      !!projectId &&
      cardAApplicant?.applicationStatus === 'offered',
  });

  // Fetch full user profile data for Card B
  const { data: cardBTalentProfileData, isLoading: isLoadingCardBTalentProfile } = useQuery({
    queryKey: ['userProfile', cardBUsername],
    queryFn: async () => {
      if (!cardBUsername || cardBUsername === 'unknown' || cardBUsername.trim() === '') {
        return null;
      }
      return getUserProfileByUsername(cardBUsername);
    },
    enabled:
      visible && !!cardBUsername && cardBUsername !== 'unknown' && cardBUsername.trim() !== '',
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Fetch contracts for Card B applicant
  const { data: cardBContractsData, isLoading: isLoadingCardBContracts } = useQuery({
    queryKey: ['applicantContracts', cardBApplicant?.soleUserId, projectId],
    queryFn: async () => {
      if (!cardBApplicant?.soleUserId || !projectId) return [];
      const result = await talentSearchJobContracts(cardBApplicant.soleUserId, searchUrl);
      return result?.data || [];
    },
    enabled:
      visible &&
      !!cardBApplicant?.soleUserId &&
      !!projectId &&
      cardBApplicant?.applicationStatus === 'offered',
  });

  // Use data based on which card is on top (for backward compatibility with existing code)
  const talentProfileData = onTop === 'A' ? cardATalentProfileData : cardBTalentProfileData;
  const isLoadingTalentProfile =
    onTop === 'A' ? isLoadingCardATalentProfile : isLoadingCardBTalentProfile;
  const contractsData = onTop === 'A' ? cardAContractsData : cardBContractsData;
  const isLoadingContracts = onTop === 'A' ? isLoadingCardAContracts : isLoadingCardBContracts;

  const nextTalentProfileData = onTop === 'A' ? cardBTalentProfileData : cardATalentProfileData;
  const isLoadingNextTalentProfile =
    onTop === 'A' ? isLoadingCardBTalentProfile : isLoadingCardATalentProfile;
  const nextContractsData = onTop === 'A' ? cardBContractsData : cardAContractsData;
  const isLoadingNextContracts = onTop === 'A' ? isLoadingCardBContracts : isLoadingCardAContracts;

  // Mutation for updating applicant status
  const updateApplicantMutation = useMutation({
    mutationFn: async ({
      applicantId,
      status,
      process,
    }: {
      applicantId: number;
      status: string;
      process?: string;
    }) => {
      const applicationProcess =
        process || (status === 'rejected' ? 'rejected' : currentProcessRef.current);
      const applicantData = currentApplicantRef.current;

      // Include all required fields like the web version does - must preserve all existing fields
      // The web version explicitly uses projectData.id for projectId
      const updateValues: any = {
        id: applicantData?.id || applicantId,
        soleUserId: applicantData?.soleUserId || null,
        roleId: applicantData?.roleId || (roleIdRef.current ? Number(roleIdRef.current) : null),
        projectId: projectIdRef.current
          ? Number(projectIdRef.current)
          : applicantData?.projectId || null,
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
    onSuccess: (_, variables) => {
      queryClientRef.current?.invalidateQueries({ queryKey: ['role-candidates'] });
      queryClientRef.current?.invalidateQueries({ queryKey: ['role-process-counts'] });
      onCandidateUpdatedRef.current?.();

      // Reset animations for the swiped card (instant, no animation)
      // translateX.value = 0;
      // translateY.value = 0;
      // opacity.value = 1;

      // Trigger card swap after a delay to allow query to update
      // Use a longer delay to ensure the candidate list has been updated
      setTimeout(() => {
        handleCardSwipeCompleteRef.current?.();
      }, 300);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to execute action. Please try again.', [{ text: 'OK' }]);
    },
  });

  // Store mutation function in ref for worklet access
  useEffect(() => {
    mutationMutateRef.current = updateApplicantMutation.mutate;
    queryClientRef.current = queryClient;
    onCandidateUpdatedRef.current = onCandidateUpdated;
  }, [updateApplicantMutation.mutate, queryClient, onCandidateUpdated]);

  // Handle card swipe completion - switch cards and update indices
  const handleCardSwipeComplete = useCallback(() => {
    // Check if we have any candidates left
    if (candidates.length === 0) {
      onClose();
      return;
    }

    // Get the current top card's index
    const currentTopIndex = onTop === 'A' ? cardAIndex : cardBIndex;

    // Find the next valid candidate index
    // Start from the next index after the current top card
    let nextIndex = currentTopIndex + 1;

    // If we've gone past the end, or if the current candidate is no longer in the list,
    // find the first valid candidate
    if (
      nextIndex >= candidates.length ||
      currentTopIndex < 0 ||
      currentTopIndex >= candidates.length
    ) {
      // The current candidate was removed or list changed, start from beginning
      nextIndex = 0;
    }

    // Validate the next index
    if (nextIndex >= candidates.length) {
      // No more candidates, close modal
      onClose();
      return;
    }

    // Reset animations BEFORE swapping to prevent flickering
    // The back card will use translateX = 0, so resetting here ensures smooth transition
    translateX.value = 0;
    translateY.value = 0;
    opacity.value = 1;
    rejectGradientOpacity.value = 0;
    rightActionOpacities.value = [0, 0, 0, 0, 0];

    // Switch which card is on top
    const newOnTop = onTop === 'A' ? 'B' : 'A';
    setOnTop(newOnTop);

    // Update the new top card's index to the next valid candidate
    if (newOnTop === 'A') {
      setCardAIndex(nextIndex);
      setCurrentIndex(nextIndex);
      // Update Card B to the next candidate after Card A
      const cardBNextIndex = nextIndex + 1;
      if (cardBNextIndex < candidates.length) {
        setCardBIndex(cardBNextIndex);
      } else {
        setCardBIndex(-1);
      }
    } else {
      setCardBIndex(nextIndex);
      setCurrentIndex(nextIndex);
      // Update Card A to the next candidate after Card B
      const cardANextIndex = nextIndex + 1;
      if (cardANextIndex < candidates.length) {
        setCardAIndex(cardANextIndex);
      } else {
        setCardAIndex(-1);
      }
    }
  }, [onTop, cardAIndex, cardBIndex, candidates.length, onClose, translateX, translateY, opacity, rejectGradientOpacity, rightActionOpacities]);

  const handleNextCandidate = () => {
    // Trigger card swipe completion instead of directly updating index
    handleCardSwipeComplete();
  };

  // Update handleCardSwipeComplete ref for mutation access
  const handleCardSwipeCompleteRef = useRef(handleCardSwipeComplete);
  useEffect(() => {
    handleCardSwipeCompleteRef.current = handleCardSwipeComplete;
  }, [handleCardSwipeComplete]);

  const handleReject = () => {
    if (!applicant?.id) return;

    // Just show alert and execute - no confirmation needed
    Alert.alert('Candidate Rejected', 'The candidate has been rejected.', [{ text: 'OK' }]);

    updateApplicantMutation.mutate({
      applicantId: applicant.id,
      status: 'rejected',
    });
  };

  const handleClose = () => {
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    opacity.value = withTiming(0, {}, () => {
      runOnJS(onClose)();
    });
  };

  const executeSwipeLeftReject = () => {
    'worklet';
    const maxTranslate = SCREEN_WIDTH - MODAL_MARGIN * 2;
    translateX.value = withSpring(-maxTranslate, {}, () => {
      runOnJS(handleReject)();
    });
    opacity.value = withTiming(0);
  };

  // Execute action by index (called from worklet via runOnJS) - use refs only to avoid closure issues
  const executeActionByIndex = useCallback((actionIndex: number) => {
    const action = availableActionsRef.current[actionIndex];
    const applicantData = currentApplicantRef.current;
    const mutateFn = mutationMutateRef.current;

    if (!action || !applicantData?.id || !mutateFn) {
      console.warn('Cannot execute action: missing data', {
        action,
        applicantData: !!applicantData,
        mutateFn: !!mutateFn,
      });
      return;
    }

    // Directly execute based on action type - no confirmation needed
    if (action === 'shortlisted') {
      mutateFn({
        applicantId: applicantData.id,
        status: 'shortlisted',
        process: 'shortlisted',
      });
    } else {
      // Session action - map to session with "invited" status
      mutateFn({
        applicantId: applicantData.id,
        status: 'invited',
        process: action,
      });
    }
  }, []); // Empty deps since we only use refs

  const executeSwipeRightAction = (actionIndex: number) => {
    'worklet';
    if (actionIndex >= 0) {
      const maxTranslate = SCREEN_WIDTH - MODAL_MARGIN * 2;
      translateX.value = withSpring(maxTranslate, {}, () => {
        runOnJS(executeActionByIndex)(actionIndex);
      });
      opacity.value = withTiming(0);
    } else {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    }
  };

  const executeSwipeDown = () => {
    'worklet';
    translateY.value = withSpring(SCREEN_HEIGHT, {}, () => {
      runOnJS(handleClose)();
    });
    opacity.value = withTiming(0);
  };

  // Header pan gesture - only vertical (down) drag for closing - enabled when any card is on top
  const headerPanGesture = Gesture.Pan()
    .enabled(true) // Always enabled, but only affects the card that's on top via animated styles
    .activeOffsetY([0, 1]) // Only activate on downward movement
    .failOffsetX([-50, 50]) // Fail if horizontal movement exceeds 50px
    .minDistance(10) // Require 10px movement before activation
    .onUpdate((event) => {
      'worklet';
      // Only allow vertical translation for header
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      'worklet';
      const { translationY, velocityY } = event;

      // Swipe down to close
      if (translationY > SWIPE_THRESHOLD || velocityY > 500) {
        executeSwipeDown();
      } else {
        // Snap back
        translateY.value = withSpring(0);
      }
    });

  // Content pan gesture - horizontal swipes for actions, only when scroll is at top
  const contentPanGesture = Gesture.Pan()
    .enabled(true) // Always enabled, but only affects the card that's on top via animated styles
    .activeOffsetX([-15, 15]) // Activate on horizontal movement (15px threshold)
    .failOffsetY([-50, 50]) // Fail if too much vertical movement
    .minDistance(15) // Require 15px movement before activation
    .onBegin(() => {
      'worklet';
      // Check if scrolled at the beginning of gesture - cancel if scrolled
      if (scrollY.value > 10) {
        return;
      }
    })
    .onUpdate((event) => {
      'worklet';
      // Only process if scroll is at top - allow small scroll threshold
      if (scrollY.value > 10) {
        return;
      }
      // Better threshold: if vertical movement is 1.5x horizontal, prioritize scrolling
      if (Math.abs(event.translationY) > Math.abs(event.translationX) * 1.5) {
        return;
      }

      translateX.value = event.translationX;

      const maxDragDistance = SCREEN_WIDTH - MODAL_MARGIN * 2;
      const modalCenterY = (SCREEN_HEIGHT - MODAL_HEIGHT) / 2 + MODAL_HEIGHT / 2;
      const actionThreshold = 120; // Y position threshold for shortlist vs invite (wider)
      
      // Calculate drag progress for back card scaling (0 to 1)
      // Scale the back card as front card approaches action/reject areas
      let dragProgressForScale = 0;
      const isDraggingLeft = event.translationX < -30;
      const isDraggingRight = event.translationX > 30;
      
      if (isDraggingLeft || isDraggingRight) {
        // Calculate progress based on how close to the threshold
        const absTranslationX = Math.abs(event.translationX);
        dragProgressForScale = Math.min(absTranslationX / SWIPE_THRESHOLD, 1); // Scale from 0 to 1 as we approach threshold
      }
      
      // Animate back card scale based on drag progress
      // Scale from 0.95 to 1.0 as front card gets closer to action/reject areas
      const targetBackScale = 0.95 + (dragProgressForScale * 0.05); // From 0.95 to 1.0
      
      // Use ref to access onTop in worklet
      const currentOnTop = onTopRef.current;
      if (currentOnTop === 'A') {
        // Card A is front, Card B is behind - scale Card B
        cardBScale.value = withTiming(targetBackScale, { duration: 100 });
      } else {
        // Card B is front, Card A is behind - scale Card A
        cardAScale.value = withTiming(targetBackScale, { duration: 100 });
      }

      // Handle LEFT swipe (Reject) - show gradient when dragging left
      // Disable reject when at offered status
      if (event.translationX < -30) {
        // Check if we're at offered status - if so, don't show reject
        const isOffered = currentProcessRef.current === 'offered';
        if (!isOffered) {
          // Calculate opacity based on drag distance (closer to edge = brighter)
          const dragProgress = Math.min(Math.abs(event.translationX) / maxDragDistance, 1);
          const targetOpacity = 0.4 + dragProgress * 0.6; // From 0.4 to 1.0
          rejectGradientOpacity.value = withTiming(targetOpacity);
          runOnJS(setHighlightedAction)('reject');
        } else {
          // At offered status, hide reject gradient
          rejectGradientOpacity.value = withTiming(0);
        }
      } else {
        // Hide reject gradient if not dragging left
        rejectGradientOpacity.value = withTiming(0);
        if (highlightedAction === 'reject') {
          runOnJS(setHighlightedAction)(null);
        }
      }

      // Handle RIGHT swipe (Dynamic actions) - show gradients when dragging right
      if (event.translationX > 30) {
        const dragProgress = Math.min(event.translationX / maxDragDistance, 1);
        const baseOpacity = 0.3 + dragProgress * 0.7; // From 0.3 to 1.0
        const dimOpacity = baseOpacity * 0.4;

        // Calculate Y position on screen (0 to SCREEN_HEIGHT)
        const screenY = SCREEN_HEIGHT / 2 + event.translationY;
        const clampedY = Math.max(0, Math.min(SCREEN_HEIGHT, screenY));
        const actionCount = availableActionsCount.value;
        const actionHeight = SCREEN_HEIGHT / Math.max(actionCount, 1);
        const actionIndex = Math.min(
          Math.max(0, Math.floor(clampedY / actionHeight)),
          Math.min(actionCount - 1, 4)
        );

        // Update array-based opacities - light up all actions dimly first
        const newOpacities = [...rightActionOpacities.value];
        for (let i = 0; i < Math.min(actionCount, 5); i++) {
          newOpacities[i] = dimOpacity;
        }

        // Brightly highlight the action being dragged to (if drag is far enough)
        if (dragProgress > 0.3 && actionIndex >= 0 && actionIndex < actionCount) {
          newOpacities[actionIndex] = baseOpacity;
        }

        rightActionOpacities.value = newOpacities;
      } else {
        // Hide all right gradients if not dragging right
        rightActionOpacities.value = [0, 0, 0, 0, 0];
      }
    })
    .onEnd((event) => {
      'worklet';
      // Only process if scroll is at top
      if (scrollY.value > 5) {
        translateX.value = withTiming(0, { duration: 300 });
        // Hide gradients
        rejectGradientOpacity.value = withTiming(0);
        rightActionOpacities.value = [0, 0, 0, 0, 0];
        // Reset back card scale
        const currentOnTop = onTopRef.current;
        if (currentOnTop === 'A') {
          cardBScale.value = withTiming(0.95, { duration: 200 });
        } else {
          cardAScale.value = withTiming(0.95, { duration: 200 });
        }
        return;
      }

      const { translationX, translationY, velocityX } = event;

      const maxDragDistance = SCREEN_WIDTH - MODAL_MARGIN * 2;
      const modalCenterY = (SCREEN_HEIGHT - MODAL_HEIGHT) / 2 + MODAL_HEIGHT / 2;
      const actionThreshold = 120; // Wider threshold
      const highlightOpacityThreshold = 0.5; // Only trigger if opacity is above this

      // Check if dragged to edge
      const draggedToLeftEdge = translationX < -SWIPE_THRESHOLD || velocityX < -500;
      const draggedToRightEdge = translationX > SWIPE_THRESHOLD || velocityX > 500;

      // Swipe LEFT - only trigger if reject area is highlighted
      // Disable reject when at offered status
      if (draggedToLeftEdge) {
        const isOffered = currentProcessRef.current === 'offered';
        if (!isOffered && rejectGradientOpacity.value > highlightOpacityThreshold) {
          // Area is highlighted and not at offered status, trigger action
          // Back card scale will be handled in the mutation onSuccess
          executeSwipeLeftReject();
        } else {
          // No area highlighted or at offered status, smooth slide back
          translateX.value = withTiming(0, { duration: 300 });
          rejectGradientOpacity.value = withTiming(0);
          runOnJS(setHighlightedAction)(null);
          // Reset back card scale
          if (onTop === 'A') {
            cardBScale.value = withTiming(0.95, { duration: 200 });
          } else {
            cardAScale.value = withTiming(0.95, { duration: 200 });
          }
        }
        return;
      }

      // Swipe RIGHT - trigger based on highlighted action index
      if (draggedToRightEdge) {
        const actionCount = availableActionsCount.value;
        const screenY = SCREEN_HEIGHT / 2 + translationY;
        const clampedY = Math.max(0, Math.min(SCREEN_HEIGHT, screenY));
        const actionHeight = SCREEN_HEIGHT / Math.max(actionCount, 1);
        const actionIndex = Math.min(
          Math.max(0, Math.floor(clampedY / actionHeight)),
          Math.min(actionCount - 1, 4)
        );

        // Check if any action is highlighted enough using array
        const currentOpacities = rightActionOpacities.value;
        const isHighlighted =
          actionIndex >= 0 &&
          actionIndex < actionCount &&
          currentOpacities[actionIndex] > highlightOpacityThreshold;

        if (isHighlighted) {
          // Area is highlighted, trigger action
          // Back card scale will be handled in the mutation onSuccess
          executeSwipeRightAction(actionIndex);
        } else {
          // No area highlighted, smooth slide back
          translateX.value = withTiming(0, { duration: 300 });
          rightActionOpacities.value = [0, 0, 0, 0, 0];
          // Reset back card scale
          if (onTop === 'A') {
            cardBScale.value = withTiming(0.95, { duration: 200 });
          } else {
            cardAScale.value = withTiming(0.95, { duration: 200 });
          }
        }
        return;
      }

      // Not dragged to edge - smooth slide back to center
      translateX.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
      rejectGradientOpacity.value = withTiming(0);
      rightActionOpacities.value = [0, 0, 0, 0, 0];
      runOnJS(setHighlightedAction)(null);
      // Reset back card scale
      if (onTop === 'A') {
        cardBScale.value = withTiming(0.95, { duration: 200 });
      } else {
        cardAScale.value = withTiming(0.95, { duration: 200 });
      }
    });

  // Scroll handler to track scroll position
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
      // Update state to track if scrolled
      const scrolled = event.contentOffset.y > 5;
      if (scrolled !== isScrolled) {
        runOnJS(setIsScrolled)(scrolled);
      }
    },
  });

  // Animated styles for Card A
  const cardAAnimatedStyle = useAnimatedStyle(() => {
    const maxTranslate = SCREEN_WIDTH - MODAL_MARGIN * 2;
    // For back card, always use 0 for translateX/Y to prevent flickering
    const currentTranslateX = onTop === 'A' ? translateX.value : 0;
    const currentTranslateY = onTop === 'A' ? translateY.value : 0;
    const rotate =
      onTop === 'A'
        ? interpolate(translateX.value, [-maxTranslate, 0, maxTranslate], [-15, 0, 15])
        : 0;
    return {
      transform: [
        { translateX: currentTranslateX },
        { translateY: currentTranslateY },
        { rotate: `${rotate}deg` },
        { scale: cardAScale.value },
      ],
      opacity: onTop === 'A' ? opacity.value : 1,
    };
  });

  // Animated styles for Card B
  const cardBAnimatedStyle = useAnimatedStyle(() => {
    const maxTranslate = SCREEN_WIDTH - MODAL_MARGIN * 2;
    // For back card, always use 0 for translateX/Y to prevent flickering
    const currentTranslateX = onTop === 'B' ? translateX.value : 0;
    const currentTranslateY = onTop === 'B' ? translateY.value : 0;
    const rotate =
      onTop === 'B'
        ? interpolate(translateX.value, [-maxTranslate, 0, maxTranslate], [-15, 0, 15])
        : 0;
    return {
      transform: [
        { translateX: currentTranslateX },
        { translateY: currentTranslateY },
        { rotate: `${rotate}deg` },
        { scale: cardBScale.value },
      ],
      opacity: onTop === 'B' ? opacity.value : 1,
    };
  });

  // Animated styles for gradient opacities
  const rejectGradientAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: rejectGradientOpacity.value,
    };
  });

  // Animated styles for text opacity - solid when area is reached
  const rejectTextAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: rejectGradientOpacity.value > 0.3 ? 1 : rejectGradientOpacity.value * 2,
    };
  });

  // Create animated styles for all action gradients (up to 5) - must be called at top level
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

  // Create animated styles for all action texts (up to 5) - must be called at top level
  const rightAction0TextStyle = useAnimatedStyle(() => {
    const opacity = rightActionOpacities.value[0] || 0;
    return {
      opacity: opacity > 0.3 ? 1 : opacity * 2,
    };
  });
  const rightAction1TextStyle = useAnimatedStyle(() => {
    const opacity = rightActionOpacities.value[1] || 0;
    return {
      opacity: opacity > 0.3 ? 1 : opacity * 2,
    };
  });
  const rightAction2TextStyle = useAnimatedStyle(() => {
    const opacity = rightActionOpacities.value[2] || 0;
    return {
      opacity: opacity > 0.3 ? 1 : opacity * 2,
    };
  });
  const rightAction3TextStyle = useAnimatedStyle(() => {
    const opacity = rightActionOpacities.value[3] || 0;
    return {
      opacity: opacity > 0.3 ? 1 : opacity * 2,
    };
  });
  const rightAction4TextStyle = useAnimatedStyle(() => {
    const opacity = rightActionOpacities.value[4] || 0;
    return {
      opacity: opacity > 0.3 ? 1 : opacity * 2,
    };
  });

  // Array of styles for easy access by index
  const rightActionGradientStyles = [
    rightAction0GradientStyle,
    rightAction1GradientStyle,
    rightAction2GradientStyle,
    rightAction3GradientStyle,
    rightAction4GradientStyle,
  ];

  const rightActionTextStyles = [
    rightAction0TextStyle,
    rightAction1TextStyle,
    rightAction2TextStyle,
    rightAction3TextStyle,
    rightAction4TextStyle,
  ];

  const tabs = [
    { id: 'talent-profile', label: 'Talent Profile' },
    { id: 'application', label: 'Application Details' },
    { id: 'actions', label: 'Actions' },
  ];

  // Validate and fix indices when candidates list changes
  useEffect(() => {
    if (!visible || candidates.length === 0) return;

    // Validate Card A index
    if (cardAIndex < 0 || cardAIndex >= candidates.length) {
      setCardAIndex(0);
      setCurrentIndex(0);
      setOnTop('A');
    }

    // Validate Card B index
    if (cardBIndex >= candidates.length) {
      setCardBIndex(cardBIndex < candidates.length ? cardBIndex : -1);
    }

    // If Card A is invalid but we have candidates, reset to first
    if (cardAIndex < 0 && candidates.length > 0) {
      setCardAIndex(0);
      setCardBIndex(1 < candidates.length ? 1 : -1);
      setCurrentIndex(0);
      setOnTop('A');
    }
  }, [candidates.length, visible, cardAIndex, cardBIndex]);

  if (!visible || !currentCandidate) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 justify-center" style={{ paddingHorizontal: MODAL_MARGIN }}>
          {/* Backdrop */}
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.65)',
            }}
            onPress={handleClose}
          />

          {/* Card Stack Container */}
          <View
            style={{
              height: MODAL_HEIGHT,
              width: SCREEN_WIDTH - MODAL_MARGIN * 2,
              position: 'relative',
            }}>
            {/* Render cards in order: behind card first, front card last (like exp.tsx) */}
            {/* Card B (Behind when onTop === 'A', Front when onTop === 'B') */}
            {cardBCandidate && (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    height: MODAL_HEIGHT,
                    width: SCREEN_WIDTH - MODAL_MARGIN * 2,
                    borderRadius: 28,
                    borderWidth: 1,
                    borderColor: onTop === 'B' ? 'rgb(21, 0, 255)' : 'rgb(255, 0, 0)',
                    overflow: 'hidden',
                    zIndex: onTop === 'B' ? 2 : 1, // Set z-index directly like exp.tsx
                  },
                  cardBAnimatedStyle,
                ]}>
                {/* Blur Background */}
                <BlurView
                  intensity={100}
                  tint="dark"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                {/* Semi-transparent overlay */}
                <View className="bg-black/12 absolute inset-0" />

                {/* Handle Bar and Header */}
                <View>
                  {/* Handle Bar */}
                  <View className="items-center pb-2 pt-4">
                    <View
                      style={{
                        width: 40,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      }}
                    />
                  </View>

                  {/* Header */}
                  <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
                    <View className="-ml-2 p-2" />
                    <Text className="flex-1 text-center text-lg font-semibold text-white">
                      {cardBIndex >= 0 ? cardBIndex + 1 : 0} / {candidates.length}
                    </Text>
                    <View className="-mr-2 p-2" />
                  </View>
                </View>

                {/* Content */}
                <ScrollView
                  className="flex-1"
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  scrollEnabled={true}>
                  {/* Candidate Header Card */}
                  <View className="mx-4 mt-4 rounded-2xl border border-white/10 bg-zinc-800 p-4">
                    <View className="flex-row items-center gap-4">
                      <Image
                        source={{
                          uri:
                            cardBTalentProfileData?.userInfo?.profilePic ||
                            cardBCandidate?.comcardFirstPic ||
                            cardBUserInfo?.profilePic ||
                            undefined,
                        }}
                        className="h-20 w-20 rounded-full bg-zinc-700"
                      />
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-white">
                          {cardBTalentProfileData?.userInfo?.name ||
                            cardBUserInfo?.name ||
                            'Unnamed candidate'}
                        </Text>
                        <Text className="text-sm text-white/60">@{cardBUsername}</Text>
                        <View
                          className="mt-2 self-start rounded-full border px-3 py-1.5"
                          style={{
                            backgroundColor:
                              getStatusColor(cardBApplicant?.applicationStatus || 'applied') + '20',
                            borderColor:
                              getStatusColor(cardBApplicant?.applicationStatus || 'applied') + '60',
                          }}>
                          <Text
                            className="text-xs font-bold uppercase tracking-wide"
                            style={{
                              color: getStatusColor(cardBApplicant?.applicationStatus || 'applied'),
                            }}>
                            {cardBApplicant?.applicationStatus || 'applied'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Tabs */}
                  <View className="mt-4 px-4">
                    <CustomTabs tabs={tabs} value="talent-profile" onValueChange={() => {}} />
                  </View>

                  {/* Tab Content */}
                  <View className="px-4 pb-8">
                    <View className="">
                      {isLoadingCardBTalentProfile ? (
                        <View className="py-8">
                          <ActivityIndicator size="large" color="#3b82f6" />
                        </View>
                      ) : !cardBTalentProfileData || !cardBTalentProfileData.talentInfo ? (
                        <View className="py-8">
                          <Text className="mb-2 text-center text-base font-semibold text-white">
                            Profile Not Available
                          </Text>
                          <Text className="text-center text-sm text-white/60">
                            {cardBUsername === 'unknown'
                              ? "This user's profile information is not available."
                              : 'Unable to load profile data for this user.'}
                          </Text>
                        </View>
                      ) : (
                        <TalentProfile
                          userProfileData={cardBTalentProfileData}
                          talentLevel={parseInt(cardBTalentProfileData?.talentLevel || '0')}
                          talentInfo={cardBTalentProfileData?.talentInfo}
                          isOwnProfile={false}
                        />
                      )}
                    </View>
                  </View>
                </ScrollView>
              </Animated.View>
            )}

            {/* Card A (Front when onTop === 'A', Behind when onTop === 'B') */}
            {cardACandidate && (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    height: MODAL_HEIGHT,
                    width: SCREEN_WIDTH - MODAL_MARGIN * 2,
                    borderRadius: 28,
                    borderWidth: 1,
                    borderColor: onTop === 'A' ? 'rgb(21, 0, 255)' : 'rgb(255, 0, 0)',
                    overflow: 'hidden',
                    zIndex: onTop === 'A' ? 2 : 1, // Set z-index directly like exp.tsx
                  },
                  cardAAnimatedStyle,
                ]}>
                {/* Blur Background */}
                <BlurView
                  intensity={100}
                  tint="dark"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                {/* Semi-transparent overlay */}
                <View className="bg-black/12 absolute inset-0" />

                {/* Handle Bar and Header - with header gesture (only interactive when Card A is on top) */}
                <GestureDetector
                  gesture={onTop === 'A' ? headerPanGesture : Gesture.Pan().enabled(false)}>
                  <View>
                    {/* Handle Bar */}
                    <View className="items-center pb-2 pt-4">
                      <View
                        style={{
                          width: 40,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: 'rgba(255, 255, 255, 0.4)',
                        }}
                      />
                    </View>

                    {/* Header */}
                    <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
                      {onTop === 'A' ? (
                        <>
                          <TouchableOpacity onPress={handleClose} className="-ml-2 p-2">
                            <ChevronLeft size={24} color="#ffffff" />
                          </TouchableOpacity>
                          <Text className="flex-1 text-center text-lg font-semibold text-white">
                            {cardAIndex >= 0 ? cardAIndex + 1 : 0} / {candidates.length}
                          </Text>
                          <TouchableOpacity onPress={handleClose} className="-mr-2 p-2">
                            <X size={24} color="#ffffff" />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <View className="-ml-2 p-2" />
                          <Text className="flex-1 text-center text-lg font-semibold text-white">
                            {cardAIndex >= 0 ? cardAIndex + 1 : 0} / {candidates.length}
                          </Text>
                          <View className="-mr-2 p-2" />
                        </>
                      )}
                    </View>
                  </View>
                </GestureDetector>

                {/* Content - with content gesture for horizontal swipes (only interactive when Card A is on top) */}
                {onTop === 'A' ? (
                  <GestureDetector gesture={contentPanGesture}>
                    <Animated.ScrollView
                      className="flex-1"
                      showsVerticalScrollIndicator={false}
                      bounces={false}
                      scrollEnabled={true}
                      onScroll={onTop === 'A' ? scrollHandler : undefined}
                      scrollEventThrottle={16}>
                      {/* Candidate Header Card */}
                      <View className="mx-4 mt-4 rounded-2xl border border-white/10 bg-zinc-800 p-4">
                        <View className="flex-row items-center gap-4">
                          <Image
                            source={{
                              uri:
                                cardATalentProfileData?.userInfo?.profilePic ||
                                cardACandidate?.comcardFirstPic ||
                                cardAUserInfo?.profilePic ||
                                undefined,
                            }}
                            className="h-20 w-20 rounded-full bg-zinc-700"
                          />
                          <View className="flex-1">
                            <Text className="text-lg font-semibold text-white">
                              {cardATalentProfileData?.userInfo?.name ||
                                cardAUserInfo?.name ||
                                'Unnamed candidate'}
                            </Text>
                            <Text className="text-sm text-white/60">@{cardAUsername}</Text>
                            <View
                              className="mt-2 self-start rounded-full border px-3 py-1.5"
                              style={{
                                backgroundColor:
                                  getStatusColor(cardAApplicant?.applicationStatus || 'applied') +
                                  '20',
                                borderColor:
                                  getStatusColor(cardAApplicant?.applicationStatus || 'applied') +
                                  '60',
                              }}>
                              <Text
                                className="text-xs font-bold uppercase tracking-wide"
                                style={{
                                  color: getStatusColor(
                                    cardAApplicant?.applicationStatus || 'applied'
                                  ),
                                }}>
                                {cardAApplicant?.applicationStatus || 'applied'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Tabs */}
                      <View className="mt-4 px-4">
                        <CustomTabs tabs={tabs} value={currentTab} onValueChange={setCurrentTab} />
                      </View>

                      {/* Tab Content */}
                      <View className="px-4 pb-8">
                        {currentTab === 'talent-profile' && (
                          <View className="">
                            {isLoadingCardATalentProfile ? (
                              <View className="py-8">
                                <ActivityIndicator size="large" color="#3b82f6" />
                              </View>
                            ) : !cardATalentProfileData || !cardATalentProfileData.talentInfo ? (
                              <View className="py-8">
                                <Text className="mb-2 text-center text-base font-semibold text-white">
                                  Profile Not Available
                                </Text>
                                <Text className="text-center text-sm text-white/60">
                                  {cardAUsername === 'unknown'
                                    ? "This user's profile information is not available."
                                    : 'Unable to load profile data for this user.'}
                                </Text>
                              </View>
                            ) : (
                              <TalentProfile
                                userProfileData={cardATalentProfileData}
                                talentLevel={parseInt(cardATalentProfileData?.talentLevel || '0')}
                                talentInfo={cardATalentProfileData?.talentInfo}
                                isOwnProfile={false}
                              />
                            )}
                          </View>
                        )}

                        {currentTab === 'application' && (
                          <ApplicationDetail applicant={cardAApplicant} />
                        )}

                        {currentTab === 'actions' && (
                          <ActionToCandidates
                            applicant={cardACandidate}
                            projectData={{ id: projectId }}
                            roleId={roleId ? parseInt(roleId as string) : undefined}
                            contractsData={cardAContractsData}
                            isLoadingContracts={isLoadingCardAContracts}
                          />
                        )}
                      </View>
                    </Animated.ScrollView>
                  </GestureDetector>
                ) : (
                  <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    scrollEnabled={true}>
                    {/* Same content but non-interactive */}
                    <View className="mx-4 mt-4 rounded-2xl border border-white/10 bg-zinc-800 p-4">
                      <View className="flex-row items-center gap-4">
                        <Image
                          source={{
                            uri:
                              cardATalentProfileData?.userInfo?.profilePic ||
                              cardACandidate?.comcardFirstPic ||
                              cardAUserInfo?.profilePic ||
                              undefined,
                          }}
                          className="h-20 w-20 rounded-full bg-zinc-700"
                        />
                        <View className="flex-1">
                          <Text className="text-lg font-semibold text-white">
                            {cardATalentProfileData?.userInfo?.name ||
                              cardAUserInfo?.name ||
                              'Unnamed candidate'}
                          </Text>
                          <Text className="text-sm text-white/60">@{cardAUsername}</Text>
                          <View
                            className="mt-2 self-start rounded-full border px-3 py-1.5"
                            style={{
                              backgroundColor:
                                getStatusColor(cardAApplicant?.applicationStatus || 'applied') +
                                '20',
                              borderColor:
                                getStatusColor(cardAApplicant?.applicationStatus || 'applied') +
                                '60',
                            }}>
                            <Text
                              className="text-xs font-bold uppercase tracking-wide"
                              style={{
                                color: getStatusColor(
                                  cardAApplicant?.applicationStatus || 'applied'
                                ),
                              }}>
                              {cardAApplicant?.applicationStatus || 'applied'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View className="mt-4 px-4">
                      <CustomTabs tabs={tabs} value="talent-profile" onValueChange={() => {}} />
                    </View>
                    <View className="px-4 pb-8">
                      {isLoadingCardATalentProfile ? (
                        <View className="py-8">
                          <ActivityIndicator size="large" color="#3b82f6" />
                        </View>
                      ) : !cardATalentProfileData || !cardATalentProfileData.talentInfo ? (
                        <View className="py-8">
                          <Text className="mb-2 text-center text-base font-semibold text-white">
                            Profile Not Available
                          </Text>
                          <Text className="text-center text-sm text-white/60">
                            {cardAUsername === 'unknown'
                              ? "This user's profile information is not available."
                              : 'Unable to load profile data for this user.'}
                          </Text>
                        </View>
                      ) : (
                        <TalentProfile
                          userProfileData={cardATalentProfileData}
                          talentLevel={parseInt(cardATalentProfileData?.talentLevel || '0')}
                          talentInfo={cardATalentProfileData?.talentInfo}
                          isOwnProfile={false}
                        />
                      )}
                    </View>
                  </ScrollView>
                )}
              </Animated.View>
            )}
          </View>

          {/* Reject Action Area - Fixed gradient at left edge - Full screen height */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                top: 0,
                width: ACTION_AREA_WIDTH,
                height: SCREEN_HEIGHT,
                pointerEvents: 'none',
                borderTopRightRadius: 20,
                borderBottomRightRadius: 20,
                overflow: 'hidden',
                zIndex: 10, // Higher z-index to appear above cards
              },
              rejectGradientAnimatedStyle,
            ]}>
            <LinearGradient
              colors={['rgba(239, 68, 68, 1)', 'rgba(239, 68, 68, 0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'flex-start',
                paddingLeft: 16,
              }}>
              <Animated.Text
                className="text-lg font-bold uppercase tracking-wider text-white"
                style={rejectTextAnimatedStyle}>
                Reject
              </Animated.Text>
            </LinearGradient>
          </Animated.View>

          {/* Dynamic Right Action Areas - Full screen height - Show all actions */}
          {getAvailableActions.slice(0, 5).map((action, index) => {
            const actionCount = getAvailableActions.length;
            const actionHeight = SCREEN_HEIGHT / actionCount;
            const top = index * actionHeight;
            const isFirst = index === 0;
            const isLast = index === actionCount - 1;

            const gradientStyle = rightActionGradientStyles[index] || rightActionGradientStyles[0];
            const textStyle = rightActionTextStyles[index] || rightActionTextStyles[0];

            return (
              <Animated.View
                key={`right-action-${index}`}
                style={[
                  {
                    position: 'absolute',
                    right: 0,
                    top: top,
                    width: ACTION_AREA_WIDTH,
                    height: actionHeight,
                    pointerEvents: 'none',
                    borderTopLeftRadius: isFirst ? 20 : 0,
                    borderBottomLeftRadius: isLast ? 20 : 0,
                    overflow: 'hidden',
                    zIndex: 10, // Higher z-index to appear above cards
                  },
                  gradientStyle,
                ]}>
                <LinearGradient
                  colors={getActionColor(action)}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 0 }}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    paddingRight: 16,
                  }}>
                  <Animated.Text
                    className="text-lg font-bold uppercase tracking-wider text-white"
                    style={textStyle}>
                    {getActionLabel(action)}
                  </Animated.Text>
                </LinearGradient>
              </Animated.View>
            );
          })}

        

          {/* Swipe Indicators */}
          <View
            className="absolute bottom-8 left-0 right-0 items-center gap-2"
            style={{ paddingHorizontal: MODAL_MARGIN }}>
            <Text className="text-xs text-white/60">Swipe right for actions</Text>
            <Text className="text-xs text-white/60">Swipe left to reject</Text>
            <Text className="text-xs text-white/60">Swipe down to close</Text>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
