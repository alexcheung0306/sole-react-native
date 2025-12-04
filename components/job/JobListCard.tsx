import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity, View, Text, Image, ImageBackground, StyleSheet } from 'react-native';
import { formatDateTime } from '~/utils/time-converts';
import { getStatusColor } from '@/utils/get-status-color';

export default function JobListCard({ item }: { item: any }) {
  const project = item?.project || item;

  if (!project) {
    return null;
  }

  const handleJobPress = () => {
    router.push({
      pathname: `/(protected)/(user)/job/job-detail` as any,
      params: { id: project.id },
    });
  };

  const statusColor = useMemo(() => getStatusColor(project.status || 'Published'), [project.status]);
  const hasClientMeta = item?.userInfoName || item?.soleUserName || item?.userInfoProfilePic;
  const clientInitial = useMemo(() =>
    item?.userInfoName && typeof item.userInfoName === 'string'
      ? item.userInfoName
          .split(' ')
          .map((segment: string) => segment.charAt(0))
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '', [item?.userInfoName]);

  const handleProfilePress = () => {
    if (!item?.soleUserName) {
      return;
    }
    router.push({
      pathname: '/(protected)/profile/[username]',
      params: { username: item.soleUserName },
    });
  };

  const hasImage = !!project.projectImage;
  
  const renderCardOverlay = useMemo(() => (
    <LinearGradient
      colors={hasImage
        ? ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.15)']
        : ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.1)']}
      style={styles.overlayGradient}>
      <View className="flex-1 justify-between">
        <View className="flex-row items-start justify-between">
          <View className="max-w-[70%]">
            <Text className="text-2xs font-semibold text-white/80">#{project.id ? String(project.id) : ''}</Text>
            <Text className="mt-1 text-2xs font-semibold text-white" numberOfLines={2}>
              {project.projectName || 'Untitled Job'}
            </Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: `${statusColor}33` }]}>
            <Text className="text-[10px] font-semibold" style={{ color: statusColor }}>
              {project.status || 'Published'}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  ), [statusColor, project.id, project.projectName, project.status, hasImage]);

  return (
    <TouchableOpacity activeOpacity={0.85} className="mx-1 mb-5" style={{ width: '100%' }}>

      {/* Client Name and Profile Picture */}
      {hasClientMeta && (
        <TouchableOpacity className="mb-2 flex-row items-center gap-2 px-1" onPress={handleProfilePress}>
          {item?.userInfoProfilePic ? (
            <Image source={{ uri: item.userInfoProfilePic }} className="h-6 w-6 rounded-full" />
          ) : (
            <View className="h-6 w-6 items-center justify-center rounded-full bg-white/10">
              <Text className="text-[10px] font-semibold text-white/80">{clientInitial}</Text>
            </View>
          )}
          <View className="flex-1">
            {item?.userInfoName && (
              <Text className="text-xs font-semibold text-white" numberOfLines={1}>
                {item.userInfoName}
              </Text>
            )}
            {item?.soleUserName && (
              <Text className="text-[10px] text-white/70" numberOfLines={1}>
                @{item.soleUserName}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Project Image and Overlay */}
      <TouchableOpacity
        className="overflow-hidden rounded-2xl border bg-zinc-900/80"
        onPress={handleJobPress}>
        {project.projectImage ? (
          <ImageBackground
            source={{ uri: project.projectImage }}
            style={styles.cardBackground}
            imageStyle={styles.cardImage}>
            {renderCardOverlay}
          </ImageBackground>
        ) : (
          <LinearGradient colors={['rgba(255, 255, 255, 0.4)', 'rgba(250, 250, 250, 0.35)', 'rgba(245, 245, 245, 0.3)']} style={styles.cardBackground}>
            {renderCardOverlay}
          </LinearGradient>
        )}
      </TouchableOpacity>

      {/* Project Details */}
      <View className="mt-2 gap-1 px-1">
        <Text className="text-[11px] text-gray-400">
          Updated: {formatDateTime(project.updatedAt)}
        </Text>
        {project.applicationDeadline && (
          <Text className="text-[11px] text-amber-400">
            Deadline: {formatDateTime(project.applicationDeadline)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardBackground: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  cardImage: {
    resizeMode: 'cover',
  },
  overlayGradient: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
});
