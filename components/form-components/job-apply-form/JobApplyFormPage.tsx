import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Formik } from 'formik';
import { router, useLocalSearchParams } from 'expo-router';
import { FormPage } from '@/components/custom/form-page';
import { createApplicant } from '@/api/apiservice/applicant_api';
import { parseDateTime } from '@/lib/datetime';
import { getProjectByID } from '~/api/apiservice/project_api';
import { getRolesByProjectId } from '~/api/apiservice/role_api';

type JobApplyFormValues = {
  soleUserId: string;
  roleId: number | null;
  projectId: number | null;
  paymentBasis: string;
  quotePrice: string | number | null;
  otQuotePrice: string | number | null;
  skills: string;
  answer: string;
  applicationStatus: string | null;
  applicationProcess: string | null;
};

export default function JobApplyFormPage() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    projectId?: string;
    roleId?: string;
    soleUserId?: string;
  }>();

  const projectId = params.projectId ? parseInt(params.projectId) : undefined;
  const roleId = params.roleId ? parseInt(params.roleId) : undefined;
  const soleUserId = params.soleUserId || undefined;

  // Fetch project data
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['jobDetail', projectId],
    queryFn: () => getProjectByID(projectId!),
    enabled: Boolean(projectId),
  });

  // Fetch roles
  const { data: rolesWithSchedules = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['jobRoles', projectId],
    queryFn: () => getRolesByProjectId(projectId!),
    enabled: Boolean(projectId),
  });

  // Find the specific role
  const roleWithSchedules = useMemo(() => {
    if (!roleId || !rolesWithSchedules.length) return null;
    return rolesWithSchedules.find((r: any) => r?.role?.id === roleId) || null;
  }, [roleId, rolesWithSchedules]);

  const role = roleWithSchedules?.role || {};
  const canApply = Boolean(soleUserId && role?.id && projectData?.id);

  const totalJobHours = useMemo(() => {
    const activities = roleWithSchedules?.activities ?? [];
    return activities
      .filter((activity: any) => activity?.type === 'job')
      .flatMap((activity: any) => activity?.schedules ?? [])
      .reduce((total: number, schedule: any) => {
        const fromTime = schedule?.fromTime ? parseDateTime(String(schedule.fromTime)) : null;
        const toTime = schedule?.toTime ? parseDateTime(String(schedule.toTime)) : null;
        if (!fromTime || !toTime) return total;
        const duration = (toTime.getTime() - fromTime.getTime()) / (1000 * 60 * 60);
        return duration > 0 ? total + duration : total;
      }, 0);
  }, [roleWithSchedules?.activities]);

  const initialValues: JobApplyFormValues = useMemo(
    () => ({
      soleUserId: soleUserId || '',
      roleId: role?.id ?? null,
      projectId: projectData?.id ?? null,
      paymentBasis: role?.paymentBasis ?? '',
      quotePrice: '',
      otQuotePrice: '',
      skills: '',
      answer: '',
      applicationStatus: null,
      applicationProcess: null,
    }),
    [projectData?.id, role?.id, role?.paymentBasis, soleUserId]
  );

  const applyMutation = useMutation({
    mutationFn: async (values: JobApplyFormValues) => createApplicant(values),
    onSuccess: () => {
      if (projectId && soleUserId) {
        queryClient.invalidateQueries({
          queryKey: ['userApplications', projectId, soleUserId],
        });
        queryClient.invalidateQueries({
          queryKey: ['jobApplicants', roleId],
        });
        queryClient.invalidateQueries({
          queryKey: ['jobRoles', projectId],
        });
      }
      Alert.alert('Success', 'Application submitted successfully');
      router.back();
    },
    onError: (error) => {
      console.error('Error submitting application:', error);
      Alert.alert('Error', 'Failed to submit application');
    },
  });

  const handleSubmit = async (values: JobApplyFormValues, { resetForm }: any) => {
    const payload = {
      ...values,
      quotePrice: values.quotePrice ? Number(values.quotePrice) : null,
      otQuotePrice: values.otQuotePrice ? Number(values.otQuotePrice) : null,
      skills: values.skills?.trim(),
      answer: values.answer?.trim(),
      applicationStatus: values.applicationStatus || 'applied',
      applicationProcess: values.applicationProcess || 'applied',
    };

    await applyMutation.mutateAsync(payload as any);
    resetForm();
  };

  if (projectLoading || rolesLoading) {
    return (
      <FormPage
        title="Apply for Role"
        submitButtonText="Loading..."
        hasErrors={true}
        onSubmit={() => {}}
        isLoading={true}
        headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
        contentClassName="flex-1 px-4">
        <View className="p-4">
          <Text className="text-white text-center">Loading role information...</Text>
        </View>
      </FormPage>
    );
  }

  if (!canApply) {
    return (
      <FormPage
        title="Apply for Role"
        submitButtonText="Sign in to apply"
        hasErrors={true}
        onSubmit={() => {}}
        headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
        contentClassName="flex-1 px-4">
        <View className="p-4">
          <Text className="text-white text-center">Please sign in to apply for this role.</Text>
        </View>
      </FormPage>
    );
  }

  if (!roleWithSchedules || !role) {
    return (
      <FormPage
        title="Apply for Role"
        submitButtonText="Error"
        hasErrors={true}
        onSubmit={() => {}}
        headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
        contentClassName="flex-1 px-4">
        <View className="p-4">
          <Text className="text-white text-center">Role not found.</Text>
        </View>
      </FormPage>
    );
  }

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      onSubmit={handleSubmit}>
      {({ values, setFieldValue, submitForm, touched, setFieldTouched }) => {
        const quoteError = !values.quotePrice || Number(values.quotePrice) <= 0;
        const otQuoteError = role?.otPayment && (!values.otQuotePrice || Number(values.otQuotePrice) <= 0);
        const skillsError = !values.skills?.trim();
        const answerRequired = Boolean(role?.questions);
        const answerError = answerRequired && !values.answer?.trim();
        const hasErrors = quoteError || otQuoteError || skillsError || answerError || !canApply;

        return (
          <FormPage
            title="Role Application"
            submitButtonText={applyMutation.isPending ? 'Submitting…' : 'Submit'}
            isSubmitting={applyMutation.isPending}
            hasErrors={hasErrors}
            onSubmit={submitForm}
            headerClassName="border-b border-white/10 px-4 pb-3 pt-12"
            contentClassName="flex-1 px-4">
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 80 }}>
              <View className="mb-4">
                <Text className="text-sm font-semibold text-white/80">
                  Project: {projectData?.projectName || projectData?.title || 'Job'}
                </Text>
                <Text className="text-xs text-white/60">
                  Role #{role?.id ?? '—'} • {role?.roleTitle || 'Untitled role'}
                </Text>
              </View>
              <View className="gap-4">
                <View className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
                  <Text className="text-sm font-semibold text-white">Total Job Hours</Text>
                  <Text className="text-lg font-bold text-white">
                    {totalJobHours.toFixed(1)} {totalJobHours === 1 ? 'hour' : 'hours'}
                  </Text>
                  {role?.paymentBasis ? (
                    <Text className="text-xs text-white/70">Payment basis: {role.paymentBasis}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  className="rounded-xl border border-amber-300/40 bg-amber-500/15 px-4 py-3"
                  activeOpacity={0.85}
                  onPress={() => {
                    setFieldValue('quotePrice', '100');
                    setFieldValue('otQuotePrice', role?.otPayment ? '10' : '');
                    setFieldValue('skills', 'Singing, dancing');
                    setFieldValue('answer', 'I am a good fit for this role.');
                  }}>
                  <Text className="text-sm font-semibold text-amber-200">Dev fill form</Text>
                  <Text className="text-xs text-amber-100/80">Quick fill for testing</Text>
                </TouchableOpacity>

                <View className="gap-2">
                  <Text className="text-sm font-semibold text-white">
                    {role?.paymentBasis !== 'Hourly Rate' ? 'Hourly Rate Quote (HKD)' : 'Project Quote (HKD)'}
                  </Text>
                  <TextInput
                    value={values.quotePrice !== null && values.quotePrice !== undefined ? String(values.quotePrice) : ''}
                    onChangeText={(text) => setFieldValue('quotePrice', text.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    placeholder="Enter your quote"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white"
                    onBlur={() => setFieldTouched('quotePrice', true)}
                  />
                  {quoteError && touched.quotePrice && (
                    <Text className="text-xs text-rose-400">Quote is required</Text>
                  )}
                </View>

                {role?.otPayment && (
                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-white">Overtime Payment / Hour</Text>
                    <TextInput
                      value={values.otQuotePrice !== null && values.otQuotePrice !== undefined ? String(values.otQuotePrice) : ''}
                      onChangeText={(text) => setFieldValue('otQuotePrice', text.replace(/[^0-9.]/g, ''))}
                      keyboardType="numeric"
                      placeholder="Enter OT payment"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white"
                      onBlur={() => setFieldTouched('otQuotePrice', true)}
                    />
                    {otQuoteError && touched.otQuotePrice && (
                      <Text className="text-xs text-rose-400">Overtime payment is required</Text>
                    )}
                  </View>
                )}

                <View className="gap-2">
                  <Text className="text-sm font-semibold text-white">Skills</Text>
                  <TextInput
                    value={values.skills}
                    onChangeText={(text) => setFieldValue('skills', text)}
                    placeholder="Highlight relevant skills"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    multiline
                    className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white"
                    onBlur={() => setFieldTouched('skills', true)}
                  />
                  {skillsError && touched.skills && (
                    <Text className="text-xs text-rose-400">Please share at least one skill</Text>
                  )}
                </View>

                {role?.questions ? (
                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-white">{role.questions}</Text>
                    <TextInput
                      value={values.answer}
                      onChangeText={(text) => setFieldValue('answer', text)}
                      placeholder="Answer the client's question"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      multiline
                      className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white"
                      onBlur={() => setFieldTouched('answer', true)}
                    />
                    {answerError && touched.answer && (
                      <Text className="text-xs text-rose-400">Answer is required</Text>
                    )}
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </FormPage>
        );
      }}
    </Formik>
  );
}
