import { Text, View } from 'react-native';

import { EditScreenInfo } from './EditScreenInfo';
import { useTheme } from '../contexts/ThemeContext';

type ScreenContentProps = {
  title: string;
  path: string;
  children?: React.ReactNode;
};

export const ScreenContent = ({ title, path, children }: ScreenContentProps) => {
  const { isDark } = useTheme();
  
  return (
    <View className="items-center flex-1 justify-center">
      <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </Text>
      <View className={`h-px my-7 w-4/5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <EditScreenInfo path={path} />
      {children}
    </View>
  );
};
