import { View } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';

interface RoleFormNavigationButtonsProps {
  currentPage: 'roleInformation' | 'requirements' | 'schedules' | 'confirm';
  getPreviousPage: () => 'roleInformation' | 'requirements' | 'schedules' | 'confirm';
  getNextPage: () => 'roleInformation' | 'requirements' | 'schedules' | 'confirm';
  setCurrentPage: (page: 'roleInformation' | 'requirements' | 'schedules' | 'confirm') => void;
  isCurrentPageValid: () => boolean;
  hasErrors: boolean;
  isSubmitting: boolean;
  onSave: () => Promise<void>;
  onClose: () => void;
}

export function RoleFormNavigationButtons({
  currentPage,
  getPreviousPage,
  getNextPage,
  setCurrentPage,
  isCurrentPageValid,
  hasErrors,
  isSubmitting,
  onSave,
  onClose,
}: RoleFormNavigationButtonsProps) {
  return (
    <View className="flex-row gap-3 border-t border-white/10 px-4 py-4">
      <Button
        action="secondary"
        variant="outline"
        isDisabled={currentPage === 'roleInformation'}
        onPress={() => setCurrentPage(getPreviousPage())}
        className="flex-1">
        <ButtonText>Previous</ButtonText>
      </Button>
      {currentPage === 'confirm' ? (
        <Button
          action="primary"
          isDisabled={hasErrors || isSubmitting}
          onPress={async () => {
            await onSave();
            onClose();
          }}
          className="flex-1">
          <ButtonText>{isSubmitting ? 'Saving...' : 'Save Role'}</ButtonText>
        </Button>
      ) : (
        <Button
          action="primary"
          isDisabled={!isCurrentPageValid()}
          onPress={() => setCurrentPage(getNextPage())}
          className="flex-1">
          <ButtonText>Next</ButtonText>
        </Button>
      )}
    </View>
  );
}

