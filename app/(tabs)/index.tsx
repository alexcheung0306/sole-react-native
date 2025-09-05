import { Stack } from 'expo-router';

import { StyleSheet, View } from 'react-native';

import { ScreenContent } from '~/components/ScreenContent';
import { useTheme } from '../../contexts/ThemeContext';

export default function Home() {
  const { isDark } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Tab One' }} />
      <View className={`flex-1 p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <ScreenContent path="app/(tabs)/index.tsx" title="Tab One" />
      </View>
    </>
  );
}

