import { useRef } from "react";
import { router } from "expo-router";
import { FileCheck, Calendar, Briefcase } from "lucide-react-native";
import { TouchableOpacity, View, Text, Animated } from "react-native";
import { getStatusColorObject } from "~/utils/get-status-color";

export function MyContractListCard({ item }: { item: any }) {
  const translateX = useRef(new Animated.Value(0)).current;
  
  // Extract nested data to match the logged structure
  const jobContract = item?.jobContract || item;
  
  const contractId = jobContract?.id;
  const projectId = jobContract?.projectId;
  const roleId = jobContract?.roleId;
  const roleTitle = jobContract?.roleTitle || 'Unnamed Role';
  const projectName = jobContract?.projectName || `Project #${projectId}`;
  const contractStatus = jobContract?.contractStatus;
  const createdAt = jobContract?.createdAt;
  const remarks = jobContract?.remarks;
  const conditionsCount = jobContract?.conditions?.length || 0;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper function to get primary condition (latest condition)
  const getPrimaryCondition = (conditions: any[]) => {
    if (!conditions || conditions.length === 0) return null;
    if (conditions.length === 1) return conditions[0];
    
    // Sort by creation date (newest first) and return the latest
    const sortedConditions = [...conditions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sortedConditions[0];
  };

  // Helper function to check if contract is read by talent (check latest condition)
  const isReadByTalent = (conditions: any[]) => {
    if (!conditions || conditions.length === 0) return true;
    const latestCondition = getPrimaryCondition(conditions);
    return latestCondition?.readByTalent === true;
  };

  const statusColor = getStatusColorObject(contractStatus);

  const handleContractPress = (contract: any) => {
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
      const jobContract = contract?.jobContract || contract;
      const projectId = jobContract?.projectId;
      if (projectId) {
        router.push({
          pathname: `/(protected)/(user)/job/job-detail` as any,
          params: { id: projectId, contractId: jobContract?.id || contract?.id },
        });
      }
    });
  };

  return (
    <Animated.View style={{ transform: [{ translateX }] }}>
      <TouchableOpacity
        onPress={() => handleContractPress(item)}
        className="bg-zinc-800/60 rounded-2xl p-4 mb-3 border border-white/10"
        activeOpacity={0.7}
      >
      {/* Contract ID Badge */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <FileCheck size={16} color="#3b82f6" />
          <Text className="text-sm text-blue-400 font-semibold">
            Contract #{contractId || 'N/A'}
          </Text>
          {!isReadByTalent(jobContract?.conditions || []) && (
            <View className="w-2 h-2 bg-red-500 rounded-full" />
          )}
        </View>
        <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: statusColor.bg }}>
          <Text className="text-xs font-semibold" style={{ color: statusColor.text }}>
            {contractStatus || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Role Title */}
      <Text className="text-lg font-bold text-white mb-2" numberOfLines={2}>
        {roleTitle}
      </Text>

      {/* Project Info */}
      <View className="flex-row items-center mb-2 gap-2">
        <Briefcase size={14} color="#9ca3af" />
        <Text className="text-sm text-gray-300 flex-1" numberOfLines={1}>
          {projectName}
        </Text>
      </View>

      {/* Project & Role IDs */}
      <View className="flex-row items-center mb-2 gap-2">
        <FileCheck size={14} color="#9ca3af" />
        <Text className="text-sm text-gray-400">
          Project ID: {projectId || 'N/A'} | Role ID: {roleId || 'N/A'}
        </Text>
      </View>

      {/* Conditions Count */}
      {conditionsCount > 0 && (
        <View className="flex-row items-center mb-2 gap-2">
          <FileCheck size={14} color="#9ca3af" />
          <Text className="text-sm text-gray-400">
            {conditionsCount} {conditionsCount === 1 ? 'Condition' : 'Conditions'}
          </Text>
        </View>
      )}

      {/* Created Date */}
      {createdAt && (
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-1">
            <Calendar size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-400">
              Created: {formatDate(createdAt)}
            </Text>
          </View>
        </View>
      )}

      {/* Remarks */}
      {remarks && (
        <Text className="text-sm text-gray-400 mt-2 italic" numberOfLines={2}>
          "{remarks}"
        </Text>
      )}
    </TouchableOpacity>
    </Animated.View>
  );
}

