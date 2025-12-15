import { RoleInformationInput } from './RoleInformationInput';
import { RoleRequirementsInputs } from './RoleRequirementsInputs';
import { RoleScheduleListInputs } from './RoleScheduleListInputs';
import { RoleConfirm } from '../../project-detail/roles/RoleConfirm';

interface RoleFormPortalPageContentProps {
  currentPage: 'roleInformation' | 'requirements' | 'schedules' | 'confirm';
  values: any;
  touched: any;
  setFieldValue: (field: string, value: any) => void;
  setValues: (values: any, shouldValidate?: boolean) => void;
  setFieldTouched: (field: string, touched: boolean, shouldValidate?: boolean) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  ethnic: Set<string>;
  setEthnic: (ethnic: Set<string>) => void;
  onFillLater: () => void;
  fillSchedulesLater: boolean;
  onRegisterScrollClose?: (closeHandler: () => void) => void;
}

export function RoleFormPageContent({
  currentPage,
  values,
  touched,
  setFieldValue,
  setValues,
  setFieldTouched,
  selectedCategories,
  setSelectedCategories,
  ethnic,
  setEthnic,
  onFillLater,
  fillSchedulesLater,
  onRegisterScrollClose,
}: RoleFormPortalPageContentProps) {
  switch (currentPage) {
    case 'roleInformation':
      return (
        <RoleInformationInput
          values={values}
          touched={touched}
          setFieldValue={setFieldValue}
          setFieldTouched={setFieldTouched}
        />
      );
    case 'requirements':
      return (
        <RoleRequirementsInputs
          values={values}
          touched={touched}
          setFieldValue={setFieldValue}
          setFieldTouched={setFieldTouched}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          ethnic={ethnic}
          setEthnic={setEthnic}
        />
      );
    case 'schedules':
      return (
        <RoleScheduleListInputs
          values={values}
          setFieldValue={setFieldValue}
          setValues={setValues}
          touched={touched}
          setFieldTouched={setFieldTouched}
          onFillLater={onFillLater}
          fillSchedulesLater={fillSchedulesLater}
          onRegisterScrollClose={onRegisterScrollClose}
        />
      );
    case 'confirm':
      return <RoleConfirm values={values} />;
    default:
      return null;
  }
}

