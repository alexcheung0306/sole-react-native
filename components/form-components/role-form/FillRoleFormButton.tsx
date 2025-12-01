import { TouchableOpacity, Text } from 'react-native';

interface FillRoleFormButtonProps {
  projectId: number;
  setFieldValue: (field: string, value: any) => void;
  setSelectedCategories?: (categories: string[]) => void;
  setEthnic?: (ethnic: Set<string>) => void;
}

export function FillRoleFormButton({
  projectId,
  setFieldValue,
  setSelectedCategories,
  setEthnic,
}: FillRoleFormButtonProps) {
  return (
    <TouchableOpacity
      onPress={() => {
        setFieldValue('roleTitle', `test-roleTitle -${Date.now()}`);
        setFieldValue('roleDescription', `test-roleDescription -${Date.now()}`);
        setFieldValue('paymentBasis', 'On Project');
        setFieldValue('budget', 5000);
        setFieldValue('talentNumbers', 3);
        setFieldValue('displayBudgetTo', 'Everyone');
        setFieldValue('talentsQuote', true);
        setFieldValue('otPayment', true);
        setFieldValue('questions', `test-rolequestion-${Date.now()}`);
        setFieldValue('requiredGender', 'No Preference');
        setFieldValue('ageMin', 18);
        setFieldValue('ageMax', 28);
        setFieldValue('heightMin', 160);
        setFieldValue('heightMax', 210);
        // Set categories
        const categories = [
          'Spokespersons',
          'Celebrity Guests',
          'Background Actors/Extras',
          'Screenwriter',
          'Production Designer',
        ];
        setFieldValue('category', categories.join(','));
        if (setSelectedCategories) {
          setSelectedCategories(categories);
        }
        // Set ethnic groups
        const ethnicGroups = 'berbers,ashanti';
        setFieldValue('requiredEthnicGroup', ethnicGroups);
        if (setEthnic) {
          setEthnic(new Set(ethnicGroups.split(',')));
        }
        setFieldValue('skills', `test-skills-${Date.now()}`);
        // Set activity schedules
        const now = Date.now();
        setFieldValue('activityScheduleLists', [
          {
            title: 'Casting Session',
            type: 'casting',
            schedules: [
              {
                id: now,
                location: 'Studio A, Downtown',
                fromTime: '2025-08-27 09:00:00.000 +0800',
                toTime: '2025-08-27 12:00:00.000 +0800',
              },
              {
                id: now + 1,
                location: 'Studio B, Midtown',
                fromTime: '2025-08-28 14:00:00.000 +0800',
                toTime: '2025-08-28 17:00:00.000 +0800',
              },
            ],
            remarks: 'First round casting for lead role',
          },
          {
            title: 'Fitting Session',
            type: 'fitting',
            schedules: [
              {
                id: now + 2,
                location: 'Costume Department, Film Studio',
                fromTime: '2025-08-29 10:00:00.000 +0800',
                toTime: '2025-08-29 13:00:00.000 +0800',
              },
              {
                id: now + 3,
                location: 'Wardrobe Room, Production House',
                fromTime: '2025-08-30 15:00:00.000 +0800',
                toTime: '2025-08-30 18:00:00.000 +0800',
              },
            ],
            remarks: 'Costume fitting and measurements',
          },
        ]);
      }}
      className="mb-3 rounded-lg border border-orange-500/50 bg-orange-500/20 px-4 py-2.5">
      <Text className="text-center text-sm font-semibold text-orange-400">
        Dev use Fill role form
      </Text>
    </TouchableOpacity>
  );
}

