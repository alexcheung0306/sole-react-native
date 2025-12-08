import { useState, useEffect, useRef, useCallback } from "react";
import { Dimensions, Text, View, ActivityIndicator, ScrollView, Image } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  SharedValue,
} from "react-native-reanimated";
import { GlassOverlay } from "@/components/custom/GlassView";
import { CustomTabs } from "@/components/custom/custom-tabs";
import { getStatusColor } from "@/utils/get-status-color";
import TalentProfile from "~/components/talent-profile/TalentProfile";
import { ApplicationDetail } from "~/components/project-detail/roles/ApplicationDetail";
import { ActionToCandidates } from "~/components/project-detail/roles/ActionToCandidates";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const ACTION_AREA_WIDTH = 180;

interface SwipeCardProps {
  candidate: any;
  index: number;
  isTopCard: boolean;
  isSecondCard: boolean;
  isExiting?: boolean;
  stackedStyle: { scale: number; zIndex: number; opacity: number };
  talentProfileData: any;
  isLoadingProfile: boolean;
  currentTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{ id: string; label: string }>;
  projectId?: number;
  projectData?: any;
  roleId?: number;
  roleWithSchedules?: any;
  availableActions: string[];
  currentProcess: string;
  onSwipeComplete: () => void;
  onOfferSuccess?: () => void;
  onSwipeStartExit?: () => void;
  onExitAnimationEnd?: (index: number) => void;
  onSwipeAction: (actionIndex: number) => void;
  onSwipeReject: () => void;
  onHighlightAction: (action: 'shortlist' | 'invite' | 'reject' | null) => void;
  rejectGradientOpacity: SharedValue<number>;
  rightActionOpacities: SharedValue<number[]>;
  availableActionsCount: SharedValue<number>;
  currentIndexShared: SharedValue<number>;
  currentProcessShared: SharedValue<string>;
}

