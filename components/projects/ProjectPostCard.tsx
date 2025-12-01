import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TouchableOpacity,
  View,
  Text,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { formatDateTime } from '~/utils/time-converts';

export default function ProjectPostCard({ item }: { item: any }) {
  const getStatusColorValue = (status: string) => {
    const colorMap: { [key: string]: string } = {
      Draft: '#6b7280',
      Published: '#f59e0b',
      InProgress: '#10b981',
      Completed: '#3b82f6',
    };
    return colorMap[status] || '#6b7280';
  };

  const handleProjectPress = (projectId: number) => {
    router.push({
      pathname: '/(protected)/(client)/projects/project-detail',
      params: { id: projectId },
    });
  };

  const project = item?.project || item;

  if (!project) {
    return null;
  }

  const statusColor = getStatusColorValue(project.status || 'Draft');
  const projectImage = project.projectImage || null;
  const hasImage = !!projectImage;

  const renderCardOverlay = () => (
    <LinearGradient
      colors={hasImage
        ? ['rgba(174, 174, 174, 0.4)', 'rgba(0,0,0,0.5)', 'rgba(174, 174, 174, 0.4)']
        : ['rgba(174, 174, 174, 0.4)', 'rgba(0,0,0,0.5)', 'rgba(174, 174, 174, 0.4)']}
      style={styles.overlayGradient}
    >
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
    <TouchableOpacity activeOpacity={0.9} className="mx-1 mb-5" style={{ width: '100%' }} onPress={() => handleProjectPress(project.id)}>
      <View className="overflow-hidden rounded-2xl border bg-zinc-900/80">
        {projectImage ? (
          <ImageBackground
            source={{ uri: projectImage }}
            style={styles.cardBackground}
            imageStyle={styles.cardImage}
          >
            {renderCardOverlay()}
          </ImageBackground>
        ) : (
          <LinearGradient colors={['rgba(255, 255, 255, 0.4)', 'rgba(250, 250, 250, 0.35)', 'rgba(245, 245, 245, 0.3)']} style={styles.cardBackground}>
            {renderCardOverlay()}
          </LinearGradient>
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
