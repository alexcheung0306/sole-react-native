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
import { BlurView } from "expo-blur";
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
  stackedStyle: { scale: number; zIndex: number; opacity: number };
  talentProfileData: any;
  isLoadingProfile: boolean;
  currentTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{ id: string; label: string }>;
  projectId?: number;
  roleId?: number;
  availableActions: string[];
  currentProcess: string;
  onSwipeComplete: () => void;
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
  stackedStyle,
  talentProfileData,
  isLoadingProfile,
  currentTab,
  onTabChange,
  tabs,
  projectId,
  roleId,
  availableActions,
  currentProcess,
  onSwipeComplete,
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
    if (!isTopCard) {
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
      const draggedToRightEdge = event.translationX > SWIPE_THRESHOLD;
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
      if (draggedToRightEdge) {
        const actionCount = availableActionsCount.value;
        const screenY = SCREEN_HEIGHT / 2 + event.translationY;
        const clampedY = Math.max(0, Math.min(SCREEN_HEIGHT, screenY));
        const actionHeight = SCREEN_HEIGHT / Math.max(actionCount, 1);
        const actionIndex = Math.min(
          Math.max(0, Math.floor(clampedY / actionHeight)),
          Math.min(actionCount - 1, 4)
        );

        const progress = Math.min(event.translationX / ACTION_AREA_WIDTH, 1);
        const opacities = [0, 0, 0, 0, 0];
        if (actionIndex >= 0 && actionIndex < actionCount) {
          opacities[actionIndex] = progress;
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
      const draggedToRightEdge = event.translationX > SWIPE_THRESHOLD;
      const isOffered = currentProcessShared.value === 'offered';
      const highlightOpacityThreshold = 0.5;

      // Swipe LEFT - Reject
      if (draggedToLeftEdge) {
        if (!isOffered && rejectGradientOpacity.value > highlightOpacityThreshold) {
          runOnJS(onSwipeReject)();
          translateX.value = withSpring(-SCREEN_WIDTH, { damping: 20, stiffness: 200 }, () => {
            'worklet';
            runOnJS(onSwipeComplete)();
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
      if (draggedToRightEdge) {
        const actionCount = availableActionsCount.value;
        const screenY = SCREEN_HEIGHT / 2 + event.translationY;
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
          runOnJS(onSwipeAction)(actionIndex);
          translateX.value = withSpring(SCREEN_WIDTH, { damping: 20, stiffness: 200 }, () => {
            'worklet';
            runOnJS(onSwipeComplete)();
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
    });

  const candidateApplicant = candidate?.jobApplicant ?? {};
  const candidateUserInfo = candidate?.userInfo ?? {};
  const candidateUsername = candidate?.username || candidateUserInfo?.username || 'unknown';
  const candidateStatusColor = getStatusColor(candidateApplicant?.applicationStatus || 'applied');

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
          borderWidth: 1,
          borderColor: isTopCard ? candidateStatusColor : 'rgba(255, 255, 255, 0.2)',
          overflow: 'hidden',
          zIndex: stackedStyle.zIndex,
          transform: [{ scale: stackedStyle.scale }],
          opacity: stackedStyle.opacity,
        },
        isTopCard ? cardAnimatedStyle : {},
      ]}>
      <BlurView intensity={100} tint="dark" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View className="bg-black/12 absolute inset-0" />

      <GestureDetector gesture={panGesture}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Candidate Header Card */}
          <View className="mx-4 mt-4 rounded-2xl border border-white/10 bg-zinc-800 p-4">
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
                {isLoadingProfile ? (
                  <View className="py-8">
                    <ActivityIndicator size="large" color="#3b82f6" />
                  </View>
                ) : !talentProfileData || !talentProfileData.talentInfo ? (
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
                    userProfileData={talentProfileData}
                    talentLevel={parseInt(talentProfileData?.talentLevel || '0')}
                    talentInfo={talentProfileData?.talentInfo}
                    isOwnProfile={false}
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
                projectData={{ id: projectId }}
                roleId={roleId}
              />
            )}
          </View>
        </ScrollView>
      </GestureDetector>
    </Animated.View>
  );
}

