import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik } from 'formik';
import { Plus, Pencil } from 'lucide-react-native';
import { FormModal } from '@/components/custom/form-modal';
import { PrimaryButton } from '@/components/custom/primary-button';
import { Button, ButtonText } from '@/components/ui/button';
import { createRoleWithSchedules, updateRoleAndSchedules } from '@/api/apiservice/role_api';
import { validateNumberField } from '@/lib/validations/form-field-validations';
import { validateRoleTitle, validateRoleDescription } from '@/lib/validations/role-validation';
import { validateGender } from '@/lib/validations/talentInfo-validations';
import { validateScheduleList } from '@/lib/validations/role-validation';
import { RoleInformationInput } from './RoleInformationInput';
import { RoleRequirementsInputs } from './RoleRequirementsInputs';
import { RoleScheduleListInputs } from './RoleScheduleListInputs';
import { RoleConfirm } from './RoleConfirm';
import { FillRoleFormButton } from './FillRoleFormButton';

type RoleFormProps = {
  projectId: number;
  method: 'POST' | 'PUT';
  roleId?: number | null;
  fetchedValues?: any;
  isDisabled?: boolean;
  refetchRoles: () => void;
};

export function RoleForm({
  projectId,
  method,
  roleId = null,
  fetchedValues = null,
  isDisabled = false,
  refetchRoles,
}: RoleFormProps) {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState<'roleInformation' | 'requirements' | 'schedules' | 'confirm'>('roleInformation');
  const [fillSchedulesLater, setFillSchedulesLater] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ethnic, setEthnic] = useState<Set<string>>(new Set());
  const closeDropdownRef = useRef<(() => void) | null>(null);

  // Handle both old format (fetchedValues directly) and new format (roleWithSchedules with nested role)
  const roleData = fetchedValues?.role ? fetchedValues.role : fetchedValues;
  const activitiesData = fetchedValues?.activities ? fetchedValues.activities : [];

  const categoryValue =
    roleData?.category && typeof roleData.category === 'string' ? roleData.category.split(',').filter(Boolean) : [];

  const ethnicValue =
    roleData?.requiredEthnicGroup &&
    typeof roleData.requiredEthnicGroup === 'string' &&
    roleData.requiredEthnicGroup !== 'No Preference'
      ? new Set(roleData.requiredEthnicGroup.split(',').filter(Boolean))
      : new Set();

  const roleMutation = useMutation({
    mutationFn: async (values: any) => {
      if (method === 'POST') {
        return await createRoleWithSchedules(values, values);
      } else if (method === 'PUT') {
        return await updateRoleAndSchedules(String(roleId), values, values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['manageProjects'] });
      queryClient.invalidateQueries({ queryKey: ['project-roles', projectId] });
      queryClient.invalidateQueries({ queryKey: ['rolesWithSchedules', projectId] });
      refetchRoles();
    },
  });

  const handleSubmit = async (values: any) => {
    try {
      const parsedValues = {
        ...values,
        ...(method === 'POST' ? { projectId } : { category: selectedCategories.join(',') }),
      };
      await roleMutation.mutateAsync(parsedValues);
    } catch (e) {
      console.log('Error Submitting Role Form', e);
    }
  };

  // Reset all form state to initial values
  const resetFormState = () => {
    setSelectedCategories([]);
    setEthnic(new Set());
    setCurrentPage('roleInformation');
    setFillSchedulesLater(false);
  };

  const initialValues = fetchedValues
    ? {
        projectId: roleData.projectId || projectId,
        roleTitle: roleData.roleTitle || '',
        roleDescription: roleData.roleDescription || '',
        paymentBasis: roleData.paymentBasis || 'On Project',
        budget: roleData.budget || 1000,
        talentNumbers: roleData.talentNumbers || 1,
        displayBudgetTo: roleData.displayBudgetTo || 'Everyone',
        talentsQuote: roleData.talentsQuote || false,
        otPayment: roleData.otPayment !== undefined ? roleData.otPayment : true,
        questions: roleData.questions || '',
        requiredGender: roleData.requiredGender || 'No Preference',
        ageMin: roleData.ageMin || 15,
        ageMax: roleData.ageMax || 30,
        heightMin: roleData.heightMin || 160,
        heightMax: roleData.heightMax || 210,
        category: roleData.category || '',
        requiredEthnicGroup: roleData.requiredEthnicGroup || 'No Preference',
        skills: roleData.skills || '',
        activityScheduleLists:
          activitiesData.length > 0
            ? activitiesData
            : [
                {
                  title: '',
                  type: '',
                  schedules: [
                    {
                      id: Date.now(),
                      location: '',
                      fromTime: '',
                      toTime: '',
                    },
                  ],
                  remarks: '',
                },
              ],
      }
    : {
        projectId: projectId,
        roleTitle: '',
        roleDescription: '',
        paymentBasis: 'On Project',
        budget: 1000,
        talentNumbers: 1,
        displayBudgetTo: 'Everyone',
        talentsQuote: false,
        otPayment: true,
        questions: '',
        requiredGender: 'No Preference',
        ageMin: 15,
        ageMax: 30,
        heightMin: 160,
        heightMax: 210,
        category: '',
        requiredEthnicGroup: 'No Preference',
        skills: '',
        activityScheduleLists: [
          {
            title: '',
            type: '',
            schedules: [
              {
                id: Date.now(),
                location: '',
                fromTime: '',
                toTime: '',
              },
            ],
            remarks: '',
          },
        ],
      };

  const pageOrder: Array<'roleInformation' | 'requirements' | 'schedules' | 'confirm'> = [
    'roleInformation',
    'requirements',
    'schedules',
    'confirm',
  ];

  return (
    <>
      <Formik key={`${method}-${roleId || 'new'}`} initialValues={initialValues} enableReinitialize={false} onSubmit={handleSubmit}>
        {({ values, setFieldValue, setValues, submitForm, resetForm, touched, setFieldTouched }) => {
        const handleFillLater = () => {
          setFillSchedulesLater(true);
          setFieldValue('activityScheduleLists', []);
        };

        // Validation functions
        const validateRoleInformation = () => {
          return (
            validateRoleTitle(values.roleTitle) ||
            validateRoleDescription(values.roleDescription) ||
            validateNumberField(values.budget, 'budget')
          );
        };

        const validateRequirements = () => {
          return validateGender(values.requiredGender);
        };

        const validateActivitySchedules = () => {
          if (fillSchedulesLater) return [];

          if (!values.activityScheduleLists) return [];

          return values.activityScheduleLists.map((activity: any) => {
            const errors: string[] = [];

            if (!activity.title?.trim()) {
              errors.push('Activity title is required');
            }

            if (!activity.type?.trim()) {
              errors.push('Activity type is required');
            }

            if (activity.schedules?.length > 0) {
              if (activity.schedules && Array.isArray(activity.schedules)) {
                activity.schedules.forEach((schedule: any, index: number) => {
                  const scheduleError = validateScheduleList(schedule);
                  if (scheduleError) {
                    errors.push(`Schedule ${index + 1}: ${scheduleError}`);
                  }
                });
              }
            } else {
              errors.push('At least one schedule is required');
            }

            return errors.length > 0 ? errors : null;
          });
        };

        // Get validation errors
        const roleInformationErrors = validateRoleInformation();
        const requirementsErrors = validateRequirements();
        const activityScheduleErrors = validateActivitySchedules();

        // Check if any errors exist
        const hasErrors =
          roleInformationErrors ||
          requirementsErrors ||
          activityScheduleErrors.some((error: string[] | null) => Boolean(error));

        // Navigation helper functions
        const getPreviousPage = () => {
          const currentIndex = pageOrder.indexOf(currentPage);
          return currentIndex > 0 ? pageOrder[currentIndex - 1] : currentPage;
        };

        const getNextPage = () => {
          const currentIndex = pageOrder.indexOf(currentPage);
          return currentIndex < pageOrder.length - 1 ? pageOrder[currentIndex + 1] : currentPage;
        };

        const isCurrentPageValid = () => {
          switch (currentPage) {
            case 'roleInformation':
              return !roleInformationErrors;
            case 'requirements':
              return !requirementsErrors;
            case 'schedules':
              return !activityScheduleErrors.some((error: string[] | null) => Boolean(error));
            default:
              return true;
          }
        };

        const handleModalClose = () => {
          resetForm();
          resetFormState();
        };

        const handleFormSubmit = async () => {
          await submitForm();
          resetForm();
          resetFormState();
        };

        const renderBreadcrumbs = () => {
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
                      {index + 1}. {page === 'roleInformation' ? 'Info' : page === 'requirements' ? 'Requirements' : page === 'schedules' ? 'Schedules' : 'Confirm'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        };

        const renderPageContent = () => {
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
                  onFillLater={handleFillLater}
                  fillSchedulesLater={fillSchedulesLater}
                  onRegisterScrollClose={(closeHandler) => {
                    closeDropdownRef.current = closeHandler;
                  }}
                />
              );
            case 'confirm':
              return <RoleConfirm values={values} />;
            default:
              return null;
          }
        };

        return (
          <>
            <FormModal
              trigger={({ open }) => (
                <PrimaryButton
                  variant={method === 'POST' ? 'create' : 'edit'}
                  disabled={isDisabled}
                  icon={
                    method === 'POST' ? (
                      <Plus size={20} color="#ffffff" />
                    ) : (
                      <Pencil size={20} color="#ffffff" />
                    )
                  }
                  onPress={() => {
                    open();
                    setSelectedCategories(categoryValue);
                    setEthnic(new Set(Array.from(ethnicValue) as string[]));
                  }}
                  className="w-full">
                  {method === 'POST' ? 'New Role' : `Edit Role ${roleId}`}
                </PrimaryButton>
              )}
              title={method === 'POST' ? 'Add a new Role' : 'Edit Role'}
              submitButtonText={currentPage === 'confirm' ? 'Save Role' : 'Next'}
              isSubmitting={roleMutation.isPending}
              hasErrors={currentPage === 'confirm' ? hasErrors : !isCurrentPageValid()}
              onSubmit={
                currentPage === 'confirm'
                  ? async () => {
                      await handleFormSubmit();
                    }
                  : () => {
                      if (isCurrentPageValid()) {
                        setCurrentPage(getNextPage());
                      }
                    }
              }
              onClose={handleModalClose}
              onReset={resetFormState}
              headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
              contentClassName="flex-1">
              {(close) => (
                <View className="flex-1">
                  <View className="px-4">
                    <FillRoleFormButton
                      projectId={projectId}
                      setFieldValue={setFieldValue}
                      setSelectedCategories={setSelectedCategories}
                      setEthnic={setEthnic}
                    />
                    {renderBreadcrumbs()}
                  </View>
                  <ScrollView 
                    className="flex-1 px-4" 
                    showsVerticalScrollIndicator={false}
                    onScrollBeginDrag={() => {
                      if (closeDropdownRef.current) {
                        closeDropdownRef.current();
                      }
                    }}
                    scrollEventThrottle={16}>
                    {renderPageContent()}
                  </ScrollView>
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
                        isDisabled={hasErrors || roleMutation.isPending}
                        onPress={async () => {
                          await handleFormSubmit();
                          close();
                        }}
                        className="flex-1">
                        <ButtonText>{roleMutation.isPending ? 'Saving...' : 'Save Role'}</ButtonText>
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
                </View>
              )}
            </FormModal>
          </>
        );
      }}
    </Formik>
    </>
  );
}
