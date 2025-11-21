import { View, TouchableOpacity, Text } from 'react-native';

interface RoleFormBreadCrumbsProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  pageOrder: string[];
  roleInformationErrors: boolean;
  requirementsErrors: boolean;
  hasErrors: boolean;
}
export function RoleFormBreadCrumbs({
  currentPage,
  setCurrentPage,
  pageOrder,
  roleInformationErrors,
  requirementsErrors,
  hasErrors,
}: RoleFormBreadCrumbsProps) {
  return (
    <View className="mb-4 flex-row flex-wrap gap-2 border-b border-white/10 pb-3">
      {pageOrder.map((page, index) => {
        const isCurrent = currentPage === page;
        const isDisabled =
          (page === 'requirements' && roleInformationErrors) ||
          (page === 'schedules' && (roleInformationErrors || requirementsErrors)) ||
          (page === 'confirm' && hasErrors);

        return (
          <TouchableOpacity
            key={page}
            onPress={() => !isDisabled && setCurrentPage(page)}
            disabled={isDisabled}
            className={`rounded-full border px-3 py-1 ${
              isCurrent
                ? 'border-blue-500 bg-blue-500/20'
                : isDisabled
                  ? 'border-white/10 bg-zinc-800/30 opacity-50'
                  : 'border-white/20 bg-zinc-800/50'
            }`}>
            <Text
              className={`text-xs ${
                isCurrent ? 'text-blue-400' : isDisabled ? 'text-white/40' : 'text-white/80'
              }`}>
              {index + 1}.{' '}
              {page === 'roleInformation'
                ? 'Info'
                : page === 'requirements'
                  ? 'Requirements'
                  : page === 'schedules'
                    ? 'Schedules'
                    : 'Confirm'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
