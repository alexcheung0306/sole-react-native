import { MultiSelectCard } from './MultiSelectCard';
import { CategorySelector } from '@/components/profile/CategorySelector';

interface CategoriesCardProps {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  selectedCategories: string[];
  setSelecedCategories: (categories: string[]) => void;
}

export function CategoriesCard({ values, setFieldValue, selectedCategories, setSelecedCategories }: CategoriesCardProps) {
  return (
    <MultiSelectCard
      label="Categories"
      selectedItems={selectedCategories}
      onItemsChange={(items) => setSelecedCategories(items as string[])}
      fieldName="category"
      setFieldValue={setFieldValue}
      selectorComponent={CategorySelector}
      addButtonText="Add Categories"
      editButtonText="Edit Categories"
      maxSelections={10}
    />
  );
}

