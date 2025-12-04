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
  const [showActions, setShowActions] = useState(false);
  const [showRejectAction, setShowRejectAction] = useState(false);
  const [highlightedAction, setHighlightedAction] = useState<'shortlist' | 'invite' | 'reject' | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

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
  
  // State to track which action is highlighted
  const [highlightedRightActionIndex, setHighlightedRightActionIndex] = useState<number | null>(null);
  const [selectedRightAction, setSelectedRightAction] = useState<string | null>(null);

  // Ensure currentIndex is valid and update when modal opens with initialIndex
  useEffect(() => {
    if (visible) {
      if (candidates.length > 0) {
        // When modal opens, use initialIndex if valid, otherwise use 0
        const validInitialIndex = Math.min(initialIndex, candidates.length - 1);
        if (validInitialIndex >= 0 && validInitialIndex !== currentIndex) {
          setCurrentIndex(validInitialIndex);
        } else {
          // Ensure current index is valid
          const validIndex = Math.min(currentIndex, candidates.length - 1);
          if (validIndex !== currentIndex && validIndex >= 0) {
            setCurrentIndex(validIndex);
          }
        }
      } else {
        // No candidates, close modal
        onClose();
      }
    }
  }, [visible, initialIndex, candidates.length, currentIndex, onClose]);

  const validIndex = Math.min(currentIndex, candidates.length - 1);
  const actualIndex = validIndex >= 0 ? validIndex : 0;

  // Get current and next candidate for Tinder-like stack
  const currentCandidate = candidates[actualIndex];
  const hasNextCandidate = actualIndex + 1 < candidates.length;
  const nextIndex = hasNextCandidate ? actualIndex + 1 : 0;
  const nextCandidate = hasNextCandidate ? candidates[nextIndex] : null;

  const applicant = currentCandidate?.jobApplicant ?? {};
  const userInfo = currentCandidate?.userInfo ?? {};
  const username = currentCandidate?.username || userInfo?.username || 'unknown';
  const statusColor = getStatusColor(applicant?.applicationStatus || 'applied');

  // Extract activities (excluding job type)
  const activities = roleWithSchedules?.activities || [];
  const sessionActivities = Array.isArray(activities)
    ? activities.filter((activity: any) => activity?.type !== 'job').map((activity: any) => activity?.title).filter(Boolean)
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
  }, [currentProcess, sessionActivities, applicant?.applicationStatus, applicant?.applicationProcess]);

  // Helper to get action opacity from array (for JS context)
  const getActionOpacityByIndex = useCallback((index: number) => {
    return rightActionOpacities.value[index] || 0;
  }, []);

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
    // Debug: log available actions
    if (visible) {
      console.log('Available actions:', getAvailableActions, 'for currentProcess:', currentProcess);
    }
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

  // Determine candidate's current position in process
  const candidateCurrentProcess = applicant?.applicationProcess || 'applied';
  const candidateCurrentStatus = applicant?.applicationStatus || 'applied';
  
  // Get process pills with current position highlighted
  const getProcessPillsWithCurrent = useMemo(() => {
    const pills = [
      { id: 'applied', label: 'Applied', isActive: candidateCurrentProcess === 'applied' && candidateCurrentStatus !== 'rejected' }
    ];
    
    // Add sessions
    sessionActivities.forEach((session: string) => {
      pills.push({
        id: session,
        label: session,
        isActive: candidateCurrentProcess === session && candidateCurrentStatus !== 'rejected'
      });
    });
    
    // Add shortlisted
    pills.push({
      id: 'shortlisted',
      label: 'Shortlisted',
      isActive: candidateCurrentStatus === 'shortlisted'
    });
    
    // Add offered
    pills.push({
      id: 'offered',
      label: 'Offered',
      isActive: candidateCurrentStatus === 'offered'
    });
    
    // Add rejected (if applicable)
    if (candidateCurrentStatus === 'rejected') {
      pills.push({
        id: 'rejected',
        label: 'Rejected',
        isActive: true
      });
    }
    
    return pills;
  }, [candidateCurrentProcess, candidateCurrentStatus, sessionActivities]);

  // Helper function to build process pills array
  const getProcessPills = useMemo(() => {
    const pills = ['applied'];
    if (sessionActivities.length > 0) {
      pills.push(...sessionActivities);
    }
    pills.push('shortlisted', 'offered');
    return pills;
  }, [sessionActivities]);

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
      setShowActions(false);
      setShowRejectAction(false);
      setHighlightedAction(null);
      setHighlightedRightActionIndex(null);
      setSelectedRightAction(null);
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
      setShowActions(false);
      setShowRejectAction(false);
      setHighlightedAction(null);
      setHighlightedRightActionIndex(null);
      setSelectedRightAction(null);
    } else if (visible && candidates.length > 0) {
      // When modal opens, set to initialIndex (the clicked card's index)
      const validInitialIndex = Math.min(initialIndex, candidates.length - 1);
      setCurrentIndex(validInitialIndex >= 0 ? validInitialIndex : 0);
    }
  }, [visible, initialIndex, candidates.length]);

  // Fetch full user profile data
  const {
    data: talentProfileData,
    isLoading: isLoadingTalentProfile,
  } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      if (!username || username === 'unknown' || username.trim() === '') {
        return null;
      }
      return getUserProfileByUsername(username);
    },
    enabled: visible && !!username && username !== 'unknown' && username.trim() !== '',
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Fetch contracts for this applicant
  const searchUrl = `projectId=${projectId}&orderBy=createdAt&orderSeq=desc&pageNo=0&pageSize=99`;
  const {
    data: contractsData,
    isLoading: isLoadingContracts,
  } = useQuery({
    queryKey: ['applicantContracts', applicant?.soleUserId, projectId],
    queryFn: async () => {
      if (!applicant?.soleUserId || !projectId) return [];
      const result = await talentSearchJobContracts(applicant.soleUserId, searchUrl);
      return result?.data || [];
    },
    enabled:
      visible &&
      !!applicant?.soleUserId &&
      !!projectId &&
      applicant?.applicationStatus === 'offered',
  });

  // Mutation for updating applicant status
  const updateApplicantMutation = useMutation({
    mutationFn: async ({ 
      applicantId, 
      status, 
      process 
    }: { 
      applicantId: number; 
      status: string;
      process?: string;
    }) => {
      const applicationProcess = process || (status === 'rejected' ? 'rejected' : currentProcessRef.current);
      const applicantData = currentApplicantRef.current;
      
      // Include all required fields like the web version does - must preserve all existing fields
      // The web version explicitly uses projectData.id for projectId
      const updateValues: any = {
        id: applicantData?.id || applicantId,
        soleUserId: applicantData?.soleUserId || null,
        roleId: applicantData?.roleId || (roleIdRef.current ? Number(roleIdRef.current) : null),
        projectId: projectIdRef.current ? Number(projectIdRef.current) : (applicantData?.projectId || null),
        paymentBasis: applicantData?.paymentBasis || null,
        quotePrice: applicantData?.quotePrice || null,
        otQuotePrice: applicantData?.otQuotePrice || null,
        skills: applicantData?.skills || null,
        answer: applicantData?.answer || null,
        applicationStatus: status,
        applicationProcess: applicationProcess,
      };
      
      console.log('Updating applicant with values:', JSON.stringify(updateValues, null, 2));
      
      return updateApplicantProcessById(updateValues, applicantId);
    },
    onSuccess: (_, variables) => {
      queryClientRef.current?.invalidateQueries({ queryKey: ['role-candidates'] });
      queryClientRef.current?.invalidateQueries({ queryKey: ['role-process-counts'] });
      onCandidateUpdatedRef.current?.();
      
      // Directly go to next candidate after a short delay to allow query to update
      setTimeout(() => {
        handleNextCandidateRef.current?.();
      }, 200);
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

  const handleNextCandidate = () => {
    // After action, the candidate list may have changed due to filtering
    // The current candidate may no longer be in the filtered list
    
    // Check if there are any candidates left
    if (candidates.length === 0) {
      // No more candidates, close modal
      onClose();
      return;
    }
    
    // Since the current candidate was moved/updated, it may no longer be in the filtered list
    // Check if we need to adjust the index
    let nextIndex = currentIndex;
    
    // If current index is out of bounds (candidate was removed), go to first
    if (currentIndex >= candidates.length) {
      nextIndex = 0;
    } else {
      // Try to move to next candidate
      nextIndex = currentIndex + 1;
      
      // If we've reached the end, go to first candidate
      if (nextIndex >= candidates.length) {
        nextIndex = 0;
      }
    }
    
    // If we have candidates, go to the calculated index (or first if all moved)
    if (candidates.length > 0) {
      setCurrentIndex(nextIndex);
    } else {
      // No candidates at all, close modal
      onClose();
    }
  };
  
  // Update handleNextCandidate ref after it's defined
  useEffect(() => {
    handleNextCandidateRef.current = handleNextCandidate;
  }, [handleNextCandidate, candidates.length, currentIndex]);

  const handleReject = () => {
    if (!applicant?.id) return;
    
    // Just show alert and execute - no confirmation needed
    Alert.alert('Candidate Rejected', 'The candidate has been rejected.', [{ text: 'OK' }]);
    
    updateApplicantMutation.mutate({
      applicantId: applicant.id,
      status: 'rejected',
    });
  };

  const handleShortlist = () => {
    if (!applicant?.id) return;
    
    Alert.alert(
      'Shortlist Candidate',
      'Move this candidate to shortlisted?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Shortlist',
          onPress: () => {
            updateApplicantMutation.mutate({
              applicantId: applicant.id,
              status: 'shortlisted',
            });
          },
        },
      ]
    );
  };

  const handleMapToSession = (sessionName: string) => {
    if (!applicant?.id) return;
    
    Alert.alert(
      'Map to Session',
      `Map this candidate to "${sessionName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Map',
          onPress: () => {
            updateApplicantMutation.mutate({
              applicantId: applicant.id,
              status: 'applied',
              process: sessionName,
            });
          },
        },
      ]
    );
  };

  const handleSendOffer = () => {
    if (!applicant?.id) return;
    
    Alert.alert(
      'Send Offer',
      'Send an offer to this candidate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Offer',
          onPress: () => {
            updateApplicantMutation.mutate({
              applicantId: applicant.id,
              status: 'offered',
            });
          },
        },
      ]
    );
  };

  // Legacy handleInvite - kept for backward compatibility, but should use handleMapToSession
  const handleInvite = () => {
    // This is deprecated - use handleMapToSession instead
    handleShortlist();
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
      console.warn('Cannot execute action: missing data', { action, applicantData: !!applicantData, mutateFn: !!mutateFn });
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
      runOnJS(setShowActions)(false);
    }
  };

  const executeSwipeDown = () => {
    'worklet';
    translateY.value = withSpring(SCREEN_HEIGHT, {}, () => {
      runOnJS(handleClose)();
    });
    opacity.value = withTiming(0);
  };

  // Header pan gesture - only vertical (down) drag for closing
  const headerPanGesture = Gesture.Pan()
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

      // Handle LEFT swipe (Reject) - show gradient when dragging left
      // Disable reject when at offered status
      if (event.translationX < -30) {
        // Check if we're at offered status - if so, don't show reject
        const isOffered = currentProcessRef.current === 'offered';
        if (!isOffered) {
          // Calculate opacity based on drag distance (closer to edge = brighter)
          const dragProgress = Math.min(Math.abs(event.translationX) / maxDragDistance, 1);
          const targetOpacity = 0.4 + (dragProgress * 0.6); // From 0.4 to 1.0
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
        const baseOpacity = 0.3 + (dragProgress * 0.7); // From 0.3 to 1.0
        const dimOpacity = baseOpacity * 0.4;
        
        // Calculate Y position on screen (0 to SCREEN_HEIGHT)
        const screenY = (SCREEN_HEIGHT / 2) + event.translationY;
        const clampedY = Math.max(0, Math.min(SCREEN_HEIGHT, screenY));
        const actionCount = availableActionsCount.value;
        const actionHeight = SCREEN_HEIGHT / Math.max(actionCount, 1);
        const actionIndex = Math.min(Math.max(0, Math.floor(clampedY / actionHeight)), Math.min(actionCount - 1, 4));
        
        // Update array-based opacities - light up all actions dimly first
        const newOpacities = [...rightActionOpacities.value];
        for (let i = 0; i < Math.min(actionCount, 5); i++) {
          newOpacities[i] = dimOpacity;
        }
        
        // Brightly highlight the action being dragged to (if drag is far enough)
        if (dragProgress > 0.3 && actionIndex >= 0 && actionIndex < actionCount) {
          newOpacities[actionIndex] = baseOpacity;
          runOnJS(setHighlightedRightActionIndex)(actionIndex);
        } else {
          runOnJS(setHighlightedRightActionIndex)(null);
        }
        
        rightActionOpacities.value = newOpacities;
      } else {
        // Hide all right gradients if not dragging right
        rightActionOpacities.value = [0, 0, 0, 0, 0];
        runOnJS(setHighlightedRightActionIndex)(null);
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
          executeSwipeLeftReject();
        } else {
          // No area highlighted or at offered status, smooth slide back
          translateX.value = withTiming(0, { duration: 300 });
          rejectGradientOpacity.value = withTiming(0);
          runOnJS(setHighlightedAction)(null);
        }
        return;
      }

      // Swipe RIGHT - trigger based on highlighted action index
      if (draggedToRightEdge) {
        const actionCount = availableActionsCount.value;
        const screenY = (SCREEN_HEIGHT / 2) + translationY;
        const clampedY = Math.max(0, Math.min(SCREEN_HEIGHT, screenY));
        const actionHeight = SCREEN_HEIGHT / Math.max(actionCount, 1);
        const actionIndex = Math.min(Math.max(0, Math.floor(clampedY / actionHeight)), Math.min(actionCount - 1, 4));
        
        // Check if any action is highlighted enough using array
        const currentOpacities = rightActionOpacities.value;
        const isHighlighted = actionIndex >= 0 && actionIndex < actionCount && 
                              currentOpacities[actionIndex] > highlightOpacityThreshold;
        
        if (isHighlighted) {
          // Area is highlighted, trigger action
          executeSwipeRightAction(actionIndex);
        } else {
          // No area highlighted, smooth slide back
          translateX.value = withTiming(0, { duration: 300 });
          rightActionOpacities.value = [0, 0, 0, 0, 0];
          runOnJS(setHighlightedRightActionIndex)(null);
        }
        return;
      }

      // Not dragged to edge - smooth slide back to center
      translateX.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
      rejectGradientOpacity.value = withTiming(0);
      rightActionOpacities.value = [0, 0, 0, 0, 0];
      runOnJS(setHighlightedAction)(null);
      runOnJS(setHighlightedRightActionIndex)(null);
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

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => {
    const maxTranslate = SCREEN_WIDTH - MODAL_MARGIN * 2;
    const rotate = interpolate(translateX.value, [-maxTranslate, 0, maxTranslate], [-15, 0, 15]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
      opacity: opacity.value,
      zIndex: 2,
    };
  });

  // Next card animated style (behind current card)
  const nextCardAnimatedStyle = useAnimatedStyle(() => {
    // When current card is being swiped, animate next card forward
    const maxTranslate = SCREEN_WIDTH - MODAL_MARGIN * 2;
    const swipeProgress = Math.min(Math.abs(translateX.value) / maxTranslate, 1);
    const scale = interpolate(swipeProgress, [0, 1], [0.95, 1], 'clamp');
    const nextOpacity = interpolate(swipeProgress, [0, 1], [0.8, 1], 'clamp');
    const nextTranslateY = interpolate(swipeProgress, [0, 1], [10, 0], 'clamp');
    
    return {
      transform: [
        { scale: scale },
        { translateY: nextTranslateY },
      ],
      opacity: nextOpacity,
      zIndex: 1,
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

  if (!visible || !currentCandidate) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}>
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
            {/* Next Card (Behind) - Only show if there's a next candidate */}
            {nextCandidate && (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    height: MODAL_HEIGHT,
                    width: SCREEN_WIDTH - MODAL_MARGIN * 2,
                    borderRadius: 28,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    overflow: 'hidden',
                  },
                  nextCardAnimatedStyle,
                ]}>
                {/* Next Card Content - Simplified preview */}
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
                <View className="bg-black/12 absolute inset-0" />
                <View className="flex-1 justify-center items-center p-4">
                  <Image
                    source={{
                      uri:
                        nextCandidate?.comcardFirstPic ||
                        nextCandidate?.userInfo?.profilePic ||
                        undefined,
                    }}
                    className="w-24 h-24 rounded-full bg-zinc-700"
                  />
                  <Text className="text-white font-semibold mt-4 text-center">
                    {nextCandidate?.userInfo?.name || 'Next Candidate'}
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    @{nextCandidate?.username || nextCandidate?.userInfo?.username || 'unknown'}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Current Card (Front) */}
            <Animated.View
              style={[
                {
                  height: MODAL_HEIGHT,
                  width: SCREEN_WIDTH - MODAL_MARGIN * 2,
                  borderRadius: 28,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.35)',
                  overflow: 'hidden',
                  position: 'relative',
                },
                cardAnimatedStyle,
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

            {/* Handle Bar and Header - with header gesture */}
            <GestureDetector gesture={headerPanGesture}>
              <View>
                {/* Handle Bar */}
                <View className="items-center pt-4 pb-2">
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
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10">
                  <TouchableOpacity onPress={handleClose} className="p-2 -ml-2">
                    <ChevronLeft size={24} color="#ffffff" />
                  </TouchableOpacity>
                  <Text className="text-lg font-semibold text-white flex-1 text-center">
                    {actualIndex + 1} / {candidates.length}
                  </Text>
                  <TouchableOpacity onPress={handleClose} className="p-2 -mr-2">
                    <X size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            </GestureDetector>

              {/* Content - with content gesture for horizontal swipes */}
              <GestureDetector gesture={contentPanGesture}>
                <Animated.ScrollView
                  className="flex-1"
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  scrollEnabled={true}
                  onScroll={scrollHandler}
                  scrollEventThrottle={16}>
                  {/* Candidate Header Card */}
                  <View className="mx-4 mt-4 rounded-2xl border border-white/10 bg-zinc-800 p-4">
                    <View className="flex-row items-center gap-4">
                      <Image
                        source={{
                          uri:
                            talentProfileData?.userInfo?.profilePic ||
                            currentCandidate?.comcardFirstPic ||
                            userInfo?.profilePic ||
                            undefined,
                        }}
                        className="w-20 h-20 rounded-full bg-zinc-700"
                      />
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-white">
                          {talentProfileData?.userInfo?.name || userInfo?.name || 'Unnamed candidate'}
                        </Text>
                        <Text className="text-sm text-white/60">@{username}</Text>
                        <View
                          className="mt-2 px-3 py-1.5 rounded-full border self-start"
                          style={{
                            backgroundColor: statusColor + '20',
                            borderColor: statusColor + '60',
                          }}>
                          <Text
                            className="text-xs font-bold uppercase tracking-wide"
                            style={{ color: statusColor }}>
                            {applicant?.applicationStatus || 'applied'}
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
                        {isLoadingTalentProfile ? (
                          <View className="py-8">
                            <ActivityIndicator size="large" color="#3b82f6" />
                          </View>
                        ) : !talentProfileData || !talentProfileData.talentInfo ? (
                          <View className="py-8">
                            <Text className="text-base font-semibold text-white mb-2 text-center">
                              Profile Not Available
                            </Text>
                            <Text className="text-sm text-white/60 text-center">
                              {username === 'unknown'
                                ? "This user's profile information is not available."
                                : 'Unable to load profile data for this user.'}
                            </Text>
                          </View>
                        ) : (
                          <TalentProfile
                            userProfileData={talentProfileData}
                            talentLevel={parseInt(talentProfileData?.talentLevel || '0')}
                            talentInfo={talentProfileData?.talentInfo}
                            isOwnProfile={false}
                          />
                        )}
                      </View>
                    )}

                    {currentTab === 'application' && <ApplicationDetail applicant={applicant} />}

                    {currentTab === 'actions' && (
                      <ActionToCandidates
                        applicant={currentCandidate}
                        projectData={{ id: projectId }}
                        roleId={roleId ? parseInt(roleId as string) : undefined}
                        contractsData={contractsData}
                        isLoadingContracts={isLoadingContracts}
                      />
                    )}
                  </View>
                </Animated.ScrollView>
              </GestureDetector>
            </Animated.View>
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
            style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 16 }}>
            <Animated.Text 
              className="text-white font-bold text-lg uppercase tracking-wider"
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
                style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 16 }}>
                <Animated.Text 
                  className="text-white font-bold text-lg uppercase tracking-wider"
                  style={textStyle}>
                  {getActionLabel(action)}
                </Animated.Text>
              </LinearGradient>
            </Animated.View>
          );
        })}

        {/* Loading Overlay */}
        {updateApplicantMutation.isPending && (
          <View
            className="absolute inset-0 bg-black/50 items-center justify-center"
            style={{ justifyContent: 'center' }}>
            <View className="bg-zinc-800 rounded-2xl p-6 items-center">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-white mt-4">Processing...</Text>
            </View>
          </View>
        )}

        {/* Swipe Indicators */}
        <View
          className="absolute bottom-8 left-0 right-0 items-center gap-2"
          style={{ paddingHorizontal: MODAL_MARGIN }}>
          <Text className="text-white/60 text-xs">Swipe right for actions</Text>
          <Text className="text-white/60 text-xs">Swipe left to reject</Text>
          <Text className="text-white/60 text-xs">Swipe down to close</Text>
        </View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

