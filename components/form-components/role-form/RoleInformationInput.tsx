import React from 'react';
import { View, Text } from 'react-native';
import { InputField } from '@/components/form-components/InputField';
import { NumberInputField } from '@/components/form-components/NumberInputField';
import { RadioGroupSingleOption } from '@/components/form-components/RadioGroupSingleOption';
import { SingleCheckbox } from '@/components/form-components/SingleCheckbox';
import { validatePaymentBasis, validateShowBudgetTo } from '@/lib/validations/role-validation';
import { validateRoleTitle, validateRoleDescription } from '@/lib/validations/role-validation';

interface RoleInformationInputProps {
  values: any;
  touched: any;
  setFieldValue: (field: string, value: any) => void;
  setFieldTouched: (field: string, touched: boolean, shouldValidate?: boolean) => void;
}

export function RoleInformationInput({ values, touched, setFieldValue, setFieldTouched }: RoleInformationInputProps) {
  return (
    <View className="gap-4">
      {/* Role Title */}
      <InputField
        inputtype="input"
        fieldname="roleTitle"
        isRequired={true}
        label="Role Title"
        data={values}
        tooltip="Title of a role required in the project"
        touched={touched.roleTitle}
        validation={validateRoleTitle}
        warning={true}
        setFieldTouched={setFieldTouched}
        setFieldValue={setFieldValue}
      />

      {/* Role Description */}
      <InputField
        inputtype="textarea"
        fieldname="roleDescription"
        isRequired={true}
        label="Role Description"
        tooltip="What is the role in the project about"
        touched={touched.roleDescription}
        validation={validateRoleDescription}
        warning={true}
        data={values}
        setFieldTouched={setFieldTouched}
        setFieldValue={setFieldValue}
      />

      {/* Numbers of Talents */}
      <NumberInputField
        fieldname="talentNumbers"
        label="Talents Numbers"
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
        touched={touched.talentNumbers}
        isRequired={undefined}
        data={values}
      />

      {/* Payment Type */}
      <RadioGroupSingleOption
        values={values}
        warning={true}
        touched={touched}
        isRequired={true}
        validation={validatePaymentBasis}
        fieldname="paymentBasis"
        label="Select Payment Basis"
        options="paymentBasis"
        tooltipContent="Choose how you would like to be billed for the work for each talent at this role"
        setFieldTouched={setFieldTouched}
        setFieldValue={setFieldValue}
      />

      {/* Budget */}
      <NumberInputField
        fieldname="budget"
        label={`Budget for this role ${values.paymentBasis || ''}`}
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
        touched={touched.budget}
        maximum={99999}
        isRequired={true}
        data={values}
      />

      {/* Show Budget To */}
      <RadioGroupSingleOption
        values={values}
        warning={true}
        touched={touched}
        fieldname="displayBudgetTo"
        label="Show Job Budget to"
        options="showBudgetTo"
        tooltipContent="Who can see the remuneration for this job"
        isRequired={true}
        validation={validateShowBudgetTo}
        setFieldTouched={setFieldTouched}
        setFieldValue={setFieldValue}
      />

      {/* Other Options */}
      <View className="mb-5 rounded-lg border border-white/10 bg-zinc-800/50 p-5">
        <Text className="mb-4 text-white">Other Options</Text>

        {/* Talents Quoting Price */}
        <SingleCheckbox
          fieldname="talentsQuote"
          values={values}
          content="Talents Quoting Price"
          tooltip="Requires talents to quote their price for the job when applying"
          setFieldValue={setFieldValue}
        />

        {/* Over Time Payment */}
        <SingleCheckbox
          fieldname="otPayment"
          values={values}
          content="Over Time Payment"
          tooltip="Overtime payments will be paid if the job runs overtime"
          setFieldValue={setFieldValue}
        />
      </View>

      {/* Questions */}
      <InputField
        inputtype="textarea"
        fieldname="questions"
        isRequired={false}
        label="Questions to applicants for the role"
        data={values}
        tooltip="Questions to applicants for the role"
        touched={null}
        validation={null}
        warning={false}
        setFieldTouched={setFieldTouched}
        setFieldValue={setFieldValue}
      />
    </View>
  );
}

