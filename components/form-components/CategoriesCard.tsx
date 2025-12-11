import { MultiSelectCard } from './MultiSelectCard';
import { CategorySelector } from '@/components/profile/CategorySelector';

interface CategoriesCardProps {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  selectedCategories: string[];
  setSelecedCategories: (categories: string[]) => void;
  maxSelections?: number;
}

export function CategoriesCard({ values, setFieldValue, selectedCategories, setSelecedCategories, maxSelections = 10 }: CategoriesCardProps) {
  // Wrapper to ensure field is set as array (for UserInfo-form compatibility)
  const handleSetFieldValue = (field: string, value: any) => {
    // If value is a string (from MultiSelectCard), convert to array
    // Otherwise, use the value as-is (might already be an array)
    if (typeof value === 'string') {
      const arrayValue = value ? value.split(',').filter((c: string) => c.trim()) : [];
      setFieldValue(field, arrayValue);
    } else {
      setFieldValue(field, value);
    }
  };

  return (
    <MultiSelectCard
      label="Categories"
      selectedItems={selectedCategories}
      onItemsChange={(items) => {
        const itemsArray = Array.isArray(items) ? items : Array.from(items);
        // Remove duplicates
        const uniqueItems = Array.from(new Set(itemsArray));
        setSelecedCategories(uniqueItems);
      }}
      fieldName="category"
      setFieldValue={handleSetFieldValue}
      selectorComponent={CategorySelector}
      addButtonText="Add Categories"
      editButtonText="Edit Categories"
      maxSelections={maxSelections}
    />
  );
}

