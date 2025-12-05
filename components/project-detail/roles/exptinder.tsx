import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Modal, Pressable, Alert } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  SharedValue,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateApplicantProcessById } from "@/api/apiservice/applicant_api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const CARD_HEIGHT = 400;
const ACTION_AREA_WIDTH = 180;

type ExpTinderProps = {
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

type CardProps = {
  candidate: any;
  borderColor: string;
  isOnTop: boolean;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
  panGesture: any;
};

function Card({ candidate, borderColor, isOnTop, translateX, translateY, opacity, scale, panGesture }: CardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const maxTranslate = SCREEN_WIDTH - 40;
    // For back card, always use 0 for translateX/Y to prevent flickering
    const currentTranslateX = isOnTop ? translateX.value : 0;
    const currentTranslateY = isOnTop ? translateY.value : 0;
    const rotate = isOnTop
      ? interpolate(translateX.value, [-maxTranslate, 0, maxTranslate], [-15, 0, 15])
      : 0;
    return {
      transform: [
        { translateX: currentTranslateX },
        { translateY: currentTranslateY },
        { rotate: `${rotate}deg` },
        { scale: scale.value },
      ],
      opacity: isOnTop ? opacity.value : 1,
    };
  });

  const applicant = candidate?.jobApplicant ?? {};
  const userInfo = candidate?.userInfo ?? {};
  const username = candidate?.username || userInfo?.username || 'unknown';
  const name = userInfo?.name || 'Unnamed candidate';

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          {
            borderColor,
            zIndex: isOnTop ? 10 : 1, // Higher z-index when on top to ensure it covers the other card
          },
          animatedStyle,
        ]}>
        <Text style={[styles.cardText, { color: borderColor }]}>
          {name}
        </Text>
        <Text style={[styles.cardSubtext, { color: borderColor }]}>
          @{username}
        </Text>
        <Text style={[styles.cardSubtext, { color: borderColor }]}>
          Status: {applicant?.applicationStatus || 'applied'}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

