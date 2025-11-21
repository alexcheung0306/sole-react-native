import React from 'react';
import { MultiSelectCard } from './MultiSelectCard';
import { EthnicGroupSelector } from './EthnicGroupSelector';

interface EthnicsCardProps {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  ethnic: Set<string>;
  setEthnic: (ethnic: Set<string>) => void;
}

export function EthnicsCard({
  values,
  setFieldValue,
  ethnic,
  setEthnic,
}: EthnicsCardProps) {
  return (
    <MultiSelectCard
      label="Ethnic Groups"
      selectedItems={ethnic}
      onItemsChange={(items) => setEthnic(items as Set<string>)}
      fieldName="requiredEthnicGroup"
      setFieldValue={setFieldValue}
      selectorComponent={EthnicGroupSelector}
      addButtonText="Add Ethnic Groups"
      editButtonText="Edit Ethnic Groups"
      maxSelections={10}
      emptyValue="No Preference"
    />
  );
}
