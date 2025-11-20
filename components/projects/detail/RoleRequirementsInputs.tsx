import React from 'react';
import { InputField } from '@/components/form-components/InputField';
import { RadioGroupSingleOption } from '@/components/form-components/RadioGroupSingleOption';
import { RangeInput } from '@/components/form-components/RangeInput';
import { CategoriesCard } from '@/components/form-components/CategoriesCard';
import { DropDownMultiSelect } from '@/components/form-components/DropDownMultiSelect';
import { validateGender } from '@/lib/validations/talentInfo-validations';

interface RoleRequirementsInputsProps {
  values: any;
  touched: any;
  setFieldValue: (field: string, value: any) => void;
  setFieldTouched: (field: string, touched: boolean, shouldValidate?: boolean) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  ethnic: Set<string>;
  setEthnic: (ethnic: Set<string>) => void;
}

export function RoleRequirementsInputs({
  values,
  touched,
  setFieldValue,
  setFieldTouched,
  selectedCategories,
  setSelectedCategories,
  ethnic,
  setEthnic,
}: RoleRequirementsInputsProps) {
  return (
    <>
      {/* Gender */}
      <RadioGroupSingleOption
        values={values}
        warning={true}
        touched={touched}
        fieldname="requiredGender"
        label="Gender"
        options="gender"
        tooltipContent="Required gender for this role"
        isRequired={true}
        validation={validateGender}
        setFieldTouched={setFieldTouched}
        setFieldValue={setFieldValue}
      />

      {/* Age Range */}
      <RangeInput
        title="Required age range for this role"
        values={values}
        setFieldValue={setFieldValue}
        minDefaultValue="15"
        maxDefaultValue="30"
        rangeName="ageRange"
        rangeMinName="ageMin"
        rangeMaxName="ageMax"
        maxDigits={2}
        sliderLabel="Age Range"
        sliderStep={1}
        sliderMin={1}
        sliderMax={99}
      />

      {/* Height Range */}
      <RangeInput
        title="Required height range for this role"
        values={values}
        setFieldValue={setFieldValue}
        minDefaultValue="160"
        maxDefaultValue="210"
        rangeName="heightRange"
        rangeMinName="heightMin"
        rangeMaxName="heightMax"
        maxDigits={3}
        sliderLabel="Height Range (cm)"
        sliderStep={1}
        sliderMin={140}
        sliderMax={240}
      />

      {/* Categories */}
      <CategoriesCard
        values={values}
        setFieldValue={setFieldValue}
        selectedCategories={selectedCategories}
        setSelecedCategories={setSelectedCategories}
      />

      {/* Ethnic Groups */}
      <DropDownMultiSelect values={values} setFieldValue={setFieldValue} ethnic={ethnic} setEthnic={setEthnic} />

      {/* Skills */}
      <InputField
        inputtype="textarea"
        fieldname="skills"
        isRequired={false}
        label="Skills required to get the role"
        data={values}
        tooltip="Skills required to get the role"
        touched={null}
        validation={null}
        warning={false}
        setFieldTouched={setFieldTouched}
        setFieldValue={setFieldValue}
      />
    </>
  );
}

