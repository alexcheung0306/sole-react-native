import { useRef } from "react";
import { router } from "expo-router";
import { Briefcase, FileText, Calendar } from "lucide-react-native";
import { TouchableOpacity, View, Text, Animated } from "react-native";
import { formatDateTime } from "~/lib/datetime";
import { getStatusColorObject } from "~/utils/get-status-color";

export  function AppliedRoleListCard({ item }: { item: any }) {
    const translateX = useRef(new Animated.Value(0)).current;
    
    // Extract nested data to match the logged structure
    const jobApplicant = item?.jobApplicant || {};
    const project = item?.project || {};
    const role = item?.role || {};
    
    const projectId = project?.id || jobApplicant?.projectId;
    const roleId = role?.id || jobApplicant?.roleId;
    const roleTitle = role?.roleTitle || 'Unnamed Role';
    const projectName = project?.projectName || `Project #${projectId}`;
    const applicationProcess = jobApplicant?.applicationProcess;
    const applicationStatus = jobApplicant?.applicationStatus;
    const appliedAt = jobApplicant?.createdAt;
    const remarks = project?.remarks || role?.roleDescription;

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      };
    
    
    const statusColor = getStatusColorObject(applicationProcess || applicationStatus);
    const handleApplicationPress = (application: any) => {
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
          const projectId = application?.project?.id || application?.jobApplicant?.projectId;
          const roleId = application?.role?.id || application?.jobApplicant?.roleId;
          if (projectId) {
            router.push({
              pathname: `/(protected)/(user)/job/job-detail` as any,
              params: { id: projectId, roleId: roleId },
            });
          }
        });
      };
    return (
      <Animated.View style={{ transform: [{ translateX }] }}>
        <TouchableOpacity
          onPress={() => handleApplicationPress(item)}
          className="bg-zinc-800/60 rounded-2xl p-4 mb-3 border border-white/10"
          activeOpacity={0.7}
        >
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

        {/* Project ID */}
        <View className="flex-row items-center mb-2 gap-2">
          <FileText size={14} color="#9ca3af" />
          <Text className="text-sm text-gray-400">
            Project ID: {projectId || 'N/A'} | Role ID: {roleId || 'N/A'}
          </Text>
        </View>

        {/* Application Status */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: statusColor.bg }}>
            <Text className="text-xs font-semibold" style={{ color: statusColor.text }}>
              {applicationProcess || applicationStatus || 'Pending'}
            </Text>
          </View>
          
          {appliedAt && (
            <View className="flex-row items-center gap-1">
              <Calendar size={12} color="#9ca3af" />
              <Text className="text-xs text-gray-400">
                {formatDate(appliedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Additional Info */}
        {remarks && (
          <Text className="text-sm text-gray-400 mt-2 italic" numberOfLines={2}>
            {remarks}
          </Text>
        )}
      </TouchableOpacity>
      </Animated.View>
    );
  };