export function ExpTinder({
  visible,
  onClose,
  candidates,
  initialIndex,
  roleId,
  projectId,
  currentProcess,
  roleWithSchedules,
  onCandidateUpdated,
}: ExpTinderProps) {
  const queryClient = useQueryClient();
  const [onTop, setOnTop] = useState<"A" | "B">("A");
  const [cardAIndex, setCardAIndex] = useState(initialIndex);
  const [cardBIndex, setCardBIndex] = useState(() => {
    const next = initialIndex + 1;
    return next < candidates.length ? next : -1;
  });
  const [highlightedAction, setHighlightedAction] = useState<'shortlist' | 'invite' | 'reject' | null>(null);

  // Animation values - shared between cards
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const cardAScale = useSharedValue(onTop === "A" ? 1 : 0.95);
  const cardBScale = useSharedValue(onTop === "B" ? 1 : 0.95);

  // Gradient opacity values
  const rejectGradientOpacity = useSharedValue(0);
  const rightActionOpacities = useSharedValue([0, 0, 0, 0, 0]);
  const availableActionsCount = useSharedValue(0);

  // Refs for worklet access
  const availableActionsRef = useRef<string[]>([]);
  const currentApplicantRef = useRef<any>(null);
  const currentProcessRef = useRef<string>(currentProcess);
  const mutationMutateRef = useRef<((variables: any) => void) | null>(null);
  const queryClientRef = useRef(queryClient);
  const onCandidateUpdatedRef = useRef(onCandidateUpdated);
  const handleCardSwipeCompleteRef = useRef<(() => void) | null>(null);
  const projectIdRef = useRef(projectId);
  const roleIdRef = useRef(roleId);
  const onTopRef = useRef<'A' | 'B'>(onTop);

  // Initialize indices when modal opens
  useEffect(() => {
    if (visible && candidates.length > 0) {
      const validInitialIndex = Math.min(initialIndex, candidates.length - 1);
      const validIndex = validInitialIndex >= 0 ? validInitialIndex : 0;
      setCardAIndex(validIndex);
      const nextIndex = validIndex + 1;
      setCardBIndex(nextIndex < candidates.length ? nextIndex : -1);
      setOnTop("A");
      // Reset animation values
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 1;
      rejectGradientOpacity.value = 0;
      rightActionOpacities.value = [0, 0, 0, 0, 0];
      cardAScale.value = 1;
      cardBScale.value = 0.95;
    }
  }, [visible, initialIndex, candidates.length]);

  // Get candidates based on which card is on top
  const cardACandidate = cardAIndex >= 0 && cardAIndex < candidates.length ? candidates[cardAIndex] : null;
  const cardBCandidate = cardBIndex >= 0 && cardBIndex < candidates.length ? candidates[cardBIndex] : null;
  const currentCandidate = onTop === "A" ? cardACandidate : cardBCandidate;

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
      const actions = sessionActivities.length > 0 ? [...sessionActivities] : [];
      actions.push('shortlisted');
      return actions;
    } else if (sessionActivities.includes(currentProcess)) {
      // At a session: show remaining sessions (after current) + shortlisted
      const currentIndex = sessionActivities.indexOf(currentProcess);
      const remainingSessions = sessionActivities.slice(currentIndex + 1);
      const actions = [...remainingSessions];
      actions.push('shortlisted');
      return actions;
    }
    // Default: if nothing matches, at least show shortlisted if at applied status
    const applicant = currentCandidate?.jobApplicant ?? {};
    if (applicant?.applicationStatus === 'applied' || applicant?.applicationProcess === 'applied') {
      return ['shortlisted'];
    }
    return [];
  }, [currentProcess, sessionActivities, currentCandidate]);

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

  // Update refs
  useEffect(() => {
    availableActionsCount.value = getAvailableActions.length;
    availableActionsRef.current = getAvailableActions;
  }, [getAvailableActions]);

  useEffect(() => {
    if (currentCandidate) {
      currentApplicantRef.current = currentCandidate?.jobApplicant;
    }
  }, [currentCandidate]);

  useEffect(() => {
    currentProcessRef.current = currentProcess;
  }, [currentProcess]);

  useEffect(() => {
    projectIdRef.current = projectId;
    roleIdRef.current = roleId;
  }, [projectId, roleId]);

  useEffect(() => {
    onTopRef.current = onTop;
  }, [onTop]);

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
    onSuccess: () => {
      queryClientRef.current?.invalidateQueries({ queryKey: ['role-candidates'] });
      queryClientRef.current?.invalidateQueries({ queryKey: ['role-process-counts'] });
      onCandidateUpdatedRef.current?.();

      // Don't reset animations here - let the card stay swiped out
      // The animations will be reset when the card swap happens

      // Trigger card swap after a delay
      setTimeout(() => {
        handleCardSwipeCompleteRef.current?.();
      }, 300);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to execute action. Please try again.', [{ text: 'OK' }]);
    },
  });

  useEffect(() => {
    mutationMutateRef.current = updateApplicantMutation.mutate;
    queryClientRef.current = queryClient;
    onCandidateUpdatedRef.current = onCandidateUpdated;
  }, [updateApplicantMutation.mutate, queryClient, onCandidateUpdated]);

  const handleCardSwipeComplete = useCallback(() => {
    if (candidates.length === 0) {
      onClose();
      return;
    }

    const currentTopIndex = onTop === "A" ? cardAIndex : cardBIndex;
    let nextIndex = currentTopIndex + 1;

    if (nextIndex >= candidates.length || currentTopIndex < 0 || currentTopIndex >= candidates.length) {
      nextIndex = 0;
    }

    if (nextIndex >= candidates.length) {
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

    // Swap cards
    const newOnTop = onTop === "A" ? "B" : "A";
    setOnTop(newOnTop);

    if (newOnTop === "A") {
      setCardAIndex(nextIndex);
      const cardBNextIndex = nextIndex + 1;
      if (cardBNextIndex < candidates.length) {
        setCardBIndex(cardBNextIndex);
      } else {
        setCardBIndex(-1);
      }
    } else {
      setCardBIndex(nextIndex);
      const cardANextIndex = nextIndex + 1;
      if (cardANextIndex < candidates.length) {
        setCardAIndex(cardANextIndex);
      } else {
        setCardAIndex(-1);
      }
    }
  }, [onTop, cardAIndex, cardBIndex, candidates.length, onClose, translateX, translateY, opacity, rejectGradientOpacity, rightActionOpacities]);

  useEffect(() => {
    handleCardSwipeCompleteRef.current = handleCardSwipeComplete;
  }, [handleCardSwipeComplete]);

  // Set card scales when onTop changes (animations are reset in handleCardSwipeComplete)
  useEffect(() => {
    // Set card scales based on which card is on top
    if (onTop === "A") {
      cardAScale.value = 1;
      cardBScale.value = 0.95;
    } else {
      cardBScale.value = 1;
      cardAScale.value = 0.95;
    }
  }, [onTop, cardAScale, cardBScale]);

  const handleReject = () => {
    const applicant = currentApplicantRef.current;
    if (!applicant?.id) return;
    Alert.alert('Candidate Rejected', 'The candidate has been rejected.', [{ text: 'OK' }]);
    updateApplicantMutation.mutate({
      applicantId: applicant.id,
      status: 'rejected',
    });
  };

  const executeSwipeLeftReject = () => {
    'worklet';
    const maxTranslate = SCREEN_WIDTH - 40;
    translateX.value = withSpring(-maxTranslate, {}, () => {
      runOnJS(handleReject)();
    });
    opacity.value = withTiming(0);
  };

  const executeActionByIndex = useCallback((actionIndex: number) => {
    const action = availableActionsRef.current[actionIndex];
    const applicantData = currentApplicantRef.current;
    const mutateFn = mutationMutateRef.current;

    if (!action || !applicantData?.id || !mutateFn) {
      return;
    }

    if (action === 'shortlisted') {
      mutateFn({
        applicantId: applicantData.id,
        status: 'shortlisted',
        process: 'shortlisted',
      });
    } else {
      mutateFn({
        applicantId: applicantData.id,
        status: 'invited',
        process: action,
      });
    }
  }, []);

  const executeSwipeRightAction = (actionIndex: number) => {
    'worklet';
    if (actionIndex >= 0) {
      const maxTranslate = SCREEN_WIDTH - 40;
      translateX.value = withSpring(maxTranslate, {}, () => {
        runOnJS(executeActionByIndex)(actionIndex);
      });
      opacity.value = withTiming(0);
    } else {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    }
  };

  // Pan gesture for card swiping
  const contentPanGesture = Gesture.Pan()
    .enabled(true)
    .activeOffsetX([-15, 15])
    .failOffsetY([-50, 50])
    .minDistance(15)
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;

      const maxDragDistance = SCREEN_WIDTH - 40;
      
      // Calculate drag progress for back card scaling
      let dragProgressForScale = 0;
      const isDraggingLeft = event.translationX < -30;
      const isDraggingRight = event.translationX > 30;
      
      if (isDraggingLeft || isDraggingRight) {
        const absTranslationX = Math.abs(event.translationX);
        dragProgressForScale = Math.min(absTranslationX / SWIPE_THRESHOLD, 1);
      }
      
      const targetBackScale = 0.95 + (dragProgressForScale * 0.05);
      const currentOnTop = onTopRef.current;
      if (currentOnTop === 'A') {
        cardBScale.value = withTiming(targetBackScale, { duration: 100 });
      } else {
        cardAScale.value = withTiming(targetBackScale, { duration: 100 });
      }

      // Handle LEFT swipe (Reject)
      if (event.translationX < -30) {
        const isOffered = currentProcessRef.current === 'offered';
        if (!isOffered) {
          const dragProgress = Math.min(Math.abs(event.translationX) / maxDragDistance, 1);
          const targetOpacity = 0.4 + dragProgress * 0.6;
          rejectGradientOpacity.value = withTiming(targetOpacity);
          runOnJS(setHighlightedAction)('reject');
        } else {
          rejectGradientOpacity.value = withTiming(0);
        }
      } else {
        rejectGradientOpacity.value = withTiming(0);
        if (highlightedAction === 'reject') {
          runOnJS(setHighlightedAction)(null);
        }
      }

      // Handle RIGHT swipe (Dynamic actions)
      if (event.translationX > 30) {
        const dragProgress = Math.min(event.translationX / maxDragDistance, 1);
        const baseOpacity = 0.3 + dragProgress * 0.7;
        const dimOpacity = baseOpacity * 0.4;

        const screenY = SCREEN_HEIGHT / 2 + event.translationY;
        const clampedY = Math.max(0, Math.min(SCREEN_HEIGHT, screenY));
        const actionCount = availableActionsCount.value;
        const actionHeight = SCREEN_HEIGHT / Math.max(actionCount, 1);
        const actionIndex = Math.min(
          Math.max(0, Math.floor(clampedY / actionHeight)),
          Math.min(actionCount - 1, 4)
        );

        const newOpacities = [...rightActionOpacities.value];
        for (let i = 0; i < Math.min(actionCount, 5); i++) {
          newOpacities[i] = dimOpacity;
        }

        if (dragProgress > 0.3 && actionIndex >= 0 && actionIndex < actionCount) {
          newOpacities[actionIndex] = baseOpacity;
        }

        rightActionOpacities.value = newOpacities;
      } else {
        rightActionOpacities.value = [0, 0, 0, 0, 0];
      }
    })
    .onEnd((event) => {
      'worklet';
      const { translationX, translationY, velocityX } = event;
      const maxDragDistance = SCREEN_WIDTH - 40;
      const highlightOpacityThreshold = 0.5;

      const draggedToLeftEdge = translationX < -SWIPE_THRESHOLD || velocityX < -500;
      const draggedToRightEdge = translationX > SWIPE_THRESHOLD || velocityX > 500;

      // Swipe LEFT
      if (draggedToLeftEdge) {
        const isOffered = currentProcessRef.current === 'offered';
        if (!isOffered && rejectGradientOpacity.value > highlightOpacityThreshold) {
          executeSwipeLeftReject();
        } else {
          translateX.value = withTiming(0, { duration: 300 });
          rejectGradientOpacity.value = withTiming(0);
          runOnJS(setHighlightedAction)(null);
          const currentOnTop = onTopRef.current;
          if (currentOnTop === 'A') {
            cardBScale.value = withTiming(0.95, { duration: 200 });
          } else {
            cardAScale.value = withTiming(0.95, { duration: 200 });
          }
        }
        return;
      }

      // Swipe RIGHT
      if (draggedToRightEdge) {
        const actionCount = availableActionsCount.value;
        const screenY = SCREEN_HEIGHT / 2 + translationY;
        const clampedY = Math.max(0, Math.min(SCREEN_HEIGHT, screenY));
        const actionHeight = SCREEN_HEIGHT / Math.max(actionCount, 1);
        const actionIndex = Math.min(
          Math.max(0, Math.floor(clampedY / actionHeight)),
          Math.min(actionCount - 1, 4)
        );

        const currentOpacities = rightActionOpacities.value;
        const isHighlighted =
          actionIndex >= 0 &&
          actionIndex < actionCount &&
          currentOpacities[actionIndex] > highlightOpacityThreshold;

        if (isHighlighted) {
          executeSwipeRightAction(actionIndex);
        } else {
          translateX.value = withTiming(0, { duration: 300 });
          rightActionOpacities.value = [0, 0, 0, 0, 0];
          const currentOnTop = onTopRef.current;
          if (currentOnTop === 'A') {
            cardBScale.value = withTiming(0.95, { duration: 200 });
          } else {
            cardAScale.value = withTiming(0.95, { duration: 200 });
          }
        }
        return;
      }

      // Not dragged to edge - snap back
      translateX.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
      rejectGradientOpacity.value = withTiming(0);
      rightActionOpacities.value = [0, 0, 0, 0, 0];
      runOnJS(setHighlightedAction)(null);
      const currentOnTop = onTopRef.current;
      if (currentOnTop === 'A') {
        cardBScale.value = withTiming(0.95, { duration: 200 });
      } else {
        cardAScale.value = withTiming(0.95, { duration: 200 });
      }
    });

  // Animated styles for gradients
  const rejectGradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: rejectGradientOpacity.value,
  }));

  const rejectTextAnimatedStyle = useAnimatedStyle(() => ({
    opacity: rejectGradientOpacity.value > 0.3 ? 1 : rejectGradientOpacity.value * 2,
  }));

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

  const rightAction0TextStyle = useAnimatedStyle(() => {
    const opacity = rightActionOpacities.value[0] || 0;
    return { opacity: opacity > 0.3 ? 1 : opacity * 2 };
  });
  const rightAction1TextStyle = useAnimatedStyle(() => {
    const opacity = rightActionOpacities.value[1] || 0;
    return { opacity: opacity > 0.3 ? 1 : opacity * 2 };
  });
  const rightAction2TextStyle = useAnimatedStyle(() => {
    const opacity = rightActionOpacities.value[2] || 0;
    return { opacity: opacity > 0.3 ? 1 : opacity * 2 };
  });
  const rightAction3TextStyle = useAnimatedStyle(() => {
    const opacity = rightActionOpacities.value[3] || 0;
    return { opacity: opacity > 0.3 ? 1 : opacity * 2 };
  });
  const rightAction4TextStyle = useAnimatedStyle(() => {
    const opacity = rightActionOpacities.value[4] || 0;
    return { opacity: opacity > 0.3 ? 1 : opacity * 2 };
  });

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

  if (!visible || candidates.length === 0) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.modalContainer}>
        {/* Backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
        />

        {/* Centered Card Container */}
        <View style={styles.centeredContainer}>
          <View style={styles.cardContainer}>
            {/* Render the card that's behind first, then the one on top (for proper z-index layering) */}
            {onTop === "A" ? (
              <>
                {/* Card B (behind) */}
                {cardBCandidate && (
                  <Card
                    candidate={cardBCandidate}
                    borderColor="red"
                    isOnTop={false}
                    translateX={translateX}
                    translateY={translateY}
                    opacity={opacity}
                    scale={cardBScale}
                    panGesture={Gesture.Pan().enabled(false)}
                  />
                )}
                {/* Card A (front) */}
                {cardACandidate && (
                  <Card
                    candidate={cardACandidate}
                    borderColor="blue"
                    isOnTop={true}
                    translateX={translateX}
                    translateY={translateY}
                    opacity={opacity}
                    scale={cardAScale}
                    panGesture={contentPanGesture}
                  />
                )}
              </>
            ) : (
              <>
                {/* Card A (behind) */}
                {cardACandidate && (
                  <Card
                    candidate={cardACandidate}
                    borderColor="blue"
                    isOnTop={false}
                    translateX={translateX}
                    translateY={translateY}
                    opacity={opacity}
                    scale={cardAScale}
                    panGesture={Gesture.Pan().enabled(false)}
                  />
                )}
                {/* Card B (front) */}
                {cardBCandidate && (
                  <Card
                    candidate={cardBCandidate}
                    borderColor="red"
                    isOnTop={true}
                    translateX={translateX}
                    translateY={translateY}
                    opacity={opacity}
                    scale={cardBScale}
                    panGesture={contentPanGesture}
                  />
                )}
              </>
            )}
          </View>

          {/* Reject Action Area - Fixed gradient at left edge */}
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
                zIndex: 10,
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
                style={[styles.actionText, rejectTextAnimatedStyle]}>
                Reject
              </Animated.Text>
            </LinearGradient>
          </Animated.View>

          {/* Dynamic Right Action Areas */}
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
                    zIndex: 10,
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
                    style={[styles.actionText, textStyle]}>
                    {getActionLabel(action)}
                  </Animated.Text>
                </LinearGradient>
              </Animated.View>
            );
          })}

          {/* Debug info */}
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Index: {onTop === "A" ? cardAIndex : cardBIndex} / {candidates.length}</Text>
            <Text style={styles.debugText}>Card A Index: {cardAIndex}</Text>
            <Text style={styles.debugText}>Card B Index: {cardBIndex}</Text>
            <Text style={styles.debugText}>On Top: {onTop}</Text>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: "relative",
  },
  card: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 4,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardSubtext: {
    fontSize: 18,
    marginTop: 4,
  },
  debugContainer: {
    marginTop: 40,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
  },
  debugText: {
    color: "#fff",
    fontSize: 14,
    marginVertical: 4,
  },
  actionText: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#fff",
  },
});
