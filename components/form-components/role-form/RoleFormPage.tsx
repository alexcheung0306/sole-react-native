import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik } from 'formik';
import { router, useLocalSearchParams } from 'expo-router';
import { FormPage } from '@/components/custom/form-page';
import { createRoleWithSchedules, updateRoleAndSchedules } from '@/api/apiservice/role_api';
import { validateNumberField } from '@/lib/validations/form-field-validations';
import { validateRoleTitle, validateRoleDescription } from '@/lib/validations/role-validation';
import { validateGender } from '@/lib/validations/talentInfo-validations';
import { validateScheduleList } from '@/lib/validations/role-validation';
import { FillRoleFormButton } from './FillRoleFormButton';
import { RoleFormBreadCrumbs } from './RoleFormBreadCrumbs';
import { RoleFormNavigationButtons } from './RoleFormNavigationButtons';
import { RoleFormPageContent } from './RoleFormPageContent';
 
export default function RoleFormPage() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    formType: string;
    projectId: string;
    method: 'POST' | 'PUT';
    roleId?: string;
    // Add all role form fields as optional params
    roleTitle?: string;
    roleDescription?: string;
    paymentBasis?: string;
    budget?: string;
    talentNumbers?: string;
    displayBudgetTo?: string;
    talentsQuote?: string;
    otPayment?: string;
    questions?: string;
    requiredGender?: string;
    ageMin?: string;
    ageMax?: string;
    heightMin?: string;
    heightMax?: string;
    category?: string;
    requiredEthnicGroup?: string;
    skills?: string;
    // For schedules, we'll need to pass as JSON string
    activityScheduleLists?: string;
  }>();

  const projectId = Number(params.projectId);
  const method = (params.method || 'POST') as 'POST' | 'PUT';
  const roleId = params.roleId ? Number(params.roleId) : null;

  const [currentPage, setCurrentPage] = useState<
    'roleInformation' | 'requirements' | 'schedules' | 'confirm'
  >('roleInformation');
  const [fillSchedulesLater, setFillSchedulesLater] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ethnic, setEthnic] = useState<Set<string>>(new Set());
  const closeDropdownRef = useRef<(() => void) | null>(null);

  // Parse category from string
  const categoryValue = params.category
    ? params.category.split(',').filter(Boolean)
    : [];

  // Parse ethnic from string
  const ethnicValue =
    params.requiredEthnicGroup &&
    params.requiredEthnicGroup !== 'No Preference'
      ? new Set(params.requiredEthnicGroup.split(',').filter(Boolean))
      : new Set();

  // Initialize state from params
  useEffect(() => {
    setSelectedCategories(categoryValue);
    setEthnic(new Set(Array.from(ethnicValue) as string[]));
  }, []);

  // Parse activityScheduleLists from JSON string if provided
  let parsedActivities = [];
  if (params.activityScheduleLists) {
    try {
      parsedActivities = JSON.parse(params.activityScheduleLists);
    } catch (e) {
      console.error('Failed to parse activityScheduleLists:', e);
    }
  }

  const roleMutation = useMutation({
    mutationFn: async (values: any) => {
      if (method === 'POST') {
        return await createRoleWithSchedules(values, values);
      } else if (method === 'PUT') {
        return await updateRoleAndSchedules(String(roleId), values, values);
      }
    },
    onSuccess: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      await queryClient.invalidateQueries({
        queryKey: ['project-roles', projectId],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-detail'] });
      queryClient.invalidateQueries({ queryKey: ['manageProjects'] });
      queryClient.invalidateQueries({ queryKey: ['rolesWithSchedules', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-contracts', projectId] });

      // Navigate back after successful submit (both create and edit)
      router.back();
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
      // Error is handled by mutation's onError callback
    }
  };

  // Reset all form state to initial values
  const resetFormState = () => {
    setSelectedCategories([]);
    setEthnic(new Set());
    setCurrentPage('roleInformation');
    setFillSchedulesLater(false);
  };

  const initialValues = {
    projectId: projectId,
    roleTitle: params.roleTitle || '',
    roleDescription: params.roleDescription || '',
    paymentBasis: params.paymentBasis || 'On Project',
    budget: params.budget ? Number(params.budget) : 1000,
    talentNumbers: params.talentNumbers ? Number(params.talentNumbers) : 1,
    displayBudgetTo: params.displayBudgetTo || 'Everyone',
    talentsQuote: params.talentsQuote === 'true',
    otPayment: params.otPayment !== 'false',
    questions: params.questions || '',
    requiredGender: params.requiredGender || 'No Preference',
    ageMin: params.ageMin ? Number(params.ageMin) : 15,
    ageMax: params.ageMax ? Number(params.ageMax) : 30,
    heightMin: params.heightMin ? Number(params.heightMin) : 160,
    heightMax: params.heightMax ? Number(params.heightMax) : 210,
    category: params.category || '',
    requiredEthnicGroup: params.requiredEthnicGroup || 'No Preference',
    skills: params.skills || '',
    activityScheduleLists:
      parsedActivities.length > 0
        ? parsedActivities
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
  };

  const pageOrder: Array<'roleInformation' | 'requirements' | 'schedules' | 'confirm'> = [
    'roleInformation',
    'requirements',
    'schedules',
    'confirm',
  ];

  return (
    <Formik
      key={`${method}-${roleId || 'new'}`}
      initialValues={initialValues}
      enableReinitialize={false}
      onSubmit={handleSubmit}>
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

        // Check if there's at least one job activity
        const hasJobActivity =
          Array.isArray(values.activityScheduleLists) &&
          values.activityScheduleLists.some((activity: any) => activity?.type === 'job');

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

        const handleFormSubmit = async () => {
          await submitForm();
          resetForm();
          resetFormState();
        };

        return (
          <FormPage
            title={method === 'POST' ? 'Add a new Role' : 'Edit Role'}
            headerComponent={
              <View>
                <FillRoleFormButton
                  projectId={projectId}
                  setFieldValue={setFieldValue}
                  setSelectedCategories={setSelectedCategories}
                  setEthnic={setEthnic}
                />
                <RoleFormBreadCrumbs
                  currentPage={currentPage}
                  setCurrentPage={(page) =>
                    setCurrentPage(
                      page as 'roleInformation' | 'requirements' | 'schedules' | 'confirm'
                    )
                  }
                  pageOrder={pageOrder}
                  roleInformationErrors={roleInformationErrors ? true : false}
                  requirementsErrors={requirementsErrors ? true : false}
                  hasErrors={hasErrors ? true : false}
                  hasJobActivity={hasJobActivity}
                />
              </View>
            }
            submitButtonText={currentPage === 'confirm' ? 'Save' : 'Next'}
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
            onClose={() => {
              resetForm();
              resetFormState();
              router.back();
            }}
            headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
            contentClassName="flex-1">
            <View className="flex-1">
              <ScrollView
                className="flex-1 px-4"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                contentContainerStyle={{
                  paddingBottom: 100,
                }}
                onScrollBeginDrag={() => {
                  if (closeDropdownRef.current) {
                    closeDropdownRef.current();
                  }
                }}
                scrollEventThrottle={16}>
                <RoleFormPageContent
                  currentPage={currentPage}
                  values={values}
                  touched={touched}
                  setFieldValue={setFieldValue}
                  setValues={setValues}
                  setFieldTouched={setFieldTouched}
                  selectedCategories={selectedCategories}
                  setSelectedCategories={setSelectedCategories}
                  ethnic={ethnic}
                  setEthnic={setEthnic}
                  onFillLater={handleFillLater}
                  fillSchedulesLater={fillSchedulesLater}
                  onRegisterScrollClose={(closeHandler) => {
                    closeDropdownRef.current = closeHandler;
                  }}
                />
              </ScrollView>
              <RoleFormNavigationButtons
                currentPage={currentPage}
                getPreviousPage={getPreviousPage}
                getNextPage={getNextPage}
                setCurrentPage={setCurrentPage}
                isCurrentPageValid={isCurrentPageValid}
                hasErrors={hasErrors}
                isSubmitting={roleMutation.isPending}
                onSave={handleFormSubmit}
                onClose={() => {
                  resetForm();
                  resetFormState();
                  router.back();
                }}
              />
            </View>
          </FormPage>
        );
      }}
    </Formik>
  );
}

