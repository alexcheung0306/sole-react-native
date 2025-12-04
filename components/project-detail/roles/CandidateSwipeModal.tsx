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
  const shortlistGradientOpacity = useSharedValue(0);
  const inviteGradientOpacity = useSharedValue(0);
  
  // Dynamic action gradient opacities (support up to 5 right-side actions)
  const rightAction1Opacity = useSharedValue(0);
  const rightAction2Opacity = useSharedValue(0);
  const rightAction3Opacity = useSharedValue(0);
  const rightAction4Opacity = useSharedValue(0);
  const rightAction5Opacity = useSharedValue(0);
  
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
  
  // State to track which action is highlighted
  const [highlightedRightActionIndex, setHighlightedRightActionIndex] = useState<number | null>(null);
  const [selectedRightAction, setSelectedRightAction] = useState<string | null>(null);

  // Ensure currentIndex is valid
  useEffect(() => {
    if (visible && candidates.length > 0) {
      const validIndex = Math.min(currentIndex, candidates.length - 1);
      if (validIndex !== currentIndex && validIndex >= 0) {
        setCurrentIndex(validIndex);
      }
    } else if (visible && candidates.length === 0) {
      onClose();
    }
  }, [visible, candidates.length, currentIndex, onClose]);

  const validIndex = Math.min(currentIndex, candidates.length - 1);
  const actualIndex = validIndex >= 0 ? validIndex : 0;

  // Get current candidate
  const currentCandidate = candidates[actualIndex];

  if (!currentCandidate && visible) {
    return null;
  }

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
    if (currentProcess === 'applied') {
      // At applied: show all sessions + shortlisted (shortlisted should always be at the end)
      // If no sessions, still show shortlisted
      const actions = sessionActivities.length > 0 ? [...sessionActivities] : [];
      // Always include shortlisted at the end
      actions.push('shortlisted');
      return actions;
    } else if (currentProcess === 'shortlisted') {
      // At shortlisted: show send an offer
      return ['send-offer'];
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

  // Helper to get action gradient opacity shared value by index
  const getActionOpacityByIndex = (index: number) => {
    switch (index) {
      case 0: return rightAction1Opacity;
      case 1: return rightAction2Opacity;
      case 2: return rightAction3Opacity;
      case 3: return rightAction4Opacity;
      case 4: return rightAction5Opacity;
      default: return rightAction1Opacity;
    }
  };

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
      shortlistGradientOpacity.value = 0;
      inviteGradientOpacity.value = 0;
      // Reset dynamic right action opacities
      rightAction1Opacity.value = 0;
      rightAction2Opacity.value = 0;
      rightAction3Opacity.value = 0;
      rightAction4Opacity.value = 0;
      rightAction5Opacity.value = 0;
      setShowActions(false);
      setShowRejectAction(false);
      setHighlightedAction(null);
      setHighlightedRightActionIndex(null);
      setSelectedRightAction(null);
      setCurrentTab('talent-profile');
    }
  }, [currentIndex, visible, currentCandidate]);

  // Reset when modal closes
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
      shortlistGradientOpacity.value = 0;
      inviteGradientOpacity.value = 0;
      // Reset dynamic right action opacities
      rightAction1Opacity.value = 0;
      rightAction2Opacity.value = 0;
      rightAction3Opacity.value = 0;
      rightAction4Opacity.value = 0;
      rightAction5Opacity.value = 0;
      setShowActions(false);
      setShowRejectAction(false);
      setHighlightedAction(null);
      setHighlightedRightActionIndex(null);
      setSelectedRightAction(null);
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

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
      return updateApplicantProcessById(
        {
          applicationStatus: status,
          applicationProcess: applicationProcess,
        },
        applicantId
      );
    },
    onSuccess: (_, variables) => {
      const { status } = variables;
      
      // Only show alert for non-reject actions (reject already shows alert)
      if (status !== 'rejected') {
        let actionMessage = '';
        if (status === 'shortlisted') {
          actionMessage = 'Candidate shortlisted';
        } else if (status === 'offered') {
          actionMessage = 'Offer sent to candidate';
        } else {
          actionMessage = variables.process ? `Candidate mapped to ${variables.process}` : 'Candidate updated';
        }
        Alert.alert('Action Executed', actionMessage, [{ text: 'OK' }]);
      }
      
      queryClientRef.current?.invalidateQueries({ queryKey: ['role-candidates'] });
      queryClientRef.current?.invalidateQueries({ queryKey: ['role-process-counts'] });
      onCandidateUpdatedRef.current?.();
      
      // Check if there are more candidates after a short delay to allow query to update
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
    // Check if there are any candidates left
    if (candidates.length === 0) {
      // No more candidates, close modal
      onClose();
      return;
    }
    
    // Check if current index is valid
    if (currentIndex >= candidates.length) {
      // Current index is out of bounds, check if there are any candidates
      if (candidates.length > 0) {
        // Go to last candidate
        setCurrentIndex(candidates.length - 1);
      } else {
        // No more candidates, close modal
        onClose();
      }
      return;
    }
    
    // Check if this was the last candidate
    if (currentIndex >= candidates.length - 1) {
      // This was the last candidate, close modal
      onClose();
      return;
    }
    
    // Move to next candidate
    setCurrentIndex(currentIndex + 1);
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
    
    // Directly execute based on action type - use refs only
    if (action === 'shortlisted') {
      Alert.alert(
        'Shortlist Candidate',
        'Move this candidate to shortlisted?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Shortlist',
            onPress: () => {
              mutateFn({
                applicantId: applicantData.id,
                status: 'shortlisted',
              });
            },
          },
        ]
      );
    } else if (action === 'send-offer') {
      Alert.alert(
        'Send Offer',
        'Send an offer to this candidate?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Offer',
            onPress: () => {
              mutateFn({
                applicantId: applicantData.id,
                status: 'offered',
              });
            },
          },
        ]
      );
    } else {
      // Session action
      Alert.alert(
        'Map to Session',
        `Map this candidate to "${action}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Map',
            onPress: () => {
              mutateFn({
                applicantId: applicantData.id,
                status: 'applied',
                process: action,
              });
            },
          },
        ]
      );
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
    .failOffsetY([-50, 50]) // Fail if too much vertical movement (increase threshold for better scrolling)
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
      
      // If vertical movement is significant, prioritize scrolling
      if (Math.abs(event.translationY) > 20 && Math.abs(event.translationX) < 30) {
        return;
      }
      
      translateX.value = event.translationX;
      
      const maxDragDistance = SCREEN_WIDTH - MODAL_MARGIN * 2;
      const modalCenterY = (SCREEN_HEIGHT - MODAL_HEIGHT) / 2 + MODAL_HEIGHT / 2;
      const actionThreshold = 120; // Y position threshold for shortlist vs invite (wider)

      // Handle LEFT swipe (Reject) - show gradient when dragging left
      if (event.translationX < -30) {
        // Calculate opacity based on drag distance (closer to edge = brighter)
        const dragProgress = Math.min(Math.abs(event.translationX) / maxDragDistance, 1);
        const targetOpacity = 0.4 + (dragProgress * 0.6); // From 0.4 to 1.0
        rejectGradientOpacity.value = withTiming(targetOpacity);
        runOnJS(setHighlightedAction)('reject');
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
        
        // Light up all actions dimly first
        if (actionCount >= 1) rightAction1Opacity.value = withTiming(dimOpacity);
        if (actionCount >= 2) rightAction2Opacity.value = withTiming(dimOpacity);
        if (actionCount >= 3) rightAction3Opacity.value = withTiming(dimOpacity);
        if (actionCount >= 4) rightAction4Opacity.value = withTiming(dimOpacity);
        if (actionCount >= 5) rightAction5Opacity.value = withTiming(dimOpacity);
        
        // Brightly highlight the action being dragged to (if drag is far enough)
        if (dragProgress > 0.3 && actionIndex >= 0) {
          // Reset the highlighted one first
          if (actionIndex === 0) rightAction1Opacity.value = withTiming(baseOpacity);
          else if (actionIndex === 1) rightAction2Opacity.value = withTiming(baseOpacity);
          else if (actionIndex === 2) rightAction3Opacity.value = withTiming(baseOpacity);
          else if (actionIndex === 3) rightAction4Opacity.value = withTiming(baseOpacity);
          else if (actionIndex === 4) rightAction5Opacity.value = withTiming(baseOpacity);
          
          runOnJS(setHighlightedRightActionIndex)(actionIndex);
        } else {
          runOnJS(setHighlightedRightActionIndex)(null);
        }
        
        // For backward compatibility, also update shortlist/invite opacities
        if (actionCount >= 1) shortlistGradientOpacity.value = rightAction1Opacity.value;
        if (actionCount >= 2) inviteGradientOpacity.value = rightAction2Opacity.value;
      } else {
        // Hide all right gradients if not dragging right
        rightAction1Opacity.value = withTiming(0);
        rightAction2Opacity.value = withTiming(0);
        rightAction3Opacity.value = withTiming(0);
        rightAction4Opacity.value = withTiming(0);
        rightAction5Opacity.value = withTiming(0);
        shortlistGradientOpacity.value = withTiming(0);
        inviteGradientOpacity.value = withTiming(0);
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
        shortlistGradientOpacity.value = withTiming(0);
        inviteGradientOpacity.value = withTiming(0);
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
      if (draggedToLeftEdge) {
        if (rejectGradientOpacity.value > highlightOpacityThreshold) {
          // Area is highlighted, trigger action
          executeSwipeLeftReject();
        } else {
          // No area highlighted, smooth slide back
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
        
        // Check if any action is highlighted enough
        let isHighlighted = false;
        if (actionIndex === 0 && rightAction1Opacity.value > highlightOpacityThreshold) isHighlighted = true;
        else if (actionIndex === 1 && rightAction2Opacity.value > highlightOpacityThreshold) isHighlighted = true;
        else if (actionIndex === 2 && rightAction3Opacity.value > highlightOpacityThreshold) isHighlighted = true;
        else if (actionIndex === 3 && rightAction4Opacity.value > highlightOpacityThreshold) isHighlighted = true;
        else if (actionIndex === 4 && rightAction5Opacity.value > highlightOpacityThreshold) isHighlighted = true;
        
        if (isHighlighted && actionIndex >= 0) {
          // Area is highlighted, trigger action
          executeSwipeRightAction(actionIndex);
        } else {
          // No area highlighted, smooth slide back
          translateX.value = withTiming(0, { duration: 300 });
          rightAction1Opacity.value = withTiming(0);
          rightAction2Opacity.value = withTiming(0);
          rightAction3Opacity.value = withTiming(0);
          rightAction4Opacity.value = withTiming(0);
          rightAction5Opacity.value = withTiming(0);
          shortlistGradientOpacity.value = withTiming(0);
          inviteGradientOpacity.value = withTiming(0);
          runOnJS(setHighlightedRightActionIndex)(null);
        }
        return;
      }

      // Not dragged to edge - smooth slide back to center
      translateX.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
      rejectGradientOpacity.value = withTiming(0);
      rightAction1Opacity.value = withTiming(0);
      rightAction2Opacity.value = withTiming(0);
      rightAction3Opacity.value = withTiming(0);
      rightAction4Opacity.value = withTiming(0);
      rightAction5Opacity.value = withTiming(0);
      shortlistGradientOpacity.value = withTiming(0);
      inviteGradientOpacity.value = withTiming(0);
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
    };
  });

  // Animated styles for gradient opacities
  const rejectGradientAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: rejectGradientOpacity.value,
    };
  });

  const shortlistGradientAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: shortlistGradientOpacity.value,
    };
  });

  const inviteGradientAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: inviteGradientOpacity.value,
    };
  });

  // Animated styles for text opacity - solid when area is reached
  const rejectTextAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: rejectGradientOpacity.value > 0.3 ? 1 : rejectGradientOpacity.value * 2,
    };
  });

  const shortlistTextAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: shortlistGradientOpacity.value > 0.3 ? 1 : shortlistGradientOpacity.value * 2,
    };
  });

  const inviteTextAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: inviteGradientOpacity.value > 0.3 ? 1 : inviteGradientOpacity.value * 2,
    };
  });

  // Animated styles for dynamic right action opacities
  const rightAction1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: rightAction1Opacity.value,
  }));
  const rightAction2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: rightAction2Opacity.value,
  }));
  const rightAction3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: rightAction3Opacity.value,
  }));
  const rightAction4AnimatedStyle = useAnimatedStyle(() => ({
    opacity: rightAction4Opacity.value,
  }));
  const rightAction5AnimatedStyle = useAnimatedStyle(() => ({
    opacity: rightAction5Opacity.value,
  }));

  // Animated text styles for dynamic actions
  const rightAction1TextStyle = useAnimatedStyle(() => ({
    opacity: rightAction1Opacity.value > 0.3 ? 1 : rightAction1Opacity.value * 2,
  }));
  const rightAction2TextStyle = useAnimatedStyle(() => ({
    opacity: rightAction2Opacity.value > 0.3 ? 1 : rightAction2Opacity.value * 2,
  }));
  const rightAction3TextStyle = useAnimatedStyle(() => ({
    opacity: rightAction3Opacity.value > 0.3 ? 1 : rightAction3Opacity.value * 2,
  }));
  const rightAction4TextStyle = useAnimatedStyle(() => ({
    opacity: rightAction4Opacity.value > 0.3 ? 1 : rightAction4Opacity.value * 2,
  }));
  const rightAction5TextStyle = useAnimatedStyle(() => ({
    opacity: rightAction5Opacity.value > 0.3 ? 1 : rightAction5Opacity.value * 2,
  }));

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

          {/* Centered Drawer Container */}
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
          
          // Get the appropriate animated style for this action
          const getAnimatedStyle = () => {
            switch (index) {
              case 0: return rightAction1AnimatedStyle;
              case 1: return rightAction2AnimatedStyle;
              case 2: return rightAction3AnimatedStyle;
              case 3: return rightAction4AnimatedStyle;
              case 4: return rightAction5AnimatedStyle;
              default: return rightAction1AnimatedStyle;
            }
          };
          
          const getTextAnimatedStyle = () => {
            switch (index) {
              case 0: return rightAction1TextStyle;
              case 1: return rightAction2TextStyle;
              case 2: return rightAction3TextStyle;
              case 3: return rightAction4TextStyle;
              case 4: return rightAction5TextStyle;
              default: return rightAction1TextStyle;
            }
          };
          
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
                },
                getAnimatedStyle(),
              ]}>
              <LinearGradient
                colors={getActionColor(action)}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 16 }}>
                <Animated.Text 
                  className="text-white font-bold text-lg uppercase tracking-wider"
                  style={getTextAnimatedStyle()}>
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

