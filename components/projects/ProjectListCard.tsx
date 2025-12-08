import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity, View, Text, ImageBackground, StyleSheet } from 'react-native';
import GlassView from '@/components/custom/GlassView';
import { formatDateTime } from '~/utils/time-converts';
import { getStatusColor } from '@/utils/get-status-color';

export default function ProjectListCard({ item }: { item: any }) {

  const handleProjectPress = (projectId: number) => {
    router.push({
      pathname: '/(protected)/(client)/projects/project-detail' as any,

      params: { id: projectId },
    });
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
          ? ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.1)']
          : ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.1)']
      }
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
          <View style={[styles.statusChip, { backgroundColor: `${statusColor}33` }]}>
            <Text className="text-[10px] font-semibold" style={{ color: statusColor }}>
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
      onPress={() => handleProjectPress(project.id)}>
      <View className="overflow-hidden rounded-2xl border  bg-zinc-900/80">
        {projectImage ? (
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
          <Text className="text-[11px] text-amber-400" numberOfLines={1}>
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
