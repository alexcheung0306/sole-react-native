import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { View, TouchableOpacity, Text } from 'react-native';

export default function PaginationControl({
  totalPages,
  currentPage,
  setCurrentPage,
  isLoadingProjects,
}: {
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  isLoadingProjects: boolean;
}) {
  if (totalPages <= 1 || isLoadingProjects) return null;

  return (
    <View className="px-6 py-4">
      <View className="flex-row items-center justify-between">
        {/* Previous Button */}
        <TouchableOpacity
          className={`flex-row items-center rounded-lg px-4 py-3 ${
            currentPage === 0
              ? 'bg-gray-800/30 opacity-50'
              : 'border border-blue-500/50 bg-blue-500/20'
          }`}
          onPress={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 0}>
          <ChevronLeft color={currentPage === 0 ? '#6b7280' : '#3b82f6'} size={20} />
          <Text
            className={`ml-2 font-semibold ${
              currentPage === 0 ? 'text-gray-500' : 'text-blue-500'
            }`}>
            Previous
          </Text>
        </TouchableOpacity>

        {/* Page Indicator */}
        <View className="rounded-lg border border-white/10 bg-gray-800/60 px-4 py-3">
          <Text className="font-semibold text-white">
            {currentPage + 1} / {totalPages}
          </Text>
        </View>

        {/* Next Button */}
        <TouchableOpacity
          className={`flex-row items-center rounded-lg px-4 py-3 ${
            currentPage >= totalPages - 1
              ? 'bg-gray-800/30 opacity-50'
              : 'border border-blue-500/50 bg-blue-500/20'
          }`}
          onPress={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}>
          <Text
            className={`mr-2 font-semibold ${
              currentPage >= totalPages - 1 ? 'text-gray-500' : 'text-blue-500'
            }`}>
            Next
          </Text>
          <ChevronRight color={currentPage >= totalPages - 1 ? '#6b7280' : '#3b82f6'} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
