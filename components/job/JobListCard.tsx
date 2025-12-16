import React, { useMemo, useState, useRef } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity, View, Text, Image, ImageBackground, StyleSheet, Animated } from 'react-native';
import GlassView from '@/components/custom/GlassView';
import { formatDateTime } from '~/utils/time-converts';
import { getStatusColor } from '@/utils/get-status-color';
import { useSoleUserContext } from '~/context/SoleUserContext';

export default function JobListCard({ item }: { item: any }) {
  const { soleUserId } = useSoleUserContext();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isProfileNavigating, setIsProfileNavigating] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const project = item?.project || item;

  if (!project) {
    return null;
  }

  const handleJobPress = () => {
    // Prevent multiple navigations
    if (isNavigating) {
      return;
    }
    
    setIsNavigating(true);
    
    // Gentle translate animation
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: 4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // If user is the creator, redirect to project detail page
      if (project.soleUserId === soleUserId) {
        router.push({
          pathname: '/(protected)/(client)/projects/project-detail' as any,
          params: { id: project.id },
        });
      } else {
        router.push({
          pathname: `/(protected)/(user)/job/job-detail` as any,
          params: { id: project.id },
        });
      }
      
      // Reset navigation state after a delay to allow navigation to complete
      setTimeout(() => {
        setIsNavigating(false);
      }, 1000);
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
    if (!item?.soleUserName || isProfileNavigating) {
      return;
    }
    
    setIsProfileNavigating(true);
    
    router.push({
      pathname: '/(protected)/profile/[username]',
      params: { username: item.soleUserName },
    });
    
    // Reset navigation state after a delay
    setTimeout(() => {
      setIsProfileNavigating(false);
    }, 1000);
  };

  const hasImage = !!project.projectImage && project.projectImage !== 'default_image_url';
  
  const renderCardOverlay = useMemo(() => (
    <LinearGradient
      colors={hasImage
        ? ['rgba(255, 255, 255, 0.27)', 'rgba(0,0,0,0.45)', 'rgba(22, 22, 22, 0.15)']
        : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)']}
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
    <Animated.View style={{ transform: [{ translateX }], width: '100%' }}>
      <TouchableOpacity activeOpacity={0.85} className="mx-1 mb-5" style={{ width: '100%' }}>

        {/* Client Name and Profile Picture */}
        {hasClientMeta && (
          <TouchableOpacity className="mb-2 flex-row items-center gap-2 px-1" onPress={handleProfilePress} disabled={isProfileNavigating}>
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
          onPress={handleJobPress}
          disabled={isNavigating}>
          {hasImage ? (
            <ImageBackground
              source={{ uri: project.projectImage }}
              style={styles.cardBackground}
              imageStyle={styles.cardImage}>
              {renderCardOverlay}
            </ImageBackground>
          ) : (
            <GlassView
              style={styles.cardBackground}
              intensity={80}
              tint="dark"
              borderRadius={16}>
              {renderCardOverlay}
            </GlassView>
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
    </Animated.View>
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
