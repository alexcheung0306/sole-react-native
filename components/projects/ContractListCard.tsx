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

type ContractListCardProps = {
  item: any;
};

const statusColorMap: Record<string, string> = {
  Pending: '#f59e0b',
  Activated: '#10b981',
  Completed: '#3b82f6',
  Paid: '#8b5cf6',
  Cancelled: '#ef4444',
  'Payment Due': '#f97316',
};

export default function ContractListCard({ item }: ContractListCardProps) {
  const contract = item?.jobContract ?? item;

  if (!contract) {
    return null;
  }

  const statusColor =
    statusColorMap[contract.contractStatus as keyof typeof statusColorMap] || '#6b7280';

  const projectImage =
    contract.projectImage ||
    contract.project?.projectImage ||
    contract.project?.projectImageUrl ||
    contract.project?.projectImageUri ||
    null;

  const handleContractPress = () => {
    router.push({
      pathname: '/(protected)/(client)/projects/contract',
      params: { id: contract.id },
    });
  };

  const hasImage = !!projectImage;
  
  const renderCardOverlay = () => (
    <LinearGradient
      colors={hasImage
        ? ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.1)']
        : ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.1)']}
      style={styles.overlayGradient}
    >
      <View className="flex-1 justify-between">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-[10px] font-semibold text-white/80">
              Contract #{contract.id}
            </Text>
            <Text className="mt-1 text-xs font-semibold text-white" numberOfLines={2}>
              {contract.projectName || 'Untitled Project'}
            </Text>
            {contract.roleTitle && (
              <Text className="mt-1 text-[10px] font-medium text-white/80" numberOfLines={1}>
                Role: {contract.roleTitle}
              </Text>
            )}
          </View>
          <View style={[styles.statusChip, { backgroundColor: `${statusColor}33` }]}>
            <Text className="text-[10px] font-semibold" style={{ color: statusColor }}>
              {contract.contractStatus || 'Pending'}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <TouchableOpacity activeOpacity={0.9} className="mx-1 mb-5" style={{ width: '100%' }} onPress={handleContractPress}>
      <View className="overflow-hidden rounded-2xl border  bg-zinc-900/80">
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
          Created: {formatDateTime(contract.createdAt)}
        </Text>

        {contract.remarks ? (
          <Text className="text-[11px] text-white/80" numberOfLines={2}>
            {contract.remarks}
          </Text>
        ) : null}
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

