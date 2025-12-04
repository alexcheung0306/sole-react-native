import React, { useState, useEffect } from 'react';
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
      setShowActions(false);
      setShowRejectAction(false);
      setHighlightedAction(null);
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
      setShowActions(false);
      setShowRejectAction(false);
      setHighlightedAction(null);
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
    mutationFn: async ({ applicantId, status }: { applicantId: number; status: string }) => {
      return updateApplicantProcessById(
        {
          applicationStatus: status,
          applicationProcess: status === 'rejected' ? 'rejected' : currentProcess,
        },
        applicantId
      );
    },
    onSuccess: (_, variables) => {
      const { status } = variables;
      let actionMessage = '';
      
      if (status === 'rejected') {
        actionMessage = 'Candidate rejected';
      } else if (status === 'shortlisted') {
        actionMessage = 'Candidate shortlisted';
      } else {
        actionMessage = 'Candidate invited';
      }
      
      Alert.alert('Action Executed', actionMessage, [{ text: 'OK' }]);
      
      queryClient.invalidateQueries({ queryKey: ['role-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['role-process-counts'] });
      onCandidateUpdated();
      handleNextCandidate();
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to execute action. Please try again.', [{ text: 'OK' }]);
    },
  });

  const handleNextCandidate = () => {
    // After action, the candidate list may have changed due to filtering
    // Check if current index is the last one in the filtered list
    if (currentIndex >= candidates.length - 1) {
      // This was the last candidate in the current process, close modal
      onClose();
      return;
    }
    
    // Move to next candidate
    if (currentIndex < candidates.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (candidates.length > 0 && currentIndex >= candidates.length) {
      // Current candidate was removed, go to last one
      setCurrentIndex(candidates.length - 1);
    } else if (candidates.length === 0) {
      // No more candidates
      onClose();
    }
  };

  const handleReject = () => {
    if (applicant?.id) {
      updateApplicantMutation.mutate({
        applicantId: applicant.id,
        status: 'rejected',
      });
    }
  };

  const handleShortlist = () => {
    if (applicant?.id) {
      updateApplicantMutation.mutate({
        applicantId: applicant.id,
        status: 'shortlisted',
      });
    }
  };

  const handleInvite = () => {
    if (applicant?.id) {
      // Invite action - may need to check what this should do
      updateApplicantMutation.mutate({
        applicantId: applicant.id,
        status: applicant?.applicationStatus || 'applied',
      });
    }
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

  const executeSwipeRightAction = (finalX: number, finalY: number) => {
    'worklet';
    if (finalX > ACTION_AREA_WIDTH) {
      // Determine which action based on drag Y position
      // Action areas are positioned at top (shortlist) and bottom (invite)
      const screenCenter = SCREEN_HEIGHT / 2;
      const actionThreshold = 100; // Distance from center to trigger action
      const maxTranslate = SCREEN_WIDTH - MODAL_MARGIN * 2;
      
      if (finalY < screenCenter - actionThreshold) {
        // Top area - Shortlist
        translateX.value = withSpring(maxTranslate, {}, () => {
          runOnJS(handleShortlist)();
        });
        opacity.value = withTiming(0);
      } else if (finalY > screenCenter + actionThreshold) {
        // Bottom area - Invite
        translateX.value = withSpring(maxTranslate, {}, () => {
          runOnJS(handleInvite)();
        });
        opacity.value = withTiming(0);
      } else {
        // Middle - just show actions, snap back
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        runOnJS(setShowActions)(true);
      }
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
    .failOffsetY([-30, 30]) // Fail if too much vertical movement (30px threshold)
    .minDistance(15) // Require 15px movement before activation
    .onBegin(() => {
      'worklet';
      // Check if scrolled at the beginning of gesture - cancel if scrolled
      if (scrollY.value > 5) {
        return;
      }
    })
    .onUpdate((event) => {
      'worklet';
      // Only process if scroll is at top
      if (scrollY.value > 5) {
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

      // Handle RIGHT swipe (Shortlist/Invite) - show gradients when dragging right
      if (event.translationX > 30) {
        const dragProgress = Math.min(event.translationX / maxDragDistance, 1);
        const targetOpacity = 0.4 + (dragProgress * 0.6); // From 0.4 to 1.0
        
        // Calculate relative Y position from modal center
        const relativeY = event.translationY + modalCenterY - (SCREEN_HEIGHT / 2);
        
        if (relativeY < -actionThreshold) {
          // Top area - Shortlist
          shortlistGradientOpacity.value = withTiming(targetOpacity);
          inviteGradientOpacity.value = withTiming(0);
          runOnJS(setHighlightedAction)('shortlist');
        } else if (relativeY > actionThreshold) {
          // Bottom area - Invite
          inviteGradientOpacity.value = withTiming(targetOpacity);
          shortlistGradientOpacity.value = withTiming(0);
          runOnJS(setHighlightedAction)('invite');
        } else {
          // Middle area - show both but dimmer
          shortlistGradientOpacity.value = withTiming(targetOpacity * 0.5);
          inviteGradientOpacity.value = withTiming(targetOpacity * 0.5);
          if (highlightedAction !== 'reject') {
            runOnJS(setHighlightedAction)(null);
          }
        }
      } else {
        // Hide right gradients if not dragging right
        shortlistGradientOpacity.value = withTiming(0);
        inviteGradientOpacity.value = withTiming(0);
        if (highlightedAction !== 'reject') {
          runOnJS(setHighlightedAction)(null);
        }
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

      // Swipe RIGHT - only trigger if shortlist or invite area is highlighted
      if (draggedToRightEdge) {
        const relativeY = translationY + modalCenterY - (SCREEN_HEIGHT / 2);
        const isShortlistHighlighted = relativeY < -actionThreshold && shortlistGradientOpacity.value > highlightOpacityThreshold;
        const isInviteHighlighted = relativeY > actionThreshold && inviteGradientOpacity.value > highlightOpacityThreshold;
        
        if (isShortlistHighlighted || isInviteHighlighted) {
          // Area is highlighted, trigger action
          executeSwipeRightAction(translationX, translationY);
        } else {
          // No area highlighted, smooth slide back
          translateX.value = withTiming(0, { duration: 300 });
          shortlistGradientOpacity.value = withTiming(0);
          inviteGradientOpacity.value = withTiming(0);
          runOnJS(setHighlightedAction)(null);
        }
        return;
      }

      // Not dragged to edge - smooth slide back to center
      translateX.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
      rejectGradientOpacity.value = withTiming(0);
      shortlistGradientOpacity.value = withTiming(0);
      inviteGradientOpacity.value = withTiming(0);
      runOnJS(setHighlightedAction)(null);
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

        {/* Reject Action Area - Fixed gradient at left edge */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: (SCREEN_HEIGHT - MODAL_HEIGHT) / 2,
              width: ACTION_AREA_WIDTH,
              height: MODAL_HEIGHT,
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

        {/* Shortlist Action Area - Fixed gradient at right edge (top half) */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              right: 0,
              top: (SCREEN_HEIGHT - MODAL_HEIGHT) / 2,
              width: ACTION_AREA_WIDTH,
              height: MODAL_HEIGHT / 2,
              pointerEvents: 'none',
              borderTopLeftRadius: 20,
              borderBottomLeftRadius: 20,
              overflow: 'hidden',
            },
            shortlistGradientAnimatedStyle,
          ]}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 1)', 'rgba(34, 197, 94, 0)']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 16 }}>
            <Animated.Text 
              className="text-white font-bold text-lg uppercase tracking-wider"
              style={shortlistTextAnimatedStyle}>
              Shortlist
            </Animated.Text>
          </LinearGradient>
        </Animated.View>

        {/* Invite Action Area - Fixed gradient at right edge (bottom half) */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              right: 0,
              top: (SCREEN_HEIGHT - MODAL_HEIGHT) / 2 + MODAL_HEIGHT / 2,
              width: ACTION_AREA_WIDTH,
              height: MODAL_HEIGHT / 2,
              pointerEvents: 'none',
              borderTopLeftRadius: 20,
              borderBottomLeftRadius: 20,
              overflow: 'hidden',
            },
            inviteGradientAnimatedStyle,
          ]}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 0)']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 16 }}>
            <Animated.Text 
              className="text-white font-bold text-lg uppercase tracking-wider"
              style={inviteTextAnimatedStyle}>
              Invite
            </Animated.Text>
          </LinearGradient>
        </Animated.View>

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

