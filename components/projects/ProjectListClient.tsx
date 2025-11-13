import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity, View, Text, Image, ImageBackground, StyleSheet } from 'react-native';
import { formatDateTime } from '~/utils/time-converts';

export default function ProjectListClient({ item }: { item: any }) {
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
  const hasClientMeta = item?.userInfoName || item?.soleUserName || item?.userInfoProfilePic;
  const clientInitial =
    item?.userInfoName && typeof item.userInfoName === 'string'
      ? item.userInfoName
          .split(' ')
          .map((segment: string) => segment.charAt(0))
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '';

  const handleProfilePress = () => {
    if (!item?.soleUserName) {
      return;
    }

    router.push({
      pathname: '/(protected)/profile/[username]',
      params: { username: item.soleUserName },
    });
  };

  const renderCardOverlay = () => (
    <LinearGradient
      colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.15)']}
      style={styles.overlayGradient}>
      <View className="flex-1 justify-between">
        <View className="flex-row items-start justify-between">
          <View className="max-w-[70%]">
            <Text className="text-2xs font-semibold text-white/80">#{project.id}</Text>
            <Text className="mt-1 text-2xs font-semibold text-white" numberOfLines={2}>
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
    <TouchableOpacity activeOpacity={0.85} className="mx-1 mb-5 flex-1">

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
        className="overflow-hidden rounded-2xl border border-white/15 bg-zinc-900/80"
        onPress={() => handleProjectPress(project.id)}>
        {project.projectImage ? (
          <ImageBackground
            source={{ uri: project.projectImage }}
            style={styles.cardBackground}
            imageStyle={styles.cardImage}>
            {renderCardOverlay()}
          </ImageBackground>
        ) : (
          <LinearGradient colors={['#27272a', '#18181b']} style={styles.cardBackground}>
            {renderCardOverlay()}
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
    borderRadius: 18,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
});
