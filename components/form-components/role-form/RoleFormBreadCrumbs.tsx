import { View, TouchableOpacity, Text } from 'react-native';

interface RoleFormBreadCrumbsProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  pageOrder: string[];
  roleInformationErrors: boolean;
  requirementsErrors: boolean;
  hasErrors: boolean;
  hasJobActivity?: boolean;
}
export function RoleFormBreadCrumbs({
  currentPage,
  setCurrentPage,
  pageOrder,
  roleInformationErrors,
  requirementsErrors,
  hasErrors,
  hasJobActivity = true,
}: RoleFormBreadCrumbsProps) {
  return (
    <View className=" flex-row flex-wrap gap-2  ">
      {pageOrder.map((page, index) => {
        const isCurrent = currentPage === page;
        const isDisabled =
          (page === 'requirements' && roleInformationErrors) ||
          (page === 'schedules' && (roleInformationErrors || requirementsErrors)) ||
          (page === 'confirm' && hasErrors);
        
        // Show red border for schedules if there's no job activity
        const isSchedulesPage = page === 'schedules';
        const showRedBorder = isSchedulesPage && !hasJobActivity;

        return (
          <TouchableOpacity
            key={page}
            onPress={() => !isDisabled && setCurrentPage(page)}
            disabled={isDisabled}
            activeOpacity={1}
            className={`rounded-full border px-3 py-1.5 ${
              showRedBorder
                ? isCurrent
                  ? 'border-red-500 bg-white'
                  : 'border-red-500'
                : isCurrent
                  ? 'border-white bg-white'
                  : isDisabled
                    ? '   text-white'
                    : 'border-white   text-white'
            }`}>
            <Text
              className={`text-xs font-semibold ${
                isCurrent ? 'text-black' : isDisabled ? '  text-grey-500' : 'text-white '
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
