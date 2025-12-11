import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { getStatusColor } from '@/utils/get-status-color';

type CandidateCardProps = {
  item: any;
  cardWidth: number;
  roleId: string | number | undefined;
  projectId: string | number | undefined;
  onPress?: (index: number) => void;
  index?: number;
};

export const CandidateCard = memo(function CandidateCard({
  item,
  cardWidth,
  roleId,
  projectId,
  onPress,
  index,
}: CandidateCardProps) {
  const applicant = item?.jobApplicant ?? {};
  const userInfo = item?.userInfo ?? {};
  const username = item?.username || userInfo?.username || 'unknown';
  const statusColor = getStatusColor(applicant?.applicationStatus || 'applied');
  const imageUri = item?.comcardFirstPic || userInfo?.profilePic || null;

  const handlePress = () => {
    if (onPress && index !== undefined) {
      onPress(index);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      className="rounded-2xl border border-white/20 bg-zinc-800/85 overflow-hidden relative"
      style={{ width: cardWidth, aspectRatio: 3 / 4 }}>
      {/* Status Chip - Top Right */}
      <View
        className="absolute top-2 right-2 z-20 px-2.5 py-1.5 rounded-full border"
        style={{ 
          backgroundColor: statusColor + '20',
          borderColor: statusColor + '60',
        }}>
        <Text className="text-[10px] font-bold uppercase tracking-wide" style={{ color: statusColor }}>
          {applicant?.applicationStatus || 'applied'}
        </Text>
      </View>

      {/* Profile Image */}
      <View className="w-full h-48 bg-zinc-700">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={100}
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Text className="text-white/40 text-xs">No Image</Text>
          </View>
        )}
      </View>

      {/* Username Chip - Bottom Left */}
      <View className="absolute bottom-2 left-2 z-20 px-2.5 py-1.5 rounded-full border border-white/20 bg-zinc-900/95 backdrop-blur-sm">
        <Text className="text-[10px] font-semibold text-white">@{username}</Text>
      </View>

      {/* Profile Loading Indicator */}
      {!userInfo?.name && username !== 'Unknown User' && (
        <View className="absolute top-2 left-2 z-20 px-2.5 py-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/25 backdrop-blur-sm">
          <Text className="text-[10px] font-semibold text-yellow-400">Loading...</Text>
        </View>
      )}

      {/* Profile Unavailable Indicator */}
      {username === 'Unknown User' && (
        <View className="absolute top-2 left-2 z-20 px-2.5 py-1.5 rounded-full border border-zinc-500/40 bg-zinc-600/30 backdrop-blur-sm">
          <Text className="text-[10px] font-semibold text-zinc-300">Unavailable</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only rerender if these props change
  return (
    prevProps.item?.jobApplicant?.id === nextProps.item?.jobApplicant?.id &&
    prevProps.cardWidth === nextProps.cardWidth &&
    prevProps.index === nextProps.index &&
    prevProps.item?.jobApplicant?.applicationStatus === nextProps.item?.jobApplicant?.applicationStatus
  );
});

