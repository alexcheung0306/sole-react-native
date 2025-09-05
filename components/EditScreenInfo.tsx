import { Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const EditScreenInfo = ({ path }: { path: string }) => {
  const { isDark } = useTheme();
  const title = 'Open up the code for this screen:';
  const description =
    'Change any of the text, save the file, and your app will automatically update.';

  return (
    <View>
      <View className="items-center mx-12">
        <Text className={`text-lg leading-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </Text>
        <View className={`rounded-md px-1 my-2 border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200'}`}>
          <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {path}
          </Text>
        </View>
        <Text className={`text-lg leading-6 text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {description}
        </Text>
      </View>
    </View>
  );
};

