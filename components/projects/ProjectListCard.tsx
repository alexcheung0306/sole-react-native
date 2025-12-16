import { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity, View, Text, ImageBackground, StyleSheet } from 'react-native';
import GlassView from '@/components/custom/GlassView';
import { formatDateTime } from '~/utils/time-converts';
import { getStatusColor } from '@/utils/get-status-color';

export default function ProjectListCard({ item }: { item: any }) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleProjectPress = (projectId: number) => {
    // Prevent multiple navigations
    if (isNavigating) {
      return;
    }
    
    setIsNavigating(true);
    
    router.push({
      pathname: '/(protected)/(client)/projects/project-detail' as any,
      params: { id: projectId },
    });
    
    // Reset navigation state after a delay to allow navigation to complete
    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
  };

  const project = item?.project || item;

  if (!project) {
    return null;
  }

  const statusColor = getStatusColor(project.status || 'Draft');
  const projectImage = project.projectImage || null;
  const hasImage = !!projectImage && projectImage !== 'default_image_url';

  const renderCardOverlay = () => (
    <LinearGradient
      colors={
        hasImage
        ? ['rgba(255, 255, 255, 0.14)', 'rgba(0,0,0,0.45)', 'rgba(22, 22, 22, 0.15)']
          : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)']}
      style={styles.overlayGradient}>
      <View className="flex-1 justify-between">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-[10px] font-semibold text-white/80">
              Project #{project.id ? String(project.id) : ''}
            </Text>
            <Text className="mt-1 text-xs font-semibold text-white" numberOfLines={2}>
              {project.projectName || 'Untitled Project'}
            </Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: `${statusColor}` }]}>
            <Text className="text-[10px] font-semibold" style={{ color: 'white' }}>
              {project.status || 'Draft'}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className="mx-1 mb-5"
      style={{ width: '100%' }}
      onPress={() => handleProjectPress(project.id)}
      disabled={isNavigating}>
      <View className="overflow-hidden rounded-2xl border  bg-zinc-900/80">
        {hasImage ? (
          <ImageBackground
            source={{ uri: projectImage }}
            style={styles.cardBackground}
            imageStyle={styles.cardImage}>
            {renderCardOverlay()}
          </ImageBackground>
        ) : (
          <GlassView
            style={styles.cardBackground}
            intensity={80}
            tint="dark"
            borderRadius={16}
            darkOverlayOpacity={0}>
            {renderCardOverlay()}
          </GlassView>
        )}
      </View>

      <View className="mt-2 gap-1 px-1">
        <Text className="text-[11px] text-gray-400">
          Updated: {formatDateTime(project.updatedAt)}
        </Text>

        {project.applicationDeadline && (
          <Text className="text-[11px] text-white" numberOfLines={1}>
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