export default function SwipeCard({
  candidate,
  index,
  isTopCard,
  isSecondCard,
  isExiting = false,
  stackedStyle,
  talentProfileData,
  isLoadingProfile,
  currentTab,
  onTabChange,
  tabs,
  projectId,
  projectData,
  roleId,
  roleWithSchedules,
  availableActions,
  currentProcess,
  onSwipeComplete,
  onOfferSuccess,
  onSwipeStartExit,
  onExitAnimationEnd,
  onSwipeAction,
  onSwipeReject,
  onHighlightAction,
  rejectGradientOpacity,
  rightActionOpacities,
  availableActionsCount,
  currentIndexShared,
  currentProcessShared,
}: SwipeCardProps) {
  // Animation values for this card
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Reset animation values when this card becomes the top card
  useEffect(() => {
    if (isTopCard) {
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 1;
    }
  }, [isTopCard, translateX, translateY, opacity]);

  // Animated style for this card
  const cardAnimatedStyle = useAnimatedStyle(() => {
    if (!isTopCard && !isExiting) {
      return {};
    }
    const maxTranslate = SCREEN_WIDTH - 40;
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

  // Pan gesture handler for this card
  const panGesture = Gesture.Pan()
    // Activate only on meaningful horizontal movement so vertical scrolls pass through
    .activeOffsetX([-20, 20])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      'worklet';
      // Only allow gesture if this card is the top card
      if (currentIndexShared.value !== index) {
        return;
      }
    })
    .onUpdate((event) => {
      'worklet';
      // Only process if this card is the top card
      if (currentIndexShared.value !== index) {
        return;
      }

      translateX.value = event.translationX;
      translateY.value = event.translationY;

      const draggedToLeftEdge = event.translationX < -SWIPE_THRESHOLD;
      const draggedRightAny = event.translationX > 0;
      const draggedToRightEdge = event.translationX > SWIPE_THRESHOLD;
      const inRightActionArea = event.absoluteX >= SCREEN_WIDTH - ACTION_AREA_WIDTH;
      const isOffered = currentProcessShared.value === 'offered';

      // Left side - Reject
      if (draggedToLeftEdge && !isOffered) {
        const progress = Math.min(Math.abs(event.translationX) / ACTION_AREA_WIDTH, 1);
        rejectGradientOpacity.value = progress;
        if (progress > 0.5) {
          runOnJS(onHighlightAction)('reject');
        }
      } else {
        rejectGradientOpacity.value = 0;
        runOnJS(onHighlightAction)(null);
      }

      // Right side - Actions
      if (draggedRightAny) {
        const actionCount = availableActionsCount.value;
        const screenY = event.absoluteY;
        const clampedY = Math.max(0, Math.min(SCREEN_HEIGHT, screenY));
        const actionHeight = SCREEN_HEIGHT / Math.max(actionCount, 1);
        const actionIndex = Math.min(
          Math.max(0, Math.floor(clampedY / actionHeight)),
          Math.min(actionCount - 1, 4)
        );

        // On drag start: light all moderately bright
        const base = 0.6;
        const opacities = [0, 0, 0, 0, 0];
        for (let i = 0; i < Math.min(actionCount, 5); i += 1) {
          opacities[i] = base;
        }

        // When inside the action strip with enough drag, only highlight the hovered action
        if (draggedToRightEdge && inRightActionArea && actionIndex >= 0 && actionIndex < actionCount) {
          for (let i = 0; i < Math.min(actionCount, 5); i += 1) {
            opacities[i] = 0; // unlight others
          }
          const progress = Math.min(event.translationX / ACTION_AREA_WIDTH, 1);
          opacities[actionIndex] = Math.max(progress, base);
        }
        rightActionOpacities.value = opacities;
      } else {
        rightActionOpacities.value = [0, 0, 0, 0, 0];
      }
    })
    .onEnd((event) => {
      'worklet';
      // Only process if this card is the top card
      if (currentIndexShared.value !== index) {
        return;
      }

      const draggedToLeftEdge = event.translationX < -SWIPE_THRESHOLD;
      const draggedRightAny = event.translationX > 0;
      const draggedToRightEdge = event.translationX > SWIPE_THRESHOLD;
      const inRightActionArea = event.absoluteX >= SCREEN_WIDTH - ACTION_AREA_WIDTH;
      const isOffered = currentProcessShared.value === 'offered';
      const highlightOpacityThreshold = 0.5;

      // Swipe LEFT - Reject
      if (draggedToLeftEdge) {
        if (!isOffered && rejectGradientOpacity.value > highlightOpacityThreshold) {
          runOnJS(onSwipeReject)();
          if (onSwipeStartExit) {
            runOnJS(onSwipeStartExit)();
          }
          // Advance to next card immediately while this one animates out
          runOnJS(onSwipeComplete)();
          translateX.value = withSpring(-SCREEN_WIDTH, { damping: 20, stiffness: 200 }, () => {
            'worklet';
            if (onExitAnimationEnd) {
              runOnJS(onExitAnimationEnd)(index);
            }
          });
          opacity.value = withTiming(0, { duration: 150 });
          // Immediately hide gradients
          rejectGradientOpacity.value = 0;
          rightActionOpacities.value = [0, 0, 0, 0, 0];
        } else {
          translateX.value = withTiming(0, { duration: 200 });
          rejectGradientOpacity.value = withTiming(0, { duration: 150 });
          runOnJS(onHighlightAction)(null);
        }
        return;
      }

      // Swipe RIGHT - Actions
      if (draggedRightAny && inRightActionArea) {
        const actionCount = availableActionsCount.value;
        const screenY = event.absoluteY;
        const clampedY = Math.max(0, Math.min(SCREEN_HEIGHT, screenY));
        const actionHeight = SCREEN_HEIGHT / Math.max(actionCount, 1);
        const actionIndex = Math.min(
          Math.max(0, Math.floor(clampedY / actionHeight)),
          Math.min(actionCount - 1, 4)
        );

        const isHighlighted =
          draggedToRightEdge &&
          actionIndex >= 0 &&
          actionIndex < actionCount;

        if (isHighlighted) {
          runOnJS(onSwipeAction)(actionIndex);
          if (onSwipeStartExit) {
            runOnJS(onSwipeStartExit)();
          }
          // Advance to next card immediately while this one animates out
          runOnJS(onSwipeComplete)();
          translateX.value = withSpring(SCREEN_WIDTH, { damping: 20, stiffness: 200 }, () => {
            'worklet';
            if (onExitAnimationEnd) {
              runOnJS(onExitAnimationEnd)(index);
            }
          });
          opacity.value = withTiming(0, { duration: 150 });
          // Immediately hide gradients
          rejectGradientOpacity.value = 0;
          rightActionOpacities.value = [0, 0, 0, 0, 0];
        } else {
          translateX.value = withTiming(0, { duration: 200 });
          rightActionOpacities.value = withTiming([0, 0, 0, 0, 0], { duration: 150 });
        }
        return;
      }

      // Not dragged to edge - slide back
      translateX.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
      rejectGradientOpacity.value = withTiming(0, { duration: 150 });
      rightActionOpacities.value = withTiming([0, 0, 0, 0, 0], { duration: 150 });
      runOnJS(onHighlightAction)(null);
    })
    // Safety: if the gesture is cancelled/failed, ensure the card recenters on Y
    .onFinalize(() => {
      'worklet';
      if (currentIndexShared.value !== index) {
        return;
      }
      const hasSwipedAway = Math.abs(translateX.value) >= SWIPE_THRESHOLD;
      if (hasSwipedAway) {
        return;
      }
      translateX.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(0, { duration: 180 });
      rejectGradientOpacity.value = withTiming(0, { duration: 120 });
      rightActionOpacities.value = withTiming([0, 0, 0, 0, 0], { duration: 120 });
      runOnJS(onHighlightAction)(null);
    });

  const candidateApplicant = candidate?.jobApplicant ?? {};
  const candidateUserInfo = candidate?.userInfo ?? {};
  const candidateUsername = candidate?.username || candidateUserInfo?.username || 'unknown';
  const candidateStatusColor = getStatusColor(candidateApplicant?.applicationStatus || 'applied');

  // Keep last good profile data for this candidate to avoid momentary flicker when queries refetch
  const [lastGoodProfile, setLastGoodProfile] = useState<any>(talentProfileData);

  useEffect(() => {
    // Reset cache when candidate changes
    setLastGoodProfile(talentProfileData);
  }, [candidateUsername]);

  useEffect(() => {
    if (talentProfileData?.talentInfo) {
      setLastGoodProfile(talentProfileData);
    }
  }, [talentProfileData]);

  const profileToRender = lastGoodProfile ?? talentProfileData;

  // Don't render if scale is 0 (swiped away)
  if (stackedStyle.scale === 0 || stackedStyle.opacity === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          bottom: 20,
          borderRadius: 28,
          zIndex: stackedStyle.zIndex,
          transform: [{ scale: stackedStyle.scale }],
          opacity: stackedStyle.opacity,
        },
        isTopCard || isExiting ? cardAnimatedStyle : {},
      ]}
      pointerEvents={isExiting ? 'none' : 'auto'}>
      <View
        style={{
          flex: 1,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.3)',
          backgroundColor: 'transparent',
          overflow: 'hidden',
        }}>
        {/* Glass effect overlay */}
        <GlassOverlay intensity={100} tint="dark" />

          <GestureDetector gesture={panGesture}>
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              scrollEventThrottle={16}>
              {/* Candidate Header Card */}
              <View className="mx-4 mt-4 rounded-2xl border border-white/10   p-4">
                <View className="flex-row items-center gap-4">
                  <Image
                    source={{
                      uri: talentProfileData?.userInfo?.profilePic || candidate?.comcardFirstPic || undefined,
                    }}
                    className="h-20 w-20 rounded-full bg-zinc-700"
                  />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-white">
                      {talentProfileData?.userInfo?.name || candidateUserInfo?.name || 'Unnamed candidate'}
                    </Text>
                    <Text className="text-sm text-white/60">@{candidateUsername}</Text>
                    <View
                      className="mt-2 self-start rounded-full border px-3 py-1.5"
                      style={{
                        backgroundColor: candidateStatusColor + '20',
                        borderColor: candidateStatusColor + '60',
                      }}>
                      <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: candidateStatusColor }}>
                        {candidateApplicant?.applicationStatus || 'applied'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Tabs */}
              <View className="mt-4 px-4">
                <CustomTabs tabs={tabs} value={currentTab} onValueChange={onTabChange} />
              </View>

              {/* Tab Content */}
              <View className="px-4 pb-8">
            {currentTab === 'talent-profile' && (
                  <View>
                {isLoadingProfile || profileToRender === undefined ? (
                      <View className="py-8">
                        <ActivityIndicator size="large" color="#3b82f6" />
                      </View>
                ) : !profileToRender || !profileToRender.talentInfo ? (
                      <View className="py-8">
                        <Text className="mb-2 text-center text-base font-semibold text-white">Profile Not Available</Text>
                        <Text className="text-center text-sm text-white/60">
                          {candidateUsername === 'unknown'
                            ? "This user's profile information is not available."
                            : 'Unable to load profile data for this user.'}
                        </Text>
                      </View>
                    ) : (
                      <TalentProfile
                    userProfileData={profileToRender}
                    talentLevel={parseInt(profileToRender?.talentLevel || '0')}
                    talentInfo={profileToRender?.talentInfo}
                        isOwnProfile={false}
                        scrollEnabled={false}
                      />
                    )}
                  </View>
                )}

                {currentTab === 'application' && (
                  <ApplicationDetail
                    applicant={candidateApplicant}
                  />
                )}

                {currentTab === 'actions' && (
                  <ActionToCandidates
                    applicant={candidate}
                    projectData={projectData || { id: projectId }}
                    roleId={roleId}
                    roleWithSchedules={roleWithSchedules}
                    onOfferSuccess={onOfferSuccess}
                  />
                )}
              </View>
            </ScrollView>
          </GestureDetector>
      </View>
    </Animated.View>
  );
}